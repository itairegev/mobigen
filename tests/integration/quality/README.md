## Quality Pipeline Integration Tests

Comprehensive end-to-end tests for the Mobigen generation quality pipeline.

### Test Structure

```
quality/
├── fixtures/
│   ├── sample-requests.ts      - Sample app generation requests
│   ├── expected-outputs.ts     - Expected file structures and validation results
│   └── mock-responses.ts       - Mock AI agent responses
├── helpers.ts                  - Test helper functions
├── setup.ts                    - Test setup and teardown
├── happy-path.test.ts          - Success path tests
├── auto-fix.test.ts            - Auto-fix integration tests
├── retry.test.ts               - Retry system tests
├── rollback.test.ts            - Rollback integration tests
└── jest.config.js              - Jest configuration
```

### Test Categories

#### 1. Happy Path Tests (`happy-path.test.ts`)
Tests successful end-to-end generation workflows:
- Simple restaurant app generation
- Service booking app generation
- Batch testing of all simple apps
- File structure validation
- Navigation checks
- Import resolution
- Branding application

#### 2. Auto-Fix Tests (`auto-fix.test.ts`)
Tests automatic error detection and fixing:
- Missing import detection and fix
- Wrong path correction
- Auto-fixable error classification

#### 3. Retry Tests (`retry.test.ts`)
Tests the retry logic for handling failures:
- Validation failure retries
- Multiple retry strategies
- Progressive error fixing
- Escalation to human review

#### 4. Rollback Tests (`rollback.test.ts`)
Tests the rollback mechanism:
- Detecting when fixes make things worse
- Restoring previous state
- Multiple rollback operations
- Git history tracking

### Running Tests

**Run all quality integration tests:**
```bash
cd mobigen/tests/integration/quality
npm test
```

**Run specific test file:**
```bash
npm test happy-path.test.ts
npm test auto-fix.test.ts
npm test retry.test.ts
npm test rollback.test.ts
```

**Run with coverage:**
```bash
npm test -- --coverage
```

**Run in watch mode:**
```bash
npm test -- --watch
```

### Test Fixtures

#### Sample Requests
Pre-defined app generation requests covering various scenarios:
- Simple apps (low complexity, should succeed)
- Medium complexity apps
- Problematic requests (for testing error handling)

#### Expected Outputs
Expected file structures and validation results for each request:
- Required files
- Optional files
- Forbidden files
- Validation expectations (tier 1, 2, 3)
- Custom checks (navigation, imports, types, branding)

#### Mock Responses
Mock AI agent responses for testing without hitting real AI:
- Analyzer responses
- Validator success/failure responses
- Error fixer responses
- Developer responses
- Build validator responses

### Helper Functions

**`createTestProject(projectId)`**
Creates an isolated test project directory.

**`runGeneration(prompt, projectId, config, options)`**
Runs generation with mocks or real orchestrator.

**`assertValidation(result, expected)`**
Asserts validation result meets expectations.

**`assertFileStructure(projectPath, expected)`**
Asserts file structure matches expectations.

**`cleanupTestProject(config, success)`**
Cleanup test project (preserves on failure for debugging).

**`checkNavigation(projectPath)`**
Validates React Navigation setup.

**`checkImports(projectPath)`**
Validates all imports resolve correctly.

**`checkTypes(projectPath)`**
Validates TypeScript type definitions exist.

**`checkBranding(projectPath, colors)`**
Validates branding colors are applied.

### Test Timeouts

- Individual test: 10 minutes (600000ms)
- Batch tests: 30 minutes (1800000ms)
- Setup/teardown: 5 minutes (300000ms)

### Test Artifacts

Failed tests preserve their artifacts at:
```
/tmp/mobigen-integration-tests/
```

You can inspect these directories to debug test failures.

### Debugging Tips

1. **Test fails - inspect artifacts:**
   ```bash
   ls -la /tmp/mobigen-integration-tests/projects/
   ```

2. **Run single test with verbose output:**
   ```bash
   npm test -- happy-path.test.ts --verbose
   ```

3. **Disable cleanup to inspect project:**
   Modify test to set `cleanupOnFailure: false`

4. **Check validation errors:**
   Errors are logged to console with file:line format

5. **Review git history:**
   For rollback tests, check git log:
   ```bash
   cd /tmp/mobigen-integration-tests/projects/test-xxx
   git log --oneline
   git reflog
   ```

### CI/CD Integration

These tests are designed to run in CI/CD pipelines:

**GitHub Actions:**
```yaml
- name: Run Quality Integration Tests
  run: |
    cd mobigen/tests/integration/quality
    npm test
  timeout-minutes: 60
```

**Test results are written to:**
- `junit.xml` - JUnit format for CI
- `coverage/` - Coverage reports

### Performance

- Tests run serially (`maxWorkers: 1`) to avoid conflicts
- Mock mode available for faster testing
- Retry logic built-in for flaky tests
- Cleanup optimized (preserves only failures)

### Future Enhancements

- [ ] Parallel test execution with better isolation
- [ ] More mock scenarios for faster tests
- [ ] Snapshot testing for generated code
- [ ] Performance benchmarking
- [ ] Visual regression tests for UI components
