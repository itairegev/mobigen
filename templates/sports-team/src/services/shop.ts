import { Product } from '@/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'product-1',
    name: 'Home Jersey 2024/25',
    description: 'Official Thunder FC home jersey. Made with advanced moisture-wicking fabric for superior comfort.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
    category: 'jersey',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blue', 'Blue/Red'],
    inStock: true,
    featured: true,
  },
  {
    id: 'product-2',
    name: 'Away Jersey 2024/25',
    description: 'Official Thunder FC away jersey in sleek white design.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    category: 'jersey',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'White/Blue'],
    inStock: true,
    featured: true,
  },
  {
    id: 'product-3',
    name: 'Thunder FC Snapback Cap',
    description: 'Adjustable snapback cap with embroidered team logo.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
    category: 'accessories',
    colors: ['Blue', 'Black', 'White'],
    inStock: true,
  },
  {
    id: 'product-4',
    name: 'Team Scarf',
    description: 'Knitted team scarf perfect for match days.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800',
    category: 'accessories',
    inStock: true,
  },
  {
    id: 'product-5',
    name: 'Training Jacket',
    description: 'Lightweight training jacket as worn by the players.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    category: 'apparel',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blue', 'Black'],
    inStock: true,
  },
  {
    id: 'product-6',
    name: 'Signed Marcus Rodriguez Photo',
    description: 'Limited edition signed photo of team captain Marcus Rodriguez.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800',
    category: 'memorabilia',
    inStock: true,
    featured: true,
  },
  {
    id: 'product-7',
    name: 'Thunder FC Hoodie',
    description: 'Comfortable pullover hoodie with team logo.',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    category: 'apparel',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blue', 'Gray', 'Black'],
    inStock: true,
  },
  {
    id: 'product-8',
    name: 'Match Ball Replica',
    description: 'Official match ball replica.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    category: 'accessories',
    inStock: true,
  },
];

export async function getProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_PRODUCTS;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_PRODUCTS.find((product) => product.id === id);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_PRODUCTS.filter((product) => product.featured);
}

export async function getProductsByCategory(category: Product['category']): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_PRODUCTS.filter((product) => product.category === category);
}
