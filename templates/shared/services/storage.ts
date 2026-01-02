/**
 * Storage Service
 *
 * Provides a unified interface for storing and retrieving data locally.
 * Uses AsyncStorage for persistent storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  /**
   * Store a value
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  /**
   * Retrieve a value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  /**
   * Remove a value
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }

  /**
   * Clear all stored values
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error('Storage has error:', error);
      return false;
    }
  }

  /**
   * Store multiple values at once
   */
  async setMultiple(items: Array<[string, any]>): Promise<void> {
    try {
      const stringItems = items.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(stringItems as [string, string][]);
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      throw error;
    }
  }

  /**
   * Retrieve multiple values at once
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result: Record<string, T | null> = {};

      values.forEach(([key, value]) => {
        result[key] = value ? JSON.parse(value) : null;
      });

      return result;
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  }

  /**
   * Remove multiple keys at once
   */
  async removeMultiple(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Storage removeMultiple error:', error);
      throw error;
    }
  }
}

export const storage = new StorageService();
