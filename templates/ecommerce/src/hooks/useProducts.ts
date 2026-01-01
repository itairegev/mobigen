import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/types';

// Mock products for demo
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 79.99,
    originalPrice: 99.99,
    discount: 20,
    image: 'https://picsum.photos/seed/headphones/400/400',
    category: 'Electronics',
    categoryId: 'electronics',
    inStock: true,
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    description: 'Feature-rich smartwatch with health tracking',
    price: 199.99,
    image: 'https://picsum.photos/seed/watch/400/400',
    category: 'Electronics',
    categoryId: 'electronics',
    inStock: true,
    rating: 4.8,
    reviewCount: 256,
  },
  {
    id: '3',
    name: 'Running Shoes',
    description: 'Comfortable running shoes for everyday use',
    price: 89.99,
    originalPrice: 119.99,
    discount: 25,
    image: 'https://picsum.photos/seed/shoes/400/400',
    category: 'Sports',
    categoryId: 'sports',
    inStock: true,
    rating: 4.3,
    reviewCount: 89,
  },
  {
    id: '4',
    name: 'Leather Wallet',
    description: 'Premium leather wallet with card slots',
    price: 49.99,
    image: 'https://picsum.photos/seed/wallet/400/400',
    category: 'Accessories',
    categoryId: 'accessories',
    inStock: true,
    rating: 4.6,
    reviewCount: 45,
  },
];

async function fetchProducts(): Promise<Product[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockProducts;
}

export function useProducts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return {
    products: data || [],
    isLoading,
    error,
  };
}

export function useProduct(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockProducts.find((p) => p.id === id) || null;
    },
  });

  return {
    product: data,
    isLoading,
    error,
  };
}
