/**
 * Shopify Storefront API Integration for E-commerce Template
 *
 * Uses the public products.json endpoint - NO API KEY REQUIRED!
 * Works with any public Shopify store
 *
 * Endpoint: https://{store}.myshopify.com/products.json
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Category } from '@/types';

const CACHE_PREFIX = 'shopify_';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CACHE HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_DURATION) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHOPIFY API TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEMO STORES (For testing and defaults)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DEMO_STORES = {
  // Shopify's official hydrogen demo store
  hydrogen: 'hydrogen-preview',
  // Popular public stores
  allbirds: 'allbirds',
  gymshark: 'gymshark',
};

// Category icons and colors
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  clothing: { icon: '👕', color: '#3b82f6' },
  shoes: { icon: '👟', color: '#10b981' },
  accessories: { icon: '👜', color: '#8b5cf6' },
  electronics: { icon: '📱', color: '#f59e0b' },
  beauty: { icon: '💄', color: '#ec4899' },
  home: { icon: '🏠', color: '#14b8a6' },
  sports: { icon: '⚽', color: '#f97316' },
  default: { icon: '🛍️', color: '#6b7280' },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getStoreDomain(): string {
  const envStore = process.env.EXPO_PUBLIC_SHOPIFY_STORE;
  if (envStore) {
    return envStore
      .replace('https://', '')
      .replace('http://', '')
      .replace('.myshopify.com', '')
      .replace(/\/$/, '');
  }
  return DEMO_STORES.hydrogen;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function getCategoryStyle(productType: string): { icon: string; color: string } {
  const type = productType.toLowerCase();
  for (const [key, style] of Object.entries(CATEGORY_STYLES)) {
    if (type.includes(key)) return style;
  }
  return CATEGORY_STYLES.default;
}

function shopifyToProduct(shopifyProduct: ShopifyProduct): Product {
  const defaultVariant = shopifyProduct.variants[0];
  const price = parseFloat(defaultVariant?.price || '0');
  const compareAtPrice = defaultVariant?.compare_at_price
    ? parseFloat(defaultVariant.compare_at_price)
    : undefined;

  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : undefined;

  // Generate a rating (in real app this would come from reviews API)
  const rating = 4 + Math.random() * 1;
  const reviewCount = Math.floor(Math.random() * 200) + 10;

  return {
    id: String(shopifyProduct.id),
    name: shopifyProduct.title,
    description: stripHtml(shopifyProduct.body_html).slice(0, 200),
    price,
    originalPrice: compareAtPrice,
    discount,
    image: shopifyProduct.images[0]?.src || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    category: shopifyProduct.product_type || 'General',
    categoryId: (shopifyProduct.product_type || 'general').toLowerCase().replace(/\s+/g, '-'),
    inStock: shopifyProduct.variants.some(v => v.available),
    rating: Math.round(rating * 10) / 10,
    reviewCount,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Fetch products from Shopify store
 */
async function fetchShopifyProducts(limit = 50): Promise<ShopifyProduct[]> {
  const domain = getStoreDomain();
  const cacheKey = `products_${domain}_${limit}`;

  const cached = await getFromCache<ShopifyProduct[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://${domain}.myshopify.com/products.json?limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ShopifyProductsResponse = await response.json();
    await setCache(cacheKey, data.products);
    return data.products;
  } catch (error) {
    console.error('Failed to fetch from Shopify:', error);
    return [];
  }
}

/**
 * Get all products
 */
export async function getShopifyProducts(): Promise<Product[]> {
  const shopifyProducts = await fetchShopifyProducts(100);
  return shopifyProducts.map(shopifyToProduct);
}

/**
 * Get product by ID
 */
export async function getShopifyProductById(id: string): Promise<Product | null> {
  const products = await getShopifyProducts();
  return products.find(p => p.id === id) || null;
}

/**
 * Get products by category
 */
export async function getShopifyProductsByCategory(categoryId: string): Promise<Product[]> {
  const products = await getShopifyProducts();
  return products.filter(p => p.categoryId === categoryId);
}

/**
 * Search products
 */
export async function searchShopifyProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return [];

  const products = await getShopifyProducts();
  const lowerQuery = query.toLowerCase();

  return products.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get featured/sale products
 */
export async function getFeaturedShopifyProducts(limit = 10): Promise<Product[]> {
  const products = await getShopifyProducts();

  // Prioritize products with discounts
  const saleProducts = products.filter(p => p.discount && p.discount > 0);
  const regularProducts = products.filter(p => !p.discount);

  return [...saleProducts.slice(0, Math.ceil(limit / 2)), ...regularProducts].slice(0, limit);
}

/**
 * Get products on sale
 */
export async function getSaleProducts(): Promise<Product[]> {
  const products = await getShopifyProducts();
  return products.filter(p => p.discount && p.discount > 0);
}

/**
 * Get categories from products
 */
export async function getShopifyCategories(): Promise<Category[]> {
  const products = await getShopifyProducts();
  const categoryMap = new Map<string, { count: number; name: string }>();

  products.forEach(product => {
    const id = product.categoryId;
    const existing = categoryMap.get(id);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(id, { count: 1, name: product.category });
    }
  });

  return Array.from(categoryMap.entries()).map(([id, { count, name }]) => {
    const style = getCategoryStyle(name);
    return {
      id,
      name,
      icon: style.icon,
      productCount: count,
    };
  });
}

/**
 * Validate store domain is accessible
 */
export async function validateShopifyStore(storeDomain: string): Promise<boolean> {
  try {
    const domain = storeDomain
      .replace('https://', '')
      .replace('http://', '')
      .replace('.myshopify.com', '')
      .replace(/\/$/, '');

    const url = `https://${domain}.myshopify.com/products.json?limit=1`;
    const response = await fetch(url);

    if (!response.ok) return false;

    const data: ShopifyProductsResponse = await response.json();
    return data.products && data.products.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get current store domain
 */
export function getCurrentStoreDomain(): string {
  return `${getStoreDomain()}.myshopify.com`;
}
