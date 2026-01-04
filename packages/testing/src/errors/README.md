# Enhanced Error Messages

This module provides user-friendly error messages for the Mobigen validation pipeline. It transforms cryptic technical errors into actionable guidance with context, suggestions, and documentation links.

## Features

- **Multiple Error Parsers**: TypeScript, ESLint, Metro, Expo, React Native
- **Smart Suggestions**: Actionable fix suggestions based on error patterns
- **Code Context**: Shows relevant code snippets with error location
- **Documentation Links**: Links to official docs for learning
- **Multiple Formats**: Console, Markdown, JSON output
- **Auto-fix Detection**: Identifies which errors can be automatically fixed

## Architecture

```
errors/
├── parsers/           # Parse raw error output into structured format
│   ├── typescript.ts  # TypeScript compiler errors
│   ├── eslint.ts      # ESLint linting errors
│   ├── metro.ts       # Metro bundler errors
│   ├── expo.ts        # Expo-specific errors
│   └── react-native.ts # React Native runtime errors
│
├── enrichers/         # Add context and suggestions to errors
│   ├── context.ts     # Code context around error location
│   ├── suggestions.ts # Fix suggestions for common errors
│   └── docs.ts        # Documentation links
│
├── formatters/        # Format errors for different audiences
│   ├── ai.ts          # Structured format for AI agents
│   └── user.ts        # Human-readable console/markdown
│
├── integration.ts     # Integration helpers for validation pipeline
├── examples.ts        # Usage examples
└── index.ts          # Main API
```

## Usage

### Basic Usage

```typescript
import { processTypeScriptErrors, formatReportForConsole } from '@mobigen/testing/errors';

// Process TypeScript errors
const errors = await processTypeScriptErrors(
  tscOutput,
  '/path/to/project'
);

// Create a report
const report = createAIErrorReport(errors);

// Format for display
const formatted = formatReportForConsole(report);
console.log(formatted);
```

### Integration with Validation Pipeline

```typescript
import { enhanceStageErrors, createErrorSummary } from '@mobigen/testing/errors';
import { runTier1 } from '@mobigen/testing';

// Run validation
const result = await runTier1({ projectPath, tier: 'tier1' });

// Create enhanced error summary
const summary = await createErrorSummary(
  result.stages,
  projectPath,
  'console'
);

console.log(summary);
```

### Get Actionable Fixes

```typescript
import { getActionableFixes, generateFixInstructions } from '@mobigen/testing/errors';

// Categorize errors
const { autoFixable, manualFixes, needsReview } = getActionableFixes(errors);

// Generate AI fix instructions
const instructions = generateFixInstructions(autoFixable);

// Send to AI fixer agent
await sendToAI(instructions);
```

### Process Multiple Error Sources

```typescript
import { processAllErrors } from '@mobigen/testing/errors';

const errors = await processAllErrors(
  [
    { source: 'typescript', rawOutput: tscOutput },
    { source: 'eslint', rawOutput: eslintOutput },
    { source: 'metro', rawOutput: metroOutput },
  ],
  projectPath
);
```

## Error Types

### TypeScript Errors

- **Parsed from**: `tsc --noEmit` output
- **Common errors**: Missing imports, type mismatches, undefined variables
- **Suggestions**: Import statements, type annotations, null checks
- **Docs**: TypeScript handbook links

### ESLint Errors

- **Parsed from**: ESLint JSON or stylish output
- **Common errors**: Unused variables, undefined variables, hook violations
- **Suggestions**: Remove unused code, add imports, fix hook calls
- **Docs**: ESLint rule documentation

### Metro Errors

- **Parsed from**: Metro bundler output
- **Common errors**: Module resolution, syntax errors, transform errors
- **Suggestions**: Check paths, install packages, fix syntax
- **Docs**: React Native metro documentation

### Expo Errors

- **Parsed from**: Expo CLI output (prebuild, doctor, build)
- **Common errors**: Missing bundle ID, config errors, plugin errors
- **Suggestions**: Add config fields, install plugins, run prebuild
- **Docs**: Expo configuration documentation

### React Native Errors

- **Parsed from**: React Native runtime errors
- **Common errors**: Text rendering, hooks violations, component errors
- **Suggestions**: Wrap in Text, fix hook usage, add null checks
- **Docs**: React Native component documentation

## Output Formats

### Console Format

User-friendly terminal output with colors:

```
═══════════════════════════════════════════════════════════
✗ Found 2 errors, 1 warning: 2 typescript
═══════════════════════════════════════════════════════════

✗ TYPESCRIPT
  src/App.tsx:15:5
  Cannot find name 'React'.
  (TS2304)

  💡 Import or define 'React'
     Example: import { React } from 'react';
     ⚡ Auto-fixable
```

### Markdown Format

Great for UI display or documentation:

```markdown
## ❌ Validation Failed

**Summary:** ✗ Found 2 errors, 1 warning

### `src/App.tsx`

🔴 **Line 15** `TS2304`
> Cannot find name 'React'.

💡 **Suggestion:** Import or define 'React'
\`\`\`typescript
import { React } from 'react';
\`\`\`
```

### JSON Format

Structured data for APIs:

```json
{
  "success": false,
  "totalErrors": 2,
  "totalWarnings": 1,
  "errors": [
    {
      "type": "typescript",
      "severity": "error",
      "file": "src/App.tsx",
      "line": 15,
      "message": "Cannot find name 'React'.",
      "code": "TS2304",
      "suggestion": {
        "description": "Import or define 'React'",
        "example": "import { React } from 'react';"
      },
      "autoFixable": true
    }
  ]
}
```

## Error Suggestion System

The suggestion system provides actionable fixes:

### TypeScript Suggestions

- **TS2304** (Cannot find name): Add import statement
- **TS2307** (Cannot find module): Install package or fix path
- **TS2339** (Property does not exist): Add property or check types
- **TS2322** (Type not assignable): Fix type compatibility
- **TS2532** (Object possibly undefined): Add null check
- **TS2741** (Missing property): Add required property

### ESLint Suggestions

- **no-undef**: Define or import the variable
- **no-unused-vars**: Remove or use the variable
- **react/jsx-no-undef**: Import the component
- **react-hooks/rules-of-hooks**: Move hook to top level
- **react-hooks/exhaustive-deps**: Add missing dependencies

### React Native Suggestions

- **Text rendering**: Wrap in `<Text>` component
- **Undefined object**: Add null checks (`obj?.property`)
- **ViewPropTypes**: Update to `ViewProps`
- **Hooks violations**: Fix hook call location
- **Screen not found**: Register screen in navigation

### Expo Suggestions

- **Missing bundle ID**: Add to app.json
- **Missing package name**: Add to app.json
- **Config errors**: Check app.json format
- **Plugin errors**: Install required plugins
- **Prebuild errors**: Run `npx expo prebuild --clean`

## Statistics & Analytics

Get error statistics for reporting:

```typescript
import { getErrorStats } from '@mobigen/testing/errors';

const stats = getErrorStats(errors);

console.log(stats);
// {
//   total: 10,
//   byType: { typescript: 5, eslint: 3, metro: 2 },
//   bySeverity: { error: 8, warning: 2 },
//   byCategory: { import: 4, type: 3, style: 3 },
//   autoFixableCount: 6
// }
```

## AI Integration

The error system is designed to work seamlessly with AI fix agents:

1. **Enhanced Context**: Includes code snippets and line numbers
2. **Structured Suggestions**: Actionable fix instructions
3. **Confidence Scores**: AI can prioritize high-confidence fixes
4. **Auto-fix Flags**: Identifies safe automatic fixes
5. **Documentation Links**: AI can learn from official docs

Example AI prompt generation:

```typescript
import { generateFixInstructions } from '@mobigen/testing/errors';

const instructions = generateFixInstructions(errors);

// Returns formatted instructions ready for AI agent
const aiPrompt = `
The following errors need to be fixed:

## src/App.tsx

- **Line 15**: Cannot find name 'React'.
  - Fix: Import or define 'React'
  - Example: \`import { React } from 'react';\`

Please fix these errors while preserving existing functionality.
`;
```

## Extension Points

### Adding New Error Parsers

1. Create parser in `parsers/your-parser.ts`
2. Implement the parsing logic
3. Export from `parsers/index.ts`
4. Add processing function in `index.ts`

### Adding New Suggestions

1. Add pattern to `enrichers/suggestions.ts`
2. Include description, action, example
3. Set confidence and auto-fixable flag

### Adding Documentation Links

1. Add to `enrichers/docs.ts`
2. Include title, URL, description
3. Add to contextual detection

## Testing

See `examples.ts` for comprehensive usage examples.

## Related

- **Validation Pipeline**: `/packages/testing/src/tiers/`
- **Validators**: `/packages/testing/src/validators/`
- **Auto-fix**: `/packages/ai/src/auto-fix/`
