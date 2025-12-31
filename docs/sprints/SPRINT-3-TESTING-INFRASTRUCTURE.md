# Sprint 3: Testing Infrastructure

**Duration:** 5 days
**Goal:** Complete testing package and integrate automated testing
**Depends on:** Sprint 1 & 2 completion

---

## Task 3.1: Implement Testing Package - Validators

**Priority:** P0 - Critical
**Estimate:** 4 hours
**Assignee:** Developer

### Description
Create the @mobigen/testing package with validation modules.

### Files to Create
- `packages/testing/src/index.ts`
- `packages/testing/src/validators/typescript.ts`
- `packages/testing/src/validators/eslint.ts`
- `packages/testing/src/validators/navigation.ts`
- `packages/testing/src/validators/imports.ts`
- `packages/testing/src/validators/types.ts`
- `packages/testing/package.json`
- `packages/testing/tsconfig.json`

### Implementation

#### packages/testing/package.json
```json
{
  "name": "@mobigen/testing",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "glob": "^10.0.0",
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "@types/glob": "^8.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

#### packages/testing/src/validators/types.ts
```typescript
export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duration: number;
}

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
  fixable: boolean;
}

export interface ValidationWarning {
  file: string;
  line?: number;
  message: string;
}

export interface ValidatorOptions {
  projectPath: string;
  timeout?: number;
  skipFiles?: string[];
}
```

#### packages/testing/src/validators/typescript.ts
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { ValidationResult, ValidationError, ValidatorOptions } from './types';

const execAsync = promisify(exec);

export async function validateTypeScript(options: ValidatorOptions): Promise<ValidationResult> {
  const { projectPath, timeout = 60000 } = options;
  const startTime = Date.now();
  const errors: ValidationError[] = [];

  try {
    await execAsync('npx tsc --noEmit --skipLibCheck', {
      cwd: projectPath,
      timeout,
    });

    return {
      passed: true,
      errors: [],
      warnings: [],
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    const output = error.stdout || error.stderr || '';

    // Parse TypeScript errors
    const errorRegex = /(.+?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/g;
    let match;

    while ((match = errorRegex.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
        fixable: isFixableError(match[4]),
      });
    }

    return {
      passed: false,
      errors,
      warnings: [],
      duration: Date.now() - startTime,
    };
  }
}

function isFixableError(code: string): boolean {
  const fixableCodes = [
    'TS2304', // Cannot find name
    'TS2307', // Cannot find module
    'TS2339', // Property does not exist
    'TS2345', // Argument type not assignable
    'TS7006', // Parameter implicitly has 'any' type
  ];
  return fixableCodes.includes(code);
}
```

#### packages/testing/src/validators/eslint.ts
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { ValidationResult, ValidationError, ValidatorOptions } from './types';

const execAsync = promisify(exec);

