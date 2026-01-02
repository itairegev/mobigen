import * as SecureStore from 'expo-secure-store';

/**
 * Storage service for persisting data locally
 */

export const storage = {
  /**
   * Save a value to secure storage
   */
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  /**
   * Get a value from secure storage
   */
  async get(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  /**
   * Remove a value from secure storage
   */
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  /**
   * Save JSON data
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  },

  /**
   * Get JSON data
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
  },
};
