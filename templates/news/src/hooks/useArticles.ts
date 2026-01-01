import { useQuery } from '@tanstack/react-query';
import type { Article, Category, Author } from '@/types';

const mockCategories: Category[] = [
  { id: '1', name: 'Technology', slug: 'technology', icon: '💻', color: '#3b82f6' },
  { id: '2', name: 'Business', slug: 'business', icon: '💼', color: '#10b981' },
  { id: '3', name: 'Sports', slug: 'sports', icon: '⚽', color: '#f59e0b' },
  { id: '4', name: 'Entertainment', slug: 'entertainment', icon: '🎬', color: '#8b5cf6' },
];

const mockAuthors: Author[] = [
  { id: '1', name: 'Sarah Johnson', avatar: 'https://picsum.photos/seed/author1/100/100' },
  { id: '2', name: 'Mike Chen', avatar: 'https://picsum.photos/seed/author2/100/100' },
  { id: '3', name: 'Emily Davis', avatar: 'https://picsum.photos/seed/author3/100/100' },
];

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'The Future of AI in Mobile Development',
    summary: 'How artificial intelligence is transforming the way we build mobile applications.',
    image: 'https://picsum.photos/seed/ai-mobile/800/400',
    category: mockCategories[0],
    author: mockAuthors[0],
    publishedAt: '2 hours ago',
    readTime: 5,
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Market Update: Tech Stocks Rally',
    summary: 'Major technology companies see significant gains as investor confidence grows.',
    image: 'https://picsum.photos/seed/stocks/800/400',
    category: mockCategories[1],
    author: mockAuthors[1],
    publishedAt: '4 hours ago',
    readTime: 3,
  },
  {
    id: '3',
    title: 'Championship Finals Preview',
    summary: 'Everything you need to know about this weekend\'s biggest sporting event.',
    image: 'https://picsum.photos/seed/sports/800/400',
    category: mockCategories[2],
    author: mockAuthors[2],
    publishedAt: '6 hours ago',
    readTime: 4,
  },
  {
    id: '4',
    title: 'New Streaming Service Launches',
    summary: 'Another major player enters the competitive streaming market with exclusive content.',
    image: 'https://picsum.photos/seed/streaming/800/400',
    category: mockCategories[3],
    author: mockAuthors[0],
    publishedAt: 'Yesterday',
    readTime: 6,
  },
  {
    id: '5',
    title: 'React Native 2025: What\'s New',
    summary: 'A deep dive into the latest features and improvements in React Native.',
    image: 'https://picsum.photos/seed/react-native/800/400',
    category: mockCategories[0],
    author: mockAuthors[1],
    publishedAt: 'Yesterday',
    readTime: 8,
    isFeatured: true,
  },
];

async function fetchArticles(categorySlug?: string): Promise<Article[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (categorySlug) {
    return mockArticles.filter((a) => a.category.slug === categorySlug);
  }
  return mockArticles;
}

async function fetchFeaturedArticles(): Promise<Article[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockArticles.filter((a) => a.isFeatured);
}

async function fetchArticle(id: string): Promise<Article | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockArticles.find((a) => a.id === id);
}

export function useArticles(categorySlug?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', categorySlug],
    queryFn: () => fetchArticles(categorySlug),
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
  });

  return {
    article: data,
    isLoading,
    error,
  };
}
