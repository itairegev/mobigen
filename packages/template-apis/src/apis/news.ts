/**
 * News API Clients
 *
 * Multiple news API options:
 * 1. NewsAPI.org - 100 requests/day free (requires API key)
 * 2. GNews - 100 requests/day free (requires API key)
 * 3. NewsData.io - 200 requests/day free (requires API key)
 *
 * For demo purposes, we also include a mock news generator
 */

import { TemplateApiClient, createApiClient } from '../client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url?: string;
  };
  author?: string;
  category?: string;
}

export type NewsCategory =
  | 'general'
  | 'business'
  | 'entertainment'
  | 'health'
  | 'science'
  | 'sports'
  | 'technology';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GNEWS API (Recommended - generous free tier)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

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

export class GNewsClient {
  private client: TemplateApiClient;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = createApiClient(GNEWS_BASE_URL, undefined, {
      cacheTime: 15 * 60 * 1000, // 15 minute cache
    });
  }

  private normalizeArticle(article: GNewsArticle, index: number): NewsArticle {
    return {
      id: `gnews_${Date.now()}_${index}`,
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      image: article.image,
      publishedAt: article.publishedAt,
      source: article.source,
    };
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(params?: {
    category?: NewsCategory;
    country?: string;
    max?: number;
  }): Promise<NewsArticle[]> {
    const response = await this.client.get<GNewsResponse>('/top-headlines', {
      params: {
        token: this.apiKey,
        lang: 'en',
        country: params?.country ?? 'us',
        topic: params?.category,
        max: params?.max ?? 10,
      },
      cacheKey: `gnews_headlines_${params?.category ?? 'general'}_${params?.country ?? 'us'}`,
    });

    return response.articles.map((a, i) => this.normalizeArticle(a, i));
  }

  /**
   * Search news articles
   */
  async searchNews(query: string, max = 10): Promise<NewsArticle[]> {
    const response = await this.client.get<GNewsResponse>('/search', {
      params: {
        token: this.apiKey,
        q: query,
        lang: 'en',
        max,
      },
      cacheKey: `gnews_search_${query.toLowerCase()}`,
    });

    return response.articles.map((a, i) => this.normalizeArticle(a, i));
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEWSAPI.ORG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';

interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export class NewsApiClient {
  private client: TemplateApiClient;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = createApiClient(NEWSAPI_BASE_URL, undefined, {
      cacheTime: 15 * 60 * 1000,
    });
  }

  private normalizeArticle(article: NewsApiArticle, index: number): NewsArticle {
    return {
      id: `newsapi_${Date.now()}_${index}`,
      title: article.title,
      description: article.description || '',
      content: article.content || article.description || '',
      url: article.url,
      image: article.urlToImage,
      publishedAt: article.publishedAt,
      source: { name: article.source.name },
      author: article.author || undefined,
    };
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(params?: {
    category?: NewsCategory;
    country?: string;
    pageSize?: number;
  }): Promise<NewsArticle[]> {
    const response = await this.client.get<NewsApiResponse>('/top-headlines', {
      params: {
        apiKey: this.apiKey,
        country: params?.country ?? 'us',
        category: params?.category,
        pageSize: params?.pageSize ?? 10,
      },
      cacheKey: `newsapi_headlines_${params?.category ?? 'general'}`,
    });

    return response.articles
      .filter(a => a.title !== '[Removed]')
      .map((a, i) => this.normalizeArticle(a, i));
  }

  /**
   * Search news articles
   */
  async searchNews(query: string, pageSize = 10): Promise<NewsArticle[]> {
    const response = await this.client.get<NewsApiResponse>('/everything', {
      params: {
        apiKey: this.apiKey,
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize,
      },
      cacheKey: `newsapi_search_${query.toLowerCase()}`,
    });

    return response.articles
      .filter(a => a.title !== '[Removed]')
      .map((a, i) => this.normalizeArticle(a, i));
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEMO/MOCK NEWS (For testing without API key)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Tech Giants Report Record Earnings Amid AI Boom',
    description: 'Major technology companies are seeing unprecedented growth driven by artificial intelligence investments.',
    content: 'In a remarkable quarter for the technology sector, leading companies have reported earnings that exceeded analyst expectations. The surge is largely attributed to increased demand for AI-powered products and services.',
    url: 'https://example.com/tech-earnings',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Tech Daily' },
    category: 'technology',
  },
  {
    id: '2',
    title: 'Global Markets Rally on Economic Optimism',
    description: 'Stock markets around the world are experiencing gains as investors grow more confident about the economic outlook.',
    content: 'Global stock markets rallied today as positive economic data from major economies boosted investor confidence. The rally was broad-based, with gains seen across multiple sectors.',
    url: 'https://example.com/markets-rally',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Financial Times' },
    category: 'business',
  },
  {
    id: '3',
    title: 'Breakthrough in Renewable Energy Storage',
    description: 'Scientists announce a major advancement in battery technology that could revolutionize solar and wind power storage.',
    content: 'Researchers have developed a new type of battery that can store renewable energy more efficiently and at lower cost than existing solutions. This breakthrough could accelerate the transition to clean energy.',
    url: 'https://example.com/energy-breakthrough',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Science Today' },
    category: 'science',
  },
  {
    id: '4',
    title: 'New Study Links Exercise to Improved Mental Health',
    description: 'Research confirms that regular physical activity can significantly reduce symptoms of anxiety and depression.',
    content: 'A comprehensive study involving thousands of participants has found strong evidence that regular exercise can improve mental health outcomes. Experts recommend at least 30 minutes of moderate activity daily.',
    url: 'https://example.com/exercise-mental-health',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Health Weekly' },
    category: 'health',
  },
  {
    id: '5',
    title: 'Major League Championship Heads to Game 7',
    description: 'The exciting series is tied 3-3, setting up a decisive final game this weekend.',
    content: 'In one of the most thrilling championship series in recent memory, both teams have pushed each other to the limit. Game 7 promises to be an unforgettable showdown.',
    url: 'https://example.com/championship-game7',
    image: 'https://images.unsplash.com/photo-1461896836934- voices-08aa5ade8a9b?w=800',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Sports Network' },
    category: 'sports',
  },
  {
    id: '6',
    title: 'Award Season Kicks Off with Surprise Nominations',
    description: 'This year\'s award nominations feature several unexpected choices that have delighted critics and fans.',
    content: 'The award season is officially underway, with nominations announced for the industry\'s top honors. Several breakthrough performances have received recognition alongside established stars.',
    url: 'https://example.com/award-nominations',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Entertainment Now' },
    category: 'entertainment',
  },
  {
    id: '7',
    title: 'Space Agency Announces New Mars Mission',
    description: 'An ambitious plan to send humans to Mars by 2035 has been unveiled by space exploration officials.',
    content: 'Space agency officials outlined their roadmap for human Mars exploration, including new spacecraft designs and international partnerships that will make the historic mission possible.',
    url: 'https://example.com/mars-mission',
    image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Space News' },
    category: 'science',
  },
  {
    id: '8',
    title: 'Electric Vehicle Sales Surge Worldwide',
    description: 'EV sales have doubled compared to last year as more consumers make the switch to electric transportation.',
    content: 'The electric vehicle market continues its rapid expansion, with sales figures showing dramatic year-over-year growth. Improved range, falling prices, and expanded charging infrastructure are driving adoption.',
    url: 'https://example.com/ev-sales-surge',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    source: { name: 'Auto Weekly' },
    category: 'technology',
  },
];

export class MockNewsClient {
  /**
   * Get mock headlines by category
   */
  async getTopHeadlines(params?: {
    category?: NewsCategory;
    max?: number;
  }): Promise<NewsArticle[]> {
    await new Promise(r => setTimeout(r, 300)); // Simulate network delay

    let articles = [...MOCK_NEWS];

    if (params?.category && params.category !== 'general') {
      articles = articles.filter(a => a.category === params.category);
    }

    return articles.slice(0, params?.max ?? 10);
  }

  /**
   * Search mock news
   */
  async searchNews(query: string, max = 10): Promise<NewsArticle[]> {
    await new Promise(r => setTimeout(r, 300));

    const lowerQuery = query.toLowerCase();
    return MOCK_NEWS.filter(
      a =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.description.toLowerCase().includes(lowerQuery)
    ).slice(0, max);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED NEWS CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type NewsProvider = 'gnews' | 'newsapi' | 'mock';

interface NewsClientConfig {
  provider: NewsProvider;
  apiKey?: string;
}

export function createNewsClient(config: NewsClientConfig) {
  switch (config.provider) {
    case 'gnews':
      if (!config.apiKey) throw new Error('GNews requires an API key');
      return new GNewsClient(config.apiKey);
    case 'newsapi':
      if (!config.apiKey) throw new Error('NewsAPI requires an API key');
      return new NewsApiClient(config.apiKey);
    case 'mock':
    default:
      return new MockNewsClient();
  }
}

// Helper: Get news client based on environment
export function getNewsClient(): GNewsClient | NewsApiClient | MockNewsClient {
  const gnewsKey = process.env.EXPO_PUBLIC_GNEWS_API_KEY;
  const newsapiKey = process.env.EXPO_PUBLIC_NEWSAPI_KEY;

  if (gnewsKey) {
    return new GNewsClient(gnewsKey);
  }
  if (newsapiKey) {
    return new NewsApiClient(newsapiKey);
  }

  // Fallback to mock
  return new MockNewsClient();
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
