# Quick Start Guide - Quality Integration Tests

## 🚀 Getting Started (3 steps)

### 1. Install Dependencies
```bash
cd /home/ubuntu/base99/mobigen/tests/integration/quality
npm install
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Or run specific suite
npm test happy-path.test.ts
```

### 3. View Results
```bash
# Check console output for results
# Failed tests preserve artifacts at:
ls /tmp/mobigen-integration-tests/
```

## 📊 What Gets Tested

### ✅ Happy Path (happy-path.test.ts)
- Restaurant app generation
- Service booking app generation
- Batch testing multiple apps
- **Runtime:** ~10-15 minutes

### ✅ Auto-Fix (auto-fix.test.ts)
- Missing import detection & fix
- Wrong path correction
- Error classification
- **Runtime:** ~5-8 minutes

### ✅ Retry Logic (retry.test.ts)
- Validation retries
- Different fix strategies
- Escalation to review
- **Runtime:** ~3-5 minutes

### ✅ Rollback (rollback.test.ts)
- Bad fix detection
- State restoration
- Git history tracking
- **Runtime:** ~2-3 minutes

## 🎯 Common Commands

```bash
# Run all tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test
npm test -- happy-path.test.ts

# Run with verbose output
npm test -- --verbose

# Run only tests matching pattern
npm test -- --testNamePattern="restaurant"
```

## 🔍 Debugging Failed Tests

### 1. Check Test Output
```bash
# Look for error messages in console
npm test 2>&1 | tee test-output.log
```

### 2. Inspect Preserved Artifacts
```bash
# Failed tests keep their project directories
ls -la /tmp/mobigen-integration-tests/projects/

# Navigate to failed project
cd /tmp/mobigen-integration-tests/projects/test-xxx

# Check generated files
ls -R src/

# Check git history (for rollback tests)
git log --oneline
```

### 3. Run Individual Test
```bash
# Run just the failing test
npm test -- --testNamePattern="restaurant app"
```

## 📝 Test Structure

```
quality/
├── fixtures/           # Test data
│   ├── sample-requests.ts
│   ├── expected-outputs.ts
│   └── mock-responses.ts
├── helpers.ts          # Test utilities
├── setup.ts            # Setup/teardown
├── *.test.ts           # Test files
└── jest.config.js      # Configuration
```

## 🛠 Helper Functions You Can Use

```typescript
// Create test project
const project = await createTestProject('my-test');

// Run generation
const result = await runGeneration(prompt, projectId, config);

// Validate results
assertValidation(result, { shouldPass: true });
assertFileStructure(projectPath, { requiredFiles: [...] });

// Check specifics
await checkNavigation(projectPath);
await checkImports(projectPath);
await checkBranding(projectPath, colors);

// Cleanup
await cleanupTestProject(project, success);
```

## ⚙️ Configuration

### Timeouts
- Individual test: 10 minutes
- Batch tests: 30 minutes

### Cleanup
- Success: Deletes project (configurable)
- Failure: Preserves for debugging

### Execution
- Serial (maxWorkers: 1) to avoid conflicts
- Retry: 1 attempt for flaky tests

## 🎨 Sample Test Data

### Available Sample Requests
1. `restaurant-simple` - Simple restaurant menu app
2. `booking-service` - Salon booking app
3. `loyalty-coffee` - Coffee shop loyalty app
4. `ai-tutor` - AI study tutor app
5. `news-local` - Local news app

### Problematic Requests (for error testing)
1. `invalid-missing-imports` - Will fail with import errors
2. `type-errors` - Will fail with type errors

## 📖 Examples

### Example 1: Run Happy Path Test
```bash
npm test happy-path.test.ts
```
**Expected:** All simple apps generate successfully

### Example 2: Test Auto-Fix
```bash
npm test auto-fix.test.ts
```
**Expected:** Errors detected and automatically fixed

### Example 3: Test Retry Logic
```bash
npm test retry.test.ts
```
**Expected:** Retries exhausted, escalates to review

### Example 4: Test Rollback
```bash
npm test rollback.test.ts
```
**Expected:** Bad changes rolled back via git

## 🚨 Troubleshooting

### Tests Timeout
- Increase timeout in jest.config.js
- Use mock mode for faster tests
- Run fewer tests in parallel

### Tests Fail to Clean Up
- Check permissions on /tmp/
- Manually delete: `rm -rf /tmp/mobigen-integration-tests`

### Import Errors
- Run `npm install` in quality/ directory
- Check monorepo workspace links
- Verify packages are built

### Git Errors (rollback tests)
- Ensure git is installed
- Check git config (user.name, user.email)

## 🎓 Next Steps

1. **Read Full Docs:** See README.md for detailed documentation
2. **Check Implementation:** See IMPLEMENTATION.md for technical details
3. **Add More Tests:** Use fixtures/ to add new test scenarios
4. **Customize Helpers:** Extend helpers.ts for your use cases

## 💡 Tips

- Use `mock: true` option for faster iteration during development
- Preserve failed projects for debugging by setting `cleanupOnFailure: false`
- Add more sample requests to fixtures/ to expand test coverage
- Use `--watch` mode when developing tests
- Check /tmp/mobigen-integration-tests/ after failures

## ✅ Success Criteria

Tests pass when:
- ✓ All happy path apps generate successfully
- ✓ Validation tiers pass (tier 1, 2, 3)
- ✓ File structures match expectations
- ✓ Navigation, imports, types are valid
- ✓ Auto-fix reduces/eliminates errors
- ✓ Retry logic works up to max attempts
- ✓ Rollback restores previous state
- ✓ Git history tracked correctly

## 📞 Support

- Check README.md for detailed docs
- Review test output for specific errors
- Inspect preserved artifacts in /tmp/
- Add `--verbose` flag for more details

---

**Happy Testing! 🎉**
