/**
 * Device types supported by the mockup system
 */
export type DeviceType = 'iphone-15-pro' | 'iphone-14' | 'pixel-8' | 'galaxy-s23';

/**
 * Notch/cutout types for different devices
 */
export type NotchType = 'dynamic-island' | 'notch' | 'punch-hole' | 'none';

/**
 * Device specification interface
 */
export interface DeviceSpec {
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
  frameColor: string;
  cornerRadius: number;
  notchType: NotchType;
  statusBarHeight: number;
  homeIndicatorHeight: number;
}

/**
 * Complete device specifications for all supported devices
 */
export const DEVICE_SPECS: Record<DeviceType, DeviceSpec> = {
  'iphone-15-pro': {
    width: 393,
    height: 852,
    screenWidth: 1179,
    screenHeight: 2556,
    frameColor: '#1C1C1E',
    cornerRadius: 55,
    notchType: 'dynamic-island',
    statusBarHeight: 59,
    homeIndicatorHeight: 34,
  },
  'iphone-14': {
    width: 390,
    height: 844,
    screenWidth: 1170,
    screenHeight: 2532,
    frameColor: '#1C1C1E',
    cornerRadius: 47,
    notchType: 'notch',
    statusBarHeight: 47,
    homeIndicatorHeight: 34,
  },
  'pixel-8': {
    width: 412,
    height: 915,
    screenWidth: 1080,
    screenHeight: 2400,
    frameColor: '#202124',
    cornerRadius: 40,
    notchType: 'punch-hole',
    statusBarHeight: 24,
    homeIndicatorHeight: 0,
  },
  'galaxy-s23': {
    width: 360,
    height: 780,
    screenWidth: 1080,
    screenHeight: 2340,
    frameColor: '#1A1A1A',
    cornerRadius: 35,
    notchType: 'punch-hole',
    statusBarHeight: 24,
    homeIndicatorHeight: 0,
  },
};

/**
 * Hotspot action types
 */
export type HotspotAction = 'navigate' | 'back' | 'tab' | 'external' | 'none';

/**
 * Screen transition types
 */
export type TransitionAnimation = 'slide-left' | 'slide-right' | 'fade' | 'modal' | 'none';

/**
 * Bounds interface for positioning
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Hotspot definition for interactive areas
 */
export interface Hotspot {
  id: string;
  bounds: Bounds;
  action: HotspotAction;
  target?: string;
  label?: string;
}

/**
 * Mockup screen definition
 */
export interface MockupScreen {
  id: string;
  name: string;
  path: string;
  thumbnail?: string;
  hotspots?: Hotspot[];
  transition?: TransitionAnimation;
}

/**
 * Branding zone for color replacement
 */
export interface BrandingZone {
  id: string;
  role: 'primary' | 'secondary' | 'accent' | 'background';
  bounds: Bounds;
}

/**
 * Branding configuration
 */
export interface BrandingConfig {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  logo?: {
    url: string;
    width: number;
    height: number;
  };
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  type: 'tabs' | 'stack' | 'drawer';
  screens: string[];
  initialScreen?: string;
}

/**
 * Complete mockup manifest
 */
export interface MockupManifest {
  templateId: string;
  version: string;
  screens: MockupScreen[];
  navigation: NavigationConfig;
  branding: {
    supportedColors: Array<'primary' | 'secondary' | 'accent'>;
    logoPlacement: string[];
    zones?: BrandingZone[];
  };
  deviceType?: DeviceType;
  metadata?: {
    author?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Color transform result
 */
export interface ColorTransformResult {
  filter: string;
  accuracy: number;
}
