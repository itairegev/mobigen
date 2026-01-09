import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/types';
import {
  getShopifyProducts,
  getShopifyProductById,
  getShopifyProductsByCategory,
  searchShopifyProducts,
  getFeaturedShopifyProducts,
  getSaleProducts,
} from '@/services/shopify-api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA (Fallback when Shopify unavailable)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life',
    price: 79.99,
    originalPrice: 99.99,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
    categoryId: 'electronics',
    inStock: true,
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    description: 'Feature-rich smartwatch with health tracking, GPS, and water resistance',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
    category: 'Electronics',
    categoryId: 'electronics',
    inStock: true,
    rating: 4.8,
    reviewCount: 256,
  },
  {
    id: '3',
    name: 'Running Shoes Elite',
    description: 'Comfortable running shoes with advanced cushioning for everyday training',
    price: 89.99,
    originalPrice: 119.99,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    category: 'Sports',
    categoryId: 'sports',
    inStock: true,
    rating: 4.3,
    reviewCount: 89,
  },
  {
    id: '4',
    name: 'Premium Leather Wallet',
    description: 'Handcrafted genuine leather wallet with RFID blocking technology',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    category: 'Accessories',
    categoryId: 'accessories',
    inStock: true,
    rating: 4.6,
    reviewCount: 45,
  },
  {
    id: '5',
    name: 'Organic Cotton T-Shirt',
    description: 'Soft and sustainable organic cotton t-shirt, perfect for everyday wear',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: 'Clothing',
    categoryId: 'clothing',
    inStock: true,
    rating: 4.4,
    reviewCount: 167,
  },
  {
    id: '6',
    name: 'Yoga Mat Premium',
    description: 'Non-slip yoga mat with extra cushioning for comfort during workouts',
    price: 34.99,
    originalPrice: 44.99,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    category: 'Sports',
    categoryId: 'sports',
    inStock: true,
    rating: 4.7,
    reviewCount: 203,
  },
  {
    id: '7',
    name: 'Wireless Earbuds',
    description: 'True wireless earbuds with premium sound quality and portable charging case',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    category: 'Electronics',
    categoryId: 'electronics',
    inStock: true,
    rating: 4.2,
    reviewCount: 94,
  },
  {
    id: '8',
    name: 'Minimalist Backpack',
    description: 'Sleek and durable backpack perfect for daily commute or travel',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    category: 'Accessories',
    categoryId: 'accessories',
    inStock: true,
    rating: 4.5,
    reviewCount: 78,
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA FETCHING FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchProducts(): Promise<Product[]> {
  try {
    const products = await getShopifyProducts();
    if (products.length > 0) {
      return products;
    }
  } catch (error) {
    console.warn('Failed to fetch products from Shopify:', error);
  }
  return mockProducts;
}

async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const product = await getShopifyProductById(id);
    if (product) {
      return product;
    }
  } catch (error) {
    console.warn('Failed to fetch product from Shopify:', error);
  }
  return mockProducts.find(p => p.id === id) || null;
}

async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const products = await getShopifyProductsByCategory(categoryId);
    if (products.length > 0) {
      return products;
    }
  } catch (error) {
    console.warn('Failed to fetch products by category:', error);
  }
  return mockProducts.filter(p => p.categoryId === categoryId);
}

async function fetchSearchResults(query: string): Promise<Product[]> {
  if (!query.trim()) return [];

  try {
    const products = await searchShopifyProducts(query);
    if (products.length > 0) {
      return products;
    }
  } catch (error) {
    console.warn('Failed to search products:', error);
  }

  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
  );
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await getFeaturedShopifyProducts(8);
    if (products.length > 0) {
      return products;
    }
  } catch (error) {
    console.warn('Failed to fetch featured products:', error);
  }
  return mockProducts.filter(p => p.discount).slice(0, 8);
}

async function fetchSaleProducts(): Promise<Product[]> {
  try {
    const products = await getSaleProducts();
    if (products.length > 0) {
      return products;
    }
  } catch (error) {
    console.warn('Failed to fetch sale products:', error);
  }
  return mockProducts.filter(p => p.discount);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useProducts() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    products: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useProduct(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  });

  return {
    product: data,
    isLoading,
    error,
  };
}

export function useProductsByCategory(categoryId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: () => fetchProductsByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    products: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useSearchProducts(query: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', 'search', query],
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

export function useFeaturedProducts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
    staleTime: 15 * 60 * 1000,
  });

  return {
    products: data || [],
    isLoading,
    error,
  };
}

export function useSaleProducts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'sale'],
    queryFn: fetchSaleProducts,
    staleTime: 15 * 60 * 1000,
  });

  return {
    products: data || [],
    isLoading,
    error,
  };
}
