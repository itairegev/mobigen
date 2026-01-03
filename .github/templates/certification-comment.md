## 📋 Template Certification Results

This PR modifies templates. Here are the certification results:

{{#each templates}}
### {{name}} - {{badge}}

**Status:** {{status}}

**Validation Tiers:**
- {{#if tier1}}✅{{else}}❌{{/if}} **Tier 1** (TypeScript, ESLint, Navigation, Imports)
- {{#if tier2}}✅{{else}}❌{{/if}} **Tier 2** (Expo Prebuild, Jest Tests)
- {{#if tier3}}✅{{else}}❌{{/if}} **Tier 3** (Maestro E2E Tests)

{{#if errors}}
**Errors Found:** {{errors}}

{{#if errorSamples}}
<details>
<summary>Sample Errors</summary>

{{#each errorSamples}}
- **{{tier}} / {{stage}}:** {{count}} error(s)
  {{#each samples}}
  - `{{this}}`
  {{/each}}
{{/each}}

</details>
{{/if}}
{{/if}}

{{#if warnings}}
**Warnings:** {{warnings}}
{{/if}}

**Duration:** {{duration}}s

<details>
<summary>View Full Output</summary>

```
{{output}}
```

</details>

---

{{/each}}

### 📊 Certification Levels

| Level | Badge | Requirements | Description |
|-------|-------|--------------|-------------|
| Gold | 🥇 | Tier 3 Pass | All checks pass including E2E tests |
| Silver | 🥈 | Tier 2 Pass | TypeScript, ESLint, builds, and unit tests pass |
| Bronze | 🥉 | Tier 1 Pass | TypeScript, ESLint, navigation, and imports pass |
| None | ❌ | Failed | Does not meet minimum requirements |

### ✅ Merge Requirements

**Minimum certification level required:** 🥈 Silver

{{#if allPassed}}
✅ **All modified templates meet the minimum certification requirements.**

This PR is ready to merge from a quality perspective.
{{else}}
❌ **Some templates do not meet the minimum certification requirements.**

The following templates need to achieve at least Silver (🥈) certification before this PR can be merged:

{{#each failedTemplates}}
- **{{name}}**: Currently at {{badge}} - {{failureReason}}
{{/each}}

### 🔧 Next Steps

1. Review the error messages for failed templates
2. Fix the identified issues
3. Push new commits to re-trigger certification
4. Achieve Silver (🥈) or Gold (🥇) certification for all templates
{{/if}}

---

<details>
<summary>ℹ️ About Template Certification</summary>

Template certification is an automated quality assurance process that validates templates against three tiers of checks:

#### Tier 1: Basic Quality (Bronze 🥉)
- TypeScript type checking
- ESLint validation (critical rules)
- Import resolution validation
- Navigation graph validation

#### Tier 2: Production Ready (Silver 🥈)
- All Tier 1 checks
- Expo prebuild validation
- Metro bundler check
- Jest unit tests
- Component smoke render tests

#### Tier 3: Fully Validated (Gold 🥇)
- All Tier 2 checks
- Maestro E2E tests
- Visual snapshot tests (optional)
- Bundle size checks

Templates must achieve at least **Silver** certification to be merged into the main branch.

</details>
