# Sprint 1: Critical Fixes ✅ COMPLETED

**Duration:** 3 days
**Goal:** Fix critical bugs and implement actual validation
**Status:** ✅ COMPLETED - December 31, 2024

---

## Task 1.1: Fix Session Duration Bug

**Priority:** P0 - Critical
**Estimate:** 2 hours
**Assignee:** Developer

### Description
The session duration calculation in `session-manager.ts` always returns ~0 seconds because it treats a Date object as milliseconds.

### Files to Modify
- `services/generator/src/session-manager.ts`

### Current Code (Bug)
```typescript
// Line 111-112
const durationMs = Date.now() - session.startTime;
```

### Fix
```typescript
const durationMs = Date.now() - session.startTime.getTime();
```

### Acceptance Criteria
- [ ] Session duration shows correct elapsed time
- [ ] Unit test verifies duration calculation
- [ ] Existing tests still pass

### Tests Required
```typescript
// tests/unit/session-manager.test.ts
describe('SessionManager', () => {
  describe('endSession', () => {
    it('should calculate correct duration', async () => {
      const manager = new SessionManager();
      const session = await manager.startSession('project-1');

      // Wait 100ms
      await new Promise(r => setTimeout(r, 100));

      const result = await manager.endSession(session.id);

      expect(result.durationMs).toBeGreaterThanOrEqual(100);
      expect(result.durationMs).toBeLessThan(200);
    });
  });
});
```

### Build Verification
```bash
cd services/generator && npm run build && npm test
```

---

## Task 1.2: Implement Tier 3 Validation

**Priority:** P0 - Critical
**Estimate:** 4 hours
**Assignee:** Developer

### Description
The `runTier3Validation()` method in build-service.ts is stubbed and always returns `{ passed: true }`. Implement actual validation.

### Files to Modify
- `services/builder/src/build-service.ts`
- `services/builder/src/validators/` (new directory)

### Current Code (Stub)
```typescript
// Line 248-252
private async runTier3Validation(projectId: string): Promise<ValidationResult> {
  console.log(`Running Tier 3 validation...`);
  return { passed: true }; // ALWAYS PASSES!
}
```

### Implementation
```typescript
private async runTier3Validation(projectId: string): Promise<ValidationResult> {
  const projectPath = await this.getProjectPath(projectId);
  const errors: ValidationError[] = [];

  // 1. TypeScript check
  const tsResult = await this.runTypeScriptCheck(projectPath);
  if (!tsResult.passed) {
    errors.push(...tsResult.errors);
  }

  // 2. ESLint check
  const eslintResult = await this.runESLintCheck(projectPath);
  if (!eslintResult.passed) {
    errors.push(...eslintResult.errors);
  }

  // 3. Expo prebuild check
  const prebuildResult = await this.runExpoPrebuild(projectPath);
  if (!prebuildResult.passed) {
    errors.push(...prebuildResult.errors);
  }

  // 4. Metro bundle check
  const bundleResult = await this.runMetroBundleCheck(projectPath);
  if (!bundleResult.passed) {
    errors.push(...bundleResult.errors);
  }

  return {
    passed: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

private async runTypeScriptCheck(projectPath: string): Promise<ValidationResult> {
  try {
    await execAsync('npx tsc --noEmit', { cwd: projectPath, timeout: 60000 });
    return { passed: true };
  } catch (error: any) {
    return {
      passed: false,
      errors: this.parseTypeScriptErrors(error.stderr || error.stdout),
    };
  }
}

private async runESLintCheck(projectPath: string): Promise<ValidationResult> {
  try {
    await execAsync('npx eslint src/ --ext .ts,.tsx --max-warnings 0', {
      cwd: projectPath,
      timeout: 60000
    });
    return { passed: true };
  } catch (error: any) {
    return {
      passed: false,
      errors: this.parseESLintErrors(error.stdout),
    };
  }
}

private async runExpoPrebuild(projectPath: string): Promise<ValidationResult> {
  try {
    await execAsync('npx expo prebuild --clean --no-install', {
      cwd: projectPath,
      timeout: 120000
    });
    return { passed: true };
  } catch (error: any) {
    return {
      passed: false,
      errors: [{ file: 'expo', message: error.message }],
    };
  }
}

private async runMetroBundleCheck(projectPath: string): Promise<ValidationResult> {
  try {
    await execAsync('npx expo export --platform web --output-dir /tmp/bundle-check', {
      cwd: projectPath,
      timeout: 120000
    });
    return { passed: true };
  } catch (error: any) {
    return {
      passed: false,
      errors: [{ file: 'metro', message: error.message }],
    };
  }
}
```

### Acceptance Criteria
- [ ] Validation runs TypeScript check
- [ ] Validation runs ESLint check
- [ ] Validation runs Expo prebuild
- [ ] Validation runs Metro bundle check
- [ ] Validation returns actual errors when checks fail
- [ ] Validation blocks build when checks fail
- [ ] Tests cover all validation paths

