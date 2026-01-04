/**
 * Test file for enhanced error messages
 *
 * This demonstrates the enhanced error message system with real examples
 */

import {
  parseTypeScriptOutput,
  parseESLintJsonOutput,
  parseMetroOutput,
  parseExpoOutput,
  parseReactNativeError,
  getTypeScriptSuggestion,
  getESLintSuggestion,
  getReactNativeSuggestion,
  getExpoSuggestion,
  processTypeScriptErrors,
  processESLintErrors,
  createAIErrorReport,
  formatReportForConsole,
} from './index';

/**
 * Test TypeScript error parsing
 */
async function testTypeScriptParsing() {
  console.log('\n=== Testing TypeScript Error Parsing ===\n');

  const tsOutput = `
src/App.tsx(15,5): error TS2304: Cannot find name 'React'.
src/components/Button.tsx(22,10): error TS2322: Type 'string' is not assignable to type 'number'.
src/screens/Home.tsx(45,3): error TS2532: Object is possibly 'undefined'.
`;

  const errors = parseTypeScriptOutput(tsOutput);

  console.log(`Parsed ${errors.length} TypeScript errors:`);
  for (const error of errors) {
    console.log(`- ${error.file}:${error.line}:${error.column} [${error.code}] ${error.message}`);

    const suggestion = getTypeScriptSuggestion(error.code, error.message);
    if (suggestion) {
      console.log(`  💡 ${suggestion.description}`);
      if (suggestion.example) {
        console.log(`     Example: ${suggestion.example}`);
      }
    }
  }
}

/**
 * Test ESLint error parsing
 */
async function testESLintParsing() {
  console.log('\n=== Testing ESLint Error Parsing ===\n');

  const eslintOutput = JSON.stringify([
    {
      filePath: 'src/App.tsx',
      messages: [
        {
          ruleId: 'no-undef',
          severity: 2,
          message: "'useState' is not defined.",
          line: 10,
          column: 15,
        },
        {
          ruleId: 'react-hooks/exhaustive-deps',
          severity: 1,
          message: "React Hook useEffect has a missing dependency: 'data'.",
          line: 25,
          column: 5,
        },
      ],
    },
  ]);

  const errors = parseESLintJsonOutput(eslintOutput);

  console.log(`Parsed ${errors.length} ESLint errors:`);
  for (const error of errors) {
    console.log(
      `- ${error.file}:${error.line}:${error.column} [${error.ruleId}] ${error.message}`
    );

    const suggestion = getESLintSuggestion(error.ruleId);
    if (suggestion) {
      console.log(`  💡 ${suggestion.description}`);
    }
  }
}

/**
 * Test Metro error parsing
 */
async function testMetroParsing() {
  console.log('\n=== Testing Metro Error Parsing ===\n');

  const metroOutput = `
error: Unable to resolve module '@react-navigation/native' from 'src/App.tsx': Module does not exist in the Haste module map

SyntaxError: Unexpected token (15:5)
  in src/components/Button.tsx
`;

  const errors = parseMetroOutput(metroOutput);

  console.log(`Parsed ${errors.length} Metro errors:`);
  for (const error of errors) {
    console.log(`- ${error.file} [${error.type}] ${error.message}`);
  }
}

/**
 * Test Expo error parsing
 */
async function testExpoParsing() {
  console.log('\n=== Testing Expo Error Parsing ===\n');

  const expoOutput = `
Error: Missing ios.bundleIdentifier in app.json
The bundle identifier is required for iOS builds.

Warning: Expo plugin 'expo-camera' is not installed
`;

  const errors = parseExpoOutput(expoOutput);

  console.log(`Parsed ${errors.length} Expo errors:`);
  for (const error of errors) {
    console.log(`- [${error.type}] ${error.message} (${error.severity})`);

    const suggestion = getExpoSuggestion(error.message);
    if (suggestion) {
      console.log(`  💡 ${suggestion.description}`);
      if (suggestion.example) {
        console.log(`     Example: ${suggestion.example}`);
      }
    }
  }
}

/**
 * Test React Native error parsing
 */
async function testReactNativeParsing() {
  console.log('\n=== Testing React Native Error Parsing ===\n');

  const rnOutput = `
Error: Text strings must be rendered within a <Text> component
  in MyComponent (at App.tsx:42:5)

Error: undefined is not an object (evaluating 'user.name')
  in ProfileScreen (at screens/Profile.tsx:25:10)
`;

  const errors = parseReactNativeError(rnOutput);

  console.log(`Parsed ${errors.length} React Native errors:`);
  for (const error of errors) {
    console.log(`- ${error.file || 'unknown'}:${error.line || '?'} [${error.type}] ${error.message}`);

    const suggestion = getReactNativeSuggestion(error.message);
    if (suggestion) {
      console.log(`  💡 ${suggestion.description}`);
      if (suggestion.example) {
        console.log(`     Example: ${suggestion.example}`);
      }
    }
  }
}

/**
 * Test full error processing workflow
 */
async function testFullWorkflow() {
  console.log('\n=== Testing Full Error Processing Workflow ===\n');

  const tsOutput = `
src/App.tsx(15,5): error TS2304: Cannot find name 'React'.
src/components/Button.tsx(22,10): error TS2322: Type 'string' is not assignable to type 'number'.
`;

  // Process errors with enrichment
  const errors = await processTypeScriptErrors(tsOutput, process.cwd());

  // Create report
  const report = createAIErrorReport(errors);

  console.log(`Report Summary: ${report.summary}`);
  console.log(`Total Errors: ${report.totalErrors}`);
  console.log(`Total Warnings: ${report.totalWarnings}`);
  console.log(`Buildable: ${report.buildable}`);

  // Format for console
  const formatted = formatReportForConsole(report);
  console.log('\nFormatted Output:');
  console.log(formatted);
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Enhanced Error Messages - Test Suite                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testTypeScriptParsing();
    await testESLintParsing();
    await testMetroParsing();
    await testExpoParsing();
    await testReactNativeParsing();
    await testFullWorkflow();

    console.log('\n✅ All tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { runAllTests };