export async function validateESLint(options: ValidatorOptions): Promise<ValidationResult> {
  const { projectPath, timeout = 60000 } = options;
  const startTime = Date.now();
  const errors: ValidationError[] = [];

  try {
    await execAsync('npx eslint src/ --ext .ts,.tsx --format json', {
      cwd: projectPath,
      timeout,
    });

    return {
      passed: true,
      errors: [],
      warnings: [],
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    try {
      const output = error.stdout || '[]';
      const results = JSON.parse(output);

      for (const file of results) {
        for (const message of file.messages) {
          if (message.severity === 2) { // Error
            errors.push({
              file: file.filePath,
              line: message.line,
              column: message.column,
              message: message.message,
              code: message.ruleId,
              fixable: message.fix !== undefined,
            });
          }
        }
      }
    } catch {
      // Parse non-JSON output
      const output = error.stdout || error.stderr || '';
      const lines = output.split('\n');

      for (const line of lines) {
        const match = line.match(/(.+):(\d+):(\d+):\s*(error)\s*(.+)/);
        if (match) {
          errors.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[5],
            fixable: false,
          });
        }
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      duration: Date.now() - startTime,
    };
  }
}
```

#### packages/testing/src/validators/navigation.ts
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ValidationResult, ValidationError, ValidatorOptions } from './types';

export async function validateNavigation(options: ValidatorOptions): Promise<ValidationResult> {
  const { projectPath } = options;
  const startTime = Date.now();
  const errors: ValidationError[] = [];

  const appDir = path.join(projectPath, 'src/app');

  // Check app directory exists
  if (!fs.existsSync(appDir)) {
    errors.push({
      file: 'src/app',
      message: 'App directory not found (src/app)',
      fixable: false,
    });
    return { passed: false, errors, warnings: [], duration: Date.now() - startTime };
  }

  // Check root _layout.tsx exists
  const rootLayout = path.join(appDir, '_layout.tsx');
  if (!fs.existsSync(rootLayout)) {
    errors.push({
      file: rootLayout,
      message: 'Root layout file not found (_layout.tsx)',
      fixable: true,
    });
  }

  // Find all route files
  const routeFiles = await glob('**/*.tsx', { cwd: appDir, ignore: ['_*.tsx', '*.test.tsx'] });
  const layoutFiles = await glob('**/_layout.tsx', { cwd: appDir });

  // Check each directory with routes has a layout
  const routeDirs = new Set(routeFiles.map(f => path.dirname(f)));
  for (const dir of routeDirs) {
    if (dir === '.') continue;

    const hasLayout = layoutFiles.some(l => path.dirname(l) === dir);
    if (!hasLayout) {
      errors.push({
        file: path.join(appDir, dir),
        message: `Route group "${dir}" is missing _layout.tsx`,
        fixable: true,
      });
    }
  }

  // Check for common navigation issues
  for (const routeFile of routeFiles) {
    const fullPath = path.join(appDir, routeFile);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Check for default export
    if (!content.includes('export default')) {
      errors.push({
        file: fullPath,
        message: 'Route file must have default export',
        fixable: true,
      });
    }

    // Check for proper React component
    if (!content.match(/function\s+\w+|const\s+\w+\s*[:=]\s*\(?\s*\)?\s*=>/)) {
      errors.push({
        file: fullPath,
        message: 'Route file does not appear to export a React component',
        fixable: false,
      });
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings: [],
    duration: Date.now() - startTime,
  };
}
```

#### packages/testing/src/validators/imports.ts
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ValidationResult, ValidationError, ValidatorOptions } from './types';

export async function validateImports(options: ValidatorOptions): Promise<ValidationResult> {
  const { projectPath } = options;
  const startTime = Date.now();
  const errors: ValidationError[] = [];

  // Get all TypeScript files
  const files = await glob('src/**/*.{ts,tsx}', { cwd: projectPath });

  for (const file of files) {
    const fullPath = path.join(projectPath, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Find all imports
    const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      // Skip node_modules imports
      if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
        continue;
      }

      // Resolve import path
      const resolvedPath = resolveImport(fullPath, importPath, projectPath);

      if (!resolvedPath) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        errors.push({
          file: fullPath,
          line: lineNumber,
          message: `Cannot resolve import: ${importPath}`,
          fixable: true,
        });
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings: [],
    duration: Date.now() - startTime,
  };
}

