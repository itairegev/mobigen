# Template Certification Guide

This guide explains how to certify Mobigen templates and maintain quality standards.

## Overview

Mobigen uses a three-tier certification system to ensure all templates meet quality standards:

- **🥇 Gold (Tier 3):** Full validation including E2E tests
- **🥈 Silver (Tier 2):** Production-ready with builds and tests
- **🥉 Bronze (Tier 1):** Basic quality standards

**Goal:** All templates certified at Silver level minimum.

## Quick Start

### Run Certification on All Templates

```bash
# Run full certification (Silver level by default)
pnpm tsx scripts/certify-all-templates.ts

# Run certification for Gold level
pnpm tsx scripts/certify-all-templates.ts --level=gold

# Run certification for specific template
pnpm tsx scripts/certify-all-templates.ts --template=restaurant
```

### View Results

After running certification, check:
- `docs/CERTIFICATION-STATUS.md` - Human-readable report
- `docs/certification-report.json` - Machine-readable results

## Certification Levels

### 🥉 Bronze (Tier 1)

**Time:** < 30 seconds
**Requirements:**
- TypeScript compilation passes
- ESLint validation passes (critical rules only)
- Navigation graph is valid
- All imports resolve correctly

**Command:**
```bash
pnpm tsx scripts/certify-all-templates.ts --level=bronze
```

### 🥈 Silver (Tier 2)

**Time:** < 2 minutes
**Requirements:**
- All Bronze requirements ✓
- Expo prebuild succeeds
- Jest unit tests pass
- Metro bundler builds successfully

**Command:**
```bash
pnpm tsx scripts/certify-all-templates.ts --level=silver
```

**This is the minimum required level for all templates.**

### 🥇 Gold (Tier 3)

**Time:** < 10 minutes
**Requirements:**
- All Silver requirements ✓
- Maestro E2E tests pass
- All critical user flows validated
- Performance benchmarks met

**Command:**
```bash
pnpm tsx scripts/certify-all-templates.ts --level=gold
```

## Fixing Certification Failures

### Common Issues

#### TypeScript Errors

```bash
# Check TypeScript errors
cd templates/your-template
npx tsc --noEmit

# Fix common issues
- Add missing type imports
- Define prop types
- Fix return types
```

#### ESLint Violations

```bash
# Auto-fix what's possible
cd templates/your-template
npx eslint src/ --fix

# Manual fixes needed for:
- Unused variables
- Missing hook dependencies
- Incorrect patterns
```

#### Navigation Issues

```bash
# Validate navigation structure
# Check that:
- All screens in app/ are properly structured
- Routes match file paths
- No orphaned screen files
```

#### Build Failures

```bash
# Run Expo doctor to diagnose
cd templates/your-template
npx expo-doctor

# Common fixes:
- Update dependencies
- Fix native module issues
- Check app.json configuration
```

## Adding Certification to Template Configs

After a template passes certification, update its config:

```bash
# Update specific template
pnpm tsx scripts/update-template-configs.ts \
  --template=restaurant \
  --level=silver \
  --notes="All checks pass"

# Update all templates (use with caution)
pnpm tsx scripts/update-template-configs.ts --level=silver
```

This adds a `certification` field to the template's config:

```json
{
  "certification": {
    "level": "silver",
    "certifiedAt": "2026-01-02T...",
    "lastChecked": "2026-01-02T...",
    "notes": "All checks pass"
  }
}
```

## Creating Maestro E2E Tests

For Gold certification, templates need Maestro tests.

### 1. Create Maestro Directory

```bash
cd templates/your-template
mkdir .maestro
```

### 2. Define Critical Flow

Create `.maestro/main-flow.yaml`:

```yaml
appId: com.example.yourapp
---
# Main User Flow
- launchApp
- tapOn: "Home Tab"
- assertVisible: "Welcome"

# Navigate to key feature
- tapOn: "Browse"
- assertVisible: "Item List"

# Interact with feature
- tapOn:
    id: "item-0"
- assertVisible: "Item Details"

# Complete action
- tapOn: "Add to Cart"
- assertVisible: "Added to cart"
```

