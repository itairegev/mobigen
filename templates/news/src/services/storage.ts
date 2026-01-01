import * as SecureStore from 'expo-secure-store';

class StorageService {
  async getSecure(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }

  async setSecure(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async removeSecure(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

export const storage = new StorageService();
