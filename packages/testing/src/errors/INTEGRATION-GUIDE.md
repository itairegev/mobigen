# Integration Guide: Enhanced Error Messages

This guide shows how to integrate the enhanced error message system into the Mobigen validation pipeline.

## Quick Start

### 1. Process Validation Results

```typescript
import { runTier1 } from '@mobigen/testing';
import { createErrorSummary } from '@mobigen/testing/errors';

async function validateProject(projectPath: string) {
  // Run validation
  const result = await runTier1({
    projectPath,
    tier: 'tier1',
  });

  // Create enhanced error summary
  const summary = await createErrorSummary(
    result.stages,
    projectPath,
    'console' // or 'markdown' or 'json'
  );

  console.log(summary);

  return result;
}
```

### 2. Get Actionable Fixes for AI

```typescript
import { enhanceStageErrors, getActionableFixes, generateFixInstructions } from '@mobigen/testing/errors';

async function getFixesForAI(result: ValidationResult, projectPath: string) {
  // Collect all enhanced errors
  const allErrors = [];
  for (const stage of Object.values(result.stages)) {
    if (!stage.passed) {
      const enhanced = await enhanceStageErrors(stage, projectPath);
      allErrors.push(...enhanced);
    }
  }

  // Categorize errors
  const { autoFixable, manualFixes, needsReview } = getActionableFixes(allErrors);

  console.log(`Auto-fixable: ${autoFixable.length}`);
  console.log(`Manual fixes: ${manualFixes.length}`);
  console.log(`Needs review: ${needsReview.length}`);

  // Generate AI instructions
  if (autoFixable.length > 0) {
    const instructions = generateFixInstructions(autoFixable);
    return instructions;
  }

  return null;
}
```

### 3. Process Raw Error Output

```typescript
import { processTypeScriptErrors, createAIErrorReport } from '@mobigen/testing/errors';

async function processRawErrors(rawOutput: string, projectPath: string) {
  // Process TypeScript errors
  const errors = await processTypeScriptErrors(rawOutput, projectPath);

  // Create structured report
  const report = createAIErrorReport(errors);

  console.log(`Found ${report.totalErrors} errors, ${report.totalWarnings} warnings`);
  console.log(`Auto-fixable: ${errors.filter(e => e.autoFixable).length}`);

  return report;
}
```

## Complete Validation Workflow

Here's a complete example integrating enhanced errors into the validation workflow:

```typescript
import { runTier1, runTier2, runTier3 } from '@mobigen/testing';
import {
  enhanceStageErrors,
  createErrorSummary,
  getActionableFixes,
  generateFixInstructions,
  hasCriticalErrors,
  getErrorStats,
  type AIFormattedError,
} from '@mobigen/testing/errors';

interface ValidationWorkflowResult {
  tier1: ValidationResult;
  tier2?: ValidationResult;
  tier3?: ValidationResult;
  allErrors: AIFormattedError[];
  summary: string;
  aiInstructions?: string;
  stats: ReturnType<typeof getErrorStats>;
  canProceed: boolean;
}

async function completeValidationWorkflow(
  projectPath: string
): Promise<ValidationWorkflowResult> {
  const allErrors: AIFormattedError[] = [];
  let canProceed = true;

  // ═══════════════════════════════════════════════════════════════
  // TIER 1: Instant validation (<30 seconds)
  // ═══════════════════════════════════════════════════════════════

  console.log('Running Tier 1 validation...');
  const tier1 = await runTier1({ projectPath, tier: 'tier1' });

  // Enhance Tier 1 errors
  for (const stage of Object.values(tier1.stages)) {
    if (!stage.passed) {
      const enhanced = await enhanceStageErrors(stage, projectPath);
      allErrors.push(...enhanced);
    }
  }

  // Show Tier 1 summary
  const tier1Summary = await createErrorSummary(tier1.stages, projectPath, 'console');
  console.log(tier1Summary);

  // Check for critical errors
  if (hasCriticalErrors(allErrors)) {
    console.log('\n❌ Critical errors found in Tier 1. Cannot proceed to Tier 2.');

    // Generate AI fix instructions
    const { autoFixable } = getActionableFixes(allErrors);
    const aiInstructions = autoFixable.length > 0
      ? generateFixInstructions(autoFixable)
      : undefined;

    return {
      tier1,
      allErrors,
      summary: tier1Summary,
      aiInstructions,
      stats: getErrorStats(allErrors),
      canProceed: false,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // TIER 2: Fast validation (<2 minutes)
  // ═══════════════════════════════════════════════════════════════

  console.log('\n✅ Tier 1 passed. Running Tier 2 validation...');
  const tier2 = await runTier2({ projectPath, tier: 'tier2' });

  // Enhance Tier 2 errors
  for (const stage of Object.values(tier2.stages)) {
    if (!stage.passed) {
      const enhanced = await enhanceStageErrors(stage, projectPath);
      allErrors.push(...enhanced);
    }
  }

  const tier2Summary = await createErrorSummary(tier2.stages, projectPath, 'console');
  console.log(tier2Summary);

  if (hasCriticalErrors(allErrors)) {
    console.log('\n❌ Critical errors found in Tier 2. Cannot proceed to Tier 3.');
    canProceed = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // TIER 3: Thorough validation (<10 minutes)
  // ═══════════════════════════════════════════════════════════════

  let tier3: ValidationResult | undefined;
  if (canProceed) {
    console.log('\n✅ Tier 2 passed. Running Tier 3 validation...');
    tier3 = await runTier3({ projectPath, tier: 'tier3' });

    for (const stage of Object.values(tier3.stages)) {
      if (!stage.passed) {
        const enhanced = await enhanceStageErrors(stage, projectPath);
        allErrors.push(...enhanced);
      }
    }

    const tier3Summary = await createErrorSummary(tier3.stages, projectPath, 'console');
    console.log(tier3Summary);

    canProceed = !hasCriticalErrors(allErrors);
  }

  // ═══════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════

  const finalSummary = await createErrorSummary(
    {
      ...tier1.stages,
      ...(tier2?.stages || {}),
      ...(tier3?.stages || {}),
    },
    projectPath,
    'markdown'
  );

  // Generate AI instructions if needed
  const { autoFixable } = getActionableFixes(allErrors);
  const aiInstructions = autoFixable.length > 0
    ? generateFixInstructions(autoFixable)
    : undefined;

  // Get statistics
  const stats = getErrorStats(allErrors);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('VALIDATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Errors: ${stats.total}`);
  console.log(`Auto-fixable: ${stats.autoFixableCount}`);
  console.log(`Can Proceed: ${canProceed ? '✅ Yes' : '❌ No'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  return {
    tier1,
    tier2,
    tier3,
    allErrors,
    summary: finalSummary,
    aiInstructions,
    stats,
    canProceed,
  };
}

// Usage
async function main() {
  const projectPath = '/path/to/project';

  const result = await completeValidationWorkflow(projectPath);

  if (!result.canProceed) {
    console.log('Fix the errors and try again.');

    if (result.aiInstructions) {
      console.log('\n=== AI Fix Instructions ===\n');
      console.log(result.aiInstructions);

      // Send to AI fixer agent
      // await sendToAIAgent(result.aiInstructions);
    }

    process.exit(1);
  }

  console.log('✅ All validations passed. Ready for build!');
}
```

## Integration with AI Fixer Agent

The enhanced error system is designed to work with AI fix agents:

```typescript
import { generateFixInstructions, getActionableFixes } from '@mobigen/testing/errors';

async function fixErrorsWithAI(errors: AIFormattedError[], projectPath: string) {
  // Categorize errors
  const { autoFixable, manualFixes, needsReview } = getActionableFixes(errors);

  // Phase 1: Auto-fix high-confidence errors
  if (autoFixable.length > 0) {
    console.log(`Attempting to auto-fix ${autoFixable.length} errors...`);

    const instructions = generateFixInstructions(autoFixable);

    // Send to AI agent
    const fixResult = await aiAgent.fix({
      projectPath,
      instructions,
      maxRetries: 3,
    });

    console.log(`Fixed ${fixResult.fixedCount} errors`);
  }

  // Phase 2: Manual fixes (lower confidence)
  if (manualFixes.length > 0) {
    console.log(`${manualFixes.length} errors require manual review`);

    // Generate detailed instructions for manual fixes
    const manualInstructions = generateFixInstructions(manualFixes);

    // Show to user or send to AI with higher scrutiny
    console.log(manualInstructions);
  }

  // Phase 3: Items needing review
  if (needsReview.length > 0) {
    console.log(`${needsReview.length} items need human review`);

    // Flag for human review
    for (const error of needsReview) {
      await flagForReview(error);
    }
  }
}
```

## Custom Error Handling

You can extend the error system with custom handlers:

```typescript
import type { AIFormattedError } from '@mobigen/testing/errors';

// Custom error handler for specific project needs
function customErrorHandler(error: AIFormattedError): string | null {
  // Example: Custom handling for specific file patterns
  if (error.file.includes('generated/')) {
    return 'This file is auto-generated. Fix the source instead.';
  }

  // Example: Custom handling for specific error types
  if (error.type === 'typescript' && error.code === 'TS2304') {
    // Check if it's a known custom module
    if (error.message.includes('MyCustomModule')) {
      return 'Install MyCustomModule: npm install my-custom-module';
    }
  }

  return null; // Use default handling
}

// Apply custom handler
async function processWithCustomHandler(errors: AIFormattedError[]) {
  for (const error of errors) {
    const customSuggestion = customErrorHandler(error);

    if (customSuggestion && error.suggestion) {
      // Override suggestion with custom one
      error.suggestion.description = customSuggestion;
    }
  }

  return errors;
}
```

## WebSocket Integration for Real-time Updates

Show validation progress to users in real-time:

```typescript
import { EventEmitter } from 'events';
import { enhanceStageErrors } from '@mobigen/testing/errors';

class ValidationStream extends EventEmitter {
  async validate(projectPath: string) {
    this.emit('progress', { stage: 'tier1', status: 'starting' });

    const tier1 = await runTier1({ projectPath, tier: 'tier1' });

    // Enhance and stream errors as they're found
    for (const [stageName, stage] of Object.entries(tier1.stages)) {
      if (!stage.passed) {
        const enhanced = await enhanceStageErrors(stage, projectPath);

        // Stream each error to frontend
        for (const error of enhanced) {
          this.emit('error', {
            stage: 'tier1',
            stageName,
            error: {
              file: error.file,
              line: error.line,
              message: error.message,
              suggestion: error.suggestion?.description,
              autoFixable: error.autoFixable,
            },
          });
        }
      }
    }

    this.emit('progress', { stage: 'tier1', status: 'complete' });
  }
}

// Usage in API endpoint
app.post('/api/validate', async (req, res) => {
  const { projectId } = req.body;
  const projectPath = await getProjectPath(projectId);

  const stream = new ValidationStream();

  // Send real-time updates via WebSocket
  stream.on('progress', (data) => {
    ws.send(JSON.stringify({ type: 'progress', data }));
  });

  stream.on('error', (data) => {
    ws.send(JSON.stringify({ type: 'error', data }));
  });

  await stream.validate(projectPath);
});
```

## Best Practices

### 1. Always Use Enhanced Errors for User-Facing Messages

```typescript
// ❌ Bad: Raw error output
console.log(stage.output);

// ✅ Good: Enhanced error summary
const summary = await createErrorSummary(result.stages, projectPath, 'console');
console.log(summary);
```

### 2. Categorize Before Sending to AI

```typescript
// ❌ Bad: Send all errors to AI
await aiAgent.fix(allErrors);

// ✅ Good: Categorize and prioritize
const { autoFixable, manualFixes } = getActionableFixes(allErrors);
await aiAgent.fix(autoFixable); // High confidence only
```

### 3. Check Critical Errors Before Proceeding

```typescript
// ❌ Bad: Always run all tiers
await runTier1();
await runTier2();
await runTier3();

// ✅ Good: Fail fast on critical errors
const tier1 = await runTier1();
if (hasCriticalErrors(await enhanceStageErrors(...))) {
  return; // Don't proceed to tier 2
}
```

### 4. Use Statistics for Analytics

```typescript
// Track error trends
const stats = getErrorStats(allErrors);

await analytics.track('validation_complete', {
  totalErrors: stats.total,
  byType: stats.byType,
  autoFixableCount: stats.autoFixableCount,
  projectId,
  timestamp: new Date(),
});
```

## Troubleshooting

### Common Issues

**Issue**: Errors not being enhanced
```typescript
// Check that raw output is available
if (!stage.output) {
  console.warn('No raw output available for enhancement');
}
```

**Issue**: Suggestions not appearing
```typescript
// Check suggestion confidence
if (suggestion && suggestion.confidence < 0.5) {
  console.warn('Low confidence suggestion, may not be accurate');
}
```

**Issue**: Context not showing
```typescript
// Ensure file paths are absolute
const absolutePath = path.isAbsolute(error.file)
  ? error.file
  : path.join(projectRoot, error.file);
```

## Next Steps

1. **Integrate with Validation Pipeline**: Add enhanced error reporting to tier validators
2. **Connect to AI Agents**: Use fix instructions in auto-fix workflow
3. **Add to Dashboard**: Display enhanced errors in web UI
4. **Track Metrics**: Monitor error patterns and fix success rates
5. **Extend Parsers**: Add custom error parsers for project-specific needs
