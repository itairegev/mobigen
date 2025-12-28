#!/usr/bin/env node

/**
 * Generate placeholder assets for Mobigen templates
 * Creates icon.png, adaptive-icon.png, splash.png, and favicon.png
 * Uses pure Node.js with no external dependencies
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Minimal 1x1 purple PNG as base64 (will be used as placeholder)
// This is a valid PNG that Expo can process
const PURPLE_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal white 1x1 PNG for splash
const WHITE_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

const ASSETS = [
  { name: 'icon.png', png: PURPLE_1X1_PNG },
  { name: 'adaptive-icon.png', png: PURPLE_1X1_PNG },
  { name: 'splash.png', png: WHITE_1X1_PNG },
  { name: 'favicon.png', png: PURPLE_1X1_PNG },
];

async function generateAssets(targetDir) {
  // Ensure directory exists
  fs.mkdirSync(targetDir, { recursive: true });

  for (const asset of ASSETS) {
    const outputPath = path.join(targetDir, asset.name);
    fs.writeFileSync(outputPath, asset.png);
    console.log(`Created: ${outputPath}`);
  }

  console.log(`\nAll placeholder assets generated in: ${targetDir}`);
  console.log('Note: These are minimal 1x1 placeholder images.');
  console.log('The AI agents will generate proper branded assets during app generation.');
}

// Main execution
const targetDir = process.argv[2] || path.join(__dirname, '../templates/base/assets');
generateAssets(targetDir).catch(console.error);