### Tests Required
```typescript
// tests/integration/tier3-validation.test.ts
describe('Tier3Validation', () => {
  it('should pass for valid project', async () => {
    const result = await buildService.runTier3Validation(validProjectId);
    expect(result.passed).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should fail for project with TypeScript errors', async () => {
    const result = await buildService.runTier3Validation(tsErrorProjectId);
    expect(result.passed).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ file: expect.stringContaining('.ts') })
    );
  });

  it('should fail for project with ESLint errors', async () => {
    const result = await buildService.runTier3Validation(eslintErrorProjectId);
    expect(result.passed).toBe(false);
  });

  it('should fail for project with invalid Expo config', async () => {
    const result = await buildService.runTier3Validation(invalidExpoProjectId);
    expect(result.passed).toBe(false);
  });
});
```

### Build Verification
```bash
cd services/builder && npm run build && npm test
```

---

## Task 1.3: Add Generation Verification

**Priority:** P0 - Critical
**Estimate:** 4 hours
**Assignee:** Developer

### Description
Add a verification step after generation completes to ensure the generated app is valid before marking the job as successful.

### Files to Create
- `services/generator/src/verification.ts`

### Files to Modify
- `services/generator/src/pipeline-executor.ts`
- `services/generator/src/api.ts`

### Implementation

#### verification.ts
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { execAsync } from './utils';

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  summary: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message?: string;
  duration: number;
}

export async function verifyGeneratedApp(projectPath: string): Promise<VerificationResult> {
  const checks: VerificationCheck[] = [];

  // Check 1: Required files exist
  checks.push(await checkRequiredFiles(projectPath));

  // Check 2: package.json is valid
  checks.push(await checkPackageJson(projectPath));

  // Check 3: app.json/app.config.js exists and is valid
  checks.push(await checkAppConfig(projectPath));

  // Check 4: TypeScript compiles
  checks.push(await checkTypeScript(projectPath));

  // Check 5: No circular imports
  checks.push(await checkCircularImports(projectPath));

  // Check 6: Navigation is valid
  checks.push(await checkNavigation(projectPath));

  // Check 7: All imports resolve
  checks.push(await checkImports(projectPath));

  const passed = checks.every(c => c.passed);
  const failedChecks = checks.filter(c => !c.passed);

  return {
    passed,
    checks,
    summary: passed
      ? `All ${checks.length} checks passed`
      : `${failedChecks.length}/${checks.length} checks failed: ${failedChecks.map(c => c.name).join(', ')}`,
  };
}

async function checkRequiredFiles(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'app.json',
    'src/app/_layout.tsx',
  ];

  const missing = requiredFiles.filter(f => !fs.existsSync(path.join(projectPath, f)));

  return {
    name: 'required-files',
    passed: missing.length === 0,
    message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
    duration: Date.now() - start,
  };
}