function resolveImport(fromFile: string, importPath: string, projectRoot: string): string | null {
  const fromDir = path.dirname(fromFile);

  // Handle alias imports (@/)
  let resolvedPath: string;
  if (importPath.startsWith('@/')) {
    resolvedPath = path.join(projectRoot, 'src', importPath.substring(2));
  } else {
    resolvedPath = path.join(fromDir, importPath);
  }

  // Try different extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}
```

#### packages/testing/src/index.ts
```typescript
// Validators
export * from './validators/types';
export { validateTypeScript } from './validators/typescript';
export { validateESLint } from './validators/eslint';
export { validateNavigation } from './validators/navigation';
export { validateImports } from './validators/imports';

// Tier runners
export { runTier1 } from './runners/tier1';
export { runTier2 } from './runners/tier2';
export { runTier3 } from './runners/tier3';

// Utilities
export { generateTestReport } from './utils/report';
```

### Acceptance Criteria
- [ ] TypeScript validator works
- [ ] ESLint validator works
- [ ] Navigation validator works
- [ ] Import validator works
- [ ] Package builds successfully
- [ ] Unit tests for each validator

### Tests Required
```typescript
// packages/testing/tests/validators/typescript.test.ts
describe('TypeScript Validator', () => {
  it('should pass for valid project', async () => {
    const result = await validateTypeScript({ projectPath: validProjectPath });
    expect(result.passed).toBe(true);
  });

  it('should detect TypeScript errors', async () => {
    const result = await validateTypeScript({ projectPath: tsErrorPath });
    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should include file and line info', async () => {
    const result = await validateTypeScript({ projectPath: tsErrorPath });
    expect(result.errors[0].file).toBeDefined();
    expect(result.errors[0].line).toBeDefined();
  });
});
```

### Build Verification
```bash
cd packages/testing && npm run build && npm test
```

---

## Task 3.2: Implement Tier Runners

**Priority:** P0 - Critical
**Estimate:** 3 hours
**Assignee:** Developer

### Description
Create tier runners that orchestrate validators.

### Files to Create
- `packages/testing/src/runners/tier1.ts`
- `packages/testing/src/runners/tier2.ts`
- `packages/testing/src/runners/tier3.ts`

### Implementation

#### packages/testing/src/runners/tier1.ts
```typescript
import { validateTypeScript } from '../validators/typescript';
import { validateImports } from '../validators/imports';
import { validateNavigation } from '../validators/navigation';
import { ValidationResult, ValidationError } from '../validators/types';

export interface TierResult {
  tier: string;
  passed: boolean;
  duration: number;
  results: {
    name: string;
    result: ValidationResult;
  }[];
  summary: {
    totalErrors: number;
    fixableErrors: number;
    checks: number;
    passedChecks: number;
  };
}

export async function runTier1(projectPath: string): Promise<TierResult> {
  const startTime = Date.now();
  const results: { name: string; result: ValidationResult }[] = [];

  // Run checks in parallel
  const [tsResult, importResult, navResult] = await Promise.all([
    validateTypeScript({ projectPath, timeout: 30000 }),
    validateImports({ projectPath }),
    validateNavigation({ projectPath }),
  ]);

  results.push(
    { name: 'typescript', result: tsResult },
    { name: 'imports', result: importResult },
    { name: 'navigation', result: navResult },
  );

  const allErrors = results.flatMap(r => r.result.errors);
  const passed = allErrors.length === 0;

  return {
    tier: 'tier1',
    passed,
    duration: Date.now() - startTime,
    results,
    summary: {
      totalErrors: allErrors.length,
      fixableErrors: allErrors.filter(e => e.fixable).length,
      checks: results.length,
      passedChecks: results.filter(r => r.result.passed).length,
    },
  };
}
```

#### packages/testing/src/runners/tier2.ts
```typescript
import { runTier1 } from './tier1';
import { validateESLint } from '../validators/eslint';
import { TierResult } from './tier1';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runTier2(projectPath: string): Promise<TierResult> {
  const startTime = Date.now();
  const results: { name: string; result: any }[] = [];

  // First run Tier 1
  const tier1 = await runTier1(projectPath);
  if (!tier1.passed) {
    return {
      tier: 'tier2',
      passed: false,
      duration: Date.now() - startTime,
      results: tier1.results,
      summary: tier1.summary,
    };
  }

  // ESLint (full)
  const eslintResult = await validateESLint({ projectPath, timeout: 60000 });
  results.push({ name: 'eslint', result: eslintResult });

  // Prettier check
  const prettierResult = await runPrettierCheck(projectPath);
  results.push({ name: 'prettier', result: prettierResult });

  // Metro bundle check
  const metroResult = await runMetroCheck(projectPath);
  results.push({ name: 'metro', result: metroResult });

  // Expo Doctor
  const expoResult = await runExpoDoctor(projectPath);
  results.push({ name: 'expo-doctor', result: expoResult });

  const allResults = [...tier1.results, ...results];
  const allErrors = allResults.flatMap(r => r.result.errors || []);
  const passed = allErrors.length === 0;

  return {
    tier: 'tier2',
    passed,
    duration: Date.now() - startTime,
    results: allResults,
    summary: {
      totalErrors: allErrors.length,
      fixableErrors: allErrors.filter(e => e.fixable).length,
      checks: allResults.length,
      passedChecks: allResults.filter(r => r.result.passed).length,
    },
  };
}

async function runPrettierCheck(projectPath: string) {
  try {
    await execAsync('npx prettier --check "src/**/*.{ts,tsx}"', {
      cwd: projectPath,
      timeout: 30000,
    });
    return { passed: true, errors: [], warnings: [], duration: 0 };
  } catch (error: any) {
    return {
      passed: false,
      errors: [{ file: 'prettier', message: 'Formatting issues found', fixable: true }],
      warnings: [],
      duration: 0,
    };
  }
}

async function runMetroCheck(projectPath: string) {
  try {
    await execAsync('npx expo export --platform web --output-dir /tmp/metro-check', {
      cwd: projectPath,
      timeout: 120000,
    });
    return { passed: true, errors: [], warnings: [], duration: 0 };
  } catch (error: any) {
    return {
      passed: false,
      errors: [{ file: 'metro', message: error.message, fixable: false }],
      warnings: [],
      duration: 0,
    };
  }
}

async function runExpoDoctor(projectPath: string) {
  try {
    await execAsync('npx expo-doctor', {
      cwd: projectPath,
      timeout: 60000,
    });
    return { passed: true, errors: [], warnings: [], duration: 0 };
  } catch (error: any) {
    // Expo doctor returns warnings, not errors
    return {
      passed: true, // Don't fail on expo-doctor
      errors: [],
      warnings: [{ file: 'expo', message: error.stdout || error.message }],
      duration: 0,
    };
  }
}
```

#### packages/testing/src/runners/tier3.ts
```typescript
import { runTier2 } from './tier2';
import { TierResult } from './tier1';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export async function runTier3(projectPath: string): Promise<TierResult> {
  const startTime = Date.now();
  const results: { name: string; result: any }[] = [];

  // First run Tier 2
  const tier2 = await runTier2(projectPath);
  if (!tier2.passed) {
    return {
      tier: 'tier3',
      passed: false,
      duration: Date.now() - startTime,
      results: tier2.results,
      summary: tier2.summary,
    };
  }

  // Expo prebuild
  const prebuildResult = await runExpoPrebuild(projectPath);
  results.push({ name: 'expo-prebuild', result: prebuildResult });

  // Bundle size check
  const bundleSizeResult = await checkBundleSize(projectPath);
  results.push({ name: 'bundle-size', result: bundleSizeResult });

  // Run Maestro tests if available
  const maestroResult = await runMaestroTests(projectPath);
  if (maestroResult) {
    results.push({ name: 'maestro-e2e', result: maestroResult });
  }

  const allResults = [...tier2.results, ...results];
  const allErrors = allResults.flatMap(r => r.result.errors || []);
  const passed = allErrors.length === 0;

  return {
    tier: 'tier3',
    passed,
    duration: Date.now() - startTime,
    results: allResults,
    summary: {
      totalErrors: allErrors.length,
      fixableErrors: allErrors.filter(e => e.fixable).length,
      checks: allResults.length,
      passedChecks: allResults.filter(r => r.result.passed).length,
    },
  };
}

async function runExpoPrebuild(projectPath: string) {
  try {
    await execAsync('npx expo prebuild --clean --no-install', {
      cwd: projectPath,
      timeout: 180000, // 3 minutes
    });
    return { passed: true, errors: [], warnings: [], duration: 0 };
  } catch (error: any) {
    return {
      passed: false,
      errors: [{ file: 'expo-prebuild', message: error.message, fixable: false }],
      warnings: [],
      duration: 0,
    };
  }
}

async function checkBundleSize(projectPath: string) {
  try {
    const { stdout } = await execAsync('npx expo export --platform web --output-dir /tmp/bundle-size-check && du -sh /tmp/bundle-size-check', {
      cwd: projectPath,
      timeout: 120000,
    });

    const sizeMatch = stdout.match(/(\d+(?:\.\d+)?)(M|K|G)/);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2];

      // Convert to MB
      const sizeInMB = unit === 'G' ? size * 1024 : unit === 'K' ? size / 1024 : size;

      // Warn if > 20MB, fail if > 50MB
      if (sizeInMB > 50) {
        return {
          passed: false,
          errors: [{ file: 'bundle', message: `Bundle size ${sizeInMB.toFixed(1)}MB exceeds 50MB limit`, fixable: false }],
          warnings: [],
          duration: 0,
        };
      }

      if (sizeInMB > 20) {
        return {
          passed: true,
          errors: [],
          warnings: [{ file: 'bundle', message: `Bundle size ${sizeInMB.toFixed(1)}MB is large` }],
          duration: 0,
        };
      }
    }

    return { passed: true, errors: [], warnings: [], duration: 0 };
  } catch (error: any) {
    return {
      passed: true, // Don't fail on bundle size check failure
      errors: [],
      warnings: [{ file: 'bundle', message: 'Could not check bundle size' }],
      duration: 0,
    };
  }
}

