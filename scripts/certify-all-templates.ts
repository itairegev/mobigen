#!/usr/bin/env tsx

/**
 * Mobigen Template Certification Runner
 *
 * Runs certification tests on all templates and generates a comprehensive report.
 *
 * Certification Levels:
 * - Bronze: Tier 1 passes (TypeScript, ESLint, Navigation, Imports)
 * - Silver: Tier 2 passes (+ Expo prebuild, Jest tests)
 * - Gold: Tier 3 passes (+ Maestro E2E tests)
 *
 * Usage:
 *   pnpm tsx scripts/certify-all-templates.ts
 *   pnpm tsx scripts/certify-all-templates.ts --template restaurant
 *   pnpm tsx scripts/certify-all-templates.ts --level silver
 */

import * as fs from 'fs/promises';
import * as path from 'path';
// Import directly from tiers to avoid test-utils which requires React
import { runTier1 } from '../packages/testing/src/tiers/tier1';
import { runTier2 } from '../packages/testing/src/tiers/tier2';
import { runTier3 } from '../packages/testing/src/tiers/tier3';
import type { ValidationResult, ValidatorConfig, ValidationTier } from '../packages/testing/src/types';

// Progressive validation options interface
interface ProgressiveValidationOptions {
  projectPath: string;
  stopOnFailure?: boolean;
  maxTier?: ValidationTier;
  timeout?: number;
  cwd?: string;
  onTierComplete?: (tier: ValidationTier, result: ValidationResult) => void;
}

// Inline validateProgressive to avoid importing from index which pulls in test-utils
async function validateProgressive(
  options: ProgressiveValidationOptions
): Promise<ValidationResult[]> {
  const {
    projectPath,
    stopOnFailure = true,
    maxTier = 'tier3',
    timeout,
    cwd,
    onTierComplete,
  } = options;

  const results: ValidationResult[] = [];
  const config: ValidatorConfig = {
    projectPath,
    tier: maxTier,
    timeout,
    cwd: cwd || projectPath,
  };

  // Always start with Tier 1
  const tier1Result = await runTier1(config);
  results.push(tier1Result);
  onTierComplete?.('tier1', tier1Result);
  if ((!tier1Result.passed && stopOnFailure) || maxTier === 'tier1') {
    return results;
  }

  // If passed Tier 1 and max is >= tier2, run Tier 2
  const tier2Result = await runTier2(config);
  results.push(tier2Result);
  onTierComplete?.('tier2', tier2Result);
  if ((!tier2Result.passed && stopOnFailure) || maxTier === 'tier2') {
    return results;
  }

  // If passed Tier 2 and max is tier3, run Tier 3
  const tier3Result = await runTier3(config);
  results.push(tier3Result);
  onTierComplete?.('tier3', tier3Result);

  return results;
}

interface CertificationLevel {
  name: 'bronze' | 'silver' | 'gold';
  tier: 'tier1' | 'tier2' | 'tier3';
  description: string;
}

const CERTIFICATION_LEVELS: Record<string, CertificationLevel> = {
  bronze: {
    name: 'bronze',
    tier: 'tier1',
    description: 'Basic quality - compiles, lints, navigates',
  },
  silver: {
    name: 'silver',
    tier: 'tier2',
    description: 'Production-ready - builds, tests pass',
  },
  gold: {
    name: 'gold',
    tier: 'tier3',
    description: 'Fully validated - E2E tests pass',
  },
};

interface TemplateCertificationResult {
  templateId: string;
  templateName: string;
  certificationLevel: 'bronze' | 'silver' | 'gold' | 'none';
  passedTiers: Array<'tier1' | 'tier2' | 'tier3'>;
  failedTiers: Array<'tier1' | 'tier2' | 'tier3'>;
  results: ValidationResult[];
  errors: Array<{
    tier: string;
    stage: string;
    count: number;
    samples: string[];
  }>;
  warnings: Array<{
    tier: string;
    stage: string;
    count: number;
  }>;
  duration: number;
  certifiedAt: string;
}

interface CertificationReport {
  reportDate: string;
  totalTemplates: number;
  summary: {
    bronze: number;
    silver: number;
    gold: number;
    none: number;
  };
  templates: TemplateCertificationResult[];
}

async function getTemplates(templatesDir: string): Promise<string[]> {
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });

  const templates = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.name !== 'shared')
    .filter((entry) => entry.name !== 'base')
    .map((entry) => entry.name);

  return templates.sort();
}

