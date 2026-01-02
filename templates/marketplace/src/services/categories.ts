import type { Category } from '@/types';
import { MOCK_LISTINGS } from './listings';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'smartphone',
    color: '#3b82f6',
    listingCount: MOCK_LISTINGS.filter((l) => l.categoryId === 'electronics').length,
  },
  {
    id: 'furniture',
    name: 'Furniture',
    icon: 'sofa',
    color: '#8b5cf6',
    listingCount: MOCK_LISTINGS.filter((l) => l.categoryId === 'furniture').length,
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    icon: 'shirt',
    color: '#ec4899',
    listingCount: MOCK_LISTINGS.filter((l) => l.categoryId === 'fashion').length,
  },
  {
    id: 'sports',
    name: 'Sports & Outdoors',
    icon: 'bike',
    color: '#10b981',
    listingCount: MOCK_LISTINGS.filter((l) => l.categoryId === 'sports').length,
  },
  {
    id: 'home',
    name: 'Home & Garden',
    icon: 'home',
    color: '#f59e0b',
    listingCount: MOCK_LISTINGS.filter((l) => l.categoryId === 'home').length,
  },
  {
    id: 'toys',
    name: 'Toys & Games',
    icon: 'gamepad-2',
    color: '#ef4444',
    listingCount: 0,
  },
  {
    id: 'books',
    name: 'Books & Media',
    icon: 'book',
    color: '#14b8a6',
    listingCount: 0,
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'package',
    color: '#64748b',
    listingCount: 0,
  },
];

export async function fetchCategories(): Promise<Category[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_CATEGORIES;
}

export async function fetchCategory(id: string): Promise<Category | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_CATEGORIES.find((cat) => cat.id === id) || null;
}
