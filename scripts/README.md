# Mobigen Scripts

This directory contains utility scripts for template certification and management.

## Template Certification Scripts

### certify-all-templates.ts

**Purpose:** Run comprehensive certification on all templates

**Usage:**
```bash
# Certify all templates (Silver level default)
pnpm certify

# Certify for Gold level
pnpm certify:gold

# Certify specific template
pnpm certify:template=restaurant

# Or use tsx directly
npx tsx scripts/certify-all-templates.ts
npx tsx scripts/certify-all-templates.ts --template=restaurant
npx tsx scripts/certify-all-templates.ts --level=gold
```

**Output:**
- `docs/CERTIFICATION-STATUS.md` - Detailed status report
- `docs/certification-report.json` - Machine-readable results
- Console output with real-time progress

**Certification Levels:**
- `bronze` - Tier 1 validation (TypeScript, ESLint, Navigation, Imports)
- `silver` - Tier 2 validation (+ Expo prebuild, Jest tests) **[Default]**
- `gold` - Tier 3 validation (+ Maestro E2E tests)

### check-template-status.ts

**Purpose:** Quick health check of all templates without running full validation

**Usage:**
```bash
# Quick overview
pnpm templates:status

# Detailed view with issues
pnpm templates:status:detailed

# Or use tsx directly
npx tsx scripts/check-template-status.ts
npx tsx scripts/check-template-status.ts --detailed
npx tsx scripts/check-template-status.ts --issues
```

**Output:**
- Console report with template health indicators
- Certification status summary
- File presence checks

**Health Indicators:**
- ✅ Good - All essential files present, has tests and README
- ⚠️  Warning - Essential files present but missing tests or README
- ❌ Error - Missing essential files (package.json, app.json, tsconfig.json)

### analyze-templates.ts

**Purpose:** Analyze template structure and count screens/components

**Usage:**
```bash
# Run analysis
pnpm templates:analyze

# Or use tsx directly
npx tsx scripts/analyze-templates.ts
```

**Output:**
- Console report with template statistics
- `docs/template-analysis.json` - Detailed analysis data

**Metrics:**
- Screen count
- Component count
- Test presence
- Maestro E2E test presence
- Estimated readiness

### update-template-configs.ts

**Purpose:** Add or update certification metadata in template configuration files

**Usage:**
```bash
# Update specific template
npx tsx scripts/update-template-configs.ts \
  --template=restaurant \
  --level=silver \
  --notes="All checks pass"

# Update all templates (use with caution)
npx tsx scripts/update-template-configs.ts --level=silver
```

**Effect:**
Adds certification field to `template.json` or `template.config.ts`:

```json
{
  "certification": {
    "level": "silver",
    "certifiedAt": "2026-01-02T12:00:00.000Z",
    "lastChecked": "2026-01-02T12:00:00.000Z",
    "notes": "All checks pass"
  }
}
```

## Other Scripts

### generate-template-ast.ts

**Purpose:** Generate Abstract Syntax Tree representations of templates

**Usage:**
```bash
pnpm generate:ast
```

**Output:**
- `templates/templates.ast.json` - AST representation of all templates

### test-cert.ts

**Purpose:** Quick test of certification on a single template (development/debugging)

**Usage:**
```bash
npx tsx scripts/test-cert.ts
```

**Note:** Hardcoded to test `restaurant` template. Edit script for other templates.

## Workflow Examples

### Initial Certification Run

```bash
# 1. Check current status
pnpm templates:status

# 2. Run full certification
pnpm certify

# 3. Review results
cat docs/CERTIFICATION-STATUS.md

# 4. Fix issues and re-run
pnpm certify:template=restaurant
```

### Fix Template and Re-certify

```bash
# 1. Navigate to template
cd templates/restaurant

# 2. Run local checks
npx tsc --noEmit
npx eslint src/ --fix

# 3. Return to root and re-certify
cd ../..
pnpm certify:template=restaurant

# 4. If passed, update config
npx tsx scripts/update-template-configs.ts \
  --template=restaurant \
  --level=silver \
  --notes="Fixed TypeScript errors"
```

### Add E2E Tests for Gold

```bash
# 1. Create Maestro directory
cd templates/restaurant
mkdir .maestro

# 2. Create test flows
# (See CERTIFICATION-README.md for examples)

# 3. Test locally
maestro test .maestro

# 4. Re-certify for Gold
cd ../..
pnpm certify:gold --template=restaurant
```

### Monitor Template Health

```bash
# Daily check
pnpm templates:status

# Weekly detailed review
pnpm templates:status:detailed

# Monthly full certification
pnpm certify
```

## Exit Codes

All certification scripts follow standard exit codes:

- `0` - Success (all templates passed)
- `1` - Failure (one or more templates failed)

This allows for CI/CD integration:

```bash
# In CI pipeline
pnpm certify || exit 1
```

## File Outputs

| Script | Output Files |
|--------|-------------|
| certify-all-templates | `docs/CERTIFICATION-STATUS.md`<br>`docs/certification-report.json` |
| analyze-templates | `docs/template-analysis.json` |
| update-template-configs | Modifies template config files |
| check-template-status | Console only |
| test-cert | Console only |

## Integration with Testing Package

All certification scripts use the `@mobigen/testing` package:

```typescript
import { validateProgressive } from '@mobigen/testing';

const results = await validateProgressive({
  projectPath: templatePath,
  maxTier: 'tier2',
  stopOnFailure: false,
  onTierComplete: (tier, result) => {
    // Real-time progress updates
  }
});
```

## Documentation

For detailed information about the certification process:

- [CERTIFICATION-STATUS.md](../docs/CERTIFICATION-STATUS.md) - Current status of all templates
- [CERTIFICATION-README.md](../docs/CERTIFICATION-README.md) - Complete certification guide
- [QP1-012-IMPLEMENTATION.md](../docs/QP1-012-IMPLEMENTATION.md) - Implementation details

## Troubleshooting

### Script hangs or times out

```bash
# Increase timeout
timeout 600 pnpm certify

# Kill hung processes
pkill -f certify
```

### Memory issues

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm certify
```

### Permission errors

```bash
# Ensure scripts are executable
chmod +x scripts/*.ts
```

### TypeScript errors

```bash
# Ensure dependencies installed
pnpm install

# Check TypeScript version
npx tsc --version
```

## Best Practices

1. **Run status check before certification**
   ```bash
   pnpm templates:status
   pnpm certify
   ```

2. **Test single template first**
   ```bash
   pnpm certify:template=restaurant
   ```

3. **Review detailed results**
   ```bash
   cat docs/CERTIFICATION-STATUS.md
   ```

4. **Update configs after successful certification**
   ```bash
   npx tsx scripts/update-template-configs.ts \
     --template=restaurant \
     --level=silver
   ```

5. **Run regularly in CI/CD**
   ```yaml
   - run: pnpm certify
   ```

## Contributing

When adding new certification scripts:

1. Follow naming convention: `verb-noun.ts`
2. Add usage documentation in this README
3. Include `--help` flag support
4. Follow exit code conventions
5. Output machine-readable formats when appropriate
6. Add npm script shortcuts to `package.json`

## Support

For issues or questions:
1. Check this README
2. Review [CERTIFICATION-README.md](../docs/CERTIFICATION-README.md)
3. Check template-specific logs
4. Ask team for assistance

---

**Last Updated:** January 2, 2026
**Maintained By:** Mobigen Platform Team
