/**
 * News API Integration for News Template
 *
 * Supports multiple news API providers:
 * - GNews API (100 requests/day free)
 * - NewsAPI.org (100 requests/day free - dev only)
 * - Currents API (free, no key required for basic use)
 *
 * Falls back to mock data when no API key is configured
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article, Category, Author } from '@/types';

const CACHE_PREFIX = 'news_';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CACHE HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_DURATION) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type NewsCategory =
  | 'general'
  | 'business'
  | 'entertainment'
  | 'health'
  | 'science'
  | 'sports'
  | 'technology';

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

interface CurrentsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
  published: string;
  author: string | null;
  category: string[];
  language: string;
}

interface CurrentsResponse {
  status: string;
  news: CurrentsArticle[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CATEGORY MAPPINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORY_CONFIG: Record<NewsCategory, { icon: string; color: string }> = {
  general: { icon: '📰', color: '#6b7280' },
  business: { icon: '💼', color: '#10b981' },
  entertainment: { icon: '🎬', color: '#8b5cf6' },
  health: { icon: '🏥', color: '#ef4444' },
  science: { icon: '🔬', color: '#3b82f6' },
  sports: { icon: '⚽', color: '#f59e0b' },
  technology: { icon: '💻', color: '#06b6d4' },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVERSION HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content?.split(/\s+/).length || 100;
  return Math.max(2, Math.ceil(words / wordsPerMinute));
}

function createAuthor(sourceName: string, authorName?: string | null): Author {
  return {
    id: sourceName.toLowerCase().replace(/\s+/g, '-'),
    name: authorName || sourceName,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || sourceName)}&background=random`,
  };
}

function gNewsToArticle(article: GNewsArticle, index: number, category: NewsCategory): Article {
  const categoryConfig = CATEGORY_CONFIG[category];

  return {
    id: `gnews_${Date.now()}_${index}`,
    title: article.title,
    summary: article.description || '',
    content: article.content || article.description,
    image: article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    category: {
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      slug: category,
      icon: categoryConfig.icon,
      color: categoryConfig.color,
    },
    author: createAuthor(article.source.name),
    publishedAt: formatTimeAgo(article.publishedAt),
    readTime: estimateReadTime(article.content || ''),
    isFeatured: index < 2,
  };
}

function currentsToArticle(article: CurrentsArticle, index: number): Article {
  const categorySlug = (article.category?.[0]?.toLowerCase() || 'general') as NewsCategory;
  const categoryConfig = CATEGORY_CONFIG[categorySlug] || CATEGORY_CONFIG.general;

  return {
    id: article.id || `currents_${Date.now()}_${index}`,
    title: article.title,
    summary: article.description || '',
    content: article.description,
    image: article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    category: {
      id: categorySlug,
      name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      slug: categorySlug,
      icon: categoryConfig.icon,
      color: categoryConfig.color,
    },
    author: createAuthor('Currents News', article.author),
    publishedAt: formatTimeAgo(article.published),
    readTime: estimateReadTime(article.description || ''),
    isFeatured: index < 2,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GNEWS API (with API key)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GNEWS_BASE = 'https://gnews.io/api/v4';

async function fetchGNewsHeadlines(
  category: NewsCategory = 'general',
  max = 10
): Promise<Article[]> {
  const apiKey = process.env.EXPO_PUBLIC_GNEWS_API_KEY;
  if (!apiKey) return [];

  const cacheKey = `gnews_${category}_${max}`;
  const cached = await getFromCache<Article[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${GNEWS_BASE}/top-headlines?token=${apiKey}&lang=en&country=us&topic=${category}&max=${max}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: GNewsResponse = await response.json();
    const articles = data.articles.map((a, i) => gNewsToArticle(a, i, category));

    await setCache(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error('GNews API error:', error);
    return [];
  }
}

async function searchGNews(query: string, max = 10): Promise<Article[]> {
  const apiKey = process.env.EXPO_PUBLIC_GNEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `${GNEWS_BASE}/search?token=${apiKey}&q=${encodeURIComponent(query)}&lang=en&max=${max}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: GNewsResponse = await response.json();
    return data.articles.map((a, i) => gNewsToArticle(a, i, 'general'));
  } catch (error) {
    console.error('GNews search error:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CURRENTS API (Free, no key required for basic use)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CURRENTS_BASE = 'https://api.currentsapi.services/v1';

async function fetchCurrentsNews(category?: string): Promise<Article[]> {
  const apiKey = process.env.EXPO_PUBLIC_CURRENTS_API_KEY;
  const cacheKey = `currents_${category || 'latest'}`;
  const cached = await getFromCache<Article[]>(cacheKey);
  if (cached) return cached;

  try {
    let url: string;
    if (apiKey) {
      url = category
        ? `${CURRENTS_BASE}/latest-news?apiKey=${apiKey}&language=en&category=${category}`
        : `${CURRENTS_BASE}/latest-news?apiKey=${apiKey}&language=en`;
    } else {
      // Use demo endpoint (limited)
      url = `${CURRENTS_BASE}/latest-news?language=en`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: CurrentsResponse = await response.json();
    const articles = data.news
      .filter(n => n.title && n.description)
      .slice(0, 15)
      .map((a, i) => currentsToArticle(a, i));

    await setCache(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error('Currents API error:', error);
    return [];
  }
}

async function searchCurrents(query: string): Promise<Article[]> {
  const apiKey = process.env.EXPO_PUBLIC_CURRENTS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `${CURRENTS_BASE}/search?apiKey=${apiKey}&keywords=${encodeURIComponent(query)}&language=en`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: CurrentsResponse = await response.json();
    return data.news
      .filter(n => n.title && n.description)
      .slice(0, 10)
      .map((a, i) => currentsToArticle(a, i));
  } catch (error) {
    console.error('Currents search error:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get all news categories
 */
