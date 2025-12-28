# Mobigen Optimization Task List

**Generated:** December 2024
**Priority:** P0 = Critical, P1 = High, P2 = Medium, P3 = Low

---

## Task Execution Strategy

### Agentic Parallel Execution

These tasks are designed for execution by Claude agents. Tasks within the same wave can run in parallel.

```
Wave 1: Critical Fixes (P0) - 3 parallel agents
    ├── Agent 1: Fix session duration bug
    ├── Agent 2: Enable parallel task execution
    └── Agent 3: Add Zod schemas foundation

Wave 2: Error Handling & State (P1) - 3 parallel agents
    ├── Agent 1: Fix global mutable state
    ├── Agent 2: Unified error handling utilities
    └── Agent 3: Add circuit breakers

Wave 3: Performance Optimization (P2) - 3 parallel agents
    ├── Agent 1: Template context caching
    ├── Agent 2: Async validation pipeline
    └── Agent 3: Selective context loading

Wave 4: Code Quality (P2-P3) - 3 parallel agents
    ├── Agent 1: Unified logging
    ├── Agent 2: Configuration centralization
    └── Agent 3: Prompt composition system
```

---

## Wave 1: Critical Fixes (P0)

### Task 1.1: Fix Session Duration Bug
**Priority:** P0 | **Effort:** Low | **Impact:** High

**Location:** `services/generator/src/session-manager.ts:111-112`

**Problem:**
```typescript
durationSeconds: Math.floor(
  (Date.now() - new Date().getTime()) / 1000
), // Always ~0!
```

**Fix:**
```typescript
// Add startTime to project session tracking
// Update endSession to use actual start time
```

**Acceptance Criteria:**
- [ ] Session duration accurately reflects elapsed time
- [ ] Start time stored when session begins
- [ ] Tests verify duration calculation

**Files to Modify:**
- `services/generator/src/session-manager.ts`
- `packages/db/prisma/schema.prisma` (if needed)

---

### Task 1.2: Enable Parallel Task Execution
**Priority:** P0 | **Effort:** Medium | **Impact:** High

**Location:** `services/generator/src/orchestrator.ts:862-909`

**Problem:**
Tasks run sequentially despite `ParallelTaskExecutor` existing.

**Fix:**
Replace sequential task loop with parallel executor:
```typescript
// Before (current)
for (let i = 0; i < sortedTasks.length; i++) {
  await runAgent('developer', ...);
}

// After (optimized)
const result = await runParallelImplementation(
  projectId, projectPath, MOBIGEN_ROOT, jobId,
  context.taskBreakdown, context, { maxConcurrentAgents: 3 }
);
```

**Acceptance Criteria:**
- [ ] Implementation phase uses `ParallelTaskExecutor`
- [ ] Independent tasks run in parallel (up to 3)
- [ ] Dependencies respected
- [ ] Progress events still emitted

**Files to Modify:**
- `services/generator/src/orchestrator.ts`

---

### Task 1.3: Add Zod Schemas for AI Outputs
**Priority:** P0 | **Effort:** Medium | **Impact:** High

**Problem:**
AI outputs are parsed with fragile JSON extraction, no validation.

**Fix:**
Create Zod schemas for all agent outputs:
```typescript
// packages/ai/src/schemas/index.ts
import { z } from 'zod';

export const PRDOutputSchema = z.object({
  appName: z.string(),
  description: z.string(),
  targetUsers: z.array(z.string()),
  coreFeatures: z.array(FeatureSchema),
  // ...
});

// Helper for safe parsing
export function parseAgentOutput<T>(
  schema: z.Schema<T>,
  output: string,
  fallback: T
): T {
  const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/);
  const json = jsonMatch ? jsonMatch[1] : output;
  try {
    return schema.parse(JSON.parse(json));
  } catch {
    return fallback;
  }
}
```

**Acceptance Criteria:**
- [ ] Zod schemas for all output types (PRD, Architecture, UI, Tasks, Validation, QA)
- [ ] `parseAgentOutput` utility with type safety
- [ ] Fallback values for partial parses
- [ ] Validation errors logged for debugging

**Files to Create:**
- `packages/ai/src/schemas/prd.schema.ts`
- `packages/ai/src/schemas/architecture.schema.ts`
- `packages/ai/src/schemas/ui-design.schema.ts`
- `packages/ai/src/schemas/task-breakdown.schema.ts`
- `packages/ai/src/schemas/validation.schema.ts`
- `packages/ai/src/schemas/index.ts`

**Files to Modify:**
- `packages/ai/package.json` (add zod)
- `services/generator/src/orchestrator.ts` (use new parser)

---

## Wave 2: Error Handling & State (P1)

### Task 2.1: Fix Global Mutable State in Hooks
**Priority:** P1 | **Effort:** Low | **Impact:** Medium

