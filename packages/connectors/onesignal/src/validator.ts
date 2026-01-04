/**
 * OneSignal credential validators
 */

/**
 * Validate OneSignal App ID format (must be UUID)
 */
export function validateAppId(appId: string): { valid: boolean; error?: string } {
  if (!appId) {
    return { valid: false, error: 'App ID is required' };
  }

  // UUID v4 format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(appId)) {
    return {
      valid: false,
      error: 'App ID must be a valid UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
    };
  }

  return { valid: true };
}

/**
 * Validate OneSignal REST API Key format (optional)
 */
export function validateRestApiKey(apiKey?: string): { valid: boolean; error?: string } {
  // REST API key is optional
  if (!apiKey) {
    return { valid: true };
  }

  // OneSignal REST API keys typically start with certain patterns
  // but there's no strict format requirement, so we just check it's not empty
  if (apiKey.trim().length < 10) {
    return {
      valid: false,
      error: 'REST API key seems too short. Please verify your key.',
    };
  }

  return { valid: true };
}
