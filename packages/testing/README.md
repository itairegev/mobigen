# @mobigen/testing

QA validation pipeline for generated code in Mobigen.

## Overview

This package provides automated quality assurance for AI-generated code. It validates TypeScript, runs ESLint, and performs other code quality checks.

## Tech Stack

- **TypeScript**: Type checking
- **ESLint**: Linting
- **Zod**: Schema validation
- **Language**: TypeScript (ESM)

## Installation

```bash
pnpm add @mobigen/testing
```

## Features

- TypeScript type checking
- ESLint validation
- Build verification
- Custom rule validators
- Tiered validation (quick, standard, thorough)
- Report generation

## Directory Structure

```
src/
├── index.ts              # Main exports
├── validators/           # Validation implementations
│   ├── typescript.ts     # TypeScript validator
│   ├── eslint.ts         # ESLint validator
│   ├── build.ts          # Build validator
│   └── custom.ts         # Custom validators
├── tiers/                # Validation tiers
│   ├── quick.ts          # Quick validation
│   ├── standard.ts       # Standard validation
│   └── thorough.ts       # Thorough validation
├── pipeline.ts           # Validation pipeline
├── reporter.ts           # Report generation
└── types.ts              # TypeScript types
```

## Usage

### Basic Validation

```typescript
import { validate, TypeScriptValidator, ESLintValidator } from '@mobigen/testing';

// Validate a project directory
const result = await validate({
  projectPath: '/path/to/project',
  validators: [
    new TypeScriptValidator(),
    new ESLintValidator(),
  ],
});

if (result.passed) {
  console.log('All checks passed!');
} else {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}
```

### Using Tiers

```typescript
import { runTier, ValidationTier } from '@mobigen/testing';

// Quick validation (TypeScript only)
const quickResult = await runTier({
  tier: ValidationTier.QUICK,
  projectPath: '/path/to/project',
});

// Standard validation (TypeScript + ESLint)
const standardResult = await runTier({
  tier: ValidationTier.STANDARD,
  projectPath: '/path/to/project',
});

// Thorough validation (all checks + build)
const thoroughResult = await runTier({
  tier: ValidationTier.THOROUGH,
  projectPath: '/path/to/project',
});
```

### Validation Pipeline

```typescript
import { ValidationPipeline } from '@mobigen/testing';

// Create pipeline
const pipeline = new ValidationPipeline({
  projectPath: '/path/to/project',
  stopOnFirstError: false,
  parallel: true,
});

// Add validators
pipeline.add(new TypeScriptValidator());
pipeline.add(new ESLintValidator({ fix: false }));
pipeline.add(new BuildValidator());

// Run pipeline
const results = await pipeline.run();

// Get report
const report = pipeline.getReport();
```

## Validators

### TypeScriptValidator

Validates TypeScript types and syntax.

```typescript
import { TypeScriptValidator } from '@mobigen/testing';

const validator = new TypeScriptValidator({
  strict: true,
  noEmit: true,
  skipLibCheck: true,
});

const result = await validator.validate('/path/to/project');
// {
//   passed: false,
//   errors: [
//     { file: 'src/App.tsx', line: 10, message: "Type 'string' is not assignable..." }
//   ],
//   warnings: []
// }
```

### ESLintValidator

Validates code against ESLint rules.

```typescript
import { ESLintValidator } from '@mobigen/testing';

const validator = new ESLintValidator({
  fix: false,           // Auto-fix issues
  extensions: ['.ts', '.tsx'],
  ignorePath: '.eslintignore',
});

const result = await validator.validate('/path/to/project');
```

### BuildValidator

Verifies the project builds successfully.

```typescript
import { BuildValidator } from '@mobigen/testing';

const validator = new BuildValidator({
  command: 'pnpm build',
  timeout: 60000,
});

const result = await validator.validate('/path/to/project');
```

### Custom Validators

Create custom validators by extending the base class:

```typescript
import { BaseValidator, ValidationResult } from '@mobigen/testing';

class SecurityValidator extends BaseValidator {
  name = 'security';

  async validate(projectPath: string): Promise<ValidationResult> {
    const errors = [];

    // Check for hardcoded secrets
    const files = await this.getFiles(projectPath, '**/*.{ts,tsx}');
    for (const file of files) {
      const content = await this.readFile(file);
      if (content.includes('sk-ant-') || content.includes('password=')) {
        errors.push({
          file,
          message: 'Potential hardcoded secret detected',
        });
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}
```

## Validation Tiers

### Quick Tier

Fast validation for immediate feedback:
- TypeScript type checking
- ~5-10 seconds

### Standard Tier

Balanced validation:
- TypeScript type checking
- ESLint validation
- ~15-30 seconds

### Thorough Tier

Comprehensive validation:
- TypeScript type checking
- ESLint validation
- Build verification
- Custom validators
- ~1-2 minutes

## Report Generation

```typescript
import { ValidationPipeline, generateReport } from '@mobigen/testing';

const pipeline = new ValidationPipeline({ projectPath: '/path/to/project' });
await pipeline.run();

// Generate report
const report = generateReport(pipeline.results, {
  format: 'json',    // 'json' | 'html' | 'markdown'
  includeDetails: true,
});

// Save report
await writeFile('validation-report.json', report);
```

### Report Structure

```typescript
interface ValidationReport {
  summary: {
    passed: boolean;
    totalErrors: number;
    totalWarnings: number;
    duration: number;
  };
  validators: {
    name: string;
    passed: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    duration: number;
  }[];
  timestamp: string;
}
```

## Configuration

### Environment Variables

```env
# Validation settings
VALIDATION_TIMEOUT=60000
VALIDATION_TIER=standard
```

### Custom ESLint Config

```typescript
const validator = new ESLintValidator({
  configFile: '/path/to/.eslintrc.js',
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
});
```

## Building

```bash
# Build package
pnpm --filter @mobigen/testing build

# Type checking
pnpm --filter @mobigen/testing typecheck

# Run tests
pnpm --filter @mobigen/testing test
```

## Related Documentation

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Main README](../../README.md)
