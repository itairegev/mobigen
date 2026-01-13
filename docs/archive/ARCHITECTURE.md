# Mobigen Architecture

Comprehensive architecture documentation for the Mobigen AI-powered mobile app generator.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                        CLIENTS                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                      │
│  │   Web Browser   │    │  Mobile Device  │    │   CLI / API     │                      │
│  │   (Dashboard)   │    │  (Preview App)  │    │   Integration   │                      │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘                      │
│           │                      │                      │                               │
└───────────┼──────────────────────┼──────────────────────┼───────────────────────────────┘
            │                      │                      │
            └──────────────────────┼──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      Load Balancer / CDN    │
                    │    (AWS ALB / CloudFront)   │
                    └──────────────┬──────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────────────────────┐
│                                  │          APPLICATION LAYER                            │
├──────────────────────────────────┼──────────────────────────────────────────────────────┤
│                                  │                                                       │
│  ┌───────────────────────────────┴───────────────────────────────────────────────────┐  │
│  │                              API Gateway / Router                                  │  │
│  └─────────┬─────────────────────┬─────────────────────┬───────────────────┬─────────┘  │
│            │                     │                     │                   │            │
│  ┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌───────▼───────┐   │
│  │    Web Service    │ │ Generator Service │ │  Builder Service  │ │Tester Service │   │
│  │    (Next.js)      │ │ (Express+Socket)  │ │   (Express+Bull)  │ │   (Express)   │   │
│  │                   │ │                   │ │                   │ │               │   │
│  │ • Dashboard UI    │ │ • AI Orchestrator │ │ • EAS Integration │ │ • Device Tests│   │
│  │ • Auth (NextAuth) │ │ • Template Engine │ │ • Build Queue     │ │ • Screenshots │   │
│  │ • tRPC API        │ │ • Code Generator  │ │ • Artifact Upload │ │ • Visual Diff │   │
│  │ • Project Mgmt    │ │ • Real-time WS    │ │ • Webhooks        │ │               │   │
│  └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘ └───────┬───────┘   │
│            │                     │                     │                   │            │
│            └─────────────────────┴─────────────────────┴───────────────────┘            │
│                                          │                                              │
│  ┌───────────────────────────────────────┴───────────────────────────────────────────┐  │
│  │                           Analytics Service (Express + Cron)                       │  │
│  │              • Usage Tracking  • Cost Monitoring  • Metrics Aggregation            │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────────────────────┐
│                                  │           DATA LAYER                                  │
├──────────────────────────────────┼──────────────────────────────────────────────────────┤
│                                  │                                                       │
│  ┌─────────────────┐   ┌─────────▼─────────┐   ┌─────────────────┐   ┌───────────────┐  │
│  │   PostgreSQL    │   │      Redis        │   │       S3        │   │     ECR       │  │
│  │   (Primary DB)  │   │  (Cache/Queue)    │   │    (Storage)    │   │   (Images)    │  │
│  │                 │   │                   │   │                 │   │               │  │
│  │ • Users         │   │ • Session Cache   │   │ • Templates     │   │ • Web Image   │  │
│  │ • Projects      │   │ • Rate Limits     │   │ • Artifacts     │   │ • Generator   │  │
│  │ • Builds        │   │ • Job Queues      │   │ • Screenshots   │   │ • Builder     │  │
│  │ • Analytics     │   │ • Real-time Data  │   │ • Generated Apps│   │ • Tester      │  │
│  └─────────────────┘   └───────────────────┘   └─────────────────┘   └───────────────┘  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────────────────────┐
│                                  │         EXTERNAL SERVICES                             │
├──────────────────────────────────┼──────────────────────────────────────────────────────┤
│                                  │                                                       │
│  ┌─────────────────┐   ┌─────────▼─────────┐   ┌─────────────────┐   ┌───────────────┐  │
│  │   Anthropic     │   │     Expo EAS      │   │  OAuth Providers│   │   Appium      │  │
│  │    (Claude)     │   │  (Build Service)  │   │ (GitHub, Google)│   │  (Testing)    │  │
│  │                 │   │                   │   │                 │   │               │  │
│  │ • Code Gen      │   │ • iOS Builds      │   │ • Social Login  │   │ • UI Tests    │  │
│  │ • PRD Analysis  │   │ • Android Builds  │   │ • SSO           │   │ • Automation  │  │
│  │ • Architecture  │   │ • OTA Updates     │   │                 │   │               │  │
│  └─────────────────┘   └───────────────────┘   └─────────────────┘   └───────────────┘  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### Web Service (apps/web)

**Technology:** Next.js 14, React, TypeScript, Tailwind CSS

**Responsibilities:**
- User authentication and session management
- Dashboard UI for project management
- Real-time generation progress display
- Build monitoring and artifact downloads
- User settings and billing

**Key Files:**
```
apps/web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/         # Auth pages (login, signup)
│   │   ├── dashboard/      # Main dashboard
│   │   ├── projects/       # Project management
│   │   └── settings/       # User settings
│   ├── components/         # React components
│   ├── lib/               # Utilities (auth, trpc)
│   └── hooks/             # Custom React hooks
└── Dockerfile
```

