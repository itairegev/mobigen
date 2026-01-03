# @mobigen/analytics-service

Analytics service for Mobigen - handles platform usage tracking and mobile app event ingestion.

## Overview

The Analytics service has two main responsibilities:

1. **Platform Analytics**: Usage tracking, cost monitoring, and metrics aggregation for the Mobigen platform itself
2. **Event Ingestion**: Receives and processes analytics events from generated mobile apps

This dual-purpose service provides insights into both platform usage (token consumption, costs) and end-user behavior in generated mobile apps (screen views, custom events, sessions).

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Scheduling**: Node-cron
- **Cache**: Redis
- **Database**: PostgreSQL (Prisma)
- **Language**: TypeScript

## Features

- Event tracking
- Token usage monitoring
- Cost calculation by model
- Metrics aggregation (daily/weekly)
- Dashboard statistics
- Usage projections

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Analytics Service                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────────────────────────────────┐  │
│  │   Express    │────▶│          Usage Tracker                    │  │
│  │   Server     │     │  • Event recording                       │  │
│  └──────────────┘     │  • API usage tracking                    │  │
│                       │  • Real-time counters                    │  │
│  ┌──────────────┐     └──────────────────────────────────────────┘  │
│  │  Cron Jobs   │                        │                          │
│  │              │     ┌──────────────────▼───────────────────────┐  │
│  │ • Hourly     │────▶│          Cost Monitor                     │  │
│  │ • Daily      │     │  • Token pricing                         │  │
│  │ • Weekly     │     │  • Model-based costs                     │  │
│  └──────────────┘     │  • Projections                           │  │
│                       └──────────────────────────────────────────┘  │
│                                          │                          │
│                       ┌──────────────────▼───────────────────────┐  │
│                       │        Metrics Aggregator                 │  │
│                       │  • Dashboard stats                       │  │
│                       │  • Time-series data                      │  │
│                       │  • Top projects                          │  │
│                       └──────────────────────────────────────────┘  │
│                                          │                          │
│  ┌──────────────┐     ┌──────────────────▼───────────────────────┐  │
│  │    Redis     │◀───▶│          Data Stores                      │  │
│  │    Cache     │     │  PostgreSQL │ Redis │ In-memory          │  │
│  └──────────────┘     └──────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── index.ts              # Entry point with cron setup
├── api.ts                # Express routes
├── usage-tracker.ts      # Event and usage tracking
├── cost-monitor.ts       # Cost calculation
├── metrics-aggregator.ts # Metrics aggregation
├── pricing.ts            # Model pricing data
├── types.ts              # TypeScript types
└── jobs/
    ├── hourly.ts         # Hourly aggregation
    ├── daily.ts          # Daily rollup
    └── weekly.ts         # Weekly reports
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- Redis

### Development

```bash
# From monorepo root
pnpm install

# Start infrastructure
docker compose up -d postgres redis

# Start development server
pnpm --filter @mobigen/analytics dev
```

### Environment Variables

```env
# Server
PORT=7000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://mobigen:mobigen_dev_password@localhost:5432/mobigen

# Redis
REDIS_URL=redis://localhost:6379

# Cron
ENABLE_CRON=true
```

## API Endpoints

### Event Ingestion (Mobile Apps)

#### POST /api/events

Ingest a batch of events from mobile apps.

**Headers:**
- `X-API-Key`: Project API key (required)

**Request:**
```json
{
  "batchId": "batch-123",
  "projectId": "project-abc",
  "events": [
    {
      "eventId": "event-1",
      "type": "screen_view",
      "sessionId": "session-xyz",
      "projectId": "project-abc",
      "timestamp": "2024-01-03T12:00:00Z",
      "properties": {
        "screenName": "Home"
      },
      "device": {
        "platform": "ios",
        "osVersion": "17.2",
        "appVersion": "1.0.0"
      }
    }
  ],
  "createdAt": "2024-01-03T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "accepted": 1,
  "rejected": 0,
  "rateLimit": {
    "count": 150,
    "limit": 1000,
    "exceeded": false
  }
}
```

#### POST /api/events/single

Ingest a single event.

**Headers:**
- `X-API-Key`: Project API key (required)

**Request:**
```json
{
  "eventId": "event-1",
  "type": "custom",
  "sessionId": "session-xyz",
  "projectId": "project-abc",
  "timestamp": "2024-01-03T12:00:00Z",
  "properties": {
    "eventName": "purchase_completed",
    "orderId": "order-123",
    "total": 99.99
  }
}
```

#### GET /api/events/health

Health check for event ingestion.

**Response:**
```json
{
  "status": "ok",
  "service": "analytics-ingestion",
  "buffers": {
    "project-abc": 45
  }
}
```

### Platform Analytics

### Health Check

```
GET /health
```

### Track Event

```
POST /events
```

Request:
```json
{
  "event": "project.created",
  "userId": "user-uuid",
  "projectId": "project-uuid",
  "metadata": {
    "template": "ecommerce"
  }
}
```

### Track API Usage

```
POST /usage/api
```

