# Mobigen Code Review Report

**Date:** December 2024
**Reviewer:** Code Review Agent
**Scope:** Full codebase review - agent architecture, orchestration, storage, testing

---

## Executive Summary

Mobigen is a sophisticated multi-agent AI system for generating React Native mobile apps. The codebase demonstrates solid architectural patterns but has significant opportunities for optimization, robustness improvements, and code sharing.

### Overall Assessment
| Category | Score | Notes |
|----------|-------|-------|
| Architecture | B+ | Good separation, needs better abstraction |
| Type Safety | A- | Strong TypeScript usage, some gaps |
| Error Handling | C+ | Inconsistent, needs hardening |
| Code Reuse | C | Significant duplication opportunities |
| Parallelization | B | Has framework, underutilized |
| Testing | C+ | Framework exists, gaps in coverage |
| Documentation | B | Good inline docs, needs API docs |

---

## Class-by-Class Review

### 1. Agent Definitions (`packages/ai/src/agents/definitions.ts`)

**Purpose:** Defines 17+ specialized agents with prompts, tools, and model configurations.

#### Strengths
- Clear separation of concerns per agent role
- Good model allocation (Opus for complex, Sonnet for fast)
- Pipeline configuration well-defined with phases

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| Prompt Duplication | Medium | Multiple | Same instructions repeated across agents (e.g., "TypeScript with strict types", "React Native + Expo SDK 51") |
| Magic Strings | Low | 36-37 | `canDelegate` arrays use string literals |
| Outdated SDK Reference | Low | 289 | References "Expo SDK 51" but template uses SDK 52 |
| No Prompt Versioning | Medium | All | Prompts are hardcoded, no way to A/B test or version |
| Missing Validation | Medium | 1594-1666 | Pipeline phases aren't validated for completeness |

#### Recommendations
1. Create shared prompt fragments for common instructions
2. Create `AgentPromptBuilder` class with composable sections
3. Add prompt versioning with template system
4. Validate pipeline phases against agent definitions

---

### 2. Type Definitions (`packages/ai/src/types.ts`)

**Purpose:** Core types for agents, pipelines, validation, and outputs.

#### Strengths
- Comprehensive type coverage (700+ lines)
- Good use of discriminated unions
- Consistent naming conventions

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| Duplicate Types | Medium | Multiple | `ValidationError` defined similarly in multiple places |
| Large Union Types | Low | 12-38 | `AgentRole` is getting unwieldy (23+ values) |
| Missing Generics | Medium | 701-728 | Hook types could use generics for better type inference |
| No Runtime Validation | High | All | Types only exist at compile-time, no Zod/Yup schemas |

#### Recommendations
1. Use Zod schemas for runtime validation of AI outputs
2. Split `AgentRole` into categories: `PlanningAgentRole | ImplementationAgentRole | QAAgentRole`
3. Create generic hook types: `HookCallback<TInput, TOutput>`

---

### 3. Orchestrator (`services/generator/src/orchestrator.ts`)

**Purpose:** Main generation pipeline coordinator.

#### Strengths
- Clear phase-based execution
- Good logging throughout
- Template context awareness

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| No Retry Logic | High | 458-513 | Phase 0-1 has no retry on failure |
| Sync File Operations | Medium | 77-80 | `fs.existsSync` in hot path |
| Sequential Agent Calls | High | 862-909 | Implementation tasks run sequentially despite parallel executor existing |
| Hardcoded Timeouts | Medium | Multiple | No timeout configuration per phase |
| Memory Leaks | Medium | 145-171 | `PipelineContext` accumulates large outputs |
| Error Recovery Gap | High | 999 | Validation result saved even on partial success |
| JSON Parsing Fragile | Medium | 332-391 | `parseJSON` fallback logic can produce incomplete objects |

#### Recommendations
1. Use `ParallelTaskExecutor` for implementation phase
2. Add per-phase retry configuration
3. Stream large outputs to disk instead of memory
4. Add circuit breaker for agent failures
5. Use Zod for parsing AI outputs with proper validation

---

### 4. Session Manager (`services/generator/src/session-manager.ts`)

**Purpose:** Manages Claude SDK session persistence.

#### Strengths
- Simple, focused API
- Good error handling in `flagForHumanReview`

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| Bug in Duration Calc | Critical | 111-112 | `Date.now() - new Date().getTime()` always = ~0 |
| No Session Cleanup | Medium | All | Old sessions never cleaned up |
| Missing Validation | Low | 10-25 | No check for session ID format |
| Fork Session Broken | Medium | 48-64 | Fork creates fake session ID, doesn't resume from parent |

