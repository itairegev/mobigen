# Mobigen Terraform Infrastructure

AWS infrastructure as code for Mobigen deployment.

## Overview

This Terraform configuration provisions a complete AWS infrastructure for running Mobigen, including VPC, ECS Fargate, RDS PostgreSQL, ElastiCache Redis, S3, and ALB.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                    VPC                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Public Subnets                                │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                Application Load Balancer                      │    │    │
│  │  │        (HTTP/HTTPS → Web, Generator Services)                │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                      NAT Gateway                              │    │    │
│  │  │           (Outbound internet for private subnets)            │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Private Subnets                               │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │    │
│  │  │    Web     │  │ Generator  │  │  Builder   │  │  Tester    │    │    │
│  │  │  Service   │  │  Service   │  │  Service   │  │  Service   │    │    │
│  │  │   :3000    │  │   :4000    │  │   :5000    │  │   :6000    │    │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │    │
│  │                                                                       │    │
│  │  ┌────────────────────┐  ┌────────────────────┐                     │    │
│  │  │   RDS PostgreSQL   │  │  ElastiCache Redis │                     │    │
│  │  │    (Database)      │  │     (Cache/Queue)  │                     │    │
│  │  └────────────────────┘  └────────────────────┘                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Other AWS Services                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │   ECR    │  │    S3    │  │ Secrets Manager  │  │   CloudWatch     │    │
│  │ (Images) │  │ (Storage)│  │    (Secrets)     │  │    (Logs)        │    │
│  └──────────┘  └──────────┘  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- Docker (for building and pushing images)

## Directory Structure

```
terraform/
├── main.tf                    # Root module configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── bootstrap/                 # State backend setup
│   └── main.tf
├── modules/
│   ├── vpc/                   # VPC, subnets, NAT gateway
│   ├── ecr/                   # ECR repositories
│   ├── s3/                    # S3 buckets for storage
│   ├── rds/                   # PostgreSQL database
│   ├── elasticache/           # Redis cache
│   ├── alb/                   # Application Load Balancer
│   └── ecs/                   # ECS cluster, services, tasks
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── secrets.tfvars.example
│   └── production/
│       ├── main.tf
│       └── terraform.tfvars
└── scripts/
    └── deploy.sh              # Deployment helper script
```

## Quick Start

### 1. Bootstrap Terraform State Backend

```bash
cd terraform/bootstrap
terraform init
terraform apply
```

This creates:
- S3 bucket for Terraform state
- DynamoDB table for state locking

### 2. Configure Environment

```bash
cd terraform/environments/staging

# Copy example configuration
cp secrets.tfvars.example secrets.tfvars

# Edit with your values
vim secrets.tfvars
```

### 3. Deploy Infrastructure

```bash
# Using the deploy script
./scripts/deploy.sh staging

# Or manually
cd terraform
terraform init
terraform plan -var-file=environments/staging/terraform.tfvars
terraform apply -var-file=environments/staging/terraform.tfvars
```

### 4. Build and Push Docker Images

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
docker build -t mobigen-web -f apps/web/Dockerfile .
docker tag mobigen-web:latest <account>.dkr.ecr.us-east-1.amazonaws.com/mobigen-staging-web:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/mobigen-staging-web:latest

# Repeat for generator, builder, tester, analytics
```

## Modules

### VPC Module

Creates networking infrastructure:

| Resource | Description |
|----------|-------------|
| VPC | Main virtual network |
| Public Subnets | For ALB, NAT Gateway |
| Private Subnets | For ECS, RDS, Redis |
| NAT Gateway | Outbound internet |
| Internet Gateway | Public internet access |
| Route Tables | Network routing |

### RDS Module

Creates PostgreSQL database:

| Resource | Description |
|----------|-------------|
| RDS Instance | PostgreSQL 16 |
| Subnet Group | Database subnets |
| Security Group | Access rules |
| Secret | Credentials in Secrets Manager |

### ElastiCache Module

Creates Redis cluster:

| Resource | Description |
|----------|-------------|
| Replication Group | Redis cluster |
| Subnet Group | Cache subnets |
| Security Group | Access rules |

### S3 Module

Creates storage buckets:

| Bucket | Purpose |
|--------|---------|
| templates | Template storage |
| artifacts | Build artifacts |
| generated | Generated apps |
| screenshots | Test screenshots |

### ECR Module

Creates container registries:

| Repository | Service |
|------------|---------|
| web | Next.js dashboard |
| generator | AI generation |
| builder | EAS builds |
| tester | Device testing |
| analytics | Usage tracking |

### ALB Module

Creates load balancer:

| Resource | Description |
|----------|-------------|
| ALB | Application Load Balancer |
| Target Groups | Service targets |
| Listeners | HTTP/HTTPS |
| Security Group | Access rules |

### ECS Module

Creates Fargate cluster:

| Service | Port | CPU | Memory |
|---------|------|-----|--------|
| web | 3000 | 512 | 1024 |
| generator | 4000 | 1024 | 2048 |
| builder | 5000 | 512 | 1024 |
| tester | 6000 | 512 | 1024 |
| analytics | 7000 | 256 | 512 |

## Configuration Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `project_name` | Project name (mobigen) |
| `environment` | Environment (staging/production) |
| `nextauth_secret` | NextAuth.js secret |
| `anthropic_api_key` | Anthropic API key |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | us-east-1 | AWS region |
| `vpc_cidr` | 10.0.0.0/16 | VPC CIDR block |
| `db_instance_class` | db.t3.medium | RDS instance type |
| `redis_node_type` | cache.t3.medium | ElastiCache type |
| `certificate_arn` | "" | ACM cert for HTTPS |
| `expo_token` | "" | Expo token for builds |

## Outputs

```bash
terraform output
```

Key outputs:
- `alb_dns_name` - Application URL
- `ecr_repository_urls` - ECR URLs
- `rds_endpoint` - Database endpoint
- `redis_endpoint` - Redis endpoint
- `database_secret_arn` - Credentials ARN

## Cost Estimation

### Staging (Minimal)

| Resource | Monthly Cost |
|----------|--------------|
| NAT Gateway | ~$32 |
| ALB | ~$16 |
| RDS db.t3.medium | ~$30 |
| ElastiCache | ~$25 |
| ECS Fargate | ~$50 |
| S3 | ~$5 |
| **Total** | **~$160/month** |

### Production

| Resource | Monthly Cost |
|----------|--------------|
| NAT Gateway | ~$35 |
| ALB | ~$25 |
| RDS r6g.large | ~$150 |
| ElastiCache | ~$100 |
| ECS Fargate | ~$200 |
| S3 | ~$20 |
| **Total** | **~$530/month** |

## Security

- All secrets in AWS Secrets Manager
- Services in private subnets
- RDS and S3 encryption at rest
- TLS encryption in transit
- IAM least-privilege roles
- Security groups restrict access

## Cleanup

```bash
terraform destroy -var-file=environments/staging/terraform.tfvars
```

## Troubleshooting

### ECS Service Not Starting

```bash
aws logs tail /ecs/mobigen-staging/web --follow
```

### Database Connection Issues

Check security groups allow ECS → RDS traffic.

### Health Check Failures

Ensure `/health` endpoint returns 200.

## Related Documentation

- [AWS Terraform Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Main README](../README.md)
- [Kubernetes Deployment](../k8s/README.md)
