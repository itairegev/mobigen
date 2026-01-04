/**
 * Credential encryption utilities using AES-256-GCM
 *
 * @packageDocumentation
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  /** Base64-encoded ciphertext */
  ciphertext: string;

  /** Base64-encoded initialization vector */
  iv: string;

  /** Base64-encoded authentication tag */
  tag: string;
}

/**
 * Get encryption key from environment.
 *
 * The key must be set in the CONNECTOR_ENCRYPTION_KEY environment variable
 * as a base64-encoded 32-byte string.
 *
 * @returns Encryption key as Buffer
 * @throws Error if key is not set
 *
 * @internal
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CONNECTOR_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'CONNECTOR_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one using: generateEncryptionKey()'
    );
  }

  // Validate key is base64 and correct length
  const keyBuffer = Buffer.from(key, 'base64');

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `Encryption key must be ${KEY_LENGTH} bytes (256 bits). ` +
        `Got ${keyBuffer.length} bytes.`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt connector credentials using AES-256-GCM.
 *
 * This provides both confidentiality and authenticity of the encrypted data.
 *
 * @param credentials - Credentials object to encrypt
 * @returns Encrypted data with ciphertext, IV, and authentication tag
 *
 * @example
 * ```typescript
 * const credentials = {
 *   apiKey: 'secret-key-123',
 *   secretKey: 'sk_live_xyz',
 * };
 *
 * const encrypted = await encryptCredentials(credentials);
 * // encrypted.ciphertext: 'base64...'
 * // encrypted.iv: 'base64...'
 * // encrypted.tag: 'base64...'
 * ```
 */
export async function encryptCredentials(
  credentials: Record<string, string>
): Promise<EncryptedData> {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Convert credentials to JSON string
  const plaintext = JSON.stringify(credentials);

  // Encrypt
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  // Get authentication tag
  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypt connector credentials using AES-256-GCM.
 *
 * @param encrypted - Encrypted data structure
 * @returns Decrypted credentials object
 * @throws Error if decryption fails or authentication fails
 *
 * @example
 * ```typescript
 * const encrypted = {
 *   ciphertext: 'base64...',
 *   iv: 'base64...',
 *   tag: 'base64...',
 * };
 *
 * const credentials = await decryptCredentials(encrypted);
 * // credentials: { apiKey: 'secret-key-123', secretKey: 'sk_live_xyz' }
 * ```
 */
export async function decryptCredentials(
  encrypted: EncryptedData
): Promise<Record<string, string>> {
  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  // Decrypt
  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  // Parse JSON
  try {
    return JSON.parse(plaintext);
  } catch (error) {
    throw new Error('Failed to parse decrypted credentials: Invalid JSON');
  }
}

/**
 * Generate a new encryption key for setup.
 *
 * This generates a cryptographically secure random 256-bit key
 * encoded as base64.
 *
 * Store this in your CONNECTOR_ENCRYPTION_KEY environment variable.
 *
 * @returns Base64-encoded encryption key
 *
 * @example
 * ```typescript
 * const key = generateEncryptionKey();
 * console.log('CONNECTOR_ENCRYPTION_KEY=' + key);
 * // CONNECTOR_ENCRYPTION_KEY=abc123...xyz
 * ```
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Validate encryption key format.
 *
 * @param key - Key to validate (base64 string)
 * @returns True if key is valid
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    const buffer = Buffer.from(key, 'base64');
    return buffer.length === KEY_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Re-encrypt credentials with a new key.
 *
 * Useful for key rotation.
 *
 * @param encrypted - Data encrypted with old key
 * @param oldKey - Old encryption key (base64)
 * @param newKey - New encryption key (base64)
 * @returns Data encrypted with new key
 *
 * @example
 * ```typescript
 * const oldKey = process.env.OLD_CONNECTOR_ENCRYPTION_KEY!;
 * const newKey = generateEncryptionKey();
 *
 * const reencrypted = await reencryptCredentials(encrypted, oldKey, newKey);
 * ```
 */
export async function reencryptCredentials(
  encrypted: EncryptedData,
  oldKey: string,
  newKey: string
): Promise<EncryptedData> {
  // Temporarily set old key
  const originalKey = process.env.CONNECTOR_ENCRYPTION_KEY;
  process.env.CONNECTOR_ENCRYPTION_KEY = oldKey;

  try {
    // Decrypt with old key
    const credentials = await decryptCredentials(encrypted);

    // Set new key
    process.env.CONNECTOR_ENCRYPTION_KEY = newKey;

    // Encrypt with new key
    return await encryptCredentials(credentials);
  } finally {
    // Restore original key
    process.env.CONNECTOR_ENCRYPTION_KEY = originalKey;
  }
}