async function runMaestroTests(projectPath: string) {
  const maestroDir = path.join(projectPath, '.maestro');

  try {
    const { stdout } = await execAsync(`ls ${maestroDir}/*.yaml 2>/dev/null | wc -l`);
    if (parseInt(stdout.trim()) === 0) {
      return null; // No Maestro tests
    }

    await execAsync(`maestro test ${maestroDir}`, {
      cwd: projectPath,
      timeout: 300000, // 5 minutes
    });

    return { passed: true, errors: [], warnings: [], duration: 0 };
  } catch (error: any) {
    if (error.message.includes('No such file')) {
      return null; // Maestro not installed or no tests
    }

    return {
      passed: false,
      errors: [{ file: 'maestro', message: error.message, fixable: false }],
      warnings: [],
      duration: 0,
    };
  }
}
```

### Acceptance Criteria
- [ ] Tier 1 runs in < 30 seconds
- [ ] Tier 2 runs in < 2 minutes
- [ ] Tier 3 runs in < 10 minutes
- [ ] Each tier includes all previous checks
- [ ] Results include summary statistics

### Tests Required
```typescript
// packages/testing/tests/runners/tier-runners.test.ts
describe('Tier Runners', () => {
  describe('runTier1', () => {
    it('should complete in < 30 seconds', async () => {
      const result = await runTier1(validProjectPath);
      expect(result.duration).toBeLessThan(30000);
    });

    it('should include all tier 1 checks', async () => {
      const result = await runTier1(validProjectPath);
      const checkNames = result.results.map(r => r.name);
      expect(checkNames).toContain('typescript');
      expect(checkNames).toContain('imports');
      expect(checkNames).toContain('navigation');
    });
  });

  describe('runTier2', () => {
    it('should include tier 1 results', async () => {
      const result = await runTier2(validProjectPath);
      const checkNames = result.results.map(r => r.name);
      expect(checkNames).toContain('typescript');
      expect(checkNames).toContain('eslint');
    });
  });
});
```

### Build Verification
```bash
cd packages/testing && npm run build && npm test
```

---

## Task 3.3: Wire Tester Service

**Priority:** P0 - Critical
**Estimate:** 3 hours
**Assignee:** Developer

### Description
Update the tester service to expose testing via API.

### Files to Modify
- `services/tester/src/index.ts`

### Implementation
```typescript
import express from 'express';
import cors from 'cors';
import { runTier1, runTier2, runTier3 } from '@mobigen/testing';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 6000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'tester' });
});

