export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  image: string;
  category: Category;
  author: Author;
  publishedAt: string;
  readTime: number;
  isFeatured?: boolean;
  isBookmarked?: boolean;
}

export interface Bookmark {
  id: string;
  articleId: string;
  savedAt: Date;
}

export interface UserPreferences {
  categories: string[];
  notificationsEnabled: boolean;
  darkMode: boolean;
}
