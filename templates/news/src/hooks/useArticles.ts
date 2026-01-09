import { useQuery } from '@tanstack/react-query';
import type { Article, Category, Author } from '@/types';
import {
  getNewsCategories,
  getNewsArticles,
  getFeaturedArticles,
  getArticleById,
  searchNews,
  getDiscoverArticles,
} from '@/services/news-api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA (Fallback when API unavailable)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mockCategories: Category[] = [
  { id: 'technology', name: 'Technology', slug: 'technology', icon: '💻', color: '#3b82f6' },
  { id: 'business', name: 'Business', slug: 'business', icon: '💼', color: '#10b981' },
  { id: 'sports', name: 'Sports', slug: 'sports', icon: '⚽', color: '#f59e0b' },
  { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', icon: '🎬', color: '#8b5cf6' },
  { id: 'health', name: 'Health', slug: 'health', icon: '🏥', color: '#ef4444' },
  { id: 'science', name: 'Science', slug: 'science', icon: '🔬', color: '#06b6d4' },
];

const mockAuthors: Author[] = [
  { id: '1', name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=3b82f6' },
  { id: '2', name: 'Mike Chen', avatar: 'https://ui-avatars.com/api/?name=Mike+Chen&background=10b981' },
  { id: '3', name: 'Emily Davis', avatar: 'https://ui-avatars.com/api/?name=Emily+Davis&background=f59e0b' },
  { id: '4', name: 'James Wilson', avatar: 'https://ui-avatars.com/api/?name=James+Wilson&background=8b5cf6' },
];

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'The Future of AI in Mobile Development',
    summary: 'How artificial intelligence is transforming the way we build mobile applications and what developers need to know.',
    content: 'Artificial intelligence is revolutionizing mobile development. From code generation to automated testing, AI tools are becoming indispensable for modern developers. This comprehensive guide explores the latest trends and technologies shaping the future of mobile app development.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    category: mockCategories[0],
    author: mockAuthors[0],
    publishedAt: '2 hours ago',
    readTime: 5,
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Market Update: Tech Stocks Rally Amid Economic Optimism',
    summary: 'Major technology companies see significant gains as investor confidence grows following positive economic indicators.',
    content: 'Global markets rallied today as positive economic data boosted investor sentiment. Technology stocks led the advance, with major companies posting impressive gains. Analysts attribute the rally to strong earnings reports and optimistic projections for the coming quarter.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    category: mockCategories[1],
    author: mockAuthors[1],
    publishedAt: '4 hours ago',
    readTime: 3,
    isFeatured: true,
  },
  {
    id: '3',
    title: 'Championship Finals Preview: Everything You Need to Know',
    summary: 'A comprehensive preview of this weekend\'s biggest sporting event with expert analysis and predictions.',
    content: 'The championship series reaches its climax this weekend with Game 7. Both teams have shown remarkable determination throughout the playoffs. Our experts break down the key matchups and offer their predictions for what promises to be an unforgettable finale.',
    image: 'https://images.unsplash.com/photo-1461896836934-08aa5ade8a9b?w=800',
    category: mockCategories[2],
    author: mockAuthors[2],
    publishedAt: '6 hours ago',
    readTime: 4,
  },
  {
    id: '4',
    title: 'New Streaming Service Launches with Exclusive Content',
    summary: 'Another major player enters the competitive streaming market with an impressive lineup of original shows and movies.',
    content: 'The streaming wars heat up with the launch of a new platform featuring exclusive content from renowned creators. The service promises a fresh approach to content delivery with innovative features designed to enhance the viewing experience.',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800',
    category: mockCategories[3],
    author: mockAuthors[0],
    publishedAt: 'Yesterday',
    readTime: 6,
  },
  {
    id: '5',
    title: 'Breakthrough in Renewable Energy Storage Technology',
    summary: 'Scientists announce major advancement in battery technology that could revolutionize solar and wind power storage.',
    content: 'Researchers have developed a new type of battery that can store renewable energy more efficiently and at significantly lower cost than existing solutions. This breakthrough could accelerate the global transition to clean energy sources.',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
    category: mockCategories[5],
    author: mockAuthors[3],
    publishedAt: 'Yesterday',
    readTime: 7,
  },
  {
    id: '6',
    title: 'New Study Links Regular Exercise to Better Mental Health',
    summary: 'Research confirms that physical activity significantly reduces symptoms of anxiety and depression in adults.',
    content: 'A comprehensive study involving thousands of participants has established a strong link between regular exercise and improved mental health outcomes. The research suggests that even moderate physical activity can have profound positive effects on psychological well-being.',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    category: mockCategories[4],
    author: mockAuthors[1],
    publishedAt: '2 days ago',
    readTime: 5,
  },
  {
    id: '7',
    title: 'React Native 2025: What\'s New and What\'s Coming',
    summary: 'A deep dive into the latest features, performance improvements, and roadmap for React Native.',
    content: 'React Native continues to evolve with exciting new features and significant performance improvements. This comprehensive guide covers everything developers need to know about the latest version and what to expect in future releases.',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    category: mockCategories[0],
    author: mockAuthors[2],
    publishedAt: '2 days ago',
    readTime: 8,
    isFeatured: true,
  },
  {
    id: '8',
    title: 'Electric Vehicle Sales Surge as Prices Drop',
    summary: 'EV sales double year-over-year as improved technology and lower prices attract mainstream consumers.',
    content: 'The electric vehicle market continues its rapid expansion, with sales figures showing dramatic year-over-year growth. Falling battery costs and improved charging infrastructure are making EVs more accessible to mainstream consumers.',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    category: mockCategories[1],
    author: mockAuthors[3],
    publishedAt: '3 days ago',
    readTime: 4,
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA FETCHING FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchArticles(categorySlug?: string): Promise<Article[]> {
  try {
    const articles = await getNewsArticles(categorySlug);
    if (articles.length > 0) {
      return articles;
    }
  } catch (error) {
    console.warn('Failed to fetch articles from API:', error);
  }

  // Fallback to mock data
  if (categorySlug) {
    return mockArticles.filter((a) => a.category.slug === categorySlug);
  }
  return mockArticles;
}

async function fetchFeaturedArticles(): Promise<Article[]> {
  try {
    const featured = await getFeaturedArticles();
    if (featured.length > 0) {
      return featured;
    }
  } catch (error) {
    console.warn('Failed to fetch featured articles:', error);
  }

  return mockArticles.filter((a) => a.isFeatured);
}

async function fetchArticle(id: string): Promise<Article | undefined> {
  try {
    const article = await getArticleById(id);
    if (article) {
      return article;
    }
  } catch (error) {
    console.warn('Failed to fetch article:', error);
  }

  return mockArticles.find((a) => a.id === id);
}

async function fetchSearchResults(query: string): Promise<Article[]> {
  if (!query.trim()) return [];

  try {
    const results = await searchNews(query);
    if (results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn('Failed to search articles:', error);
  }

  // Fallback to mock search
  const lowerQuery = query.toLowerCase();
  return mockArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.summary.toLowerCase().includes(lowerQuery)
  );
}

async function fetchDiscoverArticles(): Promise<Article[]> {
  try {
    const articles = await getDiscoverArticles();
    if (articles.length > 0) {
      return articles;
    }
  } catch (error) {
    console.warn('Failed to fetch discover articles:', error);
  }

  // Fallback: shuffle mock articles
  return [...mockArticles].sort(() => Math.random() - 0.5);
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const categories = await getNewsCategories();
    if (categories.length > 0) {
      return categories;
    }
  } catch (error) {
    console.warn('Failed to fetch categories:', error);
  }

  return mockCategories;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useArticles(categorySlug?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', categorySlug],
    queryFn: () => fetchArticles(categorySlug),
    staleTime: 10 * 60 * 1000, // 10 minutes - news should be relatively fresh
  });

  return {
    articles: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useFeaturedArticles() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', 'featured'],
    queryFn: fetchFeaturedArticles,
    staleTime: 10 * 60 * 1000,
  });

  return {
    featuredArticles: data || [],
    isLoading,
    error,
  };
}

export function useArticle(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  });

  return {
    article: data,
    isLoading,
    error,
  };
}

export function useSearchArticles(query: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', 'search', query],
    queryFn: () => fetchSearchResults(query),
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000,
  });

  return {
    results: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useDiscoverArticles() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', 'discover'],
    queryFn: fetchDiscoverArticles,
    staleTime: 15 * 60 * 1000,
  });

  return {
    articles: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000, // 1 hour - categories don't change often
  });

  return {
    categories: data || mockCategories,
    isLoading,
    error,
  };
}
