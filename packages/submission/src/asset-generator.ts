/**
 * Asset Generator Service
 *
 * Generates app icons in all required sizes for iOS and Android
 */

import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  IconSize,
  AssetGenerationOptions,
  IconGenerationResult,
} from './types';

// ============================================================================
// ICON SIZES
// ============================================================================

/**
 * iOS icon sizes (from iOS App Icon Size Guide)
 * https://developer.apple.com/design/human-interface-guidelines/app-icons
 */
export const IOS_ICON_SIZES: IconSize[] = [
  // iPhone
  { size: 20, scale: 2, idiom: 'iphone', filename: 'icon-20@2x.png' },
  { size: 20, scale: 3, idiom: 'iphone', filename: 'icon-20@3x.png' },
  { size: 29, scale: 2, idiom: 'iphone', filename: 'icon-29@2x.png' },
  { size: 29, scale: 3, idiom: 'iphone', filename: 'icon-29@3x.png' },
  { size: 40, scale: 2, idiom: 'iphone', filename: 'icon-40@2x.png' },
  { size: 40, scale: 3, idiom: 'iphone', filename: 'icon-40@3x.png' },
  { size: 60, scale: 2, idiom: 'iphone', filename: 'icon-60@2x.png' },
  { size: 60, scale: 3, idiom: 'iphone', filename: 'icon-60@3x.png' },

  // iPad
  { size: 20, scale: 1, idiom: 'ipad', filename: 'icon-20.png' },
  { size: 20, scale: 2, idiom: 'ipad', filename: 'icon-20-ipad@2x.png' },
  { size: 29, scale: 1, idiom: 'ipad', filename: 'icon-29.png' },
  { size: 29, scale: 2, idiom: 'ipad', filename: 'icon-29-ipad@2x.png' },
  { size: 40, scale: 1, idiom: 'ipad', filename: 'icon-40.png' },
  { size: 40, scale: 2, idiom: 'ipad', filename: 'icon-40-ipad@2x.png' },
  { size: 76, scale: 1, idiom: 'ipad', filename: 'icon-76.png' },
  { size: 76, scale: 2, idiom: 'ipad', filename: 'icon-76@2x.png' },
  { size: 83.5, scale: 2, idiom: 'ipad', filename: 'icon-83.5@2x.png' },

  // App Store Marketing
  { size: 1024, scale: 1, idiom: 'ios-marketing', filename: 'icon-1024.png' },
];

/**
 * Android icon sizes (from Android Icon Design Guidelines)
 * https://developer.android.com/google-play/resources/icon-design-specifications
 */
export const ANDROID_ICON_SIZES: IconSize[] = [
  { size: 48, scale: 1, idiom: 'android', filename: 'mipmap-mdpi/ic_launcher.png' },
  { size: 72, scale: 1.5, idiom: 'android', filename: 'mipmap-hdpi/ic_launcher.png' },
  { size: 96, scale: 2, idiom: 'android', filename: 'mipmap-xhdpi/ic_launcher.png' },
  { size: 144, scale: 3, idiom: 'android', filename: 'mipmap-xxhdpi/ic_launcher.png' },
  { size: 192, scale: 4, idiom: 'android', filename: 'mipmap-xxxhdpi/ic_launcher.png' },
  { size: 512, scale: 1, idiom: 'android', filename: 'playstore-icon.png' }, // Play Store
];

// ============================================================================
// ICON GENERATION
// ============================================================================

