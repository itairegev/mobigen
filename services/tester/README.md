# @mobigen/tester

Device testing and visual regression service for Mobigen.

## Overview

The Tester service provides automated UI testing and visual regression capabilities for generated mobile apps. It uses WebdriverIO with Appium for device automation and Pixelmatch for screenshot comparison.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Testing**: WebdriverIO + Appium
- **Image Processing**: Sharp + Pixelmatch
- **Queue**: BullMQ
- **Storage**: S3/MinIO
- **Language**: TypeScript

## Features

- Automated UI testing
- Screenshot capture
- Visual regression testing
- Baseline management
- Test result storage
- Real-time progress via WebSocket

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Tester Service                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────────────────────────────────┐  │
│  │   Express    │────▶│           Test Service                    │  │
│  │   Server     │     │                                          │  │
│  └──────────────┘     │  ┌────────────────────────────────────┐  │  │
│         │             │  │         WebdriverIO                 │  │  │
│  ┌──────────────┐     │  │  • UI automation                   │  │  │
│  │  WebSocket   │────▶│  │  • Element interaction             │  │  │
│  │   Server     │     │  │  • Screenshot capture              │  │  │
│  └──────────────┘     │  └────────────────────────────────────┘  │  │
│                       │                   │                      │  │
│  ┌──────────────┐     │  ┌────────────────▼───────────────────┐  │  │
│  │   BullMQ     │────▶│  │      Screenshot Service            │  │  │
│  │   Worker     │     │  │  • Image processing (Sharp)        │  │  │
│  └──────────────┘     │  │  • Visual diff (Pixelmatch)        │  │  │
│         │             │  │  • Baseline comparison             │  │  │
│         ▼             │  └────────────────────────────────────┘  │  │
│  ┌──────────────┐     └──────────────────────────────────────────┘  │
│  │    Redis     │                        │                          │
│  │    Queue     │                        ▼                          │
│  └──────────────┘     ┌──────────────────────────────────────────┐  │
│                       │              S3 Storage                   │  │
│                       │  Screenshots │ Baselines │ Diffs         │  │
│                       └──────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── index.ts              # Entry point
├── api.ts                # Express routes
├── test-service.ts       # WebdriverIO test execution
├── screenshot-service.ts # Visual testing
├── queue.ts              # BullMQ job processor
├── appium-config.ts      # Appium configuration
├── types.ts              # TypeScript types
└── utils/
    ├── image.ts          # Image processing
    └── diff.ts           # Visual diff utilities
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Appium 2.x
- Android SDK and/or Xcode
- Device or emulator/simulator

### Development

```bash
# From monorepo root
pnpm install

# Start infrastructure
docker compose up -d postgres redis minio

# Install Appium drivers
appium driver install uiautomator2  # Android
appium driver install xcuitest      # iOS

# Start Appium server
appium server

# Start development server
pnpm --filter @mobigen/tester dev
```

### Environment Variables

```env
# Server
PORT=6000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://mobigen:mobigen_dev_password@localhost:5432/mobigen

# Redis
REDIS_URL=redis://localhost:6379

# S3 Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio_admin
S3_SECRET_KEY=minio_password
SCREENSHOTS_BUCKET=mobigen-screenshots

# Appium
APPIUM_HOST=localhost
APPIUM_PORT=4723

# Visual Testing
DIFF_THRESHOLD=0.1
SCREENSHOT_TIMEOUT=5000
```

## API Endpoints

### Health Check

```
GET /health
```

### Queue Test Run

```
POST /tests
```

Request:
```json
{
  "projectId": "uuid",
  "buildId": "build-uuid",
  "platform": "ios",
  "testConfig": {
    "screens": ["home", "profile", "settings"],
    "flows": [
      {
        "name": "Login Flow",
        "steps": [
          { "action": "tap", "selector": "~login-button" },
          { "action": "type", "selector": "~email-input", "value": "test@example.com" },
          { "action": "type", "selector": "~password-input", "value": "password123" },
          { "action": "tap", "selector": "~submit-button" },
          { "action": "waitFor", "selector": "~dashboard-screen" }
        ]
      }
    ]
  }
}
```

