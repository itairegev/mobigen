/**
 * White-label branding types for Enterprise users
 */

export interface BrandConfig {
  appName: string;
  displayName: string;
  bundleId: {
    ios: string;
    android: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    backgroundColor?: string;
    logo: {
      light: string; // URL or base64
      dark?: string; // Optional dark mode logo
    };
    splash: {
      backgroundColor: string;
      image?: string; // URL or base64
      resizeMode?: 'contain' | 'cover' | 'native';
    };
  };
  storeMetadata?: {
    shortDescription?: string;
    fullDescription?: string;
    keywords?: string[];
    category?: string;
  };
}

export interface BrandingResult {
  success: boolean;
  assets: GeneratedAssets;
  config: UpdatedConfig;
  errors?: string[];
  warnings?: string[];
}

export interface GeneratedAssets {
  icons: {
    ios: AssetFile[];
    android: AssetFile[];
  };
  splash: {
    ios: AssetFile[];
    android: AssetFile[];
  };
  appIcon?: AssetFile; // Main app icon source
}

export interface AssetFile {
  path: string;
  size: { width: number; height: number };
  format: 'png' | 'jpg' | 'webp';
  purpose?: string;
}

export interface UpdatedConfig {
  appJson: Record<string, unknown>;
  themeFile?: string;
  constantsFile?: string;
}

/**
 * Asset sizes for iOS icons
 * Based on Apple's Human Interface Guidelines
 */
export const IOS_ICON_SIZES = [
  { size: 20, scales: [2, 3] }, // iPhone Notification
  { size: 29, scales: [2, 3] }, // iPhone Settings
  { size: 40, scales: [2, 3] }, // iPhone Spotlight
  { size: 60, scales: [2, 3] }, // iPhone App
  { size: 76, scales: [1, 2] }, // iPad App
  { size: 83.5, scales: [2] },  // iPad Pro App
  { size: 1024, scales: [1] },  // App Store
] as const;

/**
 * Asset sizes for Android icons
 * Based on Android adaptive icon guidelines
 */
export const ANDROID_ICON_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
} as const;

/**
 * Splash screen sizes
 */
export const SPLASH_SIZES = {
  ios: [
    { width: 1242, height: 2688 }, // iPhone XS Max, 11 Pro Max
    { width: 1125, height: 2436 }, // iPhone X, XS, 11 Pro
    { width: 828, height: 1792 },  // iPhone XR, 11
    { width: 750, height: 1334 },  // iPhone 8, SE 2nd gen
    { width: 1242, height: 2208 }, // iPhone 8 Plus
    { width: 2048, height: 2732 }, // iPad Pro 12.9"
    { width: 1668, height: 2388 }, // iPad Pro 11"
  ],
  android: [
    { width: 480, height: 800 },   // mdpi
    { width: 720, height: 1280 },  // hdpi
    { width: 1080, height: 1920 }, // xhdpi
    { width: 1440, height: 2560 }, // xxhdpi
    { width: 1800, height: 3200 }, // xxxhdpi
  ],
} as const;

/**
 * Bundle ID validation
 */
export const BUNDLE_ID_PATTERN = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

/**
 * Color validation (hex format)
 */
export const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
