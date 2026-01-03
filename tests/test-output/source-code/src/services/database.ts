import * as SQLite from 'expo-sqlite';
import type { Article, Bookmark, SearchHistory } from '../types';

const DB_NAME = 'technews.db';
const DB_VERSION = 1;

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  static async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      await this.runMigrations();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Bookmarks table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        article_id TEXT UNIQUE NOT NULL,
        article_data TEXT NOT NULL,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);

    // Search history table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        results_count INTEGER DEFAULT 0
      );
    `);

    // Cache table for articles
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS article_cache (
        id TEXT PRIMARY KEY,
        article_data TEXT NOT NULL,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
      );
    `);

    // Reading progress table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        article_id TEXT PRIMARY KEY,
        progress REAL DEFAULT 0,
        last_position INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_bookmarks_saved_at ON bookmarks(saved_at);
      CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at);
      CREATE INDEX IF NOT EXISTS idx_article_cache_expires_at ON article_cache(expires_at);
    `);
  }

  private static async runMigrations(): Promise<void> {
    // Implement future database migrations here
    const userVersion = await this.db?.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = userVersion?.user_version || 0;

    if (currentVersion < DB_VERSION) {
      // Run migrations
      await this.db?.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
    }
  }

  // Bookmark operations
  static async addBookmark(bookmark: Bookmark, article: Article): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'INSERT OR REPLACE INTO bookmarks (id, article_id, article_data, saved_at, notes) VALUES (?, ?, ?, ?, ?)',
      [bookmark.id, bookmark.articleId, JSON.stringify(article), bookmark.savedAt.toISOString(), bookmark.notes || null]
    );
  }

  static async removeBookmark(articleId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM bookmarks WHERE article_id = ?', [articleId]);
  }

  static async getBookmarks(): Promise<Bookmark[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<{
      id: string;
      article_id: string;
      article_data: string;
      saved_at: string;
      notes: string | null;
    }>('SELECT * FROM bookmarks ORDER BY saved_at DESC');

    return rows.map(row => ({
      id: row.id,
      articleId: row.article_id,
      article: JSON.parse(row.article_data),
      savedAt: new Date(row.saved_at),
      notes: row.notes || undefined,
    }));
  }

  static async isBookmarked(articleId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks WHERE article_id = ?',
      [articleId]
    );

    return (result?.count || 0) > 0;
  }

  // Search history operations
  static async addSearchHistory(entry: SearchHistory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Remove existing entry with same query
    await this.db.runAsync('DELETE FROM search_history WHERE query = ?', [entry.query]);

    // Add new entry
    await this.db.runAsync(
      'INSERT INTO search_history (id, query, searched_at, results_count) VALUES (?, ?, ?, ?)',
      [entry.id, entry.query, entry.searchedAt.toISOString(), entry.resultsCount]
    );

    // Keep only last 50 entries
    await this.db.runAsync(`
      DELETE FROM search_history 
      WHERE id NOT IN (
        SELECT id FROM search_history 
        ORDER BY searched_at DESC 
        LIMIT 50
      )
    `);
  }

  static async getSearchHistory(): Promise<SearchHistory[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<{
      id: string;
      query: string;
      searched_at: string;
      results_count: number;
    }>('SELECT * FROM search_history ORDER BY searched_at DESC LIMIT 50');

    return rows.map(row => ({
      id: row.id,
      query: row.query,
      searchedAt: new Date(row.searched_at),
      resultsCount: row.results_count,
    }));
  }

  static async clearSearchHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM search_history');
  }

  // Article cache operations
  static async cacheArticle(article: Article, ttl: number = 3600000): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const expiresAt = new Date(Date.now() + ttl);

    await this.db.runAsync(
      'INSERT OR REPLACE INTO article_cache (id, article_data, cached_at, expires_at) VALUES (?, ?, ?, ?)',
      [article.id, JSON.stringify(article), new Date().toISOString(), expiresAt.toISOString()]
    );
  }

  static async getCachedArticle(id: string): Promise<Article | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<{
      article_data: string;
      expires_at: string;
    }>('SELECT article_data, expires_at FROM article_cache WHERE id = ?', [id]);

    if (!row) return null;

    // Check if cache is expired
    if (new Date(row.expires_at) < new Date()) {
      await this.db.runAsync('DELETE FROM article_cache WHERE id = ?', [id]);
      return null;
    }

    return JSON.parse(row.article_data);
  }

  static async clearExpiredCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM article_cache WHERE expires_at < ?', [new Date().toISOString()]);
  }

  // Reading progress operations
  static async updateReadingProgress(articleId: string, progress: number, position: number = 0): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'INSERT OR REPLACE INTO reading_progress (article_id, progress, last_position, updated_at) VALUES (?, ?, ?, ?)',
      [articleId, progress, position, new Date().toISOString()]
    );
  }

  static async getReadingProgress(articleId: string): Promise<{ progress: number; lastPosition: number } | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<{
      progress: number;
      last_position: number;
    }>('SELECT progress, last_position FROM reading_progress WHERE article_id = ?', [articleId]);

    return row ? { progress: row.progress, lastPosition: row.last_position } : null;
  }

  // Database maintenance
  static async vacuum(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync('VACUUM');
  }

  static async getStats(): Promise<{
    bookmarks: number;
    searchHistory: number;
    cachedArticles: number;
    readingProgress: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const [bookmarks, searchHistory, cachedArticles, readingProgress] = await Promise.all([
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bookmarks'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM search_history'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM article_cache'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM reading_progress'),
    ]);

    return {
      bookmarks: bookmarks?.count || 0,
      searchHistory: searchHistory?.count || 0,
      cachedArticles: cachedArticles?.count || 0,
      readingProgress: readingProgress?.count || 0,
    };
  }

  static async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export default DatabaseService;