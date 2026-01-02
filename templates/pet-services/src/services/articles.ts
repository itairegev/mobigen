import { Article } from '@/types';

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Top 10 Signs Your Pet Needs to See a Vet',
    excerpt: 'Learn to recognize the warning signs that indicate your pet needs immediate veterinary attention.',
    content: 'Full article content here...',
    category: 'Health & Wellness',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600',
    author: 'Dr. Sarah Mitchell',
    publishedAt: new Date('2025-12-15'),
    readTime: 5,
    tags: ['health', 'veterinary', 'emergency'],
  },
  {
    id: '2',
    title: 'The Ultimate Guide to Pet Nutrition',
    excerpt: 'Everything you need to know about feeding your pet a balanced and healthy diet.',
    content: 'Full article content here...',
    category: 'Nutrition',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600',
    author: 'Dr. Emily Rodriguez',
    publishedAt: new Date('2025-12-10'),
    readTime: 8,
    tags: ['nutrition', 'diet', 'food'],
  },
  {
    id: '3',
    title: 'How Often Should You Groom Your Pet?',
    excerpt: 'A comprehensive guide to maintaining your pet\'s coat, nails, and overall hygiene.',
    content: 'Full article content here...',
    category: 'Grooming',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
    author: 'Lisa Johnson',
    publishedAt: new Date('2025-12-05'),
    readTime: 6,
    tags: ['grooming', 'hygiene', 'care'],
  },
  {
    id: '4',
    title: 'Understanding Pet Vaccinations: A Complete Schedule',
    excerpt: 'Keep your pet protected with this comprehensive vaccination guide.',
    content: 'Full article content here...',
    category: 'Health & Wellness',
    image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600',
    author: 'Dr. James Chen',
    publishedAt: new Date('2025-11-28'),
    readTime: 7,
    tags: ['vaccination', 'health', 'prevention'],
  },
  {
    id: '5',
    title: 'Training Tips for New Puppy Owners',
    excerpt: 'Essential training techniques to help your puppy become a well-behaved companion.',
    content: 'Full article content here...',
    category: 'Training',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600',
    author: 'Michael Torres',
    publishedAt: new Date('2025-11-20'),
    readTime: 10,
    tags: ['training', 'puppy', 'behavior'],
  },
];

export async function getArticles(category?: string): Promise<Article[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let articles = [...MOCK_ARTICLES];
  if (category) {
    articles = articles.filter(a => a.category === category);
  }
  return articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export async function getArticleById(id: string): Promise<Article | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_ARTICLES.find(a => a.id === id) || null;
}

export const ARTICLE_CATEGORIES = [
  'Health & Wellness',
  'Nutrition',
  'Grooming',
  'Training',
  'Behavior',
];