**Location:** `services/generator/src/hooks/index.ts:13`

**Problem:**
```typescript
// Shared across all executions!
const modifiedFiles: Map<string, { count: number; lastModified: Date }> = new Map();
```

**Fix:**
Create per-project tracking using WeakMap or class:
```typescript
// Option 1: Class-based
export class ProjectHookContext {
  private modifiedFiles = new Map<string, ModifiedFileInfo>();

  constructor(readonly projectId: string) {}

  trackModification(filePath: string): void { ... }
  getModifiedFiles(): Map<string, ModifiedFileInfo> { ... }
}

// Option 2: Factory function
export function createQAHooks(projectId: string): HookConfig & { context: ProjectHookContext } {
  const context = new ProjectHookContext(projectId);
  return {
    context,
    PreToolUse: [...],
    PostToolUse: [...],
  };
}
```

**Acceptance Criteria:**
- [ ] Each generation has isolated file tracking
- [ ] No state leaks between projects
- [ ] Tests verify isolation

**Files to Modify:**
- `services/generator/src/hooks/index.ts`

---

### Task 2.2: Unified Error Handling Utilities
**Priority:** P1 | **Effort:** Medium | **Impact:** High

**Problem:**
Inconsistent error handling patterns across codebase.

**Fix:**
Create `@mobigen/core` package with Result type:
```typescript
// packages/core/src/result.ts
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// packages/core/src/utils/safe.ts
export async function trySafe<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<Result<T>> {
  try {
    return Ok(await fn());
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    if (context) error.message = `${context}: ${error.message}`;
    return Err(error);
  }
}
```

**Acceptance Criteria:**
- [ ] Result type implemented
- [ ] `trySafe` utility for async operations
- [ ] Orchestrator uses Result pattern for agent calls
- [ ] Errors properly propagated and logged

**Files to Create:**
- `packages/core/src/result.ts`
- `packages/core/src/utils/safe.ts`
- `packages/core/src/index.ts`
- `packages/core/package.json`

---

### Task 2.3: Add Circuit Breakers for Agent Failures
**Priority:** P1 | **Effort:** Medium | **Impact:** Medium

**Problem:**
If Claude API is down or rate limited, entire pipeline fails immediately.

**Fix:**
Implement circuit breaker pattern:
```typescript
// packages/core/src/circuit-breaker.ts
export class CircuitBreaker<T> {
  private failures = 0;
  private lastFailure?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 3,
    private resetTimeMs: number = 60000
  ) {}

  async execute(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure!.getTime() > this.resetTimeMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void { ... }
  private reset(): void { ... }
}
```

**Acceptance Criteria:**
- [ ] Circuit breaker implemented
- [ ] Applied to Claude API calls
- [ ] Configurable threshold and reset time
- [ ] Half-open state allows recovery testing

**Files to Create:**
- `packages/core/src/circuit-breaker.ts`

**Files to Modify:**
- `services/generator/src/orchestrator.ts`

---

## Wave 3: Performance Optimization (P2)

### Task 3.1: Template Context Caching
**Priority:** P2 | **Effort:** Low | **Impact:** Medium

**Location:** `packages/storage/src/template-manager.ts:205-273`

**Problem:**
Template context re-parsed on every call (~500ms each).

**Fix:**
Add in-memory cache with TTL:
```typescript
// packages/storage/src/template-manager.ts
class TemplateManager {
  private contextCache = new Map<string, { context: TemplateContext; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getTemplateContext(templateName: string): Promise<TemplateContext | null> {
    const cached = this.contextCache.get(templateName);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.context;
    }

    const context = await this.parseTemplateContext(templateName);
    if (context) {
      this.contextCache.set(templateName, { context, timestamp: Date.now() });
    }
    return context;
  }

  invalidateCache(templateName?: string): void {
    if (templateName) {
      this.contextCache.delete(templateName);
    } else {
      this.contextCache.clear();
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Template context cached with TTL
- [ ] Cache invalidation on template changes
- [ ] Cache hit rate logged

**Files to Modify:**
- `packages/storage/src/template-manager.ts`

---

### Task 3.2: Async Validation Pipeline
**Priority:** P2 | **Effort:** Medium | **Impact:** Medium

**Location:** `packages/testing/src/tiers/tier1.ts`

**Problem:**
Validators run sequentially; blocking exec.

**Fix:**
Run validators in parallel:
```typescript
export async function runTier1(config: ValidatorConfig): Promise<ValidationResult> {
  const start = Date.now();

  // Run validators in parallel
  const [tsResult, eslintResult, prettierResult] = await Promise.all([
    typescriptValidator.run(config),
    eslintValidator.run(config),
    prettierValidator.run(config),
  ]);

  const stages = { typescript: tsResult, eslint: eslintResult, prettier: prettierResult };
  // ... aggregate results
}
```

**Acceptance Criteria:**
- [ ] Tier 1 validators run in parallel
- [ ] Add overall tier timeout (30s)
- [ ] Add Prettier validator (missing per PRD)
- [ ] Progress events for each validator

**Files to Modify:**
- `packages/testing/src/tiers/tier1.ts`
- `packages/testing/src/tiers/tier2.ts`

**Files to Create:**
- `packages/testing/src/validators/prettier.ts`

---

### Task 3.3: Selective Context Loading
**Priority:** P2 | **Effort:** High | **Impact:** High

**Problem:**
Full project context sent to each agent, high token usage.

**Fix:**
Create context-aware agent prompts:
```typescript
// packages/ai/src/context/selective-loader.ts
export interface ContextSelector {
  includeScreens?: string[];  // Only specific screens
  includeComponents?: string[];
  includeHooks?: string[];
  includeServices?: string[];
  maxFilePreview?: number;  // Max lines per file
}