### Generator Service (services/generator)

**Technology:** Express.js, Socket.IO, Claude AI SDK

**Responsibilities:**
- AI-powered code generation orchestration
- 9-phase agent pipeline execution
- Template context extraction
- Real-time progress via WebSocket
- Session management and resumption

**AI Pipeline Phases:**
1. **Intent Analysis** - Understand user requirements
2. **PRD Generation** - Create detailed product spec
3. **Architecture Design** - Plan technical structure
4. **UI/UX Planning** - Design component hierarchy
5. **Task Breakdown** - Create implementation tasks
6. **Code Generation** - Implement features
7. **QA Validation** - TypeScript/ESLint checks
8. **Git Commit** - Version control
9. **Completion** - Finalize and notify

**Key Files:**
```
services/generator/
├── src/
│   ├── index.ts            # Express + Socket.IO server
│   ├── orchestrator.ts     # Pipeline orchestrator
│   ├── agents/             # AI agent definitions
│   │   ├── intent.ts
│   │   ├── prd.ts
│   │   ├── architect.ts
│   │   └── ...
│   └── hooks/              # Pre/post validation hooks
└── Dockerfile
```

### Builder Service (services/builder)

**Technology:** Express.js, BullMQ, Expo EAS Client

**Responsibilities:**
- Build queue management
- EAS build triggering and monitoring
- Webhook handling for build status
- Artifact storage and retrieval
- Build log aggregation

**Key Files:**
```
services/builder/
├── src/
│   ├── index.ts           # Express server
│   ├── build-service.ts   # EAS integration
│   ├── webhooks.ts        # EAS webhook handler
│   └── queue.ts           # BullMQ job processor
└── Dockerfile
```

### Tester Service (services/tester)

**Technology:** Express.js, WebdriverIO, Appium, Sharp

**Responsibilities:**
- Device testing automation
- Screenshot capture and storage
- Visual regression testing
- Test result aggregation
- Baseline management

**Key Files:**
```
services/tester/
├── src/
│   ├── index.ts              # Express + WebSocket server
│   ├── test-service.ts       # Test execution
│   └── screenshot-service.ts # Visual testing
└── Dockerfile
```

### Analytics Service (services/analytics)

**Technology:** Express.js, Node-cron, Redis

**Responsibilities:**
- Event tracking and storage
- Token usage monitoring
- Cost calculation and reporting
- Metrics aggregation
- Weekly report generation

**Key Files:**
```
services/analytics/
├── src/
│   ├── index.ts              # Express server + cron jobs
│   ├── usage-tracker.ts      # Usage tracking
│   ├── cost-monitor.ts       # Cost calculations
│   └── metrics-aggregator.ts # Metrics aggregation
└── Dockerfile
```

## Data Flow

### App Generation Flow

```
User Request → Web Dashboard → Generator Service → AI Pipeline
                                      │
                                      ├──► Intent Agent (Claude)
                                      ├──► PRD Agent (Claude)
                                      ├──► Architecture Agent (Claude)
                                      ├──► UI Agent (Claude)
                                      ├──► Task Agent (Claude)
                                      ├──► Implementation Agent (Claude)
                                      ├──► QA Validation
                                      └──► Git Commit
                                              │
                                              ▼
                              Generated App Files → S3 Storage
                                              │
                                              ▼
                              User Notification via WebSocket
```

### Build Flow

```
Build Request → Web Dashboard → Builder Service → Job Queue (Redis)
                                      │
                                      ▼
                              EAS Build Trigger
                                      │
                                      ▼
                              Expo EAS Cloud Build
                                      │
                                      ▼
                              Webhook Notification
                                      │
                                      ▼
                              Artifact Upload → S3
                                      │
                                      ▼
                              User Notification
```

### Testing Flow

```
Test Request → Tester Service → Job Queue (Redis)
                     │
                     ▼
              Appium/WebDriver Session
                     │
                     ├──► UI Tests
                     ├──► Screenshot Capture
                     └──► Visual Comparison
                              │
                              ▼
                     Results → S3 + Database
                              │
                              ▼
                     User Notification
```

## Database Schema

### Core Entities

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────<│   Project    │────<│    Build     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ email        │     │ userId       │     │ projectId    │
│ name         │     │ name         │     │ platform     │
│ passwordHash │     │ templateId   │     │ status       │
│ tier         │     │ status       │     │ easBuildId   │
│ createdAt    │     │ config       │     │ artifactUrl  │
└──────────────┘     │ s3Prefix     │     │ completedAt  │
                     │ createdAt    │     └──────────────┘
                     └──────────────┘
                            │
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌──────────────┐           ┌──────────────┐
    │ProjectSession│           │ ProjectChange│
    ├──────────────┤           ├──────────────┤
    │ id           │           │ id           │
    │ projectId    │           │ projectId    │
    │ sessionId    │           │ version      │
    │ tokensUsed   │           │ message      │
    │ filesModified│           │ filesChanged │
    └──────────────┘           └──────────────┘