async function checkPackageJson(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    const requiredDeps = ['expo', 'react', 'react-native'];
    const missingDeps = requiredDeps.filter(d => !pkg.dependencies?.[d]);

    return {
      name: 'package-json',
      passed: missingDeps.length === 0,
      message: missingDeps.length > 0 ? `Missing deps: ${missingDeps.join(', ')}` : undefined,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'package-json',
      passed: false,
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function checkAppConfig(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    const appJsonPath = path.join(projectPath, 'app.json');
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));

    const required = ['expo.name', 'expo.slug'];
    const missing = required.filter(key => {
      const parts = key.split('.');
      let obj: any = appConfig;
      for (const part of parts) {
        obj = obj?.[part];
      }
      return !obj;
    });

    return {
      name: 'app-config',
      passed: missing.length === 0,
      message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'app-config',
      passed: false,
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function checkTypeScript(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    await execAsync('npx tsc --noEmit --skipLibCheck', { cwd: projectPath, timeout: 60000 });
    return {
      name: 'typescript',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    const errorCount = (error.stdout?.match(/error TS/g) || []).length;
    return {
      name: 'typescript',
      passed: false,
      message: `${errorCount} TypeScript errors`,
      duration: Date.now() - start,
    };
  }
}

async function checkCircularImports(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    await execAsync('npx madge --circular --extensions ts,tsx src/', {
      cwd: projectPath,
      timeout: 30000
    });
    return {
      name: 'circular-imports',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'circular-imports',
      passed: false,
      message: 'Circular imports detected',
      duration: Date.now() - start,
    };
  }
}

async function checkNavigation(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    // Check that _layout.tsx files exist for each route group
    const appDir = path.join(projectPath, 'src/app');
    if (!fs.existsSync(appDir)) {
      return {
        name: 'navigation',
        passed: false,
        message: 'src/app directory not found',
        duration: Date.now() - start,
      };
    }

    const layoutFile = path.join(appDir, '_layout.tsx');
    if (!fs.existsSync(layoutFile)) {
      return {
        name: 'navigation',
        passed: false,
        message: 'Root _layout.tsx not found',
        duration: Date.now() - start,
      };
    }

    return {
      name: 'navigation',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'navigation',
      passed: false,
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function checkImports(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    // Use TypeScript to check imports resolve
    await execAsync('npx tsc --noEmit --traceResolution 2>&1 | grep -i "not found" | head -5', {
      cwd: projectPath,
      timeout: 60000
    });
    // If grep finds matches, there are unresolved imports
    return {
      name: 'imports',
      passed: false,
      message: 'Unresolved imports found',
      duration: Date.now() - start,
    };
  } catch {
    // grep returns non-zero when no matches (which is good)
    return {
      name: 'imports',
      passed: true,
      duration: Date.now() - start,
    };
  }
}
```

#### Integration in pipeline-executor.ts
```typescript
// After implementation phase, add verification
import { verifyGeneratedApp } from './verification';

// In execute() method, after all phases complete:
const verification = await verifyGeneratedApp(projectPath);
if (!verification.passed) {
  logger.error('Generation verification failed', { checks: verification.checks });
  await emitProgress(projectId, 'verification:failed', verification);

  // Attempt auto-fix
  if (this.config.enableFeedbackLoop) {
    await this.attemptVerificationFix(verification);
  }
}
```

### Acceptance Criteria
- [ ] Verification runs after generation completes
- [ ] Verification checks all required aspects
- [ ] Failed verification triggers error-fixer
- [ ] Verification results are logged and emitted
- [ ] Tests cover all verification checks

### Tests Required
```typescript
// tests/unit/verification.test.ts
describe('verifyGeneratedApp', () => {
  it('should pass for valid app', async () => {
    const result = await verifyGeneratedApp(validProjectPath);
    expect(result.passed).toBe(true);
    expect(result.checks.every(c => c.passed)).toBe(true);
  });

  it('should fail when required files missing', async () => {
    const result = await verifyGeneratedApp(missingFilesPath);
    expect(result.passed).toBe(false);
    expect(result.checks.find(c => c.name === 'required-files')?.passed).toBe(false);
  });

  it('should fail when TypeScript has errors', async () => {
    const result = await verifyGeneratedApp(tsErrorPath);
    expect(result.passed).toBe(false);
    expect(result.checks.find(c => c.name === 'typescript')?.passed).toBe(false);
  });

  it('should fail when navigation is invalid', async () => {
    const result = await verifyGeneratedApp(invalidNavPath);
    expect(result.passed).toBe(false);
    expect(result.checks.find(c => c.name === 'navigation')?.passed).toBe(false);
  });
});
```

### Build Verification
```bash
cd services/generator && npm run build && npm test
```

---

## Task 1.4: Fix All TypeScript Errors

**Priority:** P1 - High
**Estimate:** 2 hours
**Assignee:** Developer

### Description
Run TypeScript check across all packages and fix any errors.

### Commands
```bash
# Check all packages
npx tsc --noEmit --project apps/web/tsconfig.json
npx tsc --noEmit --project services/generator/tsconfig.json
npx tsc --noEmit --project services/builder/tsconfig.json
npx tsc --noEmit --project packages/ai/tsconfig.json
npx tsc --noEmit --project packages/db/tsconfig.json
```

### Acceptance Criteria
- [ ] All packages compile without errors
- [ ] No `@ts-ignore` or `@ts-expect-error` added
- [ ] CI pipeline passes

### Build Verification
```bash
# Run from root
npm run typecheck
```

---

## Task 1.5: Add Sprint 1 Integration Tests

**Priority:** P1 - High
**Estimate:** 3 hours
**Assignee:** QA

### Description
Create integration tests that verify all Sprint 1 fixes work together.

### Files to Create
- `tests/integration/sprint1/session-tracking.test.ts`
- `tests/integration/sprint1/validation-pipeline.test.ts`
- `tests/integration/sprint1/generation-verification.test.ts`

### Tests Required
```typescript
// tests/integration/sprint1/validation-pipeline.test.ts
describe('Sprint 1: Validation Pipeline', () => {
  it('should block build when TypeScript fails', async () => {
    // Create project with TS errors
    const project = await createProjectWithErrors('typescript');

    // Trigger build
    const buildResult = await triggerBuild(project.id);

    // Should be rejected
    expect(buildResult.status).toBe('validation_failed');
    expect(buildResult.errors).toContainEqual(
      expect.objectContaining({ type: 'typescript' })
    );
  });

  it('should allow build when all checks pass', async () => {
    // Create valid project
    const project = await createValidProject();

    // Trigger build
    const buildResult = await triggerBuild(project.id);

    // Should proceed
    expect(buildResult.status).toBe('queued');
  });
});
```

### Acceptance Criteria
- [ ] Tests cover session duration fix
- [ ] Tests cover Tier 3 validation
- [ ] Tests cover generation verification
- [ ] All tests pass
- [ ] Tests run in CI

### Build Verification
```bash
npm run test:integration -- --grep "Sprint 1"
```

---

## Sprint 1 Completion Checklist

- [ ] Task 1.1: Session duration bug fixed
- [ ] Task 1.2: Tier 3 validation implemented
- [ ] Task 1.3: Generation verification added
- [ ] Task 1.4: All TypeScript errors fixed
- [ ] Task 1.5: Integration tests passing
- [ ] All builds succeed
- [ ] All tests pass
- [ ] Code reviewed and merged

---

## Build Commands Summary

```bash
# After each task, run:
npm run build
npm run typecheck
npm run test

# Before sprint completion:
npm run test:integration
npm run test:e2e
```