Request:
```json
{
  "userId": "user-uuid",
  "projectId": "project-uuid",
  "model": "claude-3-sonnet-20240229",
  "inputTokens": 1500,
  "outputTokens": 3000,
  "requestId": "req-uuid"
}
```

### Get User Stats

```
GET /usage/user/:userId?period=month
```

Response:
```json
{
  "totalRequests": 150,
  "totalInputTokens": 50000,
  "totalOutputTokens": 120000,
  "totalTokens": 170000,
  "uniqueProjects": 5,
  "byModel": {
    "claude-3-sonnet-20240229": {
      "requests": 100,
      "inputTokens": 30000,
      "outputTokens": 80000
    },
    "claude-3-haiku-20240307": {
      "requests": 50,
      "inputTokens": 20000,
      "outputTokens": 40000
    }
  },
  "byDay": [
    { "date": "2024-01-15", "requests": 20, "tokens": 15000 },
    { "date": "2024-01-14", "requests": 18, "tokens": 12000 }
  ]
}
```

### Get Cost Breakdown

```
GET /costs/user/:userId?period=month
```

Response:
```json
{
  "totalCost": 12.50,
  "inputCost": 2.50,
  "outputCost": 10.00,
  "byModel": {
    "claude-3-sonnet-20240229": {
      "inputCost": 2.00,
      "outputCost": 8.00,
      "totalCost": 10.00
    },
    "claude-3-haiku-20240307": {
      "inputCost": 0.50,
      "outputCost": 2.00,
      "totalCost": 2.50
    }
  },
  "byDay": [
    { "date": "2024-01-15", "cost": 2.00, "tokens": 15000 },
    { "date": "2024-01-14", "cost": 1.50, "tokens": 12000 }
  ],
  "projectedMonthly": 45.00
}
```

### Dashboard Metrics

```
GET /metrics/dashboard
```

Response:
```json
{
  "overview": {
    "totalProjects": 150,
    "totalGenerations": 500,
    "totalBuilds": 200,
    "totalTokensUsed": 5000000,
    "totalCost": 250.00
  },
  "recentActivity": {
    "generationsLast24h": 25,
    "buildsLast24h": 10,
    "tokensLast24h": 100000
  },
  "trends": {
    "generationsChange": 15.5,
    "buildsChange": -5.2,
    "tokensChange": 20.0
  },
  "topProjects": [
    { "id": "uuid", "name": "My App", "generations": 50, "tokens": 100000 }
  ]
}
```

### Time Series Data

```
GET /metrics/timeseries?metric=tokens&period=30d&granularity=day
```

Response:
```json
{
  "metric": "tokens",
  "period": "30d",
  "granularity": "day",
  "data": [
    { "timestamp": "2024-01-15T00:00:00Z", "value": 15000 },
    { "timestamp": "2024-01-14T00:00:00Z", "value": 12000 }
  ]
}
```

## Event Types

| Event | Description |
|-------|-------------|
| `user.created` | New user registered |
| `user.login` | User logged in |
| `project.created` | New project created |
| `project.deleted` | Project deleted |
| `generation.started` | Generation started |
| `generation.completed` | Generation completed |
| `generation.failed` | Generation failed |
| `build.triggered` | Build triggered |
| `build.completed` | Build completed |
| `build.failed` | Build failed |

## Cost Calculation

### Model Pricing

```typescript
const MODEL_PRICING = {
  'claude-3-opus-20240229': {
    input: 15.00,   // per 1M tokens
    output: 75.00,  // per 1M tokens
  },
  'claude-3-sonnet-20240229': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
  },
};
```

### Cost Formula

```typescript
function calculateCost(usage: ApiUsage): number {
  const pricing = MODEL_PRICING[usage.model];
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
```

## Cron Jobs

### Hourly Aggregation

```
0 * * * * - Every hour
```

- Aggregate real-time counters
- Update Redis cache

### Daily Rollup

```
0 0 * * * - Every day at midnight
```

- Create daily summaries
- Archive detailed logs
- Calculate daily costs

### Weekly Reports

```
0 0 * * 0 - Every Sunday at midnight
```

- Generate weekly reports
- Calculate trends
- Send notification emails

## Redis Caching

### Keys

```
analytics:user:{userId}:tokens:daily
analytics:user:{userId}:requests:daily
analytics:project:{projectId}:tokens:daily
analytics:global:tokens:hourly
```

### Cache Duration

- Real-time counters: No expiry (reset daily)
- Aggregated data: 24 hours
- Dashboard stats: 5 minutes

## Building

```bash
# Build for production
pnpm --filter @mobigen/analytics build

# Start production server
pnpm --filter @mobigen/analytics start
```

## Docker

```bash
# Build image
docker build -t mobigen-analytics -f services/analytics/Dockerfile .

# Run container
docker run -p 7000:7000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  mobigen-analytics
```

## Testing

```bash
# Run tests
pnpm --filter @mobigen/analytics test

# Run with coverage
pnpm --filter @mobigen/analytics test:coverage
```

## Related Documentation

- [Main README](../../README.md)
- [API Documentation](../../docs/API.md)
