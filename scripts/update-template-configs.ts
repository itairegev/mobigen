#!/usr/bin/env tsx

/**
 * Update Template Configurations with Certification Status
 *
 * Adds certification metadata to template.json or template.config.ts files
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface CertificationStatus {
  level: 'gold' | 'silver' | 'bronze' | 'none';
  certifiedAt: string;
  lastChecked: string;
  notes?: string;
}

async function updateTemplateJson(
  templatePath: string,
  certification: CertificationStatus
): Promise<void> {
  const jsonPath = path.join(templatePath, 'template.json');

  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    // Add or update certification field
    data.certification = certification;

    // Write back with pretty formatting
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✅ Updated ${data.id}/template.json`);
  } catch (error) {
    console.error(`❌ Failed to update template.json: ${error}`);
  }
}

async function updateTemplateConfigTs(
  templatePath: string,
  certification: CertificationStatus
): Promise<void> {
  const configPath = path.join(templatePath, 'template.config.ts');

  try {
    const content = await fs.readFile(configPath, 'utf-8');

    // Check if certification already exists
    const hasCertification = content.includes('certification:');

    let updatedContent: string;

    if (hasCertification) {
      // Replace existing certification
      updatedContent = content.replace(
        /certification:\s*\{[^}]*\}/,
        `certification: ${JSON.stringify(certification, null, 2).replace(/\n/g, '\n  ')}`
      );
    } else {
      // Add certification before closing brace
      const certificationField = `  certification: ${JSON.stringify(certification, null, 2).replace(/\n/g, '\n  ')},`;

      updatedContent = content.replace(
        /(\};?\s*)$/,
        `\n${certificationField}\n$1`
      );
    }

    await fs.writeFile(configPath, updatedContent, 'utf-8');
    console.log(`✅ Updated template.config.ts`);
  } catch (error) {
    console.error(`❌ Failed to update template.config.ts: ${error}`);
  }
}

async function updateTemplate(
  templatePath: string,
  certification: CertificationStatus
): Promise<void> {
  const templateId = path.basename(templatePath);
  console.log(`\nUpdating ${templateId}...`);

  // Check which config file exists
  const hasJson = await fs.access(path.join(templatePath, 'template.json'))
    .then(() => true)
    .catch(() => false);

  const hasConfigTs = await fs.access(path.join(templatePath, 'template.config.ts'))
    .then(() => true)
    .catch(() => false);

  if (hasJson) {
    await updateTemplateJson(templatePath, certification);
  } else if (hasConfigTs) {
    await updateTemplateConfigTs(templatePath, certification);
  } else {
    console.log(`⚠️  No template config file found`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const level = args.find(arg => arg.startsWith('--level='))?.split('=')[1] as CertificationStatus['level'] || 'none';
  const templateFilter = args.find(arg => arg.startsWith('--template='))?.split('=')[1];
  const notes = args.find(arg => arg.startsWith('--notes='))?.split('=')[1];

  const now = new Date().toISOString();

  const certification: CertificationStatus = {
    level,
    certifiedAt: now,
    lastChecked: now,
    ...(notes && { notes }),
  };

  console.log('🎖️  Updating Template Certification Status');
  console.log('==========================================');
  console.log(`Level: ${level}`);
  console.log(`Date: ${now}`);
  if (notes) console.log(`Notes: ${notes}`);
  console.log('');

  const templatesDir = path.join(process.cwd(), 'templates');

  if (templateFilter) {
    // Update single template
    const templatePath = path.join(templatesDir, templateFilter);
    await updateTemplate(templatePath, certification);
  } else {
    // Update all templates
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });

    const templates = entries
      .filter((entry) => entry.isDirectory())
      .filter((entry) => !entry.name.startsWith('.'))
      .filter((entry) => entry.name !== 'shared')
      .filter((entry) => entry.name !== 'base')
      .map((entry) => entry.name)
      .sort();

    for (const templateId of templates) {
      const templatePath = path.join(templatesDir, templateId);
      await updateTemplate(templatePath, certification);
    }
  }

  console.log('\n✅ Template config updates complete');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
