#!/usr/bin/env tsx

/**
 * Template Structure Analyzer
 *
 * Analyzes all templates and reports their readiness for certification
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface TemplateAnalysis {
  id: string;
  name: string;
  hasPackageJson: boolean;
  hasAppJson: boolean;
  hasTsConfig: boolean;
  hasSrcDir: boolean;
  hasTests: boolean;
  hasMaestro: boolean;
  hasTemplateConfig: boolean;
  screenCount: number;
  componentCount: number;
  estimatedReadiness: 'ready' | 'needs-work' | 'incomplete';
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function countFilesInDir(dirPath: string, pattern: RegExp): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: false });
    return entries.filter(e => e.isFile() && pattern.test(e.name)).length;
  } catch {
    return 0;
  }
}

async function countDirsInDir(dirPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).length;
  } catch {
    return 0;
  }
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

async function analyzeTemplate(templatePath: string): Promise<TemplateAnalysis> {
  const info = await getTemplateInfo(templatePath);

  const hasPackageJson = await fileExists(path.join(templatePath, 'package.json'));
  const hasAppJson = await fileExists(path.join(templatePath, 'app.json'));
  const hasTsConfig = await fileExists(path.join(templatePath, 'tsconfig.json'));
  const hasSrcDir = await fileExists(path.join(templatePath, 'src'));
  const hasTests = await fileExists(path.join(templatePath, '__tests__'));
  const hasMaestro = await fileExists(path.join(templatePath, '.maestro'));

  const hasTemplateConfig =
    await fileExists(path.join(templatePath, 'template.json')) ||
    await fileExists(path.join(templatePath, 'template.config.ts'));

  // Count screens (app directory structure for Expo Router)
  const appDirPath = path.join(templatePath, 'app');
  let screenCount = 0;
  try {
    const entries = await fs.readdir(appDirPath, { withFileTypes: true, recursive: true });
    screenCount = entries.filter(e =>
      e.isFile() &&
      (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) &&
      !e.name.startsWith('_')
    ).length;
  } catch {
    // Try src/screens if app doesn't exist
    const screensPath = path.join(templatePath, 'src', 'screens');
    screenCount = await countDirsInDir(screensPath);
  }

  // Count components
  const componentsPath = path.join(templatePath, 'src', 'components');
  const componentCount = await countDirsInDir(componentsPath);

  // Estimate readiness
  let estimatedReadiness: 'ready' | 'needs-work' | 'incomplete' = 'incomplete';

  if (hasPackageJson && hasAppJson && hasTsConfig && hasSrcDir) {
    if (screenCount >= 3 && componentCount >= 2) {
      estimatedReadiness = 'ready';
    } else {
      estimatedReadiness = 'needs-work';
    }
  }

  return {
    id: info.id,
    name: info.name,
    hasPackageJson,
    hasAppJson,
    hasTsConfig,
    hasSrcDir,
    hasTests,
    hasMaestro,
    hasTemplateConfig,
    screenCount,
    componentCount,
    estimatedReadiness,
  };
}

async function main() {
  const templatesDir = path.join(process.cwd(), 'templates');
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });

  const templates = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.name !== 'shared')
    .filter((entry) => entry.name !== 'base')
    .map((entry) => entry.name)
    .sort();

  console.log('📊 Mobigen Template Analysis');
  console.log('============================\n');

  const analyses: TemplateAnalysis[] = [];

  for (const templateId of templates) {
    const templatePath = path.join(templatesDir, templateId);
    const analysis = await analyzeTemplate(templatePath);
    analyses.push(analysis);

    const status =
      analysis.estimatedReadiness === 'ready' ? '✅' :
      analysis.estimatedReadiness === 'needs-work' ? '⚠️' : '❌';

    console.log(`${status} ${analysis.name}`);
    console.log(`   Screens: ${analysis.screenCount}, Components: ${analysis.componentCount}`);
    console.log(`   Tests: ${analysis.hasTests ? 'Yes' : 'No'}, Maestro: ${analysis.hasMaestro ? 'Yes' : 'No'}`);
  }

  console.log('\n');
  console.log('Summary');
  console.log('-------');
  console.log(`Total Templates: ${analyses.length}`);
  console.log(`✅ Ready: ${analyses.filter(a => a.estimatedReadiness === 'ready').length}`);
  console.log(`⚠️  Needs Work: ${analyses.filter(a => a.estimatedReadiness === 'needs-work').length}`);
  console.log(`❌ Incomplete: ${analyses.filter(a => a.estimatedReadiness === 'incomplete').length}`);
  console.log('');

  // Write to JSON
  const outputPath = path.join(process.cwd(), 'docs', 'template-analysis.json');
  await fs.writeFile(outputPath, JSON.stringify(analyses, null, 2), 'utf-8');
  console.log(`📄 Analysis saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
