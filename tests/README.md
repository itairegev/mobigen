# Mobigen Test Suite

Comprehensive tests for the Mobigen mobile app generator platform.

## Test Structure

```
tests/
├── api/                    # API router tests
│   ├── projects.test.ts    # Projects CRUD operations
│   ├── builds.test.ts      # Build management
│   └── users.test.ts       # User management
├── services/               # Service tests
│   └── generator.test.ts   # AI generation pipeline
├── e2e/                    # End-to-end tests
│   └── generate-news-app.test.ts  # Full generation test
├── ui/                     # UI/API contract tests
│   └── api-usage.test.ts   # Dashboard API usage
├── utils/                  # Test utilities
│   ├── mock-prisma.ts      # Mock Prisma client
│   └── test-context.ts     # Test context helpers
├── setup.ts                # Global test setup
├── vitest.config.ts        # Vitest configuration
└── run-tests.sh            # Test runner script
```

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   cd tests
   pnpm install
   ```

2. **For E2E tests:** Start the generator service:
   ```bash
   cd ../services/generator
   pnpm dev
   ```

### Quick Start

```bash
# Make the script executable
chmod +x run-tests.sh

# Run all tests
./run-tests.sh

# Run specific test suites
./run-tests.sh api       # API tests only
./run-tests.sh services  # Service tests only
./run-tests.sh e2e       # E2E tests (requires running services)
./run-tests.sh ui        # UI/API contract tests
./run-tests.sh coverage  # Run with coverage report
./run-tests.sh watch     # Watch mode for development
```

### Using npm/pnpm directly

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific suite
pnpm test:api
pnpm test:services
pnpm test:e2e
pnpm test:ui
```

## Test Suites

### API Tests (`tests/api/`)

Tests for tRPC routers:

- **projects.test.ts**: Project CRUD operations
  - Create, read, update, delete projects
  - Authorization checks (user can only access own projects)
  - Input validation

- **builds.test.ts**: Build management
  - Trigger iOS/Android builds
  - Cancel pending builds
  - Build status tracking

- **users.test.ts**: User management
  - Profile updates
  - Settings management
  - Usage tracking
  - Account deletion

### Service Tests (`tests/services/`)

Tests for backend services:

- **generator.test.ts**: AI generation pipeline
  - Agent definitions and model selection
  - Template selection logic
  - Validation pipeline (Tier 1/2/3)
  - Error recovery with retries
  - Session management
  - File tracking

### E2E Tests (`tests/e2e/`)

Full integration tests:

- **generate-news-app.test.ts**: Complete news app generation
  - Connects to live generator service
  - Triggers full generation pipeline
  - Validates generated output
  - Tests news app features

**Prerequisites for E2E tests:**
1. Generator service running at `http://localhost:4000`
2. Database accessible
3. Templates in `templates/` directory

### UI Tests (`tests/ui/`)

Frontend/API contract tests:

- **api-usage.test.ts**: Dashboard API usage
  - Verifies correct API calls from UI components
  - Tests loading and error states
  - Validates data processing for display

## Mock Utilities

### mock-prisma.ts

Provides a mock Prisma client with:
- In-memory data stores
- Factory functions for test data
- Common CRUD operations

```typescript
import { createMockPrisma, createMockUser, createMockProject } from './utils/mock-prisma';

const prisma = createMockPrisma();
const user = createMockUser({ name: 'Test User' });
prisma._store.users.push(user);
```

### test-context.ts

Creates test contexts for API testing:

```typescript
import { createAuthenticatedContext, createPopulatedContext } from './utils/test-context';

// Empty authenticated context
const ctx = createAuthenticatedContext();

// Pre-populated with sample data
const { prisma, users, projects, builds } = createPopulatedContext();
```

## Writing New Tests

### API Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { createAuthenticatedContext } from '../utils/test-context';

describe('MyRouter API', () => {
  describe('myRouter.myProcedure', () => {
    it('should do something', async () => {
      const ctx = createAuthenticatedContext();

      // Call the mock procedure
      const result = await ctx.prisma.something.findMany({
        where: { userId: ctx.userId },
      });

      expect(result).toEqual([]);
    });
  });
});
```

### E2E Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';

describe('E2E: Feature Test', () => {
  let socket: Socket;

  beforeAll(async () => {
    socket = io('http://localhost:4000');
    await new Promise<void>((resolve) => socket.on('connect', resolve));
  });

  afterAll(() => {
    socket.disconnect();
  });

  it('should complete workflow', async () => {
    // Test implementation
  });
});
```

## Coverage

Run tests with coverage:

```bash
./run-tests.sh coverage
```

Coverage reports are generated in `../coverage/`:
- `coverage/index.html` - HTML report
- `coverage/coverage-summary.json` - JSON summary

## Troubleshooting

### Tests timing out

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 60000,  // 60 seconds
}
```

### E2E tests failing to connect

1. Ensure generator service is running
2. Check `GENERATOR_URL` environment variable
3. Verify WebSocket connection is allowed

### Mock data not resetting

Each test should create its own context:

```typescript
// Good: Each test gets fresh data
it('test 1', () => {
  const ctx = createAuthenticatedContext();
});

it('test 2', () => {
  const ctx = createAuthenticatedContext();
});
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run tests
  run: |
    cd mobigen/tests
    pnpm install
    pnpm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```