export async function loadSelectiveContext(
  projectPath: string,
  selector: ContextSelector
): Promise<string> {
  const parts: string[] = [];

  if (selector.includeScreens?.length) {
    for (const screen of selector.includeScreens) {
      const content = await loadFilePreview(
        `${projectPath}/src/screens/${screen}.tsx`,
        selector.maxFilePreview || 50
      );
      parts.push(`## Screen: ${screen}\n${content}`);
    }
  }
  // ... similar for other types

  return parts.join('\n\n');
}
```

**Acceptance Criteria:**
- [ ] `loadSelectiveContext` implemented
- [ ] Agents receive only relevant context
- [ ] Token usage reduced by 50%+
- [ ] Context selection based on task type

**Files to Create:**
- `packages/ai/src/context/selective-loader.ts`
- `packages/ai/src/context/task-context-map.ts`

---

## Wave 4: Code Quality (P2-P3)

### Task 4.1: Unified Logging
**Priority:** P2 | **Effort:** Medium | **Impact:** Medium

**Problem:**
Multiple logging patterns: console.log, console.warn, logger.info, emitProgress.

**Fix:**
Create unified logging package:
```typescript
// packages/logging/src/index.ts
import pino from 'pino';

export interface LogContext {
  projectId?: string;
  agent?: string;
  phase?: string;
  [key: string]: unknown;
}

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

export function createProjectLogger(projectId: string) {
  return logger.child({ projectId });
}

// Structured events
export function logAgentStart(ctx: LogContext) {
  logger.info({ event: 'agent.start', ...ctx });
}

export function logAgentEnd(ctx: LogContext & { success: boolean; duration: number }) {
  logger.info({ event: 'agent.end', ...ctx });
}
```

**Acceptance Criteria:**
- [ ] `@mobigen/logging` package created
- [ ] Structured logging with pino
- [ ] Project-scoped loggers
- [ ] Replace console.log/warn across codebase
- [ ] Log levels configurable

**Files to Create:**
- `packages/logging/src/index.ts`
- `packages/logging/src/events.ts`
- `packages/logging/package.json`

---

### Task 4.2: Configuration Centralization
**Priority:** P2 | **Effort:** Medium | **Impact:** Medium

**Problem:**
Configuration scattered across files with magic numbers.

**Fix:**
Create centralized config with env overrides:
```typescript
// packages/config/src/index.ts
import { z } from 'zod';

