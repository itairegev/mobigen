# @mobigen/generator

AI generation orchestrator service for Mobigen.

## Overview

The Generator service is the core of Mobigen's AI-powered app generation. It orchestrates a multi-agent pipeline that transforms natural language descriptions into complete React Native applications.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **AI**: Anthropic Claude SDK
- **Queue**: BullMQ (optional)
- **Language**: TypeScript

## Features

- 9-phase AI agent pipeline
- Real-time progress via WebSocket
- Template context extraction
- Session management and resumption
- Pre/post validation hooks
- Token usage tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Generator Service                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────────────────────────────────┐  │
│  │   Express    │────▶│            Orchestrator                   │  │
│  │   Server     │     │                                          │  │
│  └──────────────┘     │  ┌────────┐  ┌────────┐  ┌────────┐     │  │
│         │             │  │ Intent │──▶│  PRD   │──▶│  Arch  │     │  │
│         │             │  └────────┘  └────────┘  └────────┘     │  │
│  ┌──────────────┐     │       │                        │         │  │
│  │  Socket.IO   │◀────│       ▼                        ▼         │  │
│  │   Server     │     │  ┌────────┐  ┌────────┐  ┌────────┐     │  │
│  └──────────────┘     │  │  Task  │◀─│  Code  │──▶│   QA   │     │  │
│         │             │  └────────┘  └────────┘  └────────┘     │  │
│         │             │                                          │  │
│         ▼             └──────────────────────────────────────────┘  │
│  ┌──────────────┐                                                   │
│  │   Clients    │     ┌──────────────────────────────────────────┐  │
│  │  (Web/API)   │     │              Storage                      │  │
│  └──────────────┘     │  Templates │ Projects │ Git Repos        │  │
│                       └──────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── index.ts              # Entry point, Express + Socket.IO setup
├── api.ts                # Express routes
├── orchestrator.ts       # Pipeline orchestrator
├── session.ts            # Session management
├── agents/               # AI agent implementations
│   ├── index.ts
│   ├── intent.ts         # Intent analysis
│   ├── prd.ts            # PRD generation
│   ├── architect.ts      # Architecture design
│   ├── ui.ts             # UI/UX planning
│   ├── task.ts           # Task breakdown
│   ├── implementation.ts # Code generation
│   └── qa.ts             # Quality assurance
├── hooks/                # Validation hooks
│   ├── pre-write.ts      # Before file write
│   └── post-write.ts     # After file write
├── templates/            # Template handling
│   └── context.ts        # Context extraction
└── types/                # TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (via Docker or local)
- Redis (via Docker or local)
- Anthropic API key

### Development

```bash
# From monorepo root
pnpm install

# Start infrastructure
docker compose up -d postgres redis minio

# Set environment variables
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Start development server
pnpm --filter @mobigen/generator dev
```

### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://mobigen:mobigen_dev_password@localhost:5432/mobigen

# Redis
REDIS_URL=redis://localhost:6379

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio_admin
S3_SECRET_KEY=minio_password
S3_BUCKET=mobigen-projects

# Paths
MOBIGEN_ROOT=/app
TEMPLATES_DIR=/app/templates
TEMPLATES_BARE_DIR=/app/templates-bare
PROJECTS_DIR=/app/projects

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "generator",
  "version": "1.0.0"
}
```

### Start Generation

```
POST /api/generate
```

Request:
```json
{
  "projectId": "uuid",
  "templateId": "ecommerce",
  "config": {
    "name": "My App",
    "description": "An e-commerce app with product listings",
    "features": ["auth", "payments", "push"]
  }
}
```

Response:
```json
{
  "success": true,
  "sessionId": "uuid",
  "message": "Generation started"
}
```

### Get Session Status

```
GET /api/sessions/:sessionId
```

### Resume Session

```
POST /api/sessions/:sessionId/resume
```

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ projectId }` | Join project room |
| `leave` | `{ projectId }` | Leave project room |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `generation:started` | `{ sessionId }` | Generation began |
| `generation:phase` | `{ phase, name }` | Phase changed |
| `generation:progress` | `{ progress, message }` | Progress update |
| `generation:file` | `{ path, action }` | File operation |
| `generation:completed` | `{ projectId }` | Generation done |
| `generation:failed` | `{ error }` | Generation failed |

### Example Client

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  query: { projectId: 'uuid' },
});

socket.on('generation:progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
  console.log(`Message: ${data.message}`);
});

socket.on('generation:phase', (data) => {
  console.log(`Phase ${data.phase}: ${data.name}`);
});

socket.on('generation:completed', () => {
  console.log('Generation complete!');
});
```

## AI Pipeline

### Phase 1: Intent Analysis

Analyzes user input to understand:
- App purpose and goals
- Required features
- Target audience
- Technical requirements

### Phase 2: PRD Generation

Creates Product Requirements Document:
- Feature specifications
- User stories
- Acceptance criteria

### Phase 3: Architecture Design

Plans technical structure:
- Component architecture
- Data models
- API design

### Phase 4: UI/UX Planning

Designs user interface:
- Screen layouts
- Navigation flow
- Component hierarchy

### Phase 5: Task Breakdown

Creates implementation tasks:
- File-level tasks
- Dependencies
- Priority order

### Phase 6: Code Generation

Generates actual code:
- React Native components
- TypeScript types
- API integrations

### Phase 7: QA Validation

Validates generated code:
- TypeScript checking
- ESLint validation
- Build verification

### Phase 8: Git Commit

Version control:
- Stage changes
- Create commit
- Update history

### Phase 9: Completion

Finalizes generation:
- Update project status
- Notify user
- Record analytics

## Hooks

### Pre-Write Hook

Validates files before writing:

```typescript
// hooks/pre-write.ts
export async function preWriteHook(
  file: FileToWrite
): Promise<ValidationResult> {
  // Check for security issues
  // Validate TypeScript
  // Check imports
}
```

### Post-Write Hook

Runs after file write:

```typescript
// hooks/post-write.ts
export async function postWriteHook(
  file: WrittenFile
): Promise<void> {
  // Run ESLint
  // Update indexes
  // Track changes
}
```

## Session Management

Sessions allow resuming interrupted generations:

```typescript
// Resume a session
const session = await getSession(sessionId);
if (session.status === 'paused') {
  await resumeSession(sessionId);
}

// Flag for review
await flagSession(sessionId, 'Manual review needed');
```

## Building

```bash
# Build for production
pnpm --filter @mobigen/generator build

# Start production server
pnpm --filter @mobigen/generator start
```

## Docker

```bash
# Build image
docker build -t mobigen-generator -f services/generator/Dockerfile .

# Run container
docker run -p 4000:4000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e DATABASE_URL=postgresql://... \
  mobigen-generator
```

## Testing

```bash
# Run tests
pnpm --filter @mobigen/generator test

# Run with coverage
pnpm --filter @mobigen/generator test:coverage
```

## Related Documentation

- [Main README](../../README.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [API Documentation](../../docs/API.md)
- [@mobigen/ai](../../packages/ai/README.md)
