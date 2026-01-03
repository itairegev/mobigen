import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Update Management Utilities
 *
 * Helper functions for managing OTA updates in Mobigen apps
 */

/**
 * Check if app is running in development mode
 */
export function isDevelopment(): boolean {
  return __DEV__;
}

/**
 * Check if app is running in production/standalone mode
 */
export function isProduction(): boolean {
  return !__DEV__;
}

/**
 * Check if running with Expo Updates enabled
 * Updates are disabled in development and Expo Go
 */
export function isUpdatesEnabled(): boolean {
  return Updates.isEnabled;
}

/**
 * Get detailed update environment information
 */
export function getUpdateEnvironment() {
  return {
    // Runtime environment
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isUpdatesEnabled: isUpdatesEnabled(),

    // Platform info
    platform: Platform.OS,
    platformVersion: Platform.Version,

    // Update configuration
    updateId: Updates.updateId || null,
    runtimeVersion: Updates.runtimeVersion || null,
    channel: Updates.channel || null,
    createdAt: Updates.createdAt || null,

    // Launch type
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    isEmergencyLaunch: Updates.isEmergencyLaunch,

    // App metadata
    appVersion: Constants.expoConfig?.version || '1.0.0',
    nativeBuildVersion: Constants.nativeBuildVersion || null,
    easProjectId: Constants.expoConfig?.extra?.eas?.projectId || null,
  };
}

/**
 * Get current update manifest information
 */
export function getCurrentManifestInfo() {
  const manifest = Updates.manifest;

  if (!manifest) {
    return null;
  }

  return {
    id: Updates.updateId || null,
    createdAt: Updates.createdAt || null,
    runtimeVersion: manifest.runtimeVersion || null,
    launchAsset: manifest.launchAsset || null,
    assets: manifest.assets || [],
  };
}

/**
 * Format update date for display
 */
export function formatUpdateDate(date: Date | null | undefined): string {
  if (!date) {
    return 'Unknown';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get a human-readable update status message
 */
export function getUpdateStatusMessage(): string {
  const env = getUpdateEnvironment();

  if (!env.isUpdatesEnabled) {
    if (env.isDevelopment) {
      return 'Updates disabled in development';
    }
    return 'Updates not available';
  }

  if (env.isEmbeddedLaunch) {
    return 'Running embedded version';
  }

  if (env.isEmergencyLaunch) {
    return 'Emergency launch (fallback)';
  }

  if (env.updateId) {
    const updatedAt = formatUpdateDate(env.createdAt);
    return `Last updated ${updatedAt}`;
  }

  return 'Update status unknown';
}

/**
 * Generate a unique identifier for this app instance
 * Useful for analytics and debugging
 */
export function getAppInstanceId(): string {
  const env = getUpdateEnvironment();

  return [
    env.platform,
    env.platformVersion,
    env.appVersion,
    env.updateId?.substring(0, 8) || 'embedded',
  ].join('-');
}

/**
 * Check if a specific runtime version is compatible with current app
 */
export function isRuntimeVersionCompatible(targetRuntimeVersion: string): boolean {
  const currentRuntimeVersion = Updates.runtimeVersion;

  if (!currentRuntimeVersion) {
    return false;
  }

  // For SDK version policy, compare SDK versions
  if (currentRuntimeVersion.startsWith('exposdk:')) {
    return currentRuntimeVersion === targetRuntimeVersion;
  }

  // For app version policy, compare major.minor
  const [currentMajor, currentMinor] = currentRuntimeVersion.split('.');
  const [targetMajor, targetMinor] = targetRuntimeVersion.split('.');

  return currentMajor === targetMajor && currentMinor === targetMinor;
}

/**
 * Log update event for debugging
 */
export function logUpdateEvent(
  eventName: string,
  data?: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  const env = getUpdateEnvironment();

  const logData = {
    timestamp,
    event: eventName,
    updateId: env.updateId,
    runtimeVersion: env.runtimeVersion,
    platform: env.platform,
    ...data,
  };

  console.log('[Updates]', JSON.stringify(logData, null, 2));

  // In production, send to analytics
  if (isProduction()) {
    // TODO: Send to Mobigen analytics API
    // trackEvent('ota_update', logData);
  }
}

/**
 * Calculate approximate update size from manifest
 */
export function estimateUpdateSize(manifest?: Updates.Manifest): string {
  if (!manifest || !manifest.assets) {
    return 'Unknown';
  }

  // Sum up asset sizes (if available in manifest)
  let totalBytes = 0;

  // Note: Expo manifests don't always include size info
  // This is a placeholder for when that data is available
  manifest.assets.forEach((asset: any) => {
    if (asset.fileSize) {
      totalBytes += asset.fileSize;
    }
  });

  if (totalBytes === 0) {
    return 'Unknown';
  }

  return formatBytes(totalBytes);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if update should be prompted based on time elapsed
 * Useful for implementing "don't ask again for X hours" functionality
 */
export function shouldPromptUpdate(
  lastPromptedAt: Date | null,
  minimumHoursBetweenPrompts: number = 24
): boolean {
  if (!lastPromptedAt) {
    return true;
  }

  const now = new Date();
  const hoursSinceLastPrompt = (now.getTime() - lastPromptedAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastPrompt >= minimumHoursBetweenPrompts;
}

/**
 * Get update URL configuration
 */
export function getUpdateUrl(): string | null {
  // Try to get from expo-constants
  const updateUrl = Constants.expoConfig?.extra?.updateUrl;

  if (updateUrl) {
    return updateUrl;
  }

  // Fallback to manifest URL if available
  if (Updates.manifest?.updateUrl) {
    return Updates.manifest.updateUrl as string;
  }

  return null;
}

/**
 * Create a debug report for troubleshooting update issues
 */
export function createUpdateDebugReport(): string {
  const env = getUpdateEnvironment();
  const manifest = getCurrentManifestInfo();
  const updateUrl = getUpdateUrl();

  const report = `
=== Expo Updates Debug Report ===

Environment:
- Development: ${env.isDevelopment}
- Production: ${env.isProduction}
- Updates Enabled: ${env.isUpdatesEnabled}

Platform:
- OS: ${env.platform}
- OS Version: ${env.platformVersion}
- App Version: ${env.appVersion}
- Native Build: ${env.nativeBuildVersion || 'N/A'}

Update Configuration:
- Update ID: ${env.updateId || 'None'}
- Runtime Version: ${env.runtimeVersion || 'None'}
- Channel: ${env.channel || 'None'}
- Update URL: ${updateUrl || 'None'}
- EAS Project ID: ${env.easProjectId || 'None'}

Launch Type:
- Embedded Launch: ${env.isEmbeddedLaunch}
- Emergency Launch: ${env.isEmergencyLaunch}

Current Manifest:
${manifest ? JSON.stringify(manifest, null, 2) : 'No manifest available'}

Timestamp: ${new Date().toISOString()}
  `.trim();

  return report;
}

/**
 * Check network connectivity before downloading updates
 * Returns true if on WiFi or user has good connectivity
 */
export async function shouldDownloadOnCurrentNetwork(): Promise<boolean> {
  // TODO: Implement network check using @react-native-community/netinfo
  // For now, always return true
  // In production, you might want to check:
  // - WiFi vs cellular
  // - Connection quality
  // - Data saver mode
  return true;
}
