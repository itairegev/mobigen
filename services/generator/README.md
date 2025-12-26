# @mobigen/generator

AI generation orchestrator service for Mobigen - transforms natural language descriptions into production-ready React Native applications.

## Overview

The Generator service is the core of Mobigen's AI-powered app generation. It orchestrates a multi-agent pipeline with multiple orchestration modes, task tracking, automatic error fixing, and resume capabilities.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **AI**: Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- **Database**: PostgreSQL via Prisma
- **Language**: TypeScript

## Features

- **5 Orchestration Modes** - From simple to sophisticated workflows
- **Multi-Agent Pipeline** - Specialized AI agents for each phase
- **Task Tracking** - Database-persisted job and task state
- **Automatic Feedback Loop** - Detects and auto-fixes errors
- **Resume Capabilities** - Pick up where you left off after failures
- **Real-time Progress** - WebSocket updates for every phase/agent
- **Build Validation** - Ensures generated apps compile successfully

---

## Orchestration Modes

The generator supports 5 different orchestration modes, selectable via environment variable or per-request:

| Mode | Description | Task Tracking | Feedback Loop | Resume |
|------|-------------|---------------|---------------|--------|
| **`pipeline`** | Explicit phases with feedback loop | Yes | Yes | No |
| `ai` | Original AI-driven workflow | No | No | No |
| `ai-enhanced` | AI-driven + full tracking + feedback | Yes | Yes | Yes |
| `hybrid` | AI flexibility + pipeline reliability | Yes | Yes | Yes |
| `legacy` | Old hardcoded sequential pipeline | No | No | No |

### Default Mode: `pipeline`

Set via environment variable:
```bash
ORCHESTRATOR_MODE=pipeline  # default
ORCHESTRATOR_MODE=hybrid    # recommended for production
ORCHESTRATOR_MODE=ai-enhanced
```

Or per-request in API call:
```json
{
  "projectId": "...",
  "prompt": "...",
  "config": {...},
  "mode": "hybrid"
}
```

### Mode Comparison

#### Pipeline Mode (Default)
- Explicit phase ordering ensures every step runs
- Built-in feedback loop for automatic error fixing
- Best for reliability

#### Hybrid Mode (Recommended for Production)
- AI decides within guardrails (can parallelize, skip optional steps)
- Full task tracking with database persistence
- Resume from any failed/paused state
- Best balance of flexibility and reliability

#### AI-Enhanced Mode
- AI-driven decisions with full observability
- Task tracking and feedback loop
- Good for experimentation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Generator Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌────────────────────────────────────────────────┐   │
│  │   Express    │────▶│              Orchestrator                       │   │
│  │   Server     │     │   (pipeline | ai-enhanced | hybrid | legacy)   │   │
│  └──────────────┘     └────────────────────────────────────────────────┘   │
│         │                              │                                    │
│         │                              ▼                                    │
│  ┌──────────────┐     ┌────────────────────────────────────────────────┐   │
│  │  Socket.IO   │◀────│              Multi-Agent Pipeline               │   │
│  │   Server     │     │                                                 │   │
│  └──────────────┘     │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │
│         │             │  │ Intent  │─▶│   PM    │─▶│  Arch   │          │   │
│         │             │  │Analyzer │ │ (PRD)   │ │(Design) │          │   │
│         │             │  └─────────┘ └─────────┘ └─────────┘          │   │
│         │             │       │                        │               │   │
│         │             │       ▼                        ▼               │   │
│         │             │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │
│         │             │  │  Lead   │─▶│  Dev    │─▶│Validator│          │   │
│         │             │  │   Dev   │ │(Code)   │ │(Check)  │          │   │
│         │             │  └─────────┘ └─────────┘ └─────────┘          │   │
│         │             │                              │                 │   │
│         │             │                    ┌─────────┴─────────┐      │   │
│         │             │                    ▼                   ▼      │   │
│         │             │              ┌─────────┐         ┌─────────┐  │   │
│         │             │              │  Fixer  │◀────────│  Build  │  │   │
│         │             │              │(Auto-fix)│         │Validator│  │   │
│         │             │              └─────────┘         └─────────┘  │   │
│         │             │                                                │   │
│         ▼             └────────────────────────────────────────────────┘   │
│  ┌──────────────┐                                                          │
│  │   Clients    │     ┌────────────────────────────────────────────────┐   │
│  │  (Web/API)   │     │              Task Tracker                       │   │
│  └──────────────┘     │   Jobs │ Tasks │ Errors │ Progress │ Resume   │   │
│                       └────────────────────────────────────────────────┘   │
│                                          │                                  │
│                                          ▼                                  │
│                       ┌────────────────────────────────────────────────┐   │
│                       │              PostgreSQL                         │   │
│                       │   generation_jobs │ generation_tasks           │   │
│                       └────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Phases

Each generation runs through these phases:

| Phase | Agent | Model | Timeout | Description |
|-------|-------|-------|---------|-------------|
| 1. Analysis | `intent-analyzer` | Sonnet | 1 min | Parse request, select template |
| 2. Planning | `product-manager` | Sonnet | 5 min | Create PRD with features/stories |
| 3. Architecture | `technical-architect` | Sonnet | 5 min | Design data models, APIs, structure |
| 4. Design | `ui-ux-expert` | Sonnet | 3 min | Theme, colors, component styling |
| 5. Task Breakdown | `lead-developer` | Sonnet | 3 min | Break work into implementable tasks |
| 6. Implementation | `developer` | Opus | 5 min | Generate React Native code |
| 7. Validation | `validator` | Sonnet | 3 min | TypeScript, ESLint, import checks |
| 8. Build Validation | `build-validator` | Sonnet | 5 min | Expo prebuild, Metro bundle |
| 9. QA | `qa` | Sonnet | 3 min | Code quality, accessibility, security |

### Feedback Loop

When validation fails:
1. Errors are analyzed and categorized
2. Auto-fixable errors trigger the `error-fixer` agent
3. Validation re-runs after fixes
4. Loop continues up to 3 times
5. If still failing, job is flagged for human review

---

## Task Tracking

All jobs and tasks are persisted to the database for monitoring and resume.

### Database Tables

```sql
-- Jobs track overall generation status
generation_jobs (
  id, project_id, status, current_phase, current_agent,
  total_tasks, completed_tasks, failed_tasks, progress,
  error_message, retry_count, max_retries, metadata,
  started_at, completed_at, created_at, updated_at
)

-- Tasks track individual agent executions
generation_tasks (
  id, job_id, project_id, phase, agent_id, task_type,
  status, priority, depends_on, input, output,
  error_message, error_details, retry_count,
  files_modified, duration_ms,
  started_at, completed_at, created_at, updated_at
)
```

### Task States

| Job Status | Description |
|------------|-------------|
| `pending` | Job created, not started |
| `running` | Job in progress |
| `completed` | Job finished successfully |
| `failed` | Job failed (can be resumed) |
| `paused` | Job manually paused |

| Task Status | Description |
|-------------|-------------|
| `pending` | Task waiting to run |
| `running` | Task in progress |
| `completed` | Task finished successfully |
| `failed` | Task failed |
| `skipped` | Task skipped (optional phase) |

---

## API Endpoints

### Generate App

```http
POST /api/generate
Content-Type: application/json

{
  "projectId": "uuid",
  "prompt": "Create a coffee shop loyalty app with rewards and QR scanning",
  "config": {
    "appName": "My Coffee App",
    "bundleId": {
      "ios": "com.example.mycoffee",
      "android": "com.example.mycoffee"
    },
    "branding": {
      "displayName": "My Coffee",
      "primaryColor": "#8B4513",
      "secondaryColor": "#D2691E"
    },
    "identifiers": {
      "projectId": "uuid",
      "easProjectId": "eas-uuid",
      "awsResourcePrefix": "mycoffee",
      "analyticsKey": "analytics-key"
    }
  },
  "mode": "hybrid"  // optional, defaults to "pipeline"
}
```

Response:
```json
{
  "success": true,
  "jobId": "uuid",
  "message": "Generation started. Subscribe to WebSocket for progress updates."
}
```

### Task Status

```http
GET /api/projects/:projectId/tasks
```

Response:
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "running",
  "progress": 45,
  "currentPhase": "implementation",
  "currentAgent": "developer",
  "phases": [
    { "name": "analysis", "status": "completed", "tasks": 1, "completed": 1, "failed": 0 },
    { "name": "planning", "status": "completed", "tasks": 2, "completed": 2, "failed": 0 },
    { "name": "implementation", "status": "running", "tasks": 1, "completed": 0, "failed": 0 }
  ]
}
```

### Resume Generation

```http
POST /api/projects/:projectId/resume
```

Response:
```json
{
  "success": true,
  "message": "Generation resumed",
  "projectId": "uuid"
}
```

### Pause Generation

```http
POST /api/projects/:projectId/pause
```

### Get Errors

```http
GET /api/projects/:projectId/errors
```

Response:
```json
{
  "success": true,
  "hasErrors": true,
  "canAutoFix": true,
  "errors": [
    {
      "code": "TS2307",
      "message": "Cannot find module './components/Button'",
      "file": "src/screens/Home.tsx",
      "line": 5,
      "autoFixable": true
    }
  ]
}
```

### Health Check

```http
GET /api/health
```

### Configuration Check

```http
GET /api/config
```

Returns current orchestrator mode, AI provider, template paths, etc.

### Test AI Connection

```http
GET /api/test-ai
```

---

## WebSocket Events

### Subscribe to Project

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

socket.emit('subscribe', projectId);

socket.on('generation:progress', (data) => {
  console.log(`[${data.stage}] ${JSON.stringify(data.data)}`);
});

socket.on('generation:complete', (result) => {
  console.log('Complete!', result);
});

socket.on('generation:error', (error) => {
  console.error('Error:', error);
});
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `generation:progress` | `{ projectId, stage, data }` | Progress update |
| `generation:complete` | `GenerationResult` | Generation finished |
| `generation:error` | `{ error }` | Generation failed |
| `generation:paused` | `{ projectId, jobId }` | Generation paused |
| `generation:resumed` | `{ projectId }` | Generation resumed |

### Progress Stages

| Stage | Description |
|-------|-------------|
| `starting` | Generation beginning |
| `cloning` | Cloning template |
| `phase:start` | Phase starting |
| `phase:complete` | Phase completed |
| `agent:start` | Agent starting |
| `agent:message` | Agent output |
| `agent:complete` | Agent finished |
| `checkpoint` | Checkpoint saved |
| `feedback:attempt` | Fix attempt starting |
| `feedback:success` | Fix succeeded |
| `feedback:exhausted` | Max retries reached |
| `complete` | Generation done |
| `error` | Error occurred |

---

## Directory Structure

```
src/
├── index.ts                # Entry point
├── api.ts                  # Express routes + WebSocket
├── orchestrator.ts         # Legacy orchestrator
├── ai-orchestrator.ts      # AI-driven orchestrator
├── pipeline-executor.ts    # Pipeline mode executor
├── enhanced-orchestrator.ts # AI-enhanced & Hybrid modes
├── task-tracker.ts         # Task tracking service (Prisma)
├── session-manager.ts      # Session management
├── logger.ts               # Logging utilities
└── hooks/
    └── index.ts            # Validation hooks