Response:
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "queued"
}
```

### Get Test Status

```
GET /tests/:jobId
```

Response:
```json
{
  "jobId": "uuid",
  "status": "running",
  "progress": 45,
  "currentScreen": "profile",
  "completedScreens": ["home"],
  "errors": []
}
```

### Get Test Results

```
GET /tests/build/:buildId
```

Response:
```json
{
  "buildId": "uuid",
  "results": [
    {
      "screen": "home",
      "passed": true,
      "screenshotUrl": "https://..."
    },
    {
      "screen": "profile",
      "passed": false,
      "screenshotUrl": "https://...",
      "diffUrl": "https://...",
      "diffPercentage": 0.15
    }
  ]
}
```

### Get Screenshots

```
GET /screenshots/:buildId
```

Response:
```json
{
  "screenshots": [
    {
      "screen": "home",
      "url": "https://...",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Compare Screenshots

```
POST /screenshots/compare
```

Request:
```json
{
  "buildId": "current-build-uuid",
  "baselineId": "baseline-build-uuid",
  "threshold": 0.1
}
```

Response:
```json
{
  "results": [
    {
      "screen": "home",
      "passed": true,
      "diffPercentage": 0.02
    },
    {
      "screen": "profile",
      "passed": false,
      "diffPercentage": 0.15,
      "diffUrl": "https://..."
    }
  ]
}
```

### Set Baseline

```
POST /screenshots/:buildId/baseline
```

Sets the screenshots from the specified build as the new baseline.

## Test Configuration

### Screen Testing

```json
{
  "screens": ["home", "profile", "settings"],
  "captureOptions": {
    "fullPage": true,
    "hideScrollbars": true
  }
}
```

### Flow Testing

```json
{
  "flows": [
    {
      "name": "Login Flow",
      "steps": [
        { "action": "tap", "selector": "~login-button" },
        { "action": "type", "selector": "~email-input", "value": "test@example.com" },
        { "action": "tap", "selector": "~submit-button" },
        { "action": "waitFor", "selector": "~dashboard-screen", "timeout": 5000 },
        { "action": "screenshot", "name": "after-login" }
      ]
    }
  ]
}
```

### Available Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `tap` | `selector` | Tap an element |
| `type` | `selector`, `value` | Type text into element |
| `swipe` | `direction`, `distance` | Swipe gesture |
| `waitFor` | `selector`, `timeout` | Wait for element |
| `screenshot` | `name` | Capture screenshot |
| `assert` | `selector`, `exists` | Assert element state |

## Visual Regression

### How It Works

1. **Capture**: Screenshots are captured during test runs
2. **Compare**: New screenshots are compared against baselines
3. **Diff**: Differences are highlighted using Pixelmatch
4. **Report**: Results include diff images and percentages

### Threshold Configuration

```typescript
const comparisonResult = await compareScreenshots({
  current: currentBuffer,
  baseline: baselineBuffer,
  threshold: 0.1,  // 10% difference allowed
});
```

### Baseline Management

```bash
# Set new baseline
POST /screenshots/build-123/baseline

# Compare against baseline
POST /screenshots/compare
{
  "buildId": "build-456",
  "baselineId": "build-123"
}
```

## Building

```bash
# Build for production
pnpm --filter @mobigen/tester build

# Start production server
pnpm --filter @mobigen/tester start
```

## Docker

```bash
# Build image
docker build -t mobigen-tester -f services/tester/Dockerfile .

# Run container (requires Appium connection)
docker run -p 6000:6000 \
  -e APPIUM_HOST=host.docker.internal \
  -e DATABASE_URL=postgresql://... \
  mobigen-tester
```

## Testing

```bash
# Run tests
pnpm --filter @mobigen/tester test

# Run with coverage
pnpm --filter @mobigen/tester test:coverage
```

## Related Documentation

- [WebdriverIO Documentation](https://webdriver.io/docs/gettingstarted)
- [Appium Documentation](https://appium.io/docs/en/latest/)
- [Main README](../../README.md)
- [API Documentation](../../docs/API.md)
