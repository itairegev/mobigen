# Mobigen Kubernetes Deployment

Kubernetes manifests for deploying Mobigen using Kustomize.

## Overview

This directory contains Kubernetes manifests for deploying Mobigen to a Kubernetes cluster. It uses Kustomize for environment-specific configuration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Kubernetes Cluster                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Ingress Controller                           │ │
│  │  • TLS termination  • Path routing  • WebSocket support        │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
│                               │                                      │
│  ┌────────────────────────────┴───────────────────────────────────┐ │
│  │                         Services                                │ │
│  │                                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │   Web    │  │Generator │  │ Builder  │  │  Tester  │       │ │
│  │  │  :3000   │  │  :4000   │  │  :5000   │  │  :6000   │       │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │ │
│  │       │             │             │             │              │ │
│  │  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐       │ │
│  │  │Deployment│  │Deployment│  │Deployment│  │Deployment│       │ │
│  │  │ replicas │  │ replicas │  │ replicas │  │ replicas │       │ │
│  │  │   2-10   │  │   2-8    │  │    1     │  │    1     │       │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               │                                      │
│  ┌────────────────────────────┴───────────────────────────────────┐ │
│  │                    External Services                            │ │
│  │  • RDS PostgreSQL  • ElastiCache Redis  • S3 Storage          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │    ConfigMap    │  │     Secrets     │  │       HPA       │     │
│  │  (Non-secret)   │  │  (Credentials)  │  │   (Autoscale)   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
k8s/
├── base/                      # Base resources
│   ├── kustomization.yaml    # Base kustomization
│   ├── namespace.yaml        # Namespace
│   ├── configmap.yaml        # Configuration
│   ├── secrets.yaml          # Secret references
│   ├── web-deployment.yaml
│   ├── generator-deployment.yaml
│   ├── builder-deployment.yaml
│   ├── tester-deployment.yaml
│   ├── analytics-deployment.yaml
│   ├── services.yaml
│   └── ingress.yaml
└── overlays/
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    └── production/
        ├── kustomization.yaml
        ├── hpa.yaml
        └── pdb.yaml
```

## Prerequisites

- Kubernetes 1.25+
- kubectl configured
- NGINX Ingress Controller
- cert-manager (for TLS)
- External PostgreSQL and Redis

## Quick Start

### 1. Create Namespace

```bash
kubectl create namespace mobigen
```

### 2. Create Secrets

```bash
kubectl create secret generic mobigen-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=anthropic-api-key="sk-ant-..." \
  --from-literal=nextauth-secret="your-secret" \
  --from-literal=expo-token="..." \
  --from-literal=s3-access-key="..." \
  --from-literal=s3-secret-key="..." \
  -n mobigen
```

### 3. Deploy

```bash
# Staging
kubectl apply -k overlays/staging

# Production
kubectl apply -k overlays/production
```

## Resources

### Deployments

| Service | Staging | Production | Port |
|---------|---------|------------|------|
| web | 1 replica | 2-10 (HPA) | 3000 |
| generator | 1 replica | 2-8 (HPA) | 4000 |
| builder | 1 replica | 1 replica | 5000 |
| tester | 1 replica | 1 replica | 6000 |
| analytics | 1 replica | 1 replica | 7000 |

### Resource Limits

**Staging:**

| Service | CPU | Memory |
|---------|-----|--------|
| web | 100m-500m | 256Mi-512Mi |
| generator | 200m-1000m | 512Mi-1Gi |
| builder | 100m-500m | 256Mi-512Mi |

**Production:**

| Service | CPU | Memory |
|---------|-----|--------|
| web | 250m-1000m | 512Mi-1Gi |
| generator | 500m-2000m | 1Gi-2Gi |
| builder | 250m-1000m | 512Mi-1Gi |

## Configuration

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mobigen-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  FRONTEND_URL: "https://app.mobigen.io"
  GENERATOR_URL: "http://mobigen-generator:4000"
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mobigen
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - app.mobigen.io
      secretName: mobigen-tls
  rules:
    - host: app.mobigen.io
      http:
        paths:
          - path: /
            backend:
              service:
                name: mobigen-web
                port: 3000
```

## Autoscaling

### HPA (Production)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mobigen-web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mobigen-web
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 70
```

### PDB (Production)

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: mobigen-web-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: mobigen-web
```

## Operations

### Deploy

```bash
kubectl apply -k overlays/staging
kubectl apply -k overlays/production
```

### Status

```bash
kubectl get pods -n mobigen
kubectl get services -n mobigen
kubectl get hpa -n mobigen
```

### Logs

```bash
kubectl logs -f deployment/mobigen-web -n mobigen
kubectl logs -l app=mobigen-generator -n mobigen
```

### Scale

```bash
kubectl scale deployment mobigen-generator --replicas=3 -n mobigen
```

### Rollback

```bash
kubectl rollout undo deployment/mobigen-web -n mobigen
```

### Update Image

```bash
kubectl set image deployment/mobigen-web \
  web=<registry>/mobigen-web:v1.2.0 \
  -n mobigen
```

## Health Checks

All deployments include probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
```

## Troubleshooting

### Pod Not Starting

```bash
kubectl describe pod <name> -n mobigen
kubectl get events -n mobigen
```

### Service Not Accessible

```bash
kubectl get endpoints -n mobigen
```

### Image Pull Errors

```bash
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<password> \
  -n mobigen
```

## Cleanup

```bash
kubectl delete -k overlays/staging
kubectl delete -k overlays/production
```

## Related Documentation

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Main README](../README.md)
- [Terraform Deployment](../terraform/README.md)