const ConfigSchema = z.object({
  session: z.object({
    ttlHours: z.number().default(20),
    cleanupIntervalHours: z.number().default(24),
  }),
  validation: z.object({
    maxRetries: z.number().default(3),
    tier1Timeout: z.number().default(30000),
    tier2Timeout: z.number().default(120000),
    tier3Timeout: z.number().default(600000),
  }),
  parallel: z.object({
    maxConcurrentAgents: z.number().default(3),
    taskTimeout: z.number().default(300000),
  }),
  agents: z.object({
    defaultModel: z.enum(['opus', 'sonnet', 'haiku']).default('sonnet'),
    maxTurns: z.number().default(100),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    session: {
      ttlHours: parseInt(process.env.SESSION_TTL_HOURS || '20'),
      // ...
    },
    // ...
  });
}

export const config = loadConfig();
```

**Acceptance Criteria:**
- [ ] `@mobigen/config` package created
- [ ] All magic numbers moved to config
- [ ] Environment variable overrides
- [ ] Zod validation for config

**Files to Create:**
- `packages/config/src/index.ts`
- `packages/config/src/schema.ts`
- `packages/config/package.json`

---

### Task 4.3: Prompt Composition System
**Priority:** P3 | **Effort:** High | **Impact:** Medium

**Problem:**
Prompts have duplicated instructions and can't be versioned/A-B tested.

**Fix:**
Create composable prompt builder:
```typescript
// packages/ai/src/prompts/builder.ts
export class PromptBuilder {
  private sections: PromptSection[] = [];

  addRole(role: string, description: string): this {
    this.sections.push({ type: 'role', content: `You are ${role}. ${description}` });
    return this;
  }

  addStandards(): this {
    this.sections.push({
      type: 'standards',
      content: SHARED_STANDARDS, // TypeScript, React Native patterns, etc.
    });
    return this;
  }

  addContext(context: string): this {
    this.sections.push({ type: 'context', content: context });
    return this;
  }

  addOutputFormat(format: string): this {
    this.sections.push({ type: 'output', content: `OUTPUT FORMAT:\n${format}` });
    return this;
  }

  build(): string {
    return this.sections.map(s => s.content).join('\n\n');
  }
}

// Usage in agent definitions
const developerPrompt = new PromptBuilder()
  .addRole('Developer', 'implementing specific tasks')
  .addStandards()
  .addContext('{{TASK_CONTEXT}}')
  .addOutputFormat('Create/modify files as specified')
  .build();
```

**Acceptance Criteria:**
- [ ] PromptBuilder class implemented
- [ ] Shared standards extracted
- [ ] All agent prompts use builder
- [ ] Version tracking for prompts
- [ ] A/B testing support (future)

**Files to Create:**
- `packages/ai/src/prompts/builder.ts`
- `packages/ai/src/prompts/shared-standards.ts`
- `packages/ai/src/prompts/index.ts`

---

## Shared Code Extraction Tasks

### Task S.1: Extract Common Utilities
**Priority:** P2 | **Effort:** Medium | **Impact:** Medium

**Duplications Found:**
1. `listProjectFiles` in orchestrator.ts and parallel-executor.ts
2. Secret patterns in hooks and security-scanner agent
3. JSON parsing logic in orchestrator.ts and multiple services
4. File walk utilities in multiple locations

**Fix:**
```typescript
// packages/core/src/fs/walk.ts
export async function walkDirectory(
  dir: string,
  options: WalkOptions
): Promise<string[]>

// packages/core/src/parsing/json.ts
export function safeJsonParse<T>(input: string, fallback: T): T

// packages/core/src/security/patterns.ts
export const SECRET_PATTERNS: RegExp[]
export function detectSecrets(content: string): SecretMatch[]
```

**Files to Create:**
- `packages/core/src/fs/walk.ts`
- `packages/core/src/parsing/json.ts`
- `packages/core/src/security/patterns.ts`

---

## Testing Tasks

### Task T.1: Add Unit Tests for Critical Paths
**Priority:** P1 | **Effort:** High | **Impact:** High

**Missing Tests:**
1. Session manager - duration calculation
2. Parallel executor - dependency analysis
3. Template manager - context extraction
4. Zod schemas - validation

**Files to Create:**
- `services/generator/src/__tests__/session-manager.test.ts`
- `services/generator/src/__tests__/parallel-executor.test.ts`
- `packages/storage/src/__tests__/template-manager.test.ts`
- `packages/ai/src/schemas/__tests__/*.test.ts`

---

## Implementation Order Summary

```
Phase 1 (Week 1): Critical Fixes
├── 1.1 Fix session duration bug [1 day]
├── 1.2 Enable parallel execution [2 days]
└── 1.3 Add Zod schemas [3 days]

Phase 2 (Week 2): Error Handling
├── 2.1 Fix global state [1 day]
├── 2.2 Error utilities [2 days]
└── 2.3 Circuit breakers [2 days]

Phase 3 (Week 3): Performance
├── 3.1 Template caching [1 day]
├── 3.2 Async validation [2 days]
└── 3.3 Selective context [3 days]

Phase 4 (Week 4): Code Quality
├── 4.1 Unified logging [2 days]
├── 4.2 Config centralization [2 days]
└── 4.3 Prompt composition [3 days]
```

---

## Agentic Execution Commands

To run these tasks using Claude agents:

```bash
# Wave 1: Critical Fixes (parallel)
claude "Fix session duration bug in session-manager.ts per OPTIMIZATION_TASKS.md Task 1.1"
claude "Enable parallel task execution in orchestrator.ts per OPTIMIZATION_TASKS.md Task 1.2"
claude "Create Zod schemas for all AI outputs per OPTIMIZATION_TASKS.md Task 1.3"

# Wave 2: After Wave 1 completes
claude "Fix global mutable state in hooks per OPTIMIZATION_TASKS.md Task 2.1"
# ...
```

Or using `/build` command:
```
/build "Implement Wave 1 critical fixes from OPTIMIZATION_TASKS.md"
```
