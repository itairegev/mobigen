/**
 * Screenshot Service
 *
 * Handles screenshot generation and requirements for app store submissions
 */

import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { ScreenshotSpec, ScreenshotGenerationResult } from './types';

// ============================================================================
// SCREENSHOT SPECIFICATIONS
// ============================================================================

/**
 * iOS screenshot sizes (App Store Connect requirements)
 * https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
 */
export const IOS_SCREENSHOT_SPECS: ScreenshotSpec[] = [
  // iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
  { width: 1290, height: 2796, platform: 'ios', deviceType: '6.7inch', required: true },

  // iPhone 6.5" (iPhone XS Max, 11 Pro Max, 12 Pro Max, 13 Pro Max)
  { width: 1242, height: 2688, platform: 'ios', deviceType: '6.5inch', required: true },

  // iPhone 5.5" (iPhone 6s Plus, 7 Plus, 8 Plus)
  { width: 1242, height: 2208, platform: 'ios', deviceType: '5.5inch', required: false },

  // iPad Pro 12.9" (2nd gen and later)
  { width: 2048, height: 2732, platform: 'ios', deviceType: '12.9inch-ipad', required: false },

  // iPad Pro 11" (all gen)
  { width: 1668, height: 2388, platform: 'ios', deviceType: '11inch-ipad', required: false },
];

/**
 * Android screenshot sizes (Google Play Console requirements)
 * https://support.google.com/googleplay/android-developer/answer/9866151
 */
export const ANDROID_SCREENSHOT_SPECS: ScreenshotSpec[] = [
  // Phone - minimum 2 required
  { width: 1080, height: 1920, platform: 'android', deviceType: 'phone', required: true },
  { width: 1440, height: 2560, platform: 'android', deviceType: 'phone-xl', required: false },

  // 7-inch tablet - optional
  { width: 1200, height: 1920, platform: 'android', deviceType: '7inch-tablet', required: false },

  // 10-inch tablet - optional
  { width: 1600, height: 2560, platform: 'android', deviceType: '10inch-tablet', required: false },
];

// ============================================================================
// SCREENSHOT SERVICE
// ============================================================================

export class ScreenshotService {
  /**
   * Get screenshot requirements for a platform
   */
  getRequirements(platform: 'ios' | 'android' | 'both'): ScreenshotSpec[] {
    if (platform === 'ios') {
      return IOS_SCREENSHOT_SPECS;
    } else if (platform === 'android') {
      return ANDROID_SCREENSHOT_SPECS;
    } else {
      return [...IOS_SCREENSHOT_SPECS, ...ANDROID_SCREENSHOT_SPECS];
    }
  }

  /**
   * Generate screenshot templates
   *
   * Creates placeholder screenshots in the correct sizes with guidelines
   */
  async generateTemplates(
    projectPath: string,
    platform: 'ios' | 'android' | 'both'
  ): Promise<ScreenshotGenerationResult> {
    const errors: string[] = [];
    const generatedScreenshots: ScreenshotGenerationResult['generatedScreenshots'] =
      [];

    try {
      const specs = this.getRequirements(platform);

      for (const spec of specs) {
        try {
          const outputDir = path.join(
            projectPath,
            'screenshots',
            spec.platform,
            spec.deviceType
          );
          await fs.mkdir(outputDir, { recursive: true });

          // Generate 5 placeholder screenshots per device type
          for (let i = 1; i <= 5; i++) {
            const outputPath = path.join(outputDir, `screenshot-${i}.png`);

            await this.generatePlaceholderScreenshot(
              outputPath,
              spec.width,
              spec.height,
              `${spec.deviceType} - Screenshot ${i}`,
              spec.required
            );

            generatedScreenshots.push({
              path: outputPath,
              width: spec.width,
              height: spec.height,
              platform: spec.platform,
              deviceType: spec.deviceType,
            });
          }
        } catch (error: any) {
          errors.push(
            `Failed to generate templates for ${spec.deviceType}: ${error.message}`
          );
        }
      }

      // Generate README with instructions
      await this.generateReadme(projectPath, platform);

      return {
        success: errors.length === 0,
        generatedScreenshots,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        generatedScreenshots: [],
        errors: [error.message],
      };
    }
  }

