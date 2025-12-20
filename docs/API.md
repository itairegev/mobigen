# Mobigen API Documentation

Complete API reference for Mobigen services.

## Authentication

All API requests (except public endpoints) require authentication using NextAuth.js session cookies or JWT tokens.

### Session Authentication

For web clients, authentication is handled via HTTP-only cookies set by NextAuth.js.

### API Authentication

For programmatic access, include the session token in headers:

```
Authorization: Bearer <session-token>
```

## tRPC API (Web Dashboard)

The main dashboard uses tRPC for type-safe API calls.

### Projects

#### `projects.list`

List all projects for the authenticated user.

**Input:** None

**Output:**
```typescript
{
  id: string;
  name: string;
  status: 'draft' | 'generating' | 'ready' | 'building' | 'failed';
  templateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}[]
```

#### `projects.getById`

Get a single project by ID.

**Input:**
```typescript
{ id: string }
```

**Output:**
```typescript
{
  id: string;
  name: string;
  status: string;
  templateId: string | null;
  config: Record<string, any>;
  branding: {
    primaryColor?: string;
    logo?: string;
  };
  builds: Build[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### `projects.create`

Create a new project.

**Input:**
```typescript
{
  name: string;
  templateId: string;
  description?: string;
  config?: Record<string, any>;
}
```

**Output:** Created project object

#### `projects.update`

Update project configuration.

**Input:**
```typescript
{
  id: string;
  name?: string;
  config?: Record<string, any>;
  branding?: Record<string, any>;
}
```

#### `projects.delete`

Delete a project and all associated data.

**Input:**
```typescript
{ id: string }
```

### Builds

#### `builds.list`

List builds for a project.

**Input:**
```typescript
{
  projectId: string;
  limit?: number;
  offset?: number;
}
```

**Output:**
```typescript
{
  id: string;
  platform: 'ios' | 'android';
  status: 'queued' | 'building' | 'completed' | 'failed';
  artifactUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}[]
```

#### `builds.trigger`

Trigger a new build.

**Input:**
```typescript
{
  projectId: string;
  platform: 'ios' | 'android';
  profile?: 'development' | 'preview' | 'production';
}
```

**Output:**
```typescript
{
  id: string;
  status: 'queued';
  message: string;
}
```

#### `builds.getStatus`

Get build status and logs.

**Input:**
```typescript
{ buildId: string }
```

### Users

#### `users.me`

Get current user profile.

**Output:**
```typescript
{
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tier: string;
  projects: { id: string; name: string; status: string }[];
}
```

#### `users.updateProfile`

Update user profile.

**Input:**
```typescript
{
  name?: string;
  image?: string;
}
```

#### `users.updateSettings`

Update user settings.

**Input:**
```typescript
{
  notifications?: {
    email: boolean;
    buildComplete: boolean;
    weeklyReport: boolean;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    defaultTemplate: string;
  };
  apiKeys?: {
    anthropic: string;
    expo: string;
  };
}
```

#### `users.getUsage`

Get usage statistics.

**Input:**
```typescript
{
  startDate?: Date;
  endDate?: Date;
}
```

**Output:**
```typescript
{
  events: UsageEvent[];
  totalCredits: number;
  eventCount: number;
}
```

---

## Generator Service API

REST API for app generation orchestration.

**Base URL:** `http://localhost:4000` (or configured GENERATOR_URL)

### Health Check

```
GET /api/health
```

**Response:**
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

**Request Body:**
```json
{
  "projectId": "uuid",
  "templateId": "ecommerce",
  "config": {
    "name": "My App",
    "description": "An e-commerce app",
    "features": ["auth", "payments", "push"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "message": "Generation started"
}
```

### WebSocket Events

Connect to `/socket.io` for real-time progress updates.

**Events:**

- `generation:started` - Generation has begun
- `generation:phase` - Current phase update
- `generation:progress` - Progress percentage
- `generation:file` - File being generated
- `generation:completed` - Generation finished
- `generation:failed` - Generation failed

**Example:**
```javascript
const socket = io('http://localhost:4000', {
  query: { projectId: 'uuid' }
});

socket.on('generation:progress', (data) => {
  console.log(`Phase: ${data.phase}, Progress: ${data.progress}%`);
});
```

---

