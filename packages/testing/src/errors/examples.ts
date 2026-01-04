/**
 * Example usage of the enhanced error messages system
 *
 * This file demonstrates how to integrate enhanced error messages
 * into the validation pipeline.
 */

import type { ValidationResult, StageResult } from '../types';
import {
  enhanceStageErrors,
  createErrorSummary,
  getActionableFixes,
  generateFixInstructions,
  hasCriticalErrors,
  getErrorStats,
} from './integration';

/**
 * Example 1: Enhance errors from a validation tier
 *
 * Use this after running a validation tier to get user-friendly error messages
 */
export async function exampleEnhanceTierErrors(
  result: ValidationResult,
  projectRoot: string
): Promise<void> {
  // Create a user-friendly summary
  const summary = await createErrorSummary(result.stages, projectRoot, 'console');

  console.log(summary);

  // Or get markdown format for display in UI
  const markdown = await createErrorSummary(result.stages, projectRoot, 'markdown');

  // You can now send this to the frontend or save it to a file
}

/**
 * Example 2: Get actionable fixes for AI agent
 *
 * Use this to categorize errors for the AI fixer agent
 */
export async function exampleGetFixesForAI(
  result: ValidationResult,
  projectRoot: string
): Promise<void> {
  // Collect all enhanced errors
  const allErrors = [];
  for (const stage of Object.values(result.stages)) {
    if (!stage.passed) {
      const enhanced = await enhanceStageErrors(stage, projectRoot);
      allErrors.push(...enhanced);
    }
  }

  // Categorize errors
  const { autoFixable, manualFixes, needsReview } = getActionableFixes(allErrors);

  console.log(`Auto-fixable: ${autoFixable.length}`);
  console.log(`Manual fixes needed: ${manualFixes.length}`);
  console.log(`Needs review: ${needsReview.length}`);

  // Generate instructions for AI
  if (autoFixable.length > 0) {
    const instructions = generateFixInstructions(autoFixable);
    console.log('\nInstructions for AI:\n', instructions);
  }
}

/**
 * Example 3: Check if errors are critical
 *
 * Use this to decide whether to allow build to proceed
 */
export async function exampleCheckCriticalErrors(
  result: ValidationResult,
  projectRoot: string
): Promise<boolean> {
  const allErrors = [];
  for (const stage of Object.values(result.stages)) {
    if (!stage.passed) {
      const enhanced = await enhanceStageErrors(stage, projectRoot);
      allErrors.push(...enhanced);
    }
  }

  const critical = hasCriticalErrors(allErrors);

  if (critical) {
    console.log('❌ Critical errors found. Cannot proceed with build.');
    return false;
  }

  console.log('✅ No critical errors. Build can proceed.');
  return true;
}

/**
 * Example 4: Get error statistics
 *
 * Use this for analytics and reporting
 */
export async function exampleGetErrorStatistics(
  result: ValidationResult,
  projectRoot: string
): Promise<void> {
  const allErrors = [];
  for (const stage of Object.values(result.stages)) {
    if (!stage.passed) {
      const enhanced = await enhanceStageErrors(stage, projectRoot);
      allErrors.push(...enhanced);
    }
  }

  const stats = getErrorStats(allErrors);

  console.log('Error Statistics:');
  console.log(`Total: ${stats.total}`);
  console.log(`Auto-fixable: ${stats.autoFixableCount}`);
  console.log('\nBy Type:', stats.byType);
  console.log('By Severity:', stats.bySeverity);
  console.log('By Category:', stats.byCategory);
}

/**
 * Example 5: Integration with validation pipeline
 *
 * Complete example of integrating enhanced errors into the validation workflow
 */
export async function exampleValidationWorkflow(
  projectPath: string
): Promise<void> {
  // Import the tier validation
  const { runTier1 } = await import('../tiers/tier1');

  // Run validation
  const result = await runTier1({
    projectPath,
    tier: 'tier1',
  });

  // Create enhanced error report
  const errorReport = await createErrorSummary(result.stages, projectPath, 'console');

  console.log(errorReport);

  // If there are errors, get AI fix instructions
  if (!result.passed) {
    const allErrors = [];
    for (const stage of Object.values(result.stages)) {
      if (!stage.passed) {
        const enhanced = await enhanceStageErrors(stage, projectPath);
        allErrors.push(...enhanced);
      }
    }

    // Generate fix instructions
    const fixInstructions = generateFixInstructions(allErrors);

    // You would send this to your AI agent
    console.log('\n=== Instructions for AI Fixer ===\n');
    console.log(fixInstructions);

    // Get statistics for logging
    const stats = getErrorStats(allErrors);
    console.log('\n=== Statistics ===');
    console.log(JSON.stringify(stats, null, 2));
  }
}

/**
 * Example 6: Processing raw error output
 *
 * If you have raw error output from a command, you can process it directly
 */
export async function exampleProcessRawError(
  projectPath: string
): Promise<void> {
  const {
    processTypeScriptErrors,
    processESLintErrors,
    formatReportForConsole,
    createAIErrorReport,
  } = await import('./index');

  // Example: TypeScript error output
  const tsOutput = `
src/App.tsx(15,5): error TS2304: Cannot find name 'React'.
src/components/Button.tsx(22,10): error TS2322: Type 'string' is not assignable to type 'number'.
`;

  // Process the errors
  const tsErrors = await processTypeScriptErrors(tsOutput, projectPath);

  // Create a report
  const report = createAIErrorReport(tsErrors);

  // Format for console
  const formatted = formatReportForConsole(report);

  console.log(formatted);
}

/**
 * Example 7: Expo-specific error handling
 */
export async function exampleExpoErrors(
  projectPath: string
): Promise<void> {
  const { processExpoErrors, formatReportForConsole, createAIErrorReport } =
    await import('./index');

  // Example: Expo prebuild error
  const expoOutput = `
Error: Missing ios.bundleIdentifier in app.json
The bundle identifier is required for iOS builds.
Please add it to your app.json configuration.
`;

  // Process the errors
  const expoErrors = await processExpoErrors(expoOutput, projectPath);

  // Create a report
  const report = createAIErrorReport(expoErrors);

  // Format for console
  const formatted = formatReportForConsole(report);

  console.log(formatted);

  // The formatted output will include:
  // - The error message
  // - A suggestion to add the bundle identifier
  // - Documentation link to Expo configuration
  // - Example of the correct format
}

/**
 * Example 8: React Native error handling
 */
export async function exampleReactNativeErrors(
  projectPath: string
): Promise<void> {
  const { processReactNativeErrors, formatReportForConsole, createAIErrorReport } =
    await import('./index');

  // Example: React Native component error
  const rnOutput = `
Error: Text strings must be rendered within a <Text> component
in MyComponent (at App.tsx:42:5)
`;

  // Process the errors
  const rnErrors = await processReactNativeErrors(rnOutput, projectPath);

  // Create a report
  const report = createAIErrorReport(rnErrors);

  // Format for console
  const formatted = formatReportForConsole(report);

  console.log(formatted);

  // The formatted output will include:
  // - The error message
  // - A suggestion to wrap text in <Text> component
  // - Code example showing the correct usage
  // - Documentation link to React Native Text component
}