### 3. Test Multiple Flows

Create additional test files for different user journeys:
- `.maestro/checkout-flow.yaml`
- `.maestro/profile-flow.yaml`
- `.maestro/search-flow.yaml`

### 4. Run Tests Locally

```bash
# Install Maestro (if not already installed)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run tests
cd templates/your-template
maestro test .maestro
```

## Continuous Certification

### Pre-commit Validation

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Validate changed templates before commit

# Get changed template directories
CHANGED_TEMPLATES=$(git diff --cached --name-only | grep "^templates/" | cut -d/ -f2 | sort -u)

for TEMPLATE in $CHANGED_TEMPLATES; do
  if [ "$TEMPLATE" != "shared" ] && [ "$TEMPLATE" != "base" ]; then
    echo "Certifying $TEMPLATE..."
    pnpm tsx scripts/certify-all-templates.ts --template=$TEMPLATE --level=bronze
    if [ $? -ne 0 ]; then
      echo "❌ Certification failed for $TEMPLATE"
      exit 1
    fi
  fi
done
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
name: Template Certification

on:
  pull_request:
    paths:
      - 'templates/**'

jobs:
  certify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run certification
        run: pnpm tsx scripts/certify-all-templates.ts --level=silver

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: certification-report
          path: docs/certification-report.json
```

## Template Quality Checklist

Before submitting a template for certification:

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types (use proper types)
- [ ] All components have prop types
- [ ] ESLint rules followed
- [ ] No console.log in production code

### Structure
- [ ] Follows Expo Router conventions
- [ ] Proper directory structure (`app/`, `src/components/`, etc.)
- [ ] Shared utilities in `src/utils/`
- [ ] Types in `src/types/`

### Testing
- [ ] Jest tests for utilities
- [ ] Component tests for complex components
- [ ] Maestro tests for critical flows (Gold level)
- [ ] Mock data for all features

### Documentation
- [ ] README.md explains template
- [ ] template.json has complete metadata
- [ ] Code comments for complex logic
- [ ] Examples of customization

### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Lists use virtualization
- [ ] Navigation is fast

### Accessibility
- [ ] Proper semantic elements
- [ ] Screen reader support
- [ ] Sufficient color contrast
- [ ] Touch targets large enough

## Troubleshooting

### Certification hangs

```bash
# Kill hung processes
pkill -f certify-all-templates

# Run with timeout
timeout 300 pnpm tsx scripts/certify-all-templates.ts
```

### Memory issues

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" \
  pnpm tsx scripts/certify-all-templates.ts
```

### Template-specific issues

Check template logs:
```bash
cd templates/your-template
npx tsc --noEmit 2>&1 | tee typescript-errors.log
npx eslint src/ 2>&1 | tee eslint-errors.log
```

## Best Practices

### For New Templates

1. Start with a certified template as base
2. Run Tier 1 certification frequently during development
3. Fix issues immediately, don't accumulate tech debt
4. Add tests as you build features
5. Aim for Silver before considering complete

### For Existing Templates

1. Run full certification to identify issues
2. Fix critical errors first (TypeScript, builds)
3. Address warnings incrementally
4. Add missing tests
5. Document any exceptions

### For Team

1. Review certification status weekly
2. Block PRs that break certification
3. Celebrate templates reaching Gold
4. Share common fixes and patterns
5. Maintain certification momentum

## Resources

- [Certification Status Report](./CERTIFICATION-STATUS.md)
- [Testing Package Documentation](../packages/testing/README.md)
- [Maestro Documentation](https://maestro.mobile.dev)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing/)

## Support

If you encounter issues:
1. Check this guide
2. Review certification status report
3. Check template-specific logs
4. Ask team for help
5. Document solutions for others

---

**Last Updated:** January 2, 2026
**Maintained By:** Mobigen Platform Team