  /**
   * Generate a placeholder screenshot with guidelines
   */
  private async generatePlaceholderScreenshot(
    outputPath: string,
    width: number,
    height: number,
    label: string,
    required: boolean
  ): Promise<void> {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#f8f9fa"/>

        <!-- Border -->
        <rect x="10" y="10" width="${width - 20}" height="${height - 20}"
              fill="none" stroke="${required ? '#007AFF' : '#8E8E93'}"
              stroke-width="4" stroke-dasharray="20,10"/>

        <!-- Label -->
        <text x="${width / 2}" y="${height / 2 - 40}"
              font-family="Arial, sans-serif"
              font-size="48"
              fill="#1c1c1e"
              text-anchor="middle"
              font-weight="bold">
          ${label}
        </text>

        <!-- Dimensions -->
        <text x="${width / 2}" y="${height / 2 + 20}"
              font-family="Arial, sans-serif"
              font-size="32"
              fill="#48484a"
              text-anchor="middle">
          ${width} × ${height}
        </text>

        <!-- Required indicator -->
        ${
          required
            ? `
        <text x="${width / 2}" y="${height / 2 + 60}"
              font-family="Arial, sans-serif"
              font-size="24"
              fill="#007AFF"
              text-anchor="middle"
              font-weight="bold">
          REQUIRED
        </text>
        `
            : ''
        }

        <!-- Instructions -->
        <text x="${width / 2}" y="${height - 60}"
              font-family="Arial, sans-serif"
              font-size="20"
              fill="#8e8e93"
              text-anchor="middle">
          Replace this with actual app screenshot
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg)).png().toFile(outputPath);
  }

  /**
   * Generate README with screenshot guidelines
   */
  private async generateReadme(
    projectPath: string,
    platform: 'ios' | 'android' | 'both'
  ): Promise<void> {
    const readmePath = path.join(projectPath, 'screenshots', 'README.md');

    const content = `# App Store Screenshots

This directory contains templates for your app store screenshots.

## Instructions

1. **Take screenshots** of your app on the required device sizes
2. **Replace the placeholder files** in each directory with your actual screenshots
3. **Name them sequentially**: screenshot-1.png, screenshot-2.png, etc.
4. **Ensure correct dimensions** for each device type

## Requirements

### iOS (App Store Connect)

You need at least **2 screenshots** for the following devices:
- **6.7" iPhone** (1290 × 2796) - REQUIRED
- **6.5" iPhone** (1242 × 2688) - REQUIRED

Optional:
- 5.5" iPhone (1242 × 2208)
- 12.9" iPad Pro (2048 × 2732)
- 11" iPad Pro (1668 × 2388)

### Android (Google Play Console)

You need at least **2 screenshots** for:
- **Phone** (1080 × 1920 minimum) - REQUIRED

Optional:
- 7" Tablet (1200 × 1920)
- 10" Tablet (1600 × 2560)

## Tips

- **Show key features**: Highlight what makes your app unique
- **Use real content**: Avoid lorem ipsum or placeholder data
- **Keep it clean**: Remove any debug overlays or development artifacts
- **Localize**: Provide screenshots in all supported languages
- **Portrait orientation**: Most effective for app stores
- **Text overlay**: Add captions to explain features (optional but recommended)

## Tools

- **iOS**: Use Xcode Simulator or physical device
- **Android**: Use Android Studio Emulator or physical device
- **Design tools**: Figma, Sketch, or Adobe XD for adding captions

## Resources

- [iOS Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)
- [Android Screenshot Specifications](https://support.google.com/googleplay/android-developer/answer/9866151)
`;

    await fs.writeFile(readmePath, content);
  }

  /**
   * Validate screenshots meet requirements
   */
  async validateScreenshots(
    projectPath: string,
    platform: 'ios' | 'android'
  ): Promise<{
    valid: boolean;
    missing: Array<{ deviceType: string; required: boolean }>;
    invalid: Array<{ path: string; reason: string }>;
  }> {
    const missing: Array<{ deviceType: string; required: boolean }> = [];
    const invalid: Array<{ path: string; reason: string }> = [];

    const specs = this.getRequirements(platform);

    for (const spec of specs) {
      const screenshotDir = path.join(
        projectPath,
        'screenshots',
        spec.platform,
        spec.deviceType
      );

      try {
        const files = await fs.readdir(screenshotDir);
        const screenshots = files.filter((f) => f.endsWith('.png') || f.endsWith('.jpg'));

        if (screenshots.length < 2 && spec.required) {
          missing.push({
            deviceType: spec.deviceType,
            required: spec.required,
          });
          continue;
        }

        // Validate dimensions
        for (const screenshot of screenshots.slice(0, 5)) {
          const screenshotPath = path.join(screenshotDir, screenshot);
          const metadata = await sharp(screenshotPath).metadata();

          if (metadata.width !== spec.width || metadata.height !== spec.height) {
            invalid.push({
              path: screenshotPath,
              reason: `Invalid dimensions (expected ${spec.width}×${spec.height}, got ${metadata.width}×${metadata.height})`,
            });
          }
        }
      } catch {
        if (spec.required) {
          missing.push({
            deviceType: spec.deviceType,
            required: spec.required,
          });
        }
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
    };
  }

  /**
   * Get screenshot size requirements as formatted text
   */
  getRequirementsText(platform: 'ios' | 'android'): string {
    const specs = this.getRequirements(platform);
    const required = specs.filter((s) => s.required);
    const optional = specs.filter((s) => !s.required);

    let text = `${platform.toUpperCase()} Screenshot Requirements:\n\n`;

    text += 'REQUIRED:\n';
    for (const spec of required) {
      text += `  - ${spec.deviceType}: ${spec.width} × ${spec.height}\n`;
    }

    if (optional.length > 0) {
      text += '\nOPTIONAL:\n';
      for (const spec of optional) {
        text += `  - ${spec.deviceType}: ${spec.width} × ${spec.height}\n`;
      }
    }

    return text;
  }
}

// Export singleton instance
export const screenshotService = new ScreenshotService();
