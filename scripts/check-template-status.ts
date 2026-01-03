#!/usr/bin/env tsx

/**
 * Quick Template Status Checker
 *
 * Provides a fast overview of template health without running full validation
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface QuickCheck {
  id: string;
  name: string;
  hasPackageJson: boolean;
  hasAppJson: boolean;
  hasTsConfig: boolean;
  hasTests: boolean;
  hasMaestro: boolean;
  hasReadme: boolean;
  certificationLevel?: string;
  certifiedAt?: string;
  health: 'good' | 'warning' | 'error';
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getTemplateInfo(templatePath: string): Promise<{ id: string; name: string; certification?: any }> {
  // Try template.json first
  const jsonPath = path.join(templatePath, 'template.json');
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    return { id: data.id, name: data.name, certification: data.certification };
  } catch (e) {
    // Ignore
  }

  // Try template.config.ts
  const configPath = path.join(templatePath, 'template.config.ts');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);

    // Try to extract certification
    const certMatch = content.match(/certification:\s*\{([^}]+)\}/);
    let certification;
    if (certMatch) {
      const levelMatch = certMatch[1].match(/level:\s*['"]([^'"]+)['"]/);
      const dateMatch = certMatch[1].match(/certifiedAt:\s*['"]([^'"]+)['"]/);
      if (levelMatch) {
        certification = {
          level: levelMatch[1],
          certifiedAt: dateMatch?.[1],
        };
      }
    }

    if (idMatch && nameMatch) {
      return { id: idMatch[1], name: nameMatch[1], certification };
    }
  } catch (e) {
    // Ignore
  }

  // Fallback
  const dirName = path.basename(templatePath);
  return {
    id: dirName,
    name: dirName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  };
}

async function quickCheck(templatePath: string): Promise<QuickCheck> {
  const info = await getTemplateInfo(templatePath);

  const hasPackageJson = await fileExists(path.join(templatePath, 'package.json'));
  const hasAppJson = await fileExists(path.join(templatePath, 'app.json'));
  const hasTsConfig = await fileExists(path.join(templatePath, 'tsconfig.json'));
  const hasTests = await fileExists(path.join(templatePath, '__tests__'));
  const hasMaestro = await fileExists(path.join(templatePath, '.maestro'));
  const hasReadme = await fileExists(path.join(templatePath, 'README.md'));

  // Determine health
  let health: 'good' | 'warning' | 'error' = 'error';

  if (hasPackageJson && hasAppJson && hasTsConfig) {
    health = 'warning';
    if (hasTests && hasReadme) {
      health = 'good';
    }
  }

  return {
    id: info.id,
    name: info.name,
    hasPackageJson,
    hasAppJson,
    hasTsConfig,
    hasTests,
    hasMaestro,
    hasReadme,
    certificationLevel: info.certification?.level,
    certifiedAt: info.certification?.certifiedAt,
    health,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const detailed = args.includes('--detailed');
  const onlyIssues = args.includes('--issues');

  const templatesDir = path.join(process.cwd(), 'templates');
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });

  const templates = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.name !== 'shared')
    .filter((entry) => entry.name !== 'base')
    .map((entry) => entry.name)
    .sort();

  console.log('🔍 Quick Template Status Check');
  console.log('==============================\n');

  const checks: QuickCheck[] = [];

  for (const templateId of templates) {
    const templatePath = path.join(templatesDir, templateId);
    const check = await quickCheck(templatePath);
    checks.push(check);

    // Skip if only showing issues and this is healthy
    if (onlyIssues && check.health === 'good') continue;

    const healthIcon =
      check.health === 'good' ? '✅' :
      check.health === 'warning' ? '⚠️' : '❌';

    const certIcon =
      check.certificationLevel === 'gold' ? '🥇' :
      check.certificationLevel === 'silver' ? '🥈' :
      check.certificationLevel === 'bronze' ? '🥉' : '  ';

    console.log(`${healthIcon} ${certIcon} ${check.name.padEnd(30)} ${check.id}`);

    if (detailed) {
      const issues: string[] = [];
      if (!check.hasPackageJson) issues.push('Missing package.json');
      if (!check.hasAppJson) issues.push('Missing app.json');
      if (!check.hasTsConfig) issues.push('Missing tsconfig.json');
      if (!check.hasTests) issues.push('No tests');
      if (!check.hasMaestro) issues.push('No Maestro tests');
      if (!check.hasReadme) issues.push('No README');

      if (issues.length > 0) {
        console.log(`   Issues: ${issues.join(', ')}`);
      }

      if (check.certificationLevel) {
        const date = check.certifiedAt ? new Date(check.certifiedAt).toLocaleDateString() : 'unknown';
        console.log(`   Certified: ${check.certificationLevel} (${date})`);
      } else {
        console.log(`   Certified: Not yet certified`);
      }
      console.log('');
    }
  }

  console.log('\nSummary');
  console.log('-------');
  console.log(`Total: ${checks.length}`);
  console.log(`✅ Good: ${checks.filter(c => c.health === 'good').length}`);
  console.log(`⚠️  Warning: ${checks.filter(c => c.health === 'warning').length}`);
  console.log(`❌ Error: ${checks.filter(c => c.health === 'error').length}`);
  console.log('');

  // Certification summary
  const certified = checks.filter(c => c.certificationLevel);
  const gold = checks.filter(c => c.certificationLevel === 'gold').length;
  const silver = checks.filter(c => c.certificationLevel === 'silver').length;
  const bronze = checks.filter(c => c.certificationLevel === 'bronze').length;

  console.log('Certification Status');
  console.log('-------------------');
  console.log(`🥇 Gold: ${gold}`);
  console.log(`🥈 Silver: ${silver}`);
  console.log(`🥉 Bronze: ${bronze}`);
  console.log(`❌ Not Certified: ${checks.length - certified.length}`);
  console.log('');

  if (!onlyIssues) {
    console.log('Usage:');
    console.log('  pnpm tsx scripts/check-template-status.ts           # Quick overview');
    console.log('  pnpm tsx scripts/check-template-status.ts --detailed # Detailed view');
    console.log('  pnpm tsx scripts/check-template-status.ts --issues   # Show only issues');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
