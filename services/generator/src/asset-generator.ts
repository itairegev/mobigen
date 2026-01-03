/**
 * Asset generator for white-label branding
 * Generates app icons and splash screens from source images
 *
 * NOTE: This module requires the 'canvas' package which has native dependencies.
 * If canvas is not installed, asset generation will be disabled but the service
 * will still start. Run `pnpm rebuild canvas` to enable asset generation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  BrandConfig,
  GeneratedAssets,
  AssetFile,
} from './white-label-types';
import {
  IOS_ICON_SIZES,
  ANDROID_ICON_SIZES,
  SPLASH_SIZES,
} from './white-label-types';

// Lazy-loaded canvas module
let canvasModule: typeof import('canvas') | null = null;
let canvasLoadError: Error | null = null;

/**
 * Attempt to load canvas module
 * Returns null if canvas is not available
 */
async function getCanvas(): Promise<typeof import('canvas') | null> {
  if (canvasModule) return canvasModule;
  if (canvasLoadError) return null;

  try {
    canvasModule = await import('canvas');
    return canvasModule;
  } catch (error) {
    canvasLoadError = error as Error;
    console.warn(
      '[AssetGenerator] Canvas module not available. Asset generation disabled.',
      'Run `pnpm rebuild canvas` to enable.'
    );
    return null;
  }
}

/**
 * Check if canvas is available
 */
export async function isCanvasAvailable(): Promise<boolean> {
  const canvas = await getCanvas();
  return canvas !== null;
}

export class AssetGenerator {
  private workDir: string;

  constructor(workDir: string) {
    this.workDir = workDir;
  }

  /**
   * Generate all assets (icons and splash screens) from brand config
   */
  async generateAssets(brandConfig: BrandConfig): Promise<GeneratedAssets> {
    const canvas = await getCanvas();
    if (!canvas) {
      throw new Error(
        'Canvas module is not available. Asset generation requires the canvas package.\n' +
        'To fix: Run `pnpm rebuild canvas` or `npm rebuild canvas`\n' +
        'On macOS, you may need: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`'
      );
    }

    const assets: GeneratedAssets = {
      icons: { ios: [], android: [] },
      splash: { ios: [], android: [] },
    };

    // Load source logo
    const logoImage = await this.loadImageFromSource(
      brandConfig.branding.logo.light,
      canvas
    );

    // Generate iOS icons
    assets.icons.ios = await this.generateIOSIcons(logoImage, canvas);

    // Generate Android adaptive icons
    assets.icons.android = await this.generateAndroidIcons(logoImage, canvas);

    // Generate splash screens
    if (brandConfig.branding.splash.image) {
      const splashImage = await this.loadImageFromSource(
        brandConfig.branding.splash.image,
        canvas
      );
      assets.splash.ios = await this.generateIOSSplash(
        splashImage,
        brandConfig.branding.splash.backgroundColor,
        canvas
      );
      assets.splash.android = await this.generateAndroidSplash(
        splashImage,
        brandConfig.branding.splash.backgroundColor,
        canvas
      );
    } else {
      // Generate solid color splash with logo
      assets.splash.ios = await this.generateIOSSplash(
        logoImage,
        brandConfig.branding.splash.backgroundColor,
        canvas
      );
      assets.splash.android = await this.generateAndroidSplash(
        logoImage,
        brandConfig.branding.splash.backgroundColor,
        canvas
      );
    }

    return assets;
  }

  /**
   * Load image from URL or base64 string
   */
  private async loadImageFromSource(
    source: string,
    canvas: typeof import('canvas')
  ): Promise<import('canvas').Image> {
    const { loadImage } = canvas;

    if (source.startsWith('data:')) {
      // Base64 image
      const base64Data = source.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      return await loadImage(buffer);
    } else if (source.startsWith('http://') || source.startsWith('https://')) {
      // URL - download and load
      const response = await fetch(source);
      const buffer = Buffer.from(await response.arrayBuffer());
      return await loadImage(buffer);
    } else {
      // File path
      return await loadImage(source);
    }
  }