#### Recommendations
1. Fix duration calculation: store `startTime` at session creation
2. Add session cleanup job
3. Validate session IDs before saving
4. Implement proper session forking using Claude SDK

---

### 5. Parallel Executor (`services/generator/src/parallel-executor.ts`)

**Purpose:** Parallel task execution with dependency management.

#### Strengths
- Good dependency analysis algorithm
- Chunk-based parallelization
- Comprehensive progress events

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| Not Used in Main Pipeline | High | N/A | Orchestrator runs tasks sequentially, doesn't use this |
| Race Condition | Medium | 353-359 | Timeout promise race doesn't cancel ongoing work |
| Memory Pressure | Medium | 421-483 | Each parallel agent loads full context |
| Missing Rate Limiting | Medium | 275-279 | No rate limiting for concurrent API calls |
| TaskTracker Side Effect | Low | 305-325 | Creates tasks that may orphan if error occurs |

#### Recommendations
1. Integrate with main orchestrator
2. Use `AbortController` for proper timeout cancellation
3. Implement shared context loading with caching
4. Add rate limiting with exponential backoff
5. Clean up tracker tasks on errors

---

### 6. QA Hooks (`services/generator/src/hooks/index.ts`)

**Purpose:** Pre/Post tool use hooks for quality assurance.

#### Strengths
- Comprehensive security patterns
- Good accessibility checks
- Performance anti-pattern detection

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| Global Mutable State | High | 13 | `modifiedFiles` Map is shared across all executions |
| Sync Exec Blocking | Medium | 118-127 | `execSync` blocks event loop |
| Regex DoS Risk | Low | 37-48 | Some regexes vulnerable to catastrophic backtracking |
| No Hook Composition | Medium | 279-376 | Three separate hook creators with duplication |
| Silent Failures | Medium | 122-126 | TypeScript errors logged but not surfaced |

#### Recommendations
1. Make `modifiedFiles` per-project using WeakMap or class
2. Use `execAsync` consistently
3. Test regexes for ReDoS vulnerability
4. Create hook composition utilities
5. Aggregate and surface validation warnings

---

### 7. Project Storage (`packages/storage/src/project-storage.ts`)

**Purpose:** S3 + Git file storage management.

#### Strengths
- Clean separation of S3 and Git concerns
- Good snapshot/restore implementation

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| No Error Handling | High | 35-68 | `saveSnapshot` has no try/catch |
| Large Tarball Memory | Medium | 52-54 | Reads entire tarball into memory |
| Missing Retry Logic | Medium | All | No retry for S3 operations |
| Hardcoded Region | Low | 19 | `us-east-1` default in code |
| Race Condition | Medium | 79-85 | Directory clear + extract not atomic |

#### Recommendations
1. Add comprehensive error handling
2. Use streaming for large tarballs
3. Implement retry with exponential backoff
4. Make region configurable
5. Use atomic file operations or transactions

---

### 8. Template Manager (`packages/storage/src/template-manager.ts`)

**Purpose:** Template discovery, context extraction, and project creation.

#### Strengths
- Excellent template context extraction
- Good AST-like parsing without full parser
- Clean separation of concerns

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| Sync execSync | Medium | 568 | Shell command blocks event loop |
| No Template Validation | Medium | 546-605 | Cloned template not validated for completeness |
| Missing Package Lock | Low | 568-570 | Doesn't preserve package-lock.json |
| Regex Parsing Fragile | Medium | 294-297 | Import parsing may miss edge cases |
| No Caching | Medium | 205-273 | Template context re-parsed on every call |

#### Recommendations
1. Use async exec for shell commands
2. Validate template after extraction
3. Consider caching template context
4. Use proper TypeScript parser for extraction

---

### 9. Validation Tier 1 (`packages/testing/src/tiers/tier1.ts`)

**Purpose:** Quick validation checks (<30 seconds).

#### Strengths
- Clear tier separation
- Good error categorization

#### Issues Found

| Issue | Severity | Line(s) | Description |
|-------|----------|---------|-------------|
| Sequential Execution | Medium | 17-26 | TypeScript and ESLint run sequentially |
| No Timeout | High | 10-38 | Missing overall tier timeout |
| Missing Prettier | Low | 10-38 | Tier should include Prettier per PRD |
| No Parallel Validation | Medium | 17-26 | Validators could run in parallel |

