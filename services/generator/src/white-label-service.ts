/**
 * White-label branding service for Enterprise users
 * Handles custom branding, asset generation, and app configuration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { AssetGenerator, isCanvasAvailable } from './asset-generator';
import type {
  BrandConfig,
  BrandingResult,
  GeneratedAssets,
  UpdatedConfig,
} from './white-label-types';
import {
  BUNDLE_ID_PATTERN,
  HEX_COLOR_PATTERN,
} from './white-label-types';

export class WhiteLabelService {
  private projectsDir: string;
  private assetGenerator: AssetGenerator | null = null;

  constructor(projectsDir: string = '/tmp/mobigen-projects') {
    this.projectsDir = projectsDir;
  }

  /**
   * Apply branding to a project
   */
  async applyBranding(
    projectId: string,
    brandConfig: BrandConfig
  ): Promise<BrandingResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate brand config
    const validation = this.validateBrandConfig(brandConfig);
    if (!validation.valid) {
      return {
        success: false,
        assets: { icons: { ios: [], android: [] }, splash: { ios: [], android: [] } },
        config: { appJson: {} },
        errors: validation.errors,
      };
    }

    const projectPath = path.join(this.projectsDir, projectId);

    try {
      // Initialize asset generator
      this.assetGenerator = new AssetGenerator(projectPath);

      // Check if canvas is available for asset generation
      const canvasAvailable = await isCanvasAvailable();
      let assets: GeneratedAssets = { icons: { ios: [], android: [] }, splash: { ios: [], android: [] } };

      if (canvasAvailable) {
        // Generate assets (icons and splash screens)
        assets = await this.generateAssets(brandConfig);
      } else {
        warnings.push(
          'Asset generation skipped: canvas module not available. ' +
          'To enable: brew install pkg-config cairo pango libpng jpeg giflib librsvg && pnpm rebuild canvas'
        );
      }

      // Update app.json configuration
      const config = await this.updateAppConfig(projectPath, brandConfig, assets);

      // Generate theme file
      await this.generateThemeFile(projectPath, brandConfig);

      // Generate constants file
      await this.generateConstantsFile(projectPath, brandConfig);

      // Update package.json name
      await this.updatePackageJson(projectPath, brandConfig);

      return {
        success: true,
        assets,
        config,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Failed to apply branding: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        assets: { icons: { ios: [], android: [] }, splash: { ios: [], android: [] } },
        config: { appJson: {} },
        errors,
      };
    }
  }

  /**
   * Generate all branding assets
   */
  async generateAssets(brandConfig: BrandConfig): Promise<GeneratedAssets> {
    if (!this.assetGenerator) {
      throw new Error('Asset generator not initialized');
    }

    return await this.assetGenerator.generateAssets(brandConfig);
  }

  /**
   * Update app.json with branding configuration
   */
  async updateAppConfig(
    projectPath: string,
    brandConfig: BrandConfig,
    assets: GeneratedAssets
  ): Promise<UpdatedConfig> {
    const appJsonPath = path.join(projectPath, 'app.json');

    // Read existing app.json
    let appJson: Record<string, any> = {};
    try {
      const content = await fs.readFile(appJsonPath, 'utf-8');
      appJson = JSON.parse(content);
    } catch {
      // If app.json doesn't exist, create a new one
      appJson = { expo: {} };
    }

    // Update app.json with branding
    appJson.expo = {
      ...appJson.expo,
      name: brandConfig.appName,
      slug: this.slugify(brandConfig.appName),
      // App icon (use the 1024x1024 iOS icon)
      icon: assets.icons.ios.find(i => i.size.width === 1024)?.path || './assets/icon.png',
      // Splash screen
      splash: {
        ...appJson.expo?.splash,
        backgroundColor: brandConfig.branding.splash.backgroundColor,
        image: assets.splash.ios[0]?.path || './assets/splash.png',
        resizeMode: brandConfig.branding.splash.resizeMode || 'contain',
      },
      // iOS specific
      ios: {
        ...appJson.expo?.ios,
        bundleIdentifier: brandConfig.bundleId.ios,
        buildNumber: '1.0.0',
        supportsTablet: true,
      },
      // Android specific
      android: {
        ...appJson.expo?.android,
        package: brandConfig.bundleId.android,
        versionCode: 1,
        adaptiveIcon: {
          foregroundImage: assets.icons.android.find(i => i.purpose?.includes('foreground'))?.path || './assets/adaptive-icon.png',
          backgroundColor: brandConfig.branding.primaryColor,
        },
      },
      // Primary color
      primaryColor: brandConfig.branding.primaryColor,
      // User interface style
      userInterfaceStyle: 'automatic',
    };

    // Write updated app.json
    await fs.writeFile(
      appJsonPath,
      JSON.stringify(appJson, null, 2),
      'utf-8'
    );

    return {
      appJson,
      themeFile: path.join(projectPath, 'src', 'theme', 'colors.ts'),
      constantsFile: path.join(projectPath, 'src', 'constants', 'branding.ts'),
    };
  }

  /**
   * Generate theme file with brand colors
   */
  private async generateThemeFile(
    projectPath: string,
    brandConfig: BrandConfig
  ): Promise<void> {
    const themeDir = path.join(projectPath, 'src', 'theme');
    await fs.mkdir(themeDir, { recursive: true });

    const themeContent = `/**
 * Brand colors - Auto-generated by Mobigen white-label service
 * Do not edit manually - regenerate via branding API
 */

export const brandColors = {
  primary: '${brandConfig.branding.primaryColor}',
  secondary: '${brandConfig.branding.secondaryColor}',
  accent: '${brandConfig.branding.accentColor || brandConfig.branding.primaryColor}',
  background: '${brandConfig.branding.backgroundColor || '#FFFFFF'}',

  // Derived colors (lighter/darker variants)
  primaryLight: '${this.lightenColor(brandConfig.branding.primaryColor, 20)}',
  primaryDark: '${this.darkenColor(brandConfig.branding.primaryColor, 20)}',
  secondaryLight: '${this.lightenColor(brandConfig.branding.secondaryColor, 20)}',
  secondaryDark: '${this.darkenColor(brandConfig.branding.secondaryColor, 20)}',
} as const;

export const theme = {
  colors: {
    ...brandColors,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;

export type Theme = typeof theme;
`;

    await fs.writeFile(
      path.join(themeDir, 'colors.ts'),
      themeContent,
      'utf-8'
    );
  }

  /**
   * Generate constants file with branding info
   */
  private async generateConstantsFile(
    projectPath: string,
    brandConfig: BrandConfig
  ): Promise<void> {
    const constantsDir = path.join(projectPath, 'src', 'constants');
    await fs.mkdir(constantsDir, { recursive: true });

    const constantsContent = `/**
 * Branding constants - Auto-generated by Mobigen white-label service
 * Do not edit manually - regenerate via branding API
 */

export const BRANDING = {
  appName: '${brandConfig.appName}',
  displayName: '${brandConfig.displayName}',
  bundleId: {
    ios: '${brandConfig.bundleId.ios}',
    android: '${brandConfig.bundleId.android}',
  },
  storeMetadata: ${JSON.stringify(brandConfig.storeMetadata || {}, null, 2)},
} as const;
`;

    await fs.writeFile(
      path.join(constantsDir, 'branding.ts'),
      constantsContent,
      'utf-8'
    );
  }

  /**
   * Update package.json with app name
   */
  private async updatePackageJson(
    projectPath: string,
    brandConfig: BrandConfig
  ): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      packageJson.name = this.slugify(brandConfig.appName);
      packageJson.version = packageJson.version || '1.0.0';

      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        'utf-8'
      );
    } catch (error) {
      // If package.json doesn't exist or is invalid, skip
      console.warn('Could not update package.json:', error);
    }
  }

  /**
   * Validate brand configuration
   */
  validateBrandConfig(config: BrandConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate app name
    if (!config.appName || config.appName.trim().length === 0) {
      errors.push('App name is required');
    }

    // Validate bundle IDs
    if (!BUNDLE_ID_PATTERN.test(config.bundleId.ios)) {
      errors.push(`Invalid iOS bundle ID: ${config.bundleId.ios}`);
    }
    if (!BUNDLE_ID_PATTERN.test(config.bundleId.android)) {
      errors.push(`Invalid Android bundle ID: ${config.bundleId.android}`);
    }

    // Validate colors
    if (!HEX_COLOR_PATTERN.test(config.branding.primaryColor)) {
      errors.push(`Invalid primary color: ${config.branding.primaryColor}`);
    }
    if (!HEX_COLOR_PATTERN.test(config.branding.secondaryColor)) {
      errors.push(`Invalid secondary color: ${config.branding.secondaryColor}`);
    }
    if (config.branding.accentColor && !HEX_COLOR_PATTERN.test(config.branding.accentColor)) {
      errors.push(`Invalid accent color: ${config.branding.accentColor}`);
    }
    if (!HEX_COLOR_PATTERN.test(config.branding.splash.backgroundColor)) {
      errors.push(`Invalid splash background color: ${config.branding.splash.backgroundColor}`);
    }

    // Validate logo
    if (!config.branding.logo.light) {
      errors.push('Logo is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current branding configuration for a project
   */
  async getBranding(projectId: string): Promise<BrandConfig | null> {
    const projectPath = path.join(this.projectsDir, projectId);
    const appJsonPath = path.join(projectPath, 'app.json');

    try {
      const content = await fs.readFile(appJsonPath, 'utf-8');
      const appJson = JSON.parse(content);

      // Reconstruct BrandConfig from app.json
      return {
        appName: appJson.expo?.name || '',
        displayName: appJson.expo?.name || '',
        bundleId: {
          ios: appJson.expo?.ios?.bundleIdentifier || '',
          android: appJson.expo?.android?.package || '',
        },
        branding: {
          primaryColor: appJson.expo?.primaryColor || '#000000',
          secondaryColor: '#666666', // Not stored in app.json, need to read from theme file
          logo: {
            light: appJson.expo?.icon || '',
          },
          splash: {
            backgroundColor: appJson.expo?.splash?.backgroundColor || '#FFFFFF',
            image: appJson.expo?.splash?.image,
            resizeMode: appJson.expo?.splash?.resizeMode,
          },
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Preview branding (generate sample assets without applying)
   */
  async previewBranding(brandConfig: BrandConfig): Promise<BrandingResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate brand config
    const validation = this.validateBrandConfig(brandConfig);
    if (!validation.valid) {
      return {
        success: false,
        assets: { icons: { ios: [], android: [] }, splash: { ios: [], android: [] } },
        config: { appJson: {} },
        errors: validation.errors,
      };
    }

    try {
      // Create temporary directory for preview
      const previewDir = path.join(this.projectsDir, 'preview', Date.now().toString());
      await fs.mkdir(previewDir, { recursive: true });

      // Initialize asset generator for preview
      this.assetGenerator = new AssetGenerator(previewDir);

      // Generate preview assets (only generate a few samples, not all sizes)
      const assets = await this.generatePreviewAssets(brandConfig);

      // Generate sample app.json
      const appJson = this.generateSampleAppJson(brandConfig);

      return {
        success: true,
        assets,
        config: { appJson },
        warnings: ['This is a preview. Assets not saved to project.'],
      };
    } catch (error) {
      errors.push(`Failed to preview branding: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        assets: { icons: { ios: [], android: [] }, splash: { ios: [], android: [] } },
        config: { appJson: {} },
        errors,
      };
    }
  }

  /**
   * Generate preview assets (limited set for faster preview)
   */
  private async generatePreviewAssets(brandConfig: BrandConfig): Promise<GeneratedAssets> {
    if (!this.assetGenerator) {
      throw new Error('Asset generator not initialized');
    }

    // Only generate a few sample sizes for preview
    const assets: GeneratedAssets = {
      icons: { ios: [], android: [] },
      splash: { ios: [], android: [] },
    };

    // For preview, we'll just note what would be generated
    // rather than actually generating all sizes
    return assets;
  }

  /**
   * Generate sample app.json for preview
   */
  private generateSampleAppJson(brandConfig: BrandConfig): Record<string, any> {
    return {
      expo: {
        name: brandConfig.appName,
        slug: this.slugify(brandConfig.appName),
        ios: {
          bundleIdentifier: brandConfig.bundleId.ios,
        },
        android: {
          package: brandConfig.bundleId.android,
        },
        primaryColor: brandConfig.branding.primaryColor,
        splash: {
          backgroundColor: brandConfig.branding.splash.backgroundColor,
        },
      },
    };
  }

  /**
   * Utility: Slugify app name
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Utility: Lighten hex color
   */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * (percent / 100)));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * (percent / 100)));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Utility: Darken hex color
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * (percent / 100)));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * (percent / 100)));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}

/**
 * Singleton instance
 */
let whiteLabelService: WhiteLabelService | null = null;

export function getWhiteLabelService(): WhiteLabelService {
  if (!whiteLabelService) {
    whiteLabelService = new WhiteLabelService();
  }
  return whiteLabelService;
}
