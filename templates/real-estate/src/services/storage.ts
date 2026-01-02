import * as SecureStore from 'expo-secure-store';

export class StorageService {
  async save(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }

  async saveJSON<T>(key: string, value: T): Promise<void> {
    await this.save(key, JSON.stringify(value));
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }
}

export const storage = new StorageService();