async function getTemplateInfo(templatePath: string): Promise<{ id: string; name: string }> {
  // Try template.json first
  const jsonPath = path.join(templatePath, 'template.json');
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    return { id: data.id, name: data.name };
  } catch (e) {
    // Ignore
  }

  // Try template.config.ts
  const configPath = path.join(templatePath, 'template.config.ts');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);

    if (idMatch && nameMatch) {
      return { id: idMatch[1], name: nameMatch[1] };
    }
  } catch (e) {
    // Ignore
  }

  // Fallback to directory name
  const dirName = path.basename(templatePath);
  return {
    id: dirName,
    name: dirName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  };
}

async function certifyTemplate(
  templatePath: string,
  maxLevel: 'bronze' | 'silver' | 'gold' = 'silver'
): Promise<TemplateCertificationResult> {
  const start = Date.now();
  const info = await getTemplateInfo(templatePath);

  console.log(`\n🔍 Certifying ${info.name} (${info.id})...`);

  const maxTier = CERTIFICATION_LEVELS[maxLevel].tier;

  let results: ValidationResult[];
  try {
    results = await validateProgressive({
      projectPath: templatePath,
      maxTier,
      stopOnFailure: false,
      onTierComplete: (tier, result) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`  ${icon} ${tier}: ${result.passed ? 'PASS' : 'FAIL'} (${result.duration}ms)`);

        if (!result.passed) {
          const errorCount = result.errors.length;
          console.log(`     ${errorCount} error(s) found`);
        }
      },
    });
  } catch (error) {
    console.error(`  ❌ Certification failed: ${error instanceof Error ? error.message : String(error)}`);

    return {
      templateId: info.id,
      templateName: info.name,
      certificationLevel: 'none',
      passedTiers: [],
      failedTiers: [maxTier],
      results: [],
      errors: [{
        tier: 'all',
        stage: 'certification',
        count: 1,
        samples: [error instanceof Error ? error.message : String(error)],
      }],
      warnings: [],
      duration: Date.now() - start,
      certifiedAt: new Date().toISOString(),
    };
  }

  // Determine certification level
  const passedTiers = results.filter((r) => r.passed).map((r) => r.tier);
  const failedTiers = results.filter((r) => !r.passed).map((r) => r.tier);

  let certificationLevel: 'bronze' | 'silver' | 'gold' | 'none' = 'none';
  if (passedTiers.includes('tier3')) {
    certificationLevel = 'gold';
  } else if (passedTiers.includes('tier2')) {
    certificationLevel = 'silver';
  } else if (passedTiers.includes('tier1')) {
    certificationLevel = 'bronze';
  }

  // Collect errors and warnings
  const errors: TemplateCertificationResult['errors'] = [];
  const warnings: TemplateCertificationResult['warnings'] = [];

  for (const result of results) {
    for (const [stageName, stageResult] of Object.entries(result.stages)) {
      const stageErrors = stageResult.errors.filter((e) => e.severity === 'error');
      const stageWarnings = stageResult.errors.filter((e) => e.severity === 'warning');

      if (stageErrors.length > 0) {
        errors.push({
          tier: result.tier,
          stage: stageName,
          count: stageErrors.length,
          samples: stageErrors.slice(0, 3).map((e) =>
            `${e.file}${e.line ? `:${e.line}` : ''} - ${e.message}`
          ),
        });
      }

      if (stageWarnings.length > 0) {
        warnings.push({
          tier: result.tier,
          stage: stageName,
          count: stageWarnings.length,
        });
      }
    }
  }

  const duration = Date.now() - start;
  const certIcon =
    certificationLevel === 'gold' ? '🥇' :
    certificationLevel === 'silver' ? '🥈' :
    certificationLevel === 'bronze' ? '🥉' : '❌';

  console.log(`  ${certIcon} Certification: ${certificationLevel.toUpperCase()} (${duration}ms)`);

  return {
    templateId: info.id,
    templateName: info.name,
    certificationLevel,
    passedTiers,
    failedTiers,
    results,
    errors,
    warnings,
    duration,
    certifiedAt: new Date().toISOString(),
  };
}