  /**
   * Generate iOS app icons in all required sizes
   */
  private async generateIOSIcons(
    sourceImage: import('canvas').Image,
    canvas: typeof import('canvas')
  ): Promise<AssetFile[]> {
    const icons: AssetFile[] = [];
    const iconsDir = path.join(this.workDir, 'assets', 'icons', 'ios');
    await fs.mkdir(iconsDir, { recursive: true });

    for (const { size, scales } of IOS_ICON_SIZES) {
      for (const scale of scales) {
        const pixelSize = size * scale;
        const filename = `icon-${size}@${scale}x.png`;
        const filePath = path.join(iconsDir, filename);

        await this.resizeAndSaveImage(sourceImage, pixelSize, pixelSize, filePath, canvas);

        icons.push({
          path: path.relative(this.workDir, filePath),
          size: { width: pixelSize, height: pixelSize },
          format: 'png',
          purpose: `iOS icon ${size}pt @${scale}x`,
        });
      }
    }

    return icons;
  }

  /**
   * Generate Android adaptive icons
   * Requires foreground and background layers
   */
  private async generateAndroidIcons(
    sourceImage: import('canvas').Image,
    canvas: typeof import('canvas')
  ): Promise<AssetFile[]> {
    const icons: AssetFile[] = [];
    const iconsDir = path.join(this.workDir, 'assets', 'icons', 'android');
    await fs.mkdir(iconsDir, { recursive: true });

    // Android adaptive icons need foreground and background
    // We'll create the foreground from the logo and a transparent background
    for (const [density, size] of Object.entries(ANDROID_ICON_SIZES)) {
      // Foreground layer (logo with padding)
      const foregroundPath = path.join(
        iconsDir,
        `mipmap-${density}`,
        'ic_launcher_foreground.png'
      );
      await fs.mkdir(path.dirname(foregroundPath), { recursive: true });
      await this.resizeAndSaveImage(sourceImage, size, size, foregroundPath, canvas, 0.8); // 80% size for padding

      icons.push({
        path: path.relative(this.workDir, foregroundPath),
        size: { width: size, height: size },
        format: 'png',
        purpose: `Android foreground ${density}`,
      });

      // Background layer (solid color or transparent)
      const backgroundPath = path.join(
        iconsDir,
        `mipmap-${density}`,
        'ic_launcher_background.png'
      );
      await this.createSolidColorImage(size, size, '#FFFFFF', backgroundPath, canvas);

      icons.push({
        path: path.relative(this.workDir, backgroundPath),
        size: { width: size, height: size },
        format: 'png',
        purpose: `Android background ${density}`,
      });

      // Also create legacy round icon
      const roundPath = path.join(
        iconsDir,
        `mipmap-${density}`,
        'ic_launcher_round.png'
      );
      await this.resizeAndSaveImage(sourceImage, size, size, roundPath, canvas);

      icons.push({
        path: path.relative(this.workDir, roundPath),
        size: { width: size, height: size },
        format: 'png',
        purpose: `Android round ${density}`,
      });
    }

    return icons;
  }

  /**
   * Generate iOS splash screens
   */
  private async generateIOSSplash(
    image: import('canvas').Image,
    backgroundColor: string,
    canvas: typeof import('canvas')
  ): Promise<AssetFile[]> {
    const splashScreens: AssetFile[] = [];
    const splashDir = path.join(this.workDir, 'assets', 'splash', 'ios');
    await fs.mkdir(splashDir, { recursive: true });

    for (const { width, height } of SPLASH_SIZES.ios) {
      const filename = `splash-${width}x${height}.png`;
      const filePath = path.join(splashDir, filename);

      await this.createSplashScreen(image, width, height, backgroundColor, filePath, canvas);

      splashScreens.push({
        path: path.relative(this.workDir, filePath),
        size: { width, height },
        format: 'png',
        purpose: `iOS splash ${width}x${height}`,
      });
    }

    return splashScreens;
  }

