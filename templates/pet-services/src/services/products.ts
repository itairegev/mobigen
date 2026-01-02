import { PetProduct } from '@/types';

export const MOCK_PRODUCTS: PetProduct[] = [
  {
    id: '1',
    name: 'Premium Dog Food - Chicken & Rice',
    description: 'High-quality nutrition for adult dogs with real chicken',
    price: 45.99,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
    inStock: true,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: '2',
    name: 'Interactive Puzzle Toy',
    description: 'Mentally stimulating toy that dispenses treats',
    price: 24.99,
    category: 'toys',
    image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400',
    inStock: true,
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: '3',
    name: 'Adjustable Pet Collar',
    description: 'Durable nylon collar with reflective stitching',
    price: 12.99,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=400',
    inStock: true,
    rating: 4.5,
    reviewCount: 56,
  },
  {
    id: '4',
    name: 'Flea & Tick Prevention',
    description: '6-month supply of topical flea and tick treatment',
    price: 89.99,
    category: 'medicine',
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400',
    inStock: true,
    rating: 4.9,
    reviewCount: 234,
  },
  {
    id: '5',
    name: 'Self-Cleaning Slicker Brush',
    description: 'Professional grooming brush for all coat types',
    price: 18.99,
    category: 'grooming',
    image: 'https://images.unsplash.com/photo-1616593109013-71c8c0b5e33a?w=400',
    inStock: true,
    rating: 4.7,
    reviewCount: 167,
  },
  {
    id: '6',
    name: 'Cat Litter - Odor Control',
    description: 'Clumping clay litter with natural odor elimination',
    price: 19.99,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=400',
    inStock: true,
    rating: 4.4,
    reviewCount: 98,
  },
  {
    id: '7',
    name: 'Squeaky Plush Toy Set',
    description: 'Pack of 3 soft toys with squeakers inside',
    price: 16.99,
    category: 'toys',
    image: 'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=400',
    inStock: true,
    rating: 4.3,
    reviewCount: 45,
  },
  {
    id: '8',
    name: 'Dental Chews for Dogs',
    description: 'Daily dental treats that reduce plaque and tartar',
    price: 22.99,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
    inStock: true,
    rating: 4.6,
    reviewCount: 112,
  },
];

export async function getProducts(category?: PetProduct['category']): Promise<PetProduct[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let products = [...MOCK_PRODUCTS];
  if (category) {
    products = products.filter(p => p.category === category);
  }
  return products;
}

export async function getProductById(id: string): Promise<PetProduct | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_PRODUCTS.find(p => p.id === id) || null;
}
