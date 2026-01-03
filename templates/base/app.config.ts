import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo App Configuration
 *
 * This file provides dynamic configuration for the Expo app.
 * It will be used by Mobigen during white-label app generation.
 *
 * Variables marked with __PLACEHOLDER__ will be replaced during generation:
 * - __APP_NAME__: User's app name
 * - __BUNDLE_ID_IOS__: iOS bundle identifier
 * - __BUNDLE_ID_ANDROID__: Android package name
 * - __PROJECT_ID__: Mobigen project ID
 * - __UPDATE_URL__: Mobigen update server URL
 */

export default ({ config }: ConfigContext): ExpoConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || '__PROJECT_ID__';

  return {
    ...config,
    name: process.env.EXPO_PUBLIC_APP_NAME || '__APP_NAME__',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'mobigen-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',

    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    assetBundlePatterns: ['**/*'],

    // Runtime version for update compatibility
    // Apps can only receive updates with matching runtime versions
    runtimeVersion: {
      policy: 'sdkVersion', // Use SDK version as runtime version
      // Alternative: policy: 'appVersion' to use app.version
      // Alternative: policy: 'nativeVersion' for manual versioning
    },

    // Expo Updates (OTA) Configuration
    updates: {
      enabled: true,

      // When to check for updates
      // ON_LOAD: Check on app launch
      // ON_ERROR_RECOVERY: Check only after a fatal error
      // WIFI_ONLY: Check only on WiFi (requires additional setup)
      checkAutomatically: 'ON_LOAD',

      // Timeout before falling back to cached bundle (ms)
      // 0 = no timeout (recommended for most apps)
      fallbackToCacheTimeout: 0,

      // Update server URL
      // For Mobigen apps, this will point to the Mobigen CDN
      url: process.env.EXPO_PUBLIC_UPDATE_URL || `https://updates.mobigen.io/${projectId}`,

      // Optional: Limit updates to specific channels (dev, staging, production)
      // requestHeaders: {
      //   'expo-channel-name': process.env.EXPO_PUBLIC_UPDATE_CHANNEL || 'production',
      // },
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.EXPO_PUBLIC_BUNDLE_ID_IOS || '__BUNDLE_ID_IOS__',

      // iOS-specific update settings
      infoPlist: {
        // Allow updates to be downloaded on cellular
        NSAllowsArbitraryLoads: false,
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: process.env.EXPO_PUBLIC_BUNDLE_ID_ANDROID || '__BUNDLE_ID_ANDROID__',

      // Android-specific permissions
      permissions: [
        // Updates may need network access
        'INTERNET',
      ],
    },

    web: {
      favicon: './assets/favicon.png',
    },

    // Expo plugins
    plugins: [
      'expo-router',
      'expo-secure-store',

      // Expo Updates plugin with optional configuration
      [
        'expo-updates',
        {
          // Optional: Username for authenticated update requests
          // username: process.env.EXPO_UPDATES_USERNAME,
        },
      ],
    ],

    // EAS configuration
    extra: {
      // These values are accessible via expo-constants
      projectId,
      updateUrl: process.env.EXPO_PUBLIC_UPDATE_URL || `https://updates.mobigen.io/${projectId}`,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.mobigen.io/v1',
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '__EAS_PROJECT_ID__',
      },
    },
  };
};
