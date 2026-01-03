import { useQuery } from '@tanstack/react-query';
import type { Article, Category, Author } from '@/types';

const mockCategories: Category[] = [
  { 
    id: '1', 
    name: 'AI & Machine Learning', 
    slug: 'ai-ml', 
    icon: '🤖', 
    color: '#2563eb', 
    isActive: true, 
    sortOrder: 1, 
    createdAt: new Date().toISOString(),
    description: 'Latest in artificial intelligence and machine learning'
  },
  { 
    id: '2', 
    name: 'Mobile Development', 
    slug: 'mobile', 
    icon: '📱', 
    color: '#059669', 
    isActive: true, 
    sortOrder: 2, 
    createdAt: new Date().toISOString(),
    description: 'Mobile app development news and trends'
  },
  { 
    id: '3', 
    name: 'Web Development', 
    slug: 'web-dev', 
    icon: '🌐', 
    color: '#7c3aed', 
    isActive: true, 
    sortOrder: 3, 
    createdAt: new Date().toISOString(),
    description: 'Web technologies and frameworks'
  },
  { 
    id: '4', 
    name: 'Startups', 
    slug: 'startups', 
    icon: '🚀', 
    color: '#dc2626', 
    isActive: true, 
    sortOrder: 4, 
    createdAt: new Date().toISOString(),
    description: 'Startup news and entrepreneurship'
  },
  { 
    id: '5', 
    name: 'Cybersecurity', 
    slug: 'cybersecurity', 
    icon: '🔒', 
    color: '#ea580c', 
    isActive: true, 
    sortOrder: 5, 
    createdAt: new Date().toISOString(),
    description: 'Security news and best practices'
  },
];

const mockAuthors: Author[] = [
  { id: '1', name: 'Sarah Johnson', avatar: 'https://picsum.photos/seed/author1/100/100', bio: 'Senior Tech Writer at TechCrunch' },
  { id: '2', name: 'Mike Chen', avatar: 'https://picsum.photos/seed/author2/100/100', bio: 'AI Research Journalist' },
  { id: '3', name: 'Emily Davis', avatar: 'https://picsum.photos/seed/author3/100/100', bio: 'Mobile Development Expert' },
  { id: '4', name: 'Alex Kumar', avatar: 'https://picsum.photos/seed/author4/100/100', bio: 'Cybersecurity Analyst' },
  { id: '5', name: 'Jessica Wong', avatar: 'https://picsum.photos/seed/author5/100/100', bio: 'Startup Reporter' },
];

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'OpenAI Releases GPT-5: Revolutionary Breakthrough in AI Reasoning',
    description: 'The latest GPT model demonstrates unprecedented problem-solving capabilities and multimodal understanding.',
    content: 'OpenAI has announced the release of GPT-5, marking a significant leap in artificial intelligence capabilities. The new model demonstrates remarkable improvements in reasoning, problem-solving, and multimodal understanding...',
    author: 'Sarah Johnson',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com/gpt5-release',
    imageUrl: 'https://picsum.photos/seed/gpt5/800/400',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readingTime: 5,
    categoryId: '1',
    category: mockCategories[0],
    tags: ['OpenAI', 'GPT-5', 'Machine Learning', 'Natural Language Processing'],
    isBookmarked: false,
    isCached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFeatured: true,
  },
  {
    id: '2',
    title: 'React Native 0.75 Brings Major Performance Improvements',
    description: 'New architecture and optimizations deliver up to 60% faster app startup times.',
    content: 'React Native 0.75 introduces significant performance enhancements through the new Fabric renderer and TurboModules architecture...',
    author: 'Mike Chen',
    source: 'React Native Blog',
    sourceUrl: 'https://reactnative.dev/blog/version-075',
    imageUrl: 'https://picsum.photos/seed/react-native-075/800/400',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    readingTime: 7,
    categoryId: '2',
    category: mockCategories[1],
    tags: ['React Native', 'Mobile Development', 'Performance', 'Fabric'],
    isBookmarked: false,
    isCached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFeatured: true,
  },
  {
    id: '3',
    title: 'Next.js 15 Introduces Partial Prerendering for Lightning-Fast Apps',
    description: 'The latest update combines static and dynamic rendering for optimal performance.',
    content: 'Next.js 15 brings Partial Prerendering, a groundbreaking feature that allows developers to combine static and dynamic content seamlessly...',
    author: 'Emily Davis',
    source: 'Vercel Blog',
    sourceUrl: 'https://vercel.com/blog/nextjs-15',
    imageUrl: 'https://picsum.photos/seed/nextjs-15/800/400',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    readingTime: 6,
    categoryId: '3',
    category: mockCategories[2],
    tags: ['Next.js', 'Web Development', 'Performance', 'React'],
    isBookmarked: false,
    isCached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Y Combinator Demo Day: 10 Startups Changing the Tech Landscape',
    description: 'From AI-powered healthcare to sustainable tech solutions, this batch showcases innovation.',
    content: 'Y Combinator\'s latest Demo Day featured groundbreaking startups across various sectors. Here are the top 10 companies to watch...',
    author: 'Jessica Wong',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com/yc-demo-day',
    imageUrl: 'https://picsum.photos/seed/yc-demo/800/400',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    readingTime: 8,
    categoryId: '4',
    category: mockCategories[3],
    tags: ['Y Combinator', 'Startups', 'Demo Day', 'Innovation'],
    isBookmarked: false,
    isCached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Major Security Vulnerability Found in Popular JavaScript Library',
    description: 'Over 1 million websites affected by critical zero-day exploit in widely-used npm package.',
    content: 'Security researchers have discovered a critical vulnerability in a popular JavaScript library used by over 1 million websites...',
    author: 'Alex Kumar',
    source: 'Security Week',
    sourceUrl: 'https://securityweek.com/js-vulnerability',
    imageUrl: 'https://picsum.photos/seed/security-vuln/800/400',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    readingTime: 4,
    categoryId: '5',
    category: mockCategories[4],
    tags: ['Security', 'JavaScript', 'Vulnerability', 'Zero-day'],
    isBookmarked: false,
    isCached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Apple Announces Neural Engine 3.0 for iPhone 16 Pro',
    description: 'New chip delivers 3x faster AI processing for enhanced camera features and Siri capabilities.',
    content: 'Apple\'s latest Neural Engine 3.0 in the iPhone 16 Pro series promises significant improvements in AI processing power...',
    author: 'Emily Davis',
    source: 'Apple Newsroom',
    sourceUrl: 'https://apple.com/newsroom/neural-engine-3',
    imageUrl: 'https://picsum.photos/seed/apple-neural/800/400',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 5,
    categoryId: '1',
    category: mockCategories[0],
    tags: ['Apple', 'Neural Engine', 'AI Chip', 'iPhone'],
    isBookmarked: false,
    isCached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFeatured: true,
  },
];

async function fetchArticles(categorySlug?: string): Promise<Article[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (categorySlug) {
    return mockArticles.filter((a) => a.category?.slug === categorySlug);
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
