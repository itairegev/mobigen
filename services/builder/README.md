# @mobigen/builder

EAS build orchestration service for Mobigen.

## Overview

The Builder service handles mobile app builds through Expo Application Services (EAS). It manages build queues, triggers builds, monitors progress via webhooks/polling, and stores artifacts.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Queue**: BullMQ
- **Build Platform**: Expo EAS
- **Storage**: S3/MinIO
- **Language**: TypeScript

## Features

This service handles the entire build lifecycle for Mobigen-generated mobile apps:

- Triggers builds on Expo EAS
- Manages build queue with BullMQ
- Polls build status
- Downloads and stores artifacts in S3
- Provides REST API for build operations

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /builds
       ▼
┌─────────────┐
│  API Server │
└──────┬──────┘
       │ enqueue
       ▼
┌─────────────┐
│ Build Queue │ (BullMQ + Redis)
└──────┬──────┘
       │ process
       ▼
┌─────────────┐      ┌──────────────┐
│   Worker    │─────▶│  EAS Client  │
└──────┬──────┘      └──────────────┘
       │                     │
       │                     │ trigger build
       │                     ▼
       │              ┌──────────────┐
       │              │  Expo EAS    │
       │              └──────────────┘
       │
       ▼
┌─────────────┐
│Status Poller│
└──────┬──────┘
       │ poll status
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  Artifact   │─────▶│  S3 Storage  │
│  Storage    │      └──────────────┘
└─────────────┘
```

## Components

### 1. API Server (`api.ts`)

REST API endpoints:

- `POST /builds` - Trigger new build
- `GET /builds/:id` - Get build status
- `GET /builds/:id/logs` - Get build logs
- `GET /builds/:id/download` - Get artifact download URL

### 2. EAS Client (`eas-client.ts`)

Integrates with Expo EAS API:

- Create EAS projects
- Trigger builds
- Get build status
- Download artifacts
- Retrieve logs

### 3. Build Queue (`queue.ts`)

BullMQ-based job queue:

- Job enqueueing with priority
- Concurrency control (default: 3 concurrent builds)
- Rate limiting
- Retry logic with exponential backoff
- Job status tracking

### 4. Build Service (`build-service.ts`)

Main orchestration logic:

- Apply white-label configuration
- Run Tier 3 validation
- Create/manage EAS projects
- Update build records in database

### 5. Status Poller (`status-poller.ts`)

Polls EAS for build status:

- Configurable polling interval (default: 30s)
- Automatic retry with timeout
- Handles success/failure states
- Downloads artifacts on completion
- Extracts error summaries from logs

### 6. Artifact Storage (`artifact-storage.ts`)

Manages build artifacts:

- Downloads from EAS
- Uploads to S3 (`builds/{project_id}/{build_id}.{ipa|apk}`)
- Generates signed download URLs
- Stores build logs
- Cleanup old artifacts

## Environment Variables

```bash
# Required
EXPO_TOKEN=your_expo_token
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional
PORT=3000
WORKER_CONCURRENCY=3
NODE_ENV=development
```

## Installation

```bash
pnpm install
```

## Development

```bash
# Start in development mode with hot reload
pnpm dev

# Type checking
pnpm typecheck

# Build
pnpm build

# Start production server
pnpm start
```

## API Usage

### Trigger a Build

```bash
curl -X POST http://localhost:3000/builds \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "ios",
    "version": 1,
    "profile": "production"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "build-uuid",
    "projectId": "project-uuid",
    "platform": "ios",
    "status": "queued",
    "startedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Build Status

```bash
curl http://localhost:3000/builds/{build-id}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "build-uuid",
    "projectId": "project-uuid",
    "platform": "ios",
    "status": "building",
    "easBuildId": "eas-build-id",
    "startedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Build Logs

```bash
curl http://localhost:3000/builds/{build-id}/logs
```

### Get Download URL

```bash
curl http://localhost:3000/builds/{build-id}/download?expiresIn=3600
```

Response:
```json
{
  "success": true,
  "data": {
    "buildId": "build-uuid",
    "downloadUrl": "https://s3.amazonaws.com/...",
    "expiresIn": 3600,
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
}
```

## Build Lifecycle

1. **Trigger** (`POST /builds`)
   - Validate request
   - Apply white-label config
   - Run Tier 3 validation
   - Create build record
   - Enqueue job

2. **Queue Processing**
   - Worker picks up job
   - Create/get EAS project
   - Trigger EAS build
   - Update build status

3. **Status Polling**
   - Poll EAS API every 30s
   - Update database with status
   - Handle terminal states

4. **Success Path**
   - Download artifact from EAS
   - Upload to S3
   - Store logs
   - Update database with URLs

5. **Failure Path**
   - Retrieve error logs
   - Extract error summary
   - Update database with error
   - Mark build as failed

## Database Integration

This service expects the following database tables (from `@mobigen/db`):

### `builds` table

```sql
CREATE TABLE builds (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  version INTEGER NOT NULL,
  platform VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  eas_build_id VARCHAR(100),
  eas_project_id VARCHAR(100),
  artifact_s3_key VARCHAR(255),
  artifact_size_bytes BIGINT,
  logs_s3_key VARCHAR(255),
  error_summary TEXT,
  validation_tier VARCHAR(20),
  validation_passed BOOLEAN,
  validation_errors JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Queue Metrics

Monitor queue health:

```typescript
import { getQueueMetrics } from './queue';

const metrics = await getQueueMetrics();
// {
//   waiting: 5,
//   active: 3,
//   completed: 100,
//   failed: 2,
//   delayed: 0,
//   total: 110
// }
```

## Testing

```bash
pnpm test
```

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Environment Setup

Ensure the following are configured:

- Redis instance for queue
- S3 bucket for artifacts
- Database for build records
- Expo EAS token

### Scaling

The service can be scaled horizontally:

- **API servers**: Multiple instances behind load balancer
- **Workers**: Increase `WORKER_CONCURRENCY` or run multiple worker processes
- **Redis**: Use Redis cluster for high availability

### Monitoring

Key metrics to monitor:

- Queue depth (waiting jobs)
- Active builds
- Build success rate
- Average build time
- API response times
- Error rates

## License

MIT
