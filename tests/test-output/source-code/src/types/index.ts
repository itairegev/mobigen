export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  description?: string;
  content: string;
  author?: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  readingTime?: number;
  categoryId: string;
  category?: Category;
  tags?: string[];
  isBookmarked: boolean;
  isCached: boolean;
  cachedAt?: string;
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
}

export interface UserPreferences {
  id: string;
  userId?: string;
  preferredCategories?: string[];
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  readingSpeed: number;
  fontSize: string;
  autoDownload: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  id: string;
  articleId: string;
  userId?: string;
  progressPercent: number;
  readingTimeSpent: number;
  isCompleted: boolean;
  lastReadAt: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  articleId: string;
  savedAt: Date;
}

// Legacy type for backward compatibility
export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}
