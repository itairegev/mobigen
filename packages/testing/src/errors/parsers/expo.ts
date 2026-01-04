/**
 * Expo error parser
 *
 * Parses Expo-specific build and runtime errors
 */

export interface ExpoError {
  type: 'config' | 'plugin' | 'prebuild' | 'build' | 'doctor' | 'unknown';
  file?: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning';
}

/**
 * Parse Expo error output
 */
export function parseExpoOutput(output: string): ExpoError[] {
  const errors: ExpoError[] = [];

  // Split by error boundaries
  const errorBlocks = output.split(/(?=Error:|Warning:|Invalid|Failed|Missing)/i);

  for (const block of errorBlocks) {
    const error = parseExpoErrorBlock(block);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Parse a single Expo error block
 */
function parseExpoErrorBlock(block: string): ExpoError | null {
  const lines = block.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return null;

  // app.json/app.config.js errors
  const configMatch = block.match(
    /(?:Invalid|Missing|Error in)\s+(?:property\s+)?['"]?([^'":\s]+)['"]?\s+in\s+app\.(?:json|config)/i
  );
  if (configMatch) {
    return {
      type: 'config',
      file: 'app.json',
      message: extractCleanMessage(block),
      severity: 'error',
    };
  }

  // Plugin errors
  const pluginMatch = block.match(/Plugin\s+['"]([^'"]+)['"]\s+(?:failed|error)/i);
  if (pluginMatch) {
    return {
      type: 'plugin',
      message: `Expo plugin "${pluginMatch[1]}" failed: ${extractCleanMessage(block)}`,
      severity: 'error',
    };
  }

  // Prebuild errors
  if (block.match(/prebuild/i)) {
    const errorMsg = extractCleanMessage(block);
    return {
      type: 'prebuild',
      message: errorMsg,
      severity: 'error',
      suggestion: getSuggestionForPrebuild(errorMsg),
    };
  }

  // Expo Doctor warnings/errors
  const doctorMatch = block.match(/(Warning|Error):\s*(.+?)(?:\n|$)/i);
  if (doctorMatch) {
    return {
      type: 'doctor',
      message: doctorMatch[2].trim(),
      severity: doctorMatch[1].toLowerCase() as 'error' | 'warning',
    };
  }

  // Build errors
  if (block.match(/build\s+failed|build\s+error/i)) {
    return {
      type: 'build',
      message: extractCleanMessage(block),
      severity: 'error',
    };
  }

  return null;
}

/**
 * Extract clean error message from block
 */
function extractCleanMessage(block: string): string {
  // Try to find the main error message
  const patterns = [
    /(?:Error|Failed|Invalid):\s*(.+?)(?:\n|$)/i,
    /(?:Error|Failed|Invalid)\s+(.+?)(?:\n|$)/i,
    /^(.+?)(?:\n|$)/,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return block.split('\n')[0].trim();
}

/**
 * Get suggestion for prebuild errors
 */
function getSuggestionForPrebuild(message: string): string | undefined {
  if (message.includes('bundle identifier') || message.includes('package name')) {
    return 'Check the ios.bundleIdentifier and android.package fields in app.json';
  }

  if (message.includes('native project')) {
    return 'Run: npx expo prebuild --clean to regenerate native projects';
  }

  if (message.includes('plugin')) {
    return 'Check that all Expo config plugins are properly installed and configured';
  }

  if (message.includes('version')) {
    return 'Check SDK version compatibility in app.json and package.json';
  }

  return undefined;
}

/**
 * Get user-friendly description of Expo error type
 */
export function getExpoErrorDescription(type: ExpoError['type']): string {
  const descriptions: Record<ExpoError['type'], string> = {
    config: 'Expo configuration error (app.json)',
    plugin: 'Expo config plugin error',
    prebuild: 'Native project generation error',
    build: 'Build process error',
    doctor: 'Expo doctor health check',
    unknown: 'Unknown Expo error',
  };

  return descriptions[type];
}

/**
 * Common Expo configuration errors
 */
export const EXPO_CONFIG_ERRORS = {
  MISSING_BUNDLE_ID: 'ios.bundleIdentifier is required',
  MISSING_PACKAGE_NAME: 'android.package is required',
  INVALID_BUNDLE_ID: 'Bundle identifier must be a valid reverse-DNS format',
  INVALID_PACKAGE_NAME: 'Android package name must be a valid Java package name',
  MISSING_APP_NAME: 'name field is required in app.json',
  INVALID_SDK_VERSION: 'SDK version is not supported',
  MISSING_ICON: 'icon field is required',
  INVALID_ICON_PATH: 'Icon file does not exist at specified path',
  INCOMPATIBLE_PLUGINS: 'Config plugins are incompatible with current SDK version',
};

/**
 * Check if Expo error is critical (blocks build)
 */
export function isExpoErrorCritical(error: ExpoError): boolean {
  // Config and prebuild errors are always critical
  return error.type === 'config' || error.type === 'prebuild' || error.type === 'build';
}