```

### Analytics Entities

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│AnalyticsEvent│     │   ApiUsage   │     │  UsageEvent  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ event        │     │ userId       │     │ userId       │
│ userId       │     │ model        │     │ eventType    │
│ projectId    │     │ inputTokens  │     │ creditsUsed  │
│ metadata     │     │ outputTokens │     │ metadata     │
│ timestamp    │     │ timestamp    │     │ createdAt    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Security Architecture

### Authentication

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────>│  NextAuth   │────>│  Database   │
│             │     │             │     │             │
│ Session     │<────│  JWT/Cookie │<────│ User Record │
│ Cookie      │     │  Generation │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### API Security

1. **Session Validation** - All requests validated against session store
2. **Rate Limiting** - Redis-based rate limiting per user/IP
3. **Input Validation** - Zod schemas for all inputs
4. **CORS** - Configured for allowed origins only
5. **Secrets Management** - AWS Secrets Manager / K8s Secrets

### Data Protection

1. **Encryption at Rest** - RDS and S3 encryption
2. **Encryption in Transit** - TLS 1.3 everywhere
3. **API Key Encryption** - User API keys encrypted before storage
4. **Audit Logging** - All sensitive operations logged

## Deployment Architecture

### AWS (Terraform)

```
┌─────────────────────────────────────────────────────────────────┐
│                              VPC                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Public Subnets                        │   │
│  │  ┌─────────────┐                                        │   │
│  │  │     ALB     │                                        │   │
│  │  └──────┬──────┘                                        │   │
│  └─────────┼───────────────────────────────────────────────┘   │
│            │                                                    │
│  ┌─────────┼───────────────────────────────────────────────┐   │
│  │         │           Private Subnets                      │   │
│  │         ▼                                                │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │              ECS Fargate Cluster                  │   │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │   │   │
│  │  │  │  Web   │ │  Gen   │ │ Builder│ │ Tester │     │   │   │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘     │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                         │                                │   │
│  │         ┌───────────────┼───────────────┐               │   │
│  │         ▼               ▼               ▼               │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐          │   │
│  │  │   RDS    │    │  Redis   │    │    S3    │          │   │
│  │  │(Postgres)│    │(ElastiC) │    │ (Storage)│          │   │
│  │  └──────────┘    └──────────┘    └──────────┘          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes

```
┌─────────────────────────────────────────────────────────────────┐
│                         Kubernetes Cluster                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Ingress Controller                       │ │
│  │  • TLS termination  • Path routing  • WebSocket support    │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                  │
│  ┌────────────────────────────┴───────────────────────────────┐ │
│  │                     Service Mesh                            │ │
│  │                                                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │   Web    │  │Generator │  │ Builder  │  │  Tester  │   │ │
│  │  │Deployment│  │Deployment│  │Deployment│  │Deployment│   │ │
│  │  │ HPA: 2-10│  │ HPA: 2-8 │  │ Replicas │  │ Replicas │   │ │
│  │  └──────────┘  └──────────┘  │    1     │  │    1     │   │ │
│  │                              └──────────┘  └──────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    External Services                        │ │
│  │  • AWS RDS (Postgres)  • ElastiCache (Redis)  • S3        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability

### Horizontal Scaling

| Service | Min | Max | Trigger |
|---------|-----|-----|---------|
| Web | 2 | 10 | CPU 70%, Memory 80% |
| Generator | 2 | 8 | CPU 60%, Memory 70% |
| Builder | 1 | 4 | Queue depth |
| Tester | 1 | 4 | Queue depth |

### Vertical Scaling

| Service | CPU | Memory | Notes |
|---------|-----|--------|-------|
| Web | 0.5-1 vCPU | 512MB-1GB | Stateless |
| Generator | 1-2 vCPU | 1-2GB | AI processing |
| Builder | 0.5-1 vCPU | 512MB-1GB | Queue-based |
| Tester | 0.5-1 vCPU | 512MB-1GB | Device connections |

### Database Scaling

- **Read Replicas** - For analytics queries
- **Connection Pooling** - PgBouncer for connection management
- **Sharding** - Project-based sharding for large scale

## Monitoring & Observability

### Metrics

- **Application Metrics** - Request latency, error rates, throughput
- **Infrastructure Metrics** - CPU, memory, disk, network
- **Business Metrics** - Projects created, builds completed, token usage

### Logging

- **Structured Logging** - JSON format for all services
- **Log Aggregation** - CloudWatch Logs / ELK Stack
- **Log Retention** - 14 days hot, 90 days cold storage

### Tracing

- **Distributed Tracing** - X-Ray / Jaeger
- **Request Correlation** - Trace IDs across services
- **Performance Profiling** - Identify bottlenecks

### Alerting

- **Critical** - Service down, error rate > 5%
- **Warning** - Latency p99 > 2s, queue depth > 100
- **Info** - Scaling events, deployment notifications