export class AssetGenerator {
  /**
   * Generate all required app icons from a source image
   */
  async generateIcons(
    options: AssetGenerationOptions
  ): Promise<IconGenerationResult> {
    const errors: string[] = [];
    const generatedIcons: IconGenerationResult['generatedIcons'] = [];

    try {
      // Determine source logo path
      const logoPath =
        options.logoPath ||
        path.join(options.projectPath, 'assets', 'images', 'icon.png');

      // Check if source exists
      try {
        await fs.access(logoPath);
      } catch {
        // If no custom logo, generate a placeholder
        await this.generatePlaceholderIcon(
          logoPath,
          options.primaryColor || '#007AFF',
          options.backgroundColor || '#FFFFFF'
        );
      }

      // Create iOS icons
      const iosOutputDir = path.join(options.projectPath, 'assets', 'images', 'ios');
      await fs.mkdir(iosOutputDir, { recursive: true });

      for (const iconSpec of IOS_ICON_SIZES) {
        try {
          const outputPath = path.join(iosOutputDir, iconSpec.filename);
          const actualSize = Math.round(iconSpec.size * iconSpec.scale);

          await sharp(logoPath)
            .resize(actualSize, actualSize, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .png()
            .toFile(outputPath);

          generatedIcons.push({
            path: outputPath,
            size: actualSize,
            platform: 'ios',
          });
        } catch (error: any) {
          errors.push(`Failed to generate ${iconSpec.filename}: ${error.message}`);
        }
      }

      // Create Android icons
      const androidOutputDir = path.join(
        options.projectPath,
        'android',
        'app',
        'src',
        'main',
        'res'
      );
      await fs.mkdir(androidOutputDir, { recursive: true });

      for (const iconSpec of ANDROID_ICON_SIZES) {
        try {
          const outputPath = path.join(androidOutputDir, iconSpec.filename);
          await fs.mkdir(path.dirname(outputPath), { recursive: true });

          await sharp(logoPath)
            .resize(iconSpec.size, iconSpec.size, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .png()
            .toFile(outputPath);

          generatedIcons.push({
            path: outputPath,
            size: iconSpec.size,
            platform: 'android',
          });
        } catch (error: any) {
          errors.push(`Failed to generate ${iconSpec.filename}: ${error.message}`);
        }
      }

      // Generate Contents.json for iOS
      await this.generateContentsJson(iosOutputDir);

      return {
        success: errors.length === 0,
        generatedIcons,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        generatedIcons: [],
        errors: [error.message],
      };
    }
  }

  /**
   * Generate a simple placeholder icon
   */
  private async generatePlaceholderIcon(
    outputPath: string,
    primaryColor: string,
    backgroundColor: string
  ): Promise<void> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Create a simple colored square with rounded corners
    const size = 1024;
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="200"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${primaryColor}"/>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
  }

  /**
   * Generate Contents.json for iOS App Icons
   */
  private async generateContentsJson(outputDir: string): Promise<void> {
    const contents = {
      images: IOS_ICON_SIZES.map((iconSpec) => ({
        size: `${iconSpec.size}x${iconSpec.size}`,
        idiom: iconSpec.idiom,
        filename: iconSpec.filename,
        scale: `${iconSpec.scale}x`,
      })),
      info: {
        version: 1,
        author: 'mobigen',
      },
    };

    await fs.writeFile(
      path.join(outputDir, 'Contents.json'),
      JSON.stringify(contents, null, 2)
    );
  }

  /**
   * Validate icon requirements
   */
  async validateIcons(projectPath: string): Promise<{
    valid: boolean;
    missing: string[];
    invalid: string[];
  }> {
    const missing: string[] = [];
    const invalid: string[] = [];

    // Check iOS icons
    for (const iconSpec of IOS_ICON_SIZES) {
      const iconPath = path.join(
        projectPath,
        'assets',
        'images',
        'ios',
        iconSpec.filename
      );

      try {
        const stats = await fs.stat(iconPath);
        if (!stats.isFile()) {
          missing.push(iconSpec.filename);
          continue;
        }

        // Validate dimensions
        const metadata = await sharp(iconPath).metadata();
        const expectedSize = Math.round(iconSpec.size * iconSpec.scale);

        if (metadata.width !== expectedSize || metadata.height !== expectedSize) {
          invalid.push(
            `${iconSpec.filename} (expected ${expectedSize}x${expectedSize}, got ${metadata.width}x${metadata.height})`
          );
        }
      } catch {
        missing.push(iconSpec.filename);
      }
    }

    // Check Android icons
    for (const iconSpec of ANDROID_ICON_SIZES) {
      const iconPath = path.join(
        projectPath,
        'android',
        'app',
        'src',
        'main',
        'res',
        iconSpec.filename
      );

      try {
        const stats = await fs.stat(iconPath);
        if (!stats.isFile()) {
          missing.push(iconSpec.filename);
          continue;
        }

        // Validate dimensions
        const metadata = await sharp(iconPath).metadata();

        if (metadata.width !== iconSpec.size || metadata.height !== iconSpec.size) {
          invalid.push(
            `${iconSpec.filename} (expected ${iconSpec.size}x${iconSpec.size}, got ${metadata.width}x${metadata.height})`
          );
        }
      } catch {
        missing.push(iconSpec.filename);
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
    };
  }

  /**
   * Get icon size requirements documentation
   */
  getIconSizeRequirements(): {
    ios: IconSize[];
    android: IconSize[];
  } {
    return {
      ios: IOS_ICON_SIZES,
      android: ANDROID_ICON_SIZES,
    };
  }
}

// Export singleton instance
export const assetGenerator = new AssetGenerator();