  /**
   * Generate Android splash screens
   */
  private async generateAndroidSplash(
    image: import('canvas').Image,
    backgroundColor: string,
    canvas: typeof import('canvas')
  ): Promise<AssetFile[]> {
    const splashScreens: AssetFile[] = [];
    const splashDir = path.join(this.workDir, 'assets', 'splash', 'android');
    await fs.mkdir(splashDir, { recursive: true });

    for (const { width, height } of SPLASH_SIZES.android) {
      const filename = `splash-${width}x${height}.png`;
      const filePath = path.join(splashDir, filename);

      await this.createSplashScreen(image, width, height, backgroundColor, filePath, canvas);

      splashScreens.push({
        path: path.relative(this.workDir, filePath),
        size: { width, height },
        format: 'png',
        purpose: `Android splash ${width}x${height}`,
      });
    }

    return splashScreens;
  }

  /**
   * Resize image and save to file
   */
  private async resizeAndSaveImage(
    sourceImage: import('canvas').Image,
    targetWidth: number,
    targetHeight: number,
    outputPath: string,
    canvas: typeof import('canvas'),
    scaleFactor: number = 1.0
  ): Promise<void> {
    const { createCanvas } = canvas;
    const canvasInstance = createCanvas(targetWidth, targetHeight);
    const ctx = canvasInstance.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Calculate dimensions with scale factor (for padding)
    const scaledWidth = targetWidth * scaleFactor;
    const scaledHeight = targetHeight * scaleFactor;
    const x = (targetWidth - scaledWidth) / 2;
    const y = (targetHeight - scaledHeight) / 2;

    // Draw image centered
    ctx.drawImage(sourceImage, x, y, scaledWidth, scaledHeight);

    // Save to file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const buffer = canvasInstance.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Create solid color image
   */
  private async createSolidColorImage(
    width: number,
    height: number,
    color: string,
    outputPath: string,
    canvas: typeof import('canvas')
  ): Promise<void> {
    const { createCanvas } = canvas;
    const canvasInstance = createCanvas(width, height);
    const ctx = canvasInstance.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const buffer = canvasInstance.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Create splash screen with centered logo on colored background
   */
  private async createSplashScreen(
    logoImage: import('canvas').Image,
    width: number,
    height: number,
    backgroundColor: string,
    outputPath: string,
    canvas: typeof import('canvas')
  ): Promise<void> {
    const { createCanvas } = canvas;
    const canvasInstance = createCanvas(width, height);
    const ctx = canvasInstance.getContext('2d');

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate logo size (max 40% of screen)
    const maxLogoSize = Math.min(width, height) * 0.4;
    const aspectRatio = logoImage.width / logoImage.height;
    let logoWidth = maxLogoSize;
    let logoHeight = maxLogoSize / aspectRatio;

    if (logoHeight > maxLogoSize) {
      logoHeight = maxLogoSize;
      logoWidth = maxLogoSize * aspectRatio;
    }

    // Center logo
    const x = (width - logoWidth) / 2;
    const y = (height - logoHeight) / 2;

    // Draw logo
    ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);

    // Save to file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const buffer = canvasInstance.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Generate a single icon (useful for testing or preview)
   */
  async generateSingleIcon(
    sourceImage: import('canvas').Image,
    size: number,
    outputPath: string
  ): Promise<AssetFile> {
    const canvas = await getCanvas();
    if (!canvas) {
      throw new Error('Canvas module not available for icon generation');
    }

    await this.resizeAndSaveImage(sourceImage, size, size, outputPath, canvas);

    return {
      path: outputPath,
      size: { width: size, height: size },
      format: 'png',
      purpose: 'preview',
    };
  }
}