async function generateMarkdownReport(report: CertificationReport): Promise<string> {
  const lines: string[] = [];

  lines.push('# Mobigen Template Certification Status');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.reportDate).toLocaleString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Templates:** ${report.totalTemplates}`);
  lines.push(`- 🥇 **Gold:** ${report.summary.gold} (Tier 3 - E2E tests pass)`);
  lines.push(`- 🥈 **Silver:** ${report.summary.silver} (Tier 2 - Builds and unit tests pass)`);
  lines.push(`- 🥉 **Bronze:** ${report.summary.bronze} (Tier 1 - Compiles and lints)`);
  lines.push(`- ❌ **None:** ${report.summary.none} (Certification failed)`);
  lines.push('');

  // Overall status
  const passRate = ((report.summary.gold + report.summary.silver + report.summary.bronze) / report.totalTemplates * 100).toFixed(1);
  lines.push(`**Overall Pass Rate:** ${passRate}% (Silver+ target: ${((report.summary.gold + report.summary.silver) / report.totalTemplates * 100).toFixed(1)}%)`);
  lines.push('');

  lines.push('## Certification Levels');
  lines.push('');
  lines.push('| Level | Requirements | Description |');
  lines.push('|-------|--------------|-------------|');
  lines.push('| 🥇 Gold | Tier 3 Pass | All checks pass including E2E tests |');
  lines.push('| 🥈 Silver | Tier 2 Pass | TypeScript, ESLint, builds, and unit tests pass |');
  lines.push('| 🥉 Bronze | Tier 1 Pass | TypeScript, ESLint, navigation, and imports pass |');
  lines.push('| ❌ None | Failed | Does not meet minimum requirements |');
  lines.push('');

  lines.push('## Templates by Status');
  lines.push('');

  // Group by certification level
  const byLevel = {
    gold: report.templates.filter((t) => t.certificationLevel === 'gold'),
    silver: report.templates.filter((t) => t.certificationLevel === 'silver'),
    bronze: report.templates.filter((t) => t.certificationLevel === 'bronze'),
    none: report.templates.filter((t) => t.certificationLevel === 'none'),
  };

  lines.push('| Template | Certification | Tiers Passed | Errors | Warnings | Duration |');
  lines.push('|----------|---------------|--------------|--------|----------|----------|');

  for (const level of ['gold', 'silver', 'bronze', 'none'] as const) {
    for (const template of byLevel[level]) {
      const icon =
        level === 'gold' ? '🥇' :
        level === 'silver' ? '🥈' :
        level === 'bronze' ? '🥉' : '❌';

      const tiersPassedStr = template.passedTiers.join(', ') || 'none';
      const errorCount = template.errors.reduce((sum, e) => sum + e.count, 0);
      const warningCount = template.warnings.reduce((sum, w) => sum + w.count, 0);
      const durationSec = (template.duration / 1000).toFixed(1);

      lines.push(
        `| ${template.templateName} | ${icon} ${level} | ${tiersPassedStr} | ${errorCount} | ${warningCount} | ${durationSec}s |`
      );
    }
  }

  lines.push('');
  lines.push('## Detailed Results');
  lines.push('');

  for (const template of report.templates) {
    lines.push(`### ${template.templateName} (${template.templateId})`);
    lines.push('');

    const icon =
      template.certificationLevel === 'gold' ? '🥇' :
      template.certificationLevel === 'silver' ? '🥈' :
      template.certificationLevel === 'bronze' ? '🥉' : '❌';

    lines.push(`**Certification:** ${icon} ${template.certificationLevel.toUpperCase()}`);
    lines.push('');

    lines.push('**Validation Results:**');
    lines.push('');

    if (template.results.length === 0) {
      lines.push('- ❌ Certification crashed or failed to run');
      lines.push('');

      if (template.errors.length > 0) {
        lines.push('**Errors:**');
        lines.push('');
        for (const error of template.errors) {
          lines.push(`- **${error.stage}:** ${error.count} error(s)`);
          for (const sample of error.samples) {
            lines.push(`  - ${sample}`);
          }
        }
        lines.push('');
      }
    } else {
      for (const result of template.results) {
        const icon = result.passed ? '✅' : '❌';
        lines.push(`- ${icon} **${result.tier}:** ${result.passed ? 'PASS' : 'FAIL'} (${result.duration}ms)`);

        if (!result.passed && Object.keys(result.stages).length > 0) {
          for (const [stageName, stageResult] of Object.entries(result.stages)) {
            if (!stageResult.passed) {
              const errorCount = stageResult.errors.filter(e => e.severity === 'error').length;
              lines.push(`  - ${stageName}: ${errorCount} error(s)`);
            }
          }
        }
      }
      lines.push('');

      if (template.errors.length > 0) {
        lines.push('**Issues Found:**');
        lines.push('');
        for (const error of template.errors) {
          lines.push(`- **${error.tier} / ${error.stage}:** ${error.count} error(s)`);
          if (error.samples.length > 0) {
            for (const sample of error.samples.slice(0, 2)) {
              lines.push(`  - ${sample}`);
            }
            if (error.count > 2) {
              lines.push(`  - ... and ${error.count - 2} more`);
            }
          }
        }
        lines.push('');
      }

      if (template.warnings.length > 0) {
        const totalWarnings = template.warnings.reduce((sum, w) => sum + w.count, 0);
        lines.push(`**Warnings:** ${totalWarnings} total`);
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');
  lines.push('### Priority Actions');
  lines.push('');

  const failedTemplates = report.templates.filter((t) => t.certificationLevel === 'none');
  const bronzeTemplates = report.templates.filter((t) => t.certificationLevel === 'bronze');

  if (failedTemplates.length > 0) {
    lines.push('**Critical - Fix Failed Templates:**');
    lines.push('');
    for (const template of failedTemplates) {
      lines.push(`- **${template.templateName}**: Does not pass Tier 1 validation`);
      if (template.errors.length > 0) {
        const primaryError = template.errors[0];
        lines.push(`  - Primary issue: ${primaryError.stage} (${primaryError.count} errors)`);
      }
    }
    lines.push('');
  }

  if (bronzeTemplates.length > 0) {
    lines.push('**High Priority - Upgrade Bronze to Silver:**');
    lines.push('');
    for (const template of bronzeTemplates) {
      lines.push(`- **${template.templateName}**: Passes Tier 1 but fails Tier 2`);
      const tier2Errors = template.errors.filter((e) => e.tier === 'tier2');
      if (tier2Errors.length > 0) {
        for (const error of tier2Errors.slice(0, 1)) {
          lines.push(`  - Issue: ${error.stage} failures`);
        }
      }
    }
    lines.push('');
  }

  lines.push('### Path to Gold');
  lines.push('');
  lines.push('For templates to achieve Gold certification, they need:');
  lines.push('');
  lines.push('1. **Maestro E2E Tests**: Create `.maestro/` test flows');
  lines.push('2. **Critical User Paths**: Test key user journeys');
  lines.push('3. **Stable Navigation**: Ensure all screens are reachable');
  lines.push('4. **Mock Data**: Sufficient test data for E2E scenarios');
  lines.push('');

  return lines.join('\n');
}

async function generateJsonReport(report: CertificationReport, outputPath: string): Promise<void> {
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 JSON report saved to: ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const templateFilter = args.find((arg) => arg.startsWith('--template='))?.split('=')[1];
  const levelFilter = args.find((arg) => arg.startsWith('--level='))?.split('=')[1] as 'bronze' | 'silver' | 'gold' | undefined;

  const templatesDir = path.join(process.cwd(), 'templates');
  const allTemplates = await getTemplates(templatesDir);

  const templatesToTest = templateFilter
    ? allTemplates.filter((t) => t === templateFilter)
    : allTemplates;

  const maxLevel = levelFilter || 'silver';

  console.log('🎯 Mobigen Template Certification');
  console.log('=================================');
  console.log(`📁 Templates directory: ${templatesDir}`);
  console.log(`🎖️  Max certification level: ${maxLevel.toUpperCase()}`);
  console.log(`📋 Templates to certify: ${templatesToTest.length}`);
  console.log('');

  const results: TemplateCertificationResult[] = [];

  for (const templateId of templatesToTest) {
    const templatePath = path.join(templatesDir, templateId);
    const result = await certifyTemplate(templatePath, maxLevel);
    results.push(result);
  }

  // Generate report
  const report: CertificationReport = {
    reportDate: new Date().toISOString(),
    totalTemplates: results.length,
    summary: {
      gold: results.filter((r) => r.certificationLevel === 'gold').length,
      silver: results.filter((r) => r.certificationLevel === 'silver').length,
      bronze: results.filter((r) => r.certificationLevel === 'bronze').length,
      none: results.filter((r) => r.certificationLevel === 'none').length,
    },
    templates: results,
  };

  console.log('\n');
  console.log('📊 CERTIFICATION SUMMARY');
  console.log('========================');
  console.log(`🥇 Gold:   ${report.summary.gold}`);
  console.log(`🥈 Silver: ${report.summary.silver}`);
  console.log(`🥉 Bronze: ${report.summary.bronze}`);
  console.log(`❌ None:   ${report.summary.none}`);
  console.log('');

  // Generate markdown report
  const docsDir = path.join(process.cwd(), 'docs');
  const markdownPath = path.join(docsDir, 'CERTIFICATION-STATUS.md');
  const markdown = await generateMarkdownReport(report);
  await fs.writeFile(markdownPath, markdown, 'utf-8');
  console.log(`✅ Markdown report saved to: ${markdownPath}`);

  // Generate JSON report
  const jsonPath = path.join(docsDir, 'certification-report.json');
  await generateJsonReport(report, jsonPath);

  // Exit code
  const hasFailures = report.summary.none > 0;
  process.exit(hasFailures ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Certification failed:', error);
  process.exit(1);
});