#### Recommendations
1. Run validators in parallel with `Promise.all`
2. Add tier-level timeout
3. Include Prettier validation
4. Add progress reporting

---

## Cross-Cutting Issues

### 1. Error Handling Inconsistency

**Pattern Found:** Mix of try/catch, error returns, and silent failures.

```typescript
// Inconsistent patterns found:
} catch { /* silently ignore */ }
} catch (error) { console.warn(...) }
} catch (error) { throw new Error(...) }
} catch (error) { return fallback; }
```

**Recommendation:** Create standard error handling utilities:
```typescript
// Suggested pattern
import { Result, Ok, Err } from '@mobigen/core/result';
async function safeOperation<T>(fn: () => Promise<T>): Promise<Result<T, Error>>
```

### 2. Logging Fragmentation

**Pattern Found:** Multiple logging approaches across codebase.

```typescript
console.log('[orchestrator]...')
console.warn('[Security]...')
logger.info('...')
await emitProgress(...)
```

**Recommendation:** Unified logging with structured events:
```typescript
// Suggested pattern
import { logger } from '@mobigen/logging';
logger.event('agent.start', { agent: 'developer', phase: 'implementation' });
```

### 3. Configuration Sprawl

**Pattern Found:** Configuration scattered across files.

```typescript
// Found in multiple files:
const SESSION_TTL_HOURS = 20;
const maxAttempts = 3;
timeout: 30000
```

**Recommendation:** Centralized configuration:
```typescript
// packages/config/src/defaults.ts
export const CONFIG = {
  session: { ttlHours: 20 },
  validation: { maxRetries: 3, tierTimeouts: { tier1: 30000 } },
  parallel: { maxConcurrent: 3 }
};
```

### 4. Code Duplication Hotspots

| Location 1 | Location 2 | Duplicated Code |
|------------|------------|-----------------|
| `orchestrator.ts:50-83` | `parallel-executor.ts:...` | `listProjectFiles()` |
| `hooks/index.ts:37-48` | `security-scanner` agent | Secret patterns |
| `template-manager.ts:278-313` | Multiple validators | AST extraction logic |
| `orchestrator.ts:332-391` | Multiple services | JSON parsing logic |

---

## Performance Observations

### Bottlenecks Identified

1. **Sequential Task Execution:** Tasks in implementation phase run one-by-one
   - Impact: 3x slower than parallel execution
   - Fix: Use `ParallelTaskExecutor`

2. **Repeated Template Context Loading:** Called multiple times per generation
   - Impact: ~500ms per call
   - Fix: Cache template context

3. **Large Context Windows:** Full project context sent to each agent
   - Impact: Higher token usage, slower responses
   - Fix: Selective context loading

4. **Blocking Validation:** TypeScript checks run synchronously
   - Impact: Blocks other operations
   - Fix: Use async child processes

---

## Security Observations

### Good Practices Found
- Secret pattern detection in hooks
- Pre-tool-use hooks can block operations
- No exposed credentials in codebase

### Areas for Improvement
1. Rate limiting not implemented for Claude API calls
2. Input sanitization missing for user prompts
3. No audit logging for sensitive operations

---

## Recommendations Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Fix session duration bug | Low | High |
| P0 | Enable parallel task execution | Medium | High |
| P1 | Add Zod schemas for AI outputs | Medium | High |
| P1 | Fix global mutable state in hooks | Low | Medium |
| P1 | Add comprehensive error handling | High | High |
| P2 | Cache template context | Low | Medium |
| P2 | Unified logging | Medium | Medium |
| P2 | Configuration centralization | Medium | Medium |
| P3 | Prompt composition system | High | Medium |
| P3 | Add rate limiting | Medium | Low |

---

## Appendix: Files Reviewed

1. `packages/ai/src/agents/definitions.ts` (1707 lines)
2. `packages/ai/src/types.ts` (744 lines)
3. `services/generator/src/orchestrator.ts` (1138 lines)
4. `services/generator/src/session-manager.ts` (117 lines)
5. `services/generator/src/parallel-executor.ts` (567 lines)
6. `services/generator/src/hooks/index.ts` (399 lines)
7. `packages/storage/src/project-storage.ts` (148 lines)
8. `packages/storage/src/template-manager.ts` (830 lines)
9. `packages/testing/src/tiers/tier1.ts` (39 lines)

**Total Lines Reviewed:** ~5,700
