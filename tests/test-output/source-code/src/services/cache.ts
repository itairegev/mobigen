import StorageService from './storage';
import type { CacheEntry } from '../types';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  strategy?: 'memory' | 'storage' | 'hybrid';
  maxSize?: number; // Maximum cache size in MB
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private maxMemorySize: number;
  private currentMemorySize = 0;

  constructor(maxMemorySize: number = 10) { // 10MB default
    this.maxMemorySize = maxMemorySize * 1024 * 1024; // Convert to bytes
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Approximate size in bytes (UTF-16)
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    
    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        const entrySize = this.calculateSize(entry.data);
        this.memoryCache.delete(key);
        this.currentMemorySize -= entrySize;
      }
    }

    // Remove oldest entries if still over limit
    if (this.currentMemorySize > this.maxMemorySize) {
      const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (const [key, entry] of sortedEntries) {
        const entrySize = this.calculateSize(entry.data);
        this.memoryCache.delete(key);
        this.currentMemorySize -= entrySize;
        
        if (this.currentMemorySize <= this.maxMemorySize * 0.8) { // Leave some headroom
          break;
        }
      }
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      strategy = 'hybrid'
    } = options;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      switch (strategy) {
        case 'memory':
          await this.setMemory(key, entry);
          break;
        case 'storage':
          await this.setStorage(key, entry);
          break;
        case 'hybrid':
        default:
          // Store in memory for fast access
          await this.setMemory(key, entry);
          // Also store in persistent storage for longer-term caching
          await this.setStorage(key, entry);
          break;
      }
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { strategy = 'hybrid' } = options;

    try {
      switch (strategy) {
        case 'memory':
          return await this.getMemory<T>(key);
        case 'storage':
          return await this.getStorage<T>(key);
        case 'hybrid':
        default:
          // Try memory first (faster)
          let data = await this.getMemory<T>(key);
          if (data !== null) return data;
          
          // Fallback to storage
          data = await this.getStorage<T>(key);
          if (data !== null) {
            // Restore to memory cache
            const entry: CacheEntry<T> = {
              data,
              timestamp: Date.now(),
              ttl: 5 * 60 * 1000, // Default TTL for restored entries
            };
            await this.setMemory(key, entry);
          }
          return data;
      }
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  private async setMemory<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const entrySize = this.calculateSize(entry.data);
    
    // Clean up if needed
    if (this.currentMemorySize + entrySize > this.maxMemorySize) {
      this.cleanupMemoryCache();
    }

    // Remove existing entry if present
    if (this.memoryCache.has(key)) {
      const existingSize = this.calculateSize(this.memoryCache.get(key)!.data);
      this.currentMemorySize -= existingSize;
    }

    this.memoryCache.set(key, entry);
    this.currentMemorySize += entrySize;
  }

  private async getMemory<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      const entrySize = this.calculateSize(entry.data);
      this.memoryCache.delete(key);
      this.currentMemorySize -= entrySize;
      return null;
    }

    return entry.data;
  }

  private async setStorage<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    await StorageService.setCacheItem(key, entry.data, entry.ttl);
  }

  private async getStorage<T>(key: string): Promise<T | null> {
    return await StorageService.getCacheItem<T>(key);
  }

  async invalidate(key: string): Promise<void> {
    // Remove from memory
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      const entrySize = this.calculateSize(entry.data);
      this.memoryCache.delete(key);
      this.currentMemorySize -= entrySize;
    }

    // Remove from storage
    try {
      await StorageService.removeItem(`@technews_cache_${key}`);
    } catch (error) {
      console.warn('Storage invalidation error:', error);
    }
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.currentMemorySize = 0;

    // Clear storage cache
    try {
      await StorageService.clearCache();
    } catch (error) {
      console.warn('Storage clear error:', error);
    }
  }

  async invalidatePattern(pattern: RegExp): Promise<void> {
    // Invalidate memory cache
    const memoryKeys = Array.from(this.memoryCache.keys());
    for (const key of memoryKeys) {
      if (pattern.test(key)) {
        await this.invalidate(key);
      }
    }
  }

  getStats(): {
    memoryEntries: number;
    memorySize: number;
    maxMemorySize: number;
    memoryUsagePercent: number;
  } {
    return {
      memoryEntries: this.memoryCache.size,
      memorySize: this.currentMemorySize,
      maxMemorySize: this.maxMemorySize,
      memoryUsagePercent: (this.currentMemorySize / this.maxMemorySize) * 100,
    };
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Export cache utility functions
export const Cache = {
  set: <T>(key: string, data: T, options?: CacheOptions) => 
    cacheManager.set(key, data, options),
    
  get: <T>(key: string, options?: CacheOptions) => 
    cacheManager.get<T>(key, options),
    
  invalidate: (key: string) => 
    cacheManager.invalidate(key),
    
  clear: () => 
    cacheManager.clear(),
    
  invalidatePattern: (pattern: RegExp) => 
    cacheManager.invalidatePattern(pattern),
    
  getStats: () => 
    cacheManager.getStats(),
};

export default Cache;