## Builder Service API

REST API for EAS build management.

**Base URL:** `http://localhost:5000` (or configured BUILDER_URL)

### Health Check

```
GET /health
```

### Trigger Build

```
POST /builds
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "platform": "ios",
  "profile": "preview"
}
```

**Response:**
```json
{
  "success": true,
  "buildId": "uuid",
  "easBuildId": "eas-build-uuid"
}
```

### Get Build Status

```
GET /builds/:buildId
```

**Response:**
```json
{
  "id": "uuid",
  "status": "building",
  "platform": "ios",
  "progress": 45,
  "logs": ["Installing dependencies...", "Building..."]
}
```

### Get Build Logs

```
GET /builds/:buildId/logs
```

**Response:**
```json
{
  "logs": [
    { "timestamp": "2024-01-15T10:00:00Z", "message": "Build started" },
    { "timestamp": "2024-01-15T10:01:00Z", "message": "Installing dependencies" }
  ]
}
```

### Cancel Build

```
POST /builds/:buildId/cancel
```

### EAS Webhook

```
POST /webhooks/eas
```

Called by Expo EAS to update build status. Requires webhook signature verification.

---

## Tester Service API

REST API for device testing and screenshots.

**Base URL:** `http://localhost:6000`

### Queue Test Run

```
POST /tests
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "buildId": "uuid",
  "platform": "ios",
  "testConfig": {
    "screens": ["home", "profile", "settings"],
    "flows": [
      {
        "name": "Login Flow",
        "steps": [
          { "action": "tap", "selector": "~login-button" },
          { "action": "type", "selector": "~email-input", "value": "test@example.com" }
        ]
      }
    ]
  }
}
```

### Get Test Status

```
GET /tests/:jobId
```

### Get Test Results

```
GET /tests/build/:buildId
```

### Get Screenshots

```
GET /screenshots/:buildId
```

### Compare Screenshots

```
POST /screenshots/compare
```

**Request Body:**
```json
{
  "buildId": "current-build-uuid",
  "baselineId": "baseline-build-uuid",
  "threshold": 0.1
}
```

### Set Baseline

```
POST /screenshots/:buildId/baseline
```

---

## Analytics Service API

REST API for usage tracking and metrics.

**Base URL:** `http://localhost:7000`

### Track Event

```
POST /events
```

**Request Body:**
```json
{
  "event": "project.created",
  "userId": "uuid",
  "projectId": "uuid",
  "metadata": { "template": "ecommerce" }
}
```

### Track API Usage

```
POST /usage/api
```

**Request Body:**
```json
{
  "userId": "uuid",
  "projectId": "uuid",
  "model": "claude-3-sonnet",
  "inputTokens": 1500,
  "outputTokens": 3000,
  "requestId": "req-uuid"
}
```

### Get User Stats

```
GET /usage/user/:userId?period=month
```

**Response:**
```json
{
  "totalRequests": 150,
  "totalInputTokens": 50000,
  "totalOutputTokens": 120000,
  "totalTokens": 170000,
  "uniqueProjects": 5,
  "byModel": {
    "claude-3-sonnet": {
      "requests": 100,
      "inputTokens": 30000,
      "outputTokens": 80000
    }
  },
  "byDay": [
    { "date": "2024-01-15", "requests": 20, "tokens": 15000 }
  ]
}
```

### Get Cost Breakdown

```
GET /costs/user/:userId?period=month
```

**Response:**
```json
{
  "totalCost": 12.50,
  "inputCost": 2.50,
  "outputCost": 10.00,
  "byModel": {
    "claude-3-sonnet": {
      "totalCost": 12.50
    }
  },
  "byDay": [
    { "date": "2024-01-15", "cost": 2.00, "tokens": 15000 }
  ],
  "projectedMonthly": 45.00
}
```

### Dashboard Metrics

```
GET /metrics/dashboard
```

**Response:**
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
    { "id": "uuid", "name": "My App", "generations": 50 }
  ]
}
```

---

## Error Handling

All APIs return consistent error responses:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Tier | Requests/min | Tokens/month |
|------|-------------|--------------|
| Free | 60 | 100,000 |
| Pro | 300 | 1,000,000 |
| Enterprise | Unlimited | Unlimited |

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1705320000
```
