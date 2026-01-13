/**
 * Template Screenshot Generation Script
 *
 * Generates pre-rendered screenshots for all template screens
 * Saves them to the public assets directory for instant mockup rendering
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getScreenshotService } from './screenshot-service';
import { ecommerceManifest, loyaltyManifest } from './manifests';
import type { MockupManifest } from '@mobigen/ui/mockup';

const MANIFESTS = [ecommerceManifest, loyaltyManifest];

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'mockups');

const DEFAULT_BRANDING = {
  appName: 'My App',
  primaryColor: '#0EA5E9',
  secondaryColor: '#0284C7',
  accentColor: '#38BDF8',
};

/**
 * Generate screenshots for all templates
 */
export async function generateAllScreenshots(): Promise<void> {
  console.log('🎨 Starting template screenshot generation...\n');

  const service = getScreenshotService();

  try {
    await service.initialize();

    for (const manifest of MANIFESTS) {
      console.log(`📱 Generating screenshots for ${manifest.templateId}...`);

      const templateDir = path.join(OUTPUT_DIR, manifest.templateId);
      await fs.mkdir(templateDir, { recursive: true });

      // Generate screenshots for each screen
      for (const screen of manifest.screens) {
        console.log(`  ⏳ Rendering ${screen.id}...`);

        try {
          const result = await service.captureScreen({
            device: 'iphone-15-pro',
            screen,
            branding: {
              ...DEFAULT_BRANDING,
              primaryColor: manifest.branding.defaultPrimaryColor,
              secondaryColor: manifest.branding.defaultSecondaryColor,
              accentColor: manifest.branding.defaultAccentColor,
            },
            width: 393,
            height: 852,
            scale: 2,
            format: 'png',
            quality: 90,
          });

          // Save screenshot
          const filename = `${screen.id}.png`;
          const filepath = path.join(templateDir, filename);
          await fs.writeFile(filepath, result.buffer);

          console.log(`  ✅ Saved ${filename} (${(result.size / 1024).toFixed(1)}KB)`);
        } catch (error) {
          console.error(`  ❌ Failed to generate ${screen.id}:`, error);
        }
      }

      console.log(`\n✨ Completed ${manifest.templateId}\n`);
    }

    console.log('🎉 All screenshots generated successfully!');
  } catch (error) {
    console.error('❌ Screenshot generation failed:', error);
    throw error;
  } finally {
    await service.close();
  }
}

/**
 * Generate screenshots for a single template
 */
export async function generateTemplateScreenshots(
  templateId: string
): Promise<void> {
  const manifest = MANIFESTS.find(m => m.templateId === templateId);

  if (!manifest) {
    throw new Error(`Template ${templateId} not found`);
  }

  const service = getScreenshotService();

  try {
    await service.initialize();

    const templateDir = path.join(OUTPUT_DIR, templateId);
    await fs.mkdir(templateDir, { recursive: true });

    for (const screen of manifest.screens) {
      const result = await service.captureScreen({
        device: 'iphone-15-pro',
        screen,
        branding: {
          ...DEFAULT_BRANDING,
          primaryColor: manifest.branding.defaultPrimaryColor,
          secondaryColor: manifest.branding.defaultSecondaryColor,
          accentColor: manifest.branding.defaultAccentColor,
        },
        width: 393,
        height: 852,
        scale: 2,
        format: 'png',
      });

      const filename = `${screen.id}.png`;
      const filepath = path.join(templateDir, filename);
      await fs.writeFile(filepath, result.buffer);
    }
  } finally {
    await service.close();
  }
}

/**
 * Get manifest metadata for all templates
 */
export function getManifestMetadata(): Array<{
  id: string;
  version: string;
  screenCount: number;
  navigationTabs: number;
}> {
  return MANIFESTS.map(manifest => ({
    id: manifest.templateId,
    version: manifest.version,
    screenCount: manifest.screens.length,
    navigationTabs: manifest.navigation.tabs?.length || 0,
  }));
}

// CLI execution
if (require.main === module) {
  generateAllScreenshots()
    .then(() => {
      console.log('\n📊 Summary:');
      console.log(`  Templates: ${MANIFESTS.length}`);
      console.log(
        `  Total screens: ${MANIFESTS.reduce((sum, m) => sum + m.screens.length, 0)}`
      );
      console.log(`  Output directory: ${OUTPUT_DIR}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Generation failed:', error);
      process.exit(1);
    });
}
