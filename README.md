# Mobigen

**Mobile apps made easy - in minutes**

AI-powered mobile app generator that creates production-ready React Native apps from natural language descriptions.

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Certification](https://github.com/OWNER/REPO/actions/workflows/certify.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/certify.yml)
[![Templates](https://img.shields.io/badge/templates-20-blue)](docs/CERTIFICATION-STATUS.md)
[![Silver Certified](https://img.shields.io/badge/certified-20%20silver-c0c0c0)](docs/CERTIFICATION-STATUS.md)

## Table of Contents

- [Overview](#overview)
- [Template Certification Status](#template-certification-status)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
  - [Docker Compose](#docker-compose-deployment)
  - [AWS (Terraform)](#aws-deployment-terraform)
  - [Kubernetes](#kubernetes-deployment)
- [Project Structure](#project-structure)
- [Services](#services)
- [Packages](#packages)
- [Templates](#templates)
- [AI Agent Pipeline](#ai-agent-pipeline)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

Mobigen is a full-stack platform that transforms natural language descriptions into production-ready React Native mobile applications. It leverages Claude AI through a multi-agent pipeline to analyze requirements, design architecture, generate code, and validate quality.

Built on React Native + Expo, it removes the development barrier and allows any founder or small business to have a professional mobile app in minutes.

**Key Capabilities:**
- Describe your app idea in plain English
- AI generates a complete React Native (Expo) application
- Real-time progress tracking via WebSocket
- Build and deploy to iOS/Android via Expo EAS
- Automated testing and visual regression
- 20 best-in-class templates across 8 categories

## Template Certification Status

All Mobigen templates go through rigorous quality assurance with a 3-tier certification system:

| Certification | Templates | Description |
|---------------|-----------|-------------|
| 🥇 **Gold** | 0 | E2E tests pass, production-ready |
| 🥈 **Silver** | 20 | Builds succeed, unit tests pass |
| 🥉 **Bronze** | 0 | Compiles, lints, basic validation |

**Current Status:** 100% of templates are Silver certified or higher

[View detailed certification status →](docs/CERTIFICATION-STATUS.md)

---

## Features

| Feature | Description |
|---------|-------------|
| **AI-Powered Generation** | Multi-agent Claude AI pipeline for intelligent code generation |
| **Template-Based** | Start from customizable templates (E-commerce, Loyalty, News, AI Assistant) |
| **Real-Time Progress** | Live updates via WebSocket during generation |
| **Quality Assurance** | Automated TypeScript, ESLint, and build validation |
| **EAS Build Integration** | Deploy to iOS and Android via Expo Application Services |
| **Device Testing** | Automated UI testing with WebdriverIO and Appium |
| **Visual Regression** | Screenshot comparison for detecting UI changes |
| **Usage Analytics** | Track token usage, costs, and project metrics |
| **Multi-Tenant** | User authentication with project isolation |

---

## Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │            Web Browser              │
                                    │         (User Dashboard)            │
                                    └─────────────────┬───────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    APPLICATION LAYER                                      │
│                                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Web Dashboard  │  │    Generator    │  │     Builder     │  │     Tester      │     │
│  │   (Next.js)     │  │    Service      │  │     Service     │  │     Service     │     │
│  │   Port: 3333    │  │   Port: 4000    │  │   Port: 5001    │  │   Port: 6000    │     │
│  │                 │  │                 │  │                 │  │                 │     │
│  │ • Dashboard UI  │  │ • AI Pipeline   │  │ • EAS Builds    │  │ • Device Tests  │     │
│  │ • NextAuth SSO  │  │ • Socket.IO     │  │ • BullMQ Queue  │  │ • Screenshots   │     │
│  │ • tRPC API      │  │ • Templates     │  │ • Webhooks      │  │ • Visual Diff   │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │                    │              │
│           └────────────────────┴────────────────────┴────────────────────┘              │
│                                           │                                              │
│  ┌────────────────────────────────────────┴────────────────────────────────────────┐    │
│  │                         Analytics Service (Port: 7000)                           │    │
│  │           • Usage Tracking  • Cost Monitoring  • Metrics Aggregation             │    │
│  └──────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
┌─────────────────────────────────────────────┴─────────────────────────────────────────────┐
│                                      DATA LAYER                                            │
│                                                                                            │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │
│  │   PostgreSQL    │   │     Redis       │   │   S3 / MinIO    │   │   Anthropic     │   │
│  │   (Database)    │   │  (Cache/Queue)  │   │   (Storage)     │   │   (Claude AI)   │   │
│  │                 │   │                 │   │                 │   │                 │   │
│  │ • Users         │   │ • Sessions      │   │ • Templates     │   │ • Code Gen      │   │
│  │ • Projects      │   │ • Job Queues    │   │ • Artifacts     │   │ • PRD Analysis  │   │
│  │ • Builds        │   │ • Real-time     │   │ • Screenshots   │   │ • Architecture  │   │
│  │ • Analytics     │   │ • Rate Limits   │   │ • Projects      │   │                 │   │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘   │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker** & Docker Compose ([download](https://docs.docker.com/get-docker/))
- **AI Provider** (one of):
  - Anthropic API Key ([get one](https://console.anthropic.com/))
  - AWS Bedrock access (with Claude models enabled)

### Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/mobigen.git
cd mobigen

# 2. Install dependencies
pnpm install

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your values (see Configuration below)

# 4. Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d

# 5. Setup database
pnpm --filter @mobigen/db db:generate
pnpm --filter @mobigen/db db:push

# 6. Start all services
pnpm dev
```

### Configuration

Edit your `.env` file:

```bash
# Database (port 9432 for Docker, avoids conflict with local PostgreSQL)
DATABASE_URL=postgresql://mobigen:mobigen_dev_password@localhost:9432/mobigen

# AI Provider - Choose one:

# Option A: AWS Bedrock (recommended if you have AWS access)
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
# Uses AWS credential chain (env vars, ~/.aws/credentials, or IAM role)

# Option B: Direct Anthropic API
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3333
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web Dashboard | http://localhost:3333 | Main user interface |
| Generator API | http://localhost:4000 | AI generation service |
| Builder API | http://localhost:5001 | EAS build service |
| Tester API | http://localhost:6000 | Device testing service |
| Analytics API | http://localhost:7000 | Usage analytics |
| MinIO Console | http://localhost:9001 | S3 storage UI (admin/minio_password) |
| PostgreSQL | localhost:9432 | Database |

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://mobigen:password@localhost:9432/mobigen` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js sessions | `your-super-secret-key` |

### AI Provider (choose one)

**Option A: AWS Bedrock**

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_PROVIDER` | Set to use Bedrock | `bedrock` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key (optional*) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (optional*) | `...` |

*Credentials are optional if using AWS CLI profile or IAM role

**Option B: Direct Anthropic API**

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_PROVIDER` | Set to use Anthropic | `anthropic` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-api03-...` |

### Authentication

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_URL` | NextAuth callback URL | `http://localhost:3333` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | - |

### Service URLs

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_GENERATOR_URL` | Generator URL (client-side) | `http://localhost:4000` |
| `GENERATOR_URL` | Generator URL (server-side) | `http://localhost:4000` |
| `BUILDER_URL` | Builder service URL | `http://localhost:5001` |
| `TESTER_URL` | Tester service URL | `http://localhost:6000` |
| `ANALYTICS_URL` | Analytics service URL | `http://localhost:7000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3333` |

### Redis

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

### Storage (S3/MinIO)

| Variable | Description | Default |
|----------|-------------|---------|
| `S3_ENDPOINT` | S3-compatible endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | S3 access key | `minio_admin` |
| `S3_SECRET_KEY` | S3 secret key | `minio_password` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_BUCKET` | Projects bucket | `mobigen-projects` |
| `ARTIFACTS_BUCKET` | Build artifacts bucket | `mobigen-artifacts` |
| `SCREENSHOTS_BUCKET` | Screenshots bucket | `mobigen-screenshots` |

### Expo EAS Build

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_TOKEN` | Expo access token | - |
| `EXPO_ACCESS_TOKEN` | Expo access token (alias) | - |
| `EAS_PROJECT_ID` | EAS project ID | - |

### Worker Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `WORKER_CONCURRENCY` | Number of concurrent workers | `3` |
| `POLL_INTERVAL` | Build status poll interval (ms) | `30000` |
| `POLL_MAX_RETRIES` | Max poll retries | `120` |
| `POLL_TIMEOUT` | Poll timeout (ms) | `3600000` |

### Development

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `NEXT_PUBLIC_SIMULATION_MODE` | Enable mock generation | `false` |

### Service Ports

| Variable | Description | Default |
|----------|-------------|---------|
| `WEB_PORT` | Web dashboard port | `3333` |
| `GENERATOR_PORT` | Generator service port | `4000` |
| `BUILDER_PORT` | Builder service port | `5001` |
| `TESTER_PORT` | Tester service port | `6000` |
| `ANALYTICS_PORT` | Analytics service port | `7000` |

### Observability

| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry error tracking DSN | - |

---

## Local Development

### Development Commands

```bash
# Install all dependencies
pnpm install

# Start all services in dev mode
pnpm dev

# Start individual services
pnpm --filter @mobigen/web dev        # Web dashboard
pnpm --filter @mobigen/generator dev  # Generator service
pnpm --filter @mobigen/builder dev    # Builder service
pnpm --filter @mobigen/tester dev     # Tester service
pnpm --filter @mobigen/analytics dev  # Analytics service

# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test

# Format code
pnpm format
```

### Database Commands

```bash
# Generate Prisma client
pnpm --filter @mobigen/db prisma generate

# Push schema changes (development)
pnpm --filter @mobigen/db prisma db push

# Create migration
pnpm --filter @mobigen/db prisma migrate dev --name <migration-name>

# Apply migrations (production)
pnpm --filter @mobigen/db prisma migrate deploy

# Open Prisma Studio
pnpm --filter @mobigen/db prisma studio
```

### Setup Script Options

```bash
# Full setup (default)
./scripts/dev-setup.sh

# Start only infrastructure
./scripts/dev-setup.sh --infra-only

# Stop all services
./scripts/dev-setup.sh --stop

# Reset everything (deletes all data)
./scripts/dev-setup.sh --reset
```

---

## Deployment

### Docker Compose Deployment

#### Development (Infrastructure Only)

```bash
# Start only database services
docker compose up -d postgres redis minio

# Run app services locally for hot reload
pnpm dev
```

#### Full Stack

```bash
# Start all services
docker compose --profile full up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (reset data)
docker compose down -v
```

#### Service Ports (Docker)

| Service | Port | Container Name |
|---------|------|----------------|
| PostgreSQL | 5432 | mobigen-postgres |
| Redis | 6379 | mobigen-redis |
| MinIO | 9000, 9001 | mobigen-minio |
| Web | 3333 | mobigen-web |
| Generator | 4000 | mobigen-generator |
| Builder | 5001 | mobigen-builder |
| Tester | 6000 | mobigen-tester |
| Analytics | 7000 | mobigen-analytics |

---

### AWS Deployment (Terraform)

#### Prerequisites

- AWS CLI configured with credentials
- Terraform 1.0+

#### Setup

```bash
cd terraform

# 1. Bootstrap state backend (first time only)
cd bootstrap
terraform init
terraform apply
cd ..

# 2. Configure environment
cp environments/staging/terraform.tfvars.example environments/staging/terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Deploy infrastructure
cd environments/staging
terraform init
terraform plan
terraform apply
```

#### Using Deploy Script

```bash
# Deploy to staging
./terraform/scripts/deploy.sh staging

# Deploy to production
./terraform/scripts/deploy.sh production
```

#### Infrastructure Components

| Component | AWS Service | Description |
|-----------|-------------|-------------|
| VPC | VPC | Private network with public/private subnets |
| Database | RDS PostgreSQL | Managed PostgreSQL database |
| Cache | ElastiCache Redis | Managed Redis cluster |
| Storage | S3 | Object storage for artifacts |
| Container Registry | ECR | Docker image registry |
| Load Balancer | ALB | Application load balancer |
| Compute | ECS Fargate | Serverless container orchestration |
| Secrets | Secrets Manager | Secure credential storage |

#### Post-Deployment

```bash
# Get outputs
terraform output

# Build and push Docker images
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker build -t mobigen-web -f apps/web/Dockerfile .
docker tag mobigen-web:latest <account>.dkr.ecr.<region>.amazonaws.com/mobigen-web:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/mobigen-web:latest
```

---

### Kubernetes Deployment

#### Prerequisites

- kubectl configured with cluster access
- Kubernetes 1.28+

#### Using Kustomize

```bash
cd k8s

# Deploy to staging
kubectl apply -k overlays/staging

# Deploy to production
kubectl apply -k overlays/production

# Check status
kubectl get pods -n mobigen
kubectl get services -n mobigen
kubectl get ingress -n mobigen
```

#### Configure Secrets

```bash
# Create secrets
kubectl create secret generic mobigen-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=anthropic-api-key="sk-ant-..." \
  --from-literal=nextauth-secret="your-secret" \
  -n mobigen
```

#### Kubernetes Resources

| Resource | Description |
|----------|-------------|
| Deployments | Web, Generator, Builder, Tester, Analytics |
| Services | ClusterIP services for internal communication |
| Ingress | External access with TLS |
| ConfigMap | Non-sensitive configuration |
| Secrets | Sensitive credentials |
| HPA | Horizontal Pod Autoscaler (production) |
| PDB | Pod Disruption Budget (production) |

#### Scaling

```bash
# Manual scaling
kubectl scale deployment mobigen-generator --replicas=3 -n mobigen

# View HPA status (production)
kubectl get hpa -n mobigen
```

---

## Project Structure

```
mobigen/
├── apps/                          # Applications
│   ├── web/                       # Next.js dashboard
│   │   ├── src/
│   │   │   ├── app/              # App router pages
│   │   │   │   ├── (auth)/       # Auth pages
│   │   │   │   ├── api/          # API routes
│   │   │   │   ├── dashboard/    # Dashboard
│   │   │   │   ├── projects/     # Project management
│   │   │   │   └── settings/     # User settings
│   │   │   ├── components/       # React components
│   │   │   ├── hooks/            # Custom hooks
│   │   │   └── lib/              # Utilities
│   │   └── Dockerfile
│   ├── admin/                     # Admin panel (planned)
│   └── docs/                      # Documentation site (planned)
│
├── packages/                      # Shared packages
│   ├── ai/                        # Claude AI integration
│   ├── api/                       # tRPC API routers
│   ├── db/                        # Prisma schema & client
│   ├── storage/                   # S3 + Git utilities
│   ├── testing/                   # QA validation pipeline
│   ├── ui/                        # Shared UI components
│   └── config/                    # Shared configs
│       ├── tsconfig/             # TypeScript config
│       ├── eslint/               # ESLint config
│       └── prettier/             # Prettier config
│
├── services/                      # Microservices
│   ├── generator/                 # AI generation orchestrator
│   │   ├── src/
│   │   │   ├── index.ts          # Express + Socket.IO
│   │   │   ├── orchestrator.ts   # Pipeline coordinator
│   │   │   └── hooks/            # Pre/post validation
│   │   └── Dockerfile
│   ├── builder/                   # EAS build service
│   │   ├── src/
│   │   │   ├── index.ts          # Express server
│   │   │   ├── build-service.ts  # EAS integration
│   │   │   ├── queue.ts          # BullMQ processor
│   │   │   └── webhooks.ts       # EAS webhooks
│   │   └── Dockerfile
│   ├── tester/                    # Device testing
│   │   ├── src/
│   │   │   ├── index.ts          # Express + WebSocket
│   │   │   ├── test-service.ts   # WebdriverIO tests
│   │   │   └── screenshot-service.ts
│   │   └── Dockerfile
│   └── analytics/                 # Usage tracking
│       ├── src/
│       │   ├── index.ts          # Express + cron
│       │   ├── usage-tracker.ts
│       │   ├── cost-monitor.ts
│       │   └── metrics-aggregator.ts
│       └── Dockerfile
│
├── templates/                     # React Native templates
│   ├── base/                      # Minimal starter
│   ├── ecommerce/                 # E-commerce app
│   ├── loyalty/                   # Loyalty program
│   ├── news/                      # News reader
│   └── ai-assistant/              # AI chat app
│
├── templates-bare/                # Git bare repos
│
├── terraform/                     # AWS infrastructure
│   ├── modules/                   # Terraform modules
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   ├── s3/
│   │   ├── ecr/
│   │   ├── alb/
│   │   └── ecs/
│   ├── environments/
│   │   ├── staging/
│   │   └── production/
│   └── scripts/
│
├── k8s/                           # Kubernetes manifests
│   ├── base/                      # Base resources
│   └── overlays/
│       ├── staging/
│       └── production/
│
├── scripts/                       # Utility scripts
│   └── dev-setup.sh
│
├── docs/                          # Documentation
│   ├── API.md
│   └── ARCHITECTURE.md
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Services

### Web Dashboard (apps/web)

**Technology:** Next.js 14, React 18, TypeScript, Tailwind CSS, NextAuth.js

The main user interface for managing projects and monitoring generation progress.

**Features:**
- User authentication (credentials + OAuth)
- Project creation wizard
- Real-time generation progress via WebSocket
- Build monitoring and artifact downloads
- User settings and API key management
- Usage statistics and billing

**Key Endpoints:**
- `/` - Landing page
- `/dashboard` - Project list
- `/projects/new` - Project wizard
- `/projects/[id]` - Project detail & generation
- `/settings` - User settings
- `/api/health` - Health check

---

### Generator Service (services/generator)

**Technology:** Express.js, Socket.IO, Anthropic SDK

Orchestrates AI-powered app generation through a multi-agent pipeline.

**Features:**
- 9-phase AI agent pipeline
- Template context extraction
- Real-time progress via WebSocket
- Session management for resumption
- Pre/post validation hooks

**Key Endpoints:**
- `POST /api/generate` - Start generation
- `GET /api/health` - Health check
- `WebSocket /` - Real-time events

---

### Builder Service (services/builder)

**Technology:** Express.js, BullMQ, Expo EAS Client

Handles mobile app building via Expo Application Services.

**Features:**
- Build queue management
- EAS build triggering
- Webhook handling for status updates
- Artifact storage in S3
- Build log aggregation

**Key Endpoints:**
- `POST /builds` - Trigger build
- `GET /builds/:id` - Get build status
- `GET /builds/:id/logs` - Get logs
- `POST /webhooks/eas` - EAS webhook

---

### Tester Service (services/tester)

**Technology:** Express.js, WebdriverIO, Appium, Sharp, Pixelmatch

Automated device testing and visual regression.

**Features:**
- UI test automation
- Screenshot capture
- Visual regression with pixelmatch
- Baseline management
- Test result storage

**Key Endpoints:**
- `POST /tests` - Queue test run
- `GET /tests/:id` - Get test status
- `GET /screenshots/:buildId` - Get screenshots
- `POST /screenshots/compare` - Compare screenshots

---

### Analytics Service (services/analytics)

**Technology:** Express.js, Node-cron, Redis

Usage tracking, cost monitoring, and metrics.

**Features:**
- Event tracking
- Token usage monitoring
- Cost calculation (per model)
- Metrics aggregation (daily/weekly)
- Dashboard statistics

**Key Endpoints:**
- `POST /events` - Track event
- `POST /usage/api` - Track API usage
- `GET /usage/user/:id` - Get user stats
- `GET /costs/user/:id` - Get cost breakdown
- `GET /metrics/dashboard` - Dashboard metrics

---

## Packages

### @mobigen/ai

Claude AI SDK integration with agent definitions.

```typescript
import { createAgent, runPipeline } from '@mobigen/ai';
```

### @mobigen/api

tRPC API routers for type-safe API calls.

```typescript
import { appRouter, createContext } from '@mobigen/api';
```

### @mobigen/db

Prisma schema and database client.

```typescript
import { prisma } from '@mobigen/db';
```

### @mobigen/storage

S3 and Git storage utilities.

```typescript
import { S3Client, GitClient, TemplateManager } from '@mobigen/storage';
```

### @mobigen/testing

QA validation pipeline for generated code.

```typescript
import { TypeScriptValidator, ESLintValidator } from '@mobigen/testing';
```

### @mobigen/ui

Shared React UI components.

```typescript
import { Button, Card, Input, Modal } from '@mobigen/ui';
```

---

## Templates

### Available Templates

| Template | Description | Features |
|----------|-------------|----------|
| **base** | Minimal starter | Navigation, theme, basic screens |
| **ecommerce** | E-commerce app | Products, cart, checkout, orders |
| **loyalty** | Loyalty program | Points, rewards, tiers, redemption |
| **news** | News reader | Articles, categories, bookmarks |
| **ai-assistant** | AI chat app | Chat interface, history, settings |

### Template Structure

```
templates/<name>/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
├── services/              # API services
├── theme/                 # Theme configuration
├── utils/                 # Utility functions
├── app.json               # Expo config
├── package.json
└── tsconfig.json
```

### Adding a New Template

1. Create template directory: `templates/<name>/`
2. Set up Expo project with NativeWind
3. Add screens and components
4. Initialize bare repo:
   ```bash
   mkdir templates-bare/<name>.git
   cd templates-bare/<name>.git && git init --bare
   ```
5. Update `TemplateManager` in `packages/storage`

---

## AI Agent Pipeline

The generator service uses a 9-phase AI pipeline:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI Agent Pipeline                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │  Intent  │──▶│   PRD    │──▶│Architect │──▶│  UI/UX   │             │
│  │ Analysis │   │Generator │   │ Designer │   │ Planner  │             │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘             │
│       │                                             │                    │
│       │         Understand      Create detailed     │                    │
│       │         user intent     specifications      │                    │
│       ▼                                             ▼                    │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │   Task   │◀──│  Code    │──▶│    QA    │──▶│   Git    │             │
│  │Breakdown │   │Generator │   │Validator │   │ Commit   │             │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘             │
│                      │                              │                    │
│                      │         TypeScript +         │                    │
│                      ▼         ESLint checks        ▼                    │
│                 ┌──────────┐                   ┌──────────┐             │
│                 │ Complete │                   │ Version  │             │
│                 │   App    │                   │ Control  │             │
│                 └──────────┘                   └──────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phases

| Phase | Agent | Description |
|-------|-------|-------------|
| 1 | Intent Analysis | Parse and understand user requirements |
| 2 | PRD Generation | Create detailed product requirements document |
| 3 | Architecture Design | Plan technical structure and patterns |
| 4 | UI/UX Planning | Design component hierarchy and screens |
| 5 | Task Breakdown | Create implementation tasks |
| 6 | Code Generation | Write actual code for each task |
| 7 | QA Validation | Run TypeScript and ESLint checks |
| 8 | Git Commit | Version control the changes |
| 9 | Completion | Finalize and notify user |

---

## API Reference

### tRPC Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `projects.list` | Query | List user projects |
| `projects.getById` | Query | Get project by ID |
| `projects.create` | Mutation | Create new project |
| `projects.update` | Mutation | Update project |
| `projects.delete` | Mutation | Delete project |
| `builds.list` | Query | List project builds |
| `builds.trigger` | Mutation | Trigger new build |
| `builds.getStatus` | Query | Get build status |
| `users.me` | Query | Get current user |
| `users.updateSettings` | Mutation | Update settings |
| `users.getUsage` | Query | Get usage stats |

### REST Endpoints

See [docs/API.md](docs/API.md) for complete API documentation.

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgresql://mobigen:mobigen_dev_password@localhost:9432/mobigen

# Reset database
docker compose down -v
docker compose up -d postgres
pnpm --filter @mobigen/db prisma db push
```

#### Redis Connection Failed

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Prisma Client Not Generated

```bash
pnpm --filter @mobigen/db prisma generate
```

#### Build Failures

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

#### MinIO Bucket Not Found

```bash
# Recreate buckets
docker exec mobigen-minio mc mb local/mobigen-projects --ignore-existing
docker exec mobigen-minio mc mb local/mobigen-artifacts --ignore-existing
docker exec mobigen-minio mc mb local/mobigen-screenshots --ignore-existing
```

### Logs

```bash
# Docker Compose logs
docker compose logs -f <service>

# Specific service
docker compose logs -f generator

# All services
docker compose logs -f
```

### Health Checks

```bash
# Web dashboard
curl http://localhost:3333/api/health

# Generator
curl http://localhost:4000/health

# Builder
curl http://localhost:5001/health

# All services
for port in 3333 4000 5001 6000 7000; do
  echo "Port $port: $(curl -s http://localhost:$port/health | head -c 50)"
done
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements](../docs/PRD-mobigen.md) | Product vision, features, and roadmap |
| [Technical Design](../docs/TECHNICAL-DESIGN-mobigen.md) | System architecture and AI pipeline design |
| [Certification Status](docs/CERTIFICATION-STATUS.md) | Template quality assurance results |
| [Project Creation Flow](docs/PROJECT_CREATION_FLOW.md) | Complete guide on how apps are generated from templates |
| [Architecture Overview](docs/ARCHITECTURE.md) | System architecture and component relationships |
| [API Reference](docs/API.md) | REST and tRPC API documentation |
| [Templates Guide](templates/README.md) | Available templates and how to create new ones |
| [Terraform Deployment](terraform/README.md) | AWS infrastructure setup |
| [Kubernetes Deployment](k8s/README.md) | Kubernetes manifests and configuration |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.