```

---

## Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Orchestrator Mode
ORCHESTRATOR_MODE=pipeline  # pipeline | ai | ai-enhanced | hybrid | legacy

# Database
DATABASE_URL=postgresql://mobigen:password@localhost:5432/mobigen

# AI Provider
AI_PROVIDER=bedrock              # bedrock | anthropic
ANTHROPIC_API_KEY=sk-ant-...     # Required if AI_PROVIDER=anthropic
AWS_REGION=us-east-1             # Required if AI_PROVIDER=bedrock
CLAUDE_SDK_VERBOSE=true          # Enable verbose logging
CLAUDE_API_TIMEOUT_MS=300000     # API timeout (5 min default)

# Paths
MOBIGEN_ROOT=/app
TEMPLATES_DIR=/app/templates
TEMPLATES_BARE_DIR=/app/templates-bare
PROJECTS_DIR=/app/projects

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

## Agent Timeouts

Each agent has a configured timeout (in milliseconds):

| Agent | Timeout | Rationale |
|-------|---------|-----------|
| `orchestrator` | 15 min | Coordinates entire workflow |
| `product-manager` | 5 min | Detailed PRD generation |
| `technical-architect` | 5 min | Complex architecture design |
| `ui-ux-expert` | 3 min | Theme and styling |
| `lead-developer` | 3 min | Task breakdown |
| `developer` | 5 min | Code generation |
| `validator` | 3 min | Validation checks |
| `error-fixer` | 3 min | Error fixes |
| `build-validator` | 5 min | Build verification |
| `qa` | 3 min | Quality assessment |
| `intent-analyzer` | 1 min | Quick intent parsing |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- Anthropic API key or AWS credentials (for Bedrock)

### Development

```bash
# From monorepo root
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
pnpm --filter @mobigen/db db:push

# Start development server
pnpm --filter @mobigen/generator dev
```

### Production

```bash
# Build
pnpm --filter @mobigen/generator build

# Start
pnpm --filter @mobigen/generator start
```

### Docker

```bash
docker build -t mobigen-generator -f services/generator/Dockerfile .

docker run -p 4000:4000 \
  -e ORCHESTRATOR_MODE=hybrid \
  -e AI_PROVIDER=bedrock \
  -e AWS_REGION=us-east-1 \
  -e DATABASE_URL=postgresql://... \
  mobigen-generator
```

---

## Testing

```bash
# Run tests
pnpm --filter @mobigen/generator test

# Run with coverage
pnpm --filter @mobigen/generator test:coverage
```

---

## Monitoring

### Logs

The generator outputs structured logs:

```
[task-tracker] Created job abc-123 for project xyz-456
[task-tracker] Created task def-789: developer (implementation)
[task-tracker] Task def-789 completed (45230ms)
[api] Using hybrid orchestrator

════════════════════════════════════════════════════════
✓ HYBRID COMPLETE: xyz-456
  Files: 47
  Phases: analysis → planning → design → implementation → validation
  Can Resume: false
════════════════════════════════════════════════════════
```

### Database Queries

```sql
-- Active jobs
SELECT * FROM generation_jobs WHERE status = 'running';

-- Failed tasks for a project
SELECT * FROM generation_tasks
WHERE project_id = 'xyz' AND status = 'failed';

-- Job progress summary
SELECT
  j.id,
  j.status,
  j.progress,
  j.current_phase,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed
FROM generation_jobs j
LEFT JOIN generation_tasks t ON t.job_id = j.id
GROUP BY j.id;
```

---

## Related Documentation

- [Main README](../../README.md)
- [PRD](../../docs/PRD-mobigen.md)
- [Technical Design](../../docs/TECHNICAL-DESIGN-mobigen.md)
- [@mobigen/ai](../../packages/ai/README.md)
- [@mobigen/db](../../packages/db/README.md)