// Run Tier 1 validation
app.post('/api/test/tier1', async (req, res) => {
  const { projectPath } = req.body;

  if (!projectPath) {
    return res.status(400).json({ error: 'projectPath is required' });
  }

  try {
    const result = await runTier1(projectPath);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run Tier 2 validation
app.post('/api/test/tier2', async (req, res) => {
  const { projectPath } = req.body;

  if (!projectPath) {
    return res.status(400).json({ error: 'projectPath is required' });
  }

  try {
    const result = await runTier2(projectPath);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run Tier 3 validation
app.post('/api/test/tier3', async (req, res) => {
  const { projectPath } = req.body;

  if (!projectPath) {
    return res.status(400).json({ error: 'projectPath is required' });
  }

  try {
    const result = await runTier3(projectPath);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run specific validator
app.post('/api/test/validate/:validator', async (req, res) => {
  const { validator } = req.params;
  const { projectPath } = req.body;

  const validators: Record<string, Function> = {
    typescript: () => import('@mobigen/testing').then(m => m.validateTypeScript({ projectPath })),
    eslint: () => import('@mobigen/testing').then(m => m.validateESLint({ projectPath })),
    navigation: () => import('@mobigen/testing').then(m => m.validateNavigation({ projectPath })),
    imports: () => import('@mobigen/testing').then(m => m.validateImports({ projectPath })),
  };

  if (!validators[validator]) {
    return res.status(400).json({ error: `Unknown validator: ${validator}` });
  }

  try {
    const result = await validators[validator]();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Tester service listening on port ${PORT}`);
});
```

### Acceptance Criteria
- [ ] POST /api/test/tier1 runs Tier 1
- [ ] POST /api/test/tier2 runs Tier 2
- [ ] POST /api/test/tier3 runs Tier 3
- [ ] POST /api/test/validate/:validator runs specific validator
- [ ] Health check returns status

### Tests Required
```typescript
// tests/api/tester-service.test.ts
describe('Tester Service API', () => {
  describe('POST /api/test/tier1', () => {
    it('should run tier 1 validation', async () => {
      const response = await request(app)
        .post('/api/test/tier1')
        .send({ projectPath: validProjectPath });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.tier).toBe('tier1');
    });
  });
});
```

### Build Verification
```bash
cd services/tester && npm run build && npm test
```

---

## Task 3.4: Integrate Testing with Generator

**Priority:** P1 - High
**Estimate:** 3 hours
**Assignee:** Developer

### Description
Update pipeline-executor to run tests after each phase.

### Files to Modify
- `services/generator/src/pipeline-executor.ts`

### Implementation
```typescript
// Add to PipelineExecutor class

import { runTier1, runTier2, TierResult } from '@mobigen/testing';

/**
 * Run validation after a phase completes
 */
private async runPhaseValidation(phaseName: string): Promise<TierResult | null> {
  const { projectPath, projectId, logger } = this.context;

  // Determine validation tier based on phase
  const phaseTiers: Record<string, 'tier1' | 'tier2' | null> = {
    'analysis': null,
    'planning': null,
    'design': 'tier1',
    'task-breakdown': 'tier1',
    'implementation': 'tier1',
    'validation': 'tier2',
    'qa': null,
  };

  const tier = phaseTiers[phaseName];
  if (!tier) return null;

  logger.info(`Running ${tier} validation after ${phaseName} phase`);
  await emitProgress(projectId, 'validation:start', { tier, phase: phaseName });

  try {
    const result = tier === 'tier1'
      ? await runTier1(projectPath)
      : await runTier2(projectPath);

    await emitProgress(projectId, 'validation:complete', {
      tier,
      phase: phaseName,
      passed: result.passed,
      summary: result.summary,
    });

    if (!result.passed) {
      logger.warn(`${tier} validation failed after ${phaseName}`, {
        errors: result.summary.totalErrors,
        fixable: result.summary.fixableErrors,
      });
    }

    return result;
  } catch (error: any) {
    logger.error(`Validation error after ${phaseName}:`, error);
    return null;
  }
}

// In executePhase(), after phase completes:
const phaseResult = await this.executePhase(phase);

// Run validation
const validationResult = await this.runPhaseValidation(phase.name);
if (validationResult && !validationResult.passed && this.config.enableFeedbackLoop) {
  // Attempt to fix validation errors
  await this.attemptValidationFix(validationResult);
}
```

### Acceptance Criteria
- [ ] Tier 1 runs after design, task-breakdown, implementation
- [ ] Tier 2 runs after validation phase
- [ ] Failed validation triggers error-fixer
- [ ] Progress events emitted for validation

### Tests Required
```typescript
// tests/integration/pipeline-validation.test.ts
describe('Pipeline Validation', () => {
  it('should run tier1 after implementation', async () => {
    const events: any[] = [];
    mockEmitProgress((id, stage, data) => events.push({ stage, data }));

    await runPipeline(projectId, projectPath, config);

    const validationEvents = events.filter(e => e.stage === 'validation:complete');
    expect(validationEvents.some(e => e.data.phase === 'implementation')).toBe(true);
  });
});
```

### Build Verification
```bash
cd services/generator && npm run build && npm test
```

---

## Sprint 3 Completion Checklist

- [ ] Task 3.1: Testing package validators implemented
- [ ] Task 3.2: Tier runners implemented
- [ ] Task 3.3: Tester service wired
- [ ] Task 3.4: Testing integrated with generator
- [ ] All builds succeed
- [ ] All tests pass
- [ ] Code reviewed and merged

---

## Build Commands Summary

```bash
# Testing package
cd packages/testing && npm run build && npm test

# Tester service
cd services/tester && npm run build && npm test

# Generator service
cd services/generator && npm run build && npm test

# Full validation
npm run build && npm run test && npm run test:integration
```