export async function getNewsCategories(): Promise<Category[]> {
  const categories: NewsCategory[] = [
    'general',
    'technology',
    'business',
    'sports',
    'entertainment',
    'health',
    'science',
  ];

  return categories.map((slug) => ({
    id: slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    slug,
    icon: CATEGORY_CONFIG[slug].icon,
    color: CATEGORY_CONFIG[slug].color,
  }));
}

/**
 * Get news articles by category
 */
export async function getNewsArticles(categorySlug?: string): Promise<Article[]> {
  const category = (categorySlug || 'general') as NewsCategory;

  // Try GNews first (if API key available)
  const gnewsArticles = await fetchGNewsHeadlines(category, 15);
  if (gnewsArticles.length > 0) {
    return gnewsArticles;
  }

  // Try Currents API as fallback
  const currentsArticles = await fetchCurrentsNews(categorySlug);
  if (currentsArticles.length > 0) {
    return currentsArticles;
  }

  return [];
}

/**
 * Get featured articles
 */
export async function getFeaturedArticles(): Promise<Article[]> {
  // Get top headlines
  const articles = await getNewsArticles('general');

  // Return first 3 as featured
  return articles.slice(0, 3).map(a => ({ ...a, isFeatured: true }));
}

/**
 * Get a single article by ID
 */
export async function getArticleById(id: string): Promise<Article | null> {
  // Since news APIs don't have a single article endpoint,
  // we search through cached articles
  const categories: NewsCategory[] = ['general', 'technology', 'business', 'sports', 'entertainment'];

  for (const category of categories) {
    const cacheKey = `gnews_${category}_15`;
    const cached = await getFromCache<Article[]>(cacheKey);
    if (cached) {
      const found = cached.find(a => a.id === id);
      if (found) return found;
    }

    const currentsKey = `currents_${category}`;
    const currentsCached = await getFromCache<Article[]>(currentsKey);
    if (currentsCached) {
      const found = currentsCached.find(a => a.id === id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Search news articles
 */
export async function searchNews(query: string): Promise<Article[]> {
  if (!query.trim()) return [];

  // Try GNews search
  const gnewsResults = await searchGNews(query);
  if (gnewsResults.length > 0) {
    return gnewsResults;
  }

  // Try Currents search
  const currentsResults = await searchCurrents(query);
  if (currentsResults.length > 0) {
    return currentsResults;
  }

  return [];
}

/**
 * Get articles from multiple categories (for discover page)
 */
export async function getDiscoverArticles(): Promise<Article[]> {
  const categories: NewsCategory[] = ['technology', 'business', 'sports', 'entertainment'];
  const allArticles: Article[] = [];

  for (const category of categories) {
    const articles = await getNewsArticles(category);
    allArticles.push(...articles.slice(0, 4));
  }

  // Shuffle and return
  return allArticles.sort(() => Math.random() - 0.5);
}

// Export category list
export const NEWS_CATEGORIES: NewsCategory[] = [
  'general',
  'business',
  'entertainment',
  'health',
  'science',
  'sports',
  'technology',
];
