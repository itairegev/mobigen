#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';

const rootDir = process.cwd();
const templatesDir = path.join(rootDir, 'templates');

async function createPlaceholderAssets(templatePath: string): Promise<void> {
  const templateName = path.basename(templatePath);
  const assetsDir = path.join(templatePath, 'assets');

  // Try to find sharp in the template's node_modules
  const sharpPath = path.join(templatePath, 'node_modules', 'sharp');
  if (!fs.existsSync(sharpPath)) {
    console.log(`${templateName}: No sharp, skipping`);
    return;
  }

  // Load sharp from template's node_modules using absolute path
  const sharp = require(sharpPath);

  async function createPlaceholder(
    filename: string,
    width: number,
    height: number,
    color: string = '#0d9488'
  ): Promise<void> {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="white" font-family="Arial" font-size="${Math.min(width, height) / 6}">
        Mobigen
      </text>
    </svg>`;

    await sharp(Buffer.from(svg)).png().toFile(path.join(assetsDir, filename));
  }

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const existingFiles = fs.readdirSync(assetsDir);
  let created = 0;

  if (!existingFiles.includes('icon.png')) {
    await createPlaceholder('icon.png', 1024, 1024);
    created++;
  }
  if (!existingFiles.includes('adaptive-icon.png')) {
    await createPlaceholder('adaptive-icon.png', 1024, 1024);
    created++;
  }
  if (!existingFiles.includes('splash.png')) {
    await createPlaceholder('splash.png', 1242, 2436);
    created++;
  }
  if (!existingFiles.includes('favicon.png')) {
    await createPlaceholder('favicon.png', 48, 48);
    created++;
  }

  if (created > 0) {
    console.log(`${templateName}: Created ${created} asset(s)`);
  } else {
    console.log(`${templateName}: Assets already exist`);
  }
}

async function main(): Promise<void> {
  console.log('🖼️  Generating placeholder assets for all templates...\n');

  const templates = fs.readdirSync(templatesDir).filter((name) => {
    const fullPath = path.join(templatesDir, name);
    return (
      fs.statSync(fullPath).isDirectory() &&
      name !== 'shared' &&
      name !== 'base' &&
      fs.existsSync(path.join(fullPath, 'package.json'))
    );
  });

  let successCount = 0;
  let skipCount = 0;

  for (const template of templates) {
    try {
      await createPlaceholderAssets(path.join(templatesDir, template));
      successCount++;
    } catch (error) {
      console.log(`${template}: Error - ${error}`);
      skipCount++;
    }
  }

  console.log(`\n✅ Done! ${successCount} templates processed, ${skipCount} skipped.`);
}

main().catch(console.error);
