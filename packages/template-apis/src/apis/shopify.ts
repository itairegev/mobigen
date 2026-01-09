/**
 * Shopify Storefront API Client
 * Uses the public products.json endpoint
 *
 * Endpoint: https://{store}.myshopify.com/products.json
 *
 * No API key required for public product data!
 * Works with any public Shopify store
 */

import { TemplateApiClient, createApiClient } from '../client';

// Types based on Shopify's products.json response
export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  position: number;
  inventory_policy: string;
  fulfillment_service: string;
  inventory_management: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  weight: number;
  weight_unit: string;
  inventory_quantity: number;
  requires_shipping: boolean;
  available: boolean;
  featured_image: ShopifyImage | null;
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}

export interface ShopifyOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

interface ShopifyProductResponse {
  product: ShopifyProduct;
}

// Normalized product for app use
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: string[];
  thumbnail: string;
  vendor: string;
  productType: string;
  tags: string[];
  variants: ProductVariant[];
  options: ProductOption[];
  available: boolean;
  handle: string;
  url: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  sku: string | null;
  options: Record<string, string>;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export class ShopifyClient {
  private client: TemplateApiClient;
  private storeDomain: string;
  private currency: string;

  constructor(storeDomain: string, currency = 'USD') {
    // Clean up domain format
    this.storeDomain = storeDomain
      .replace('https://', '')
      .replace('http://', '')
      .replace('.myshopify.com', '')
      .replace(/\/$/, '');

    this.currency = currency;

    const baseUrl = `https://${this.storeDomain}.myshopify.com`;
    this.client = createApiClient(baseUrl, undefined, {
      cacheTime: 10 * 60 * 1000, // 10 minute cache
    });
  }

  /**
   * Normalize Shopify product to app format
   */
  private normalizeProduct(product: ShopifyProduct): Product {
    const defaultVariant = product.variants[0];
    const price = parseFloat(defaultVariant?.price || '0');
    const compareAtPrice = defaultVariant?.compare_at_price
      ? parseFloat(defaultVariant.compare_at_price)
      : null;

    return {
      id: String(product.id),
      title: product.title,
      description: this.stripHtml(product.body_html || ''),
      price,
      compareAtPrice,
      currency: this.currency,
      images: product.images.map(img => img.src),
      thumbnail: product.images[0]?.src || '',
      vendor: product.vendor,
      productType: product.product_type,
      tags: product.tags,
      variants: product.variants.map(v => ({
        id: String(v.id),
        title: v.title,
        price: parseFloat(v.price),
        compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        available: v.available,
        sku: v.sku,
        options: {
          ...(v.option1 && { [product.options[0]?.name || 'Option 1']: v.option1 }),
          ...(v.option2 && { [product.options[1]?.name || 'Option 2']: v.option2 }),
          ...(v.option3 && { [product.options[2]?.name || 'Option 3']: v.option3 }),
        },
      })),
      options: product.options.map(o => ({
        name: o.name,
        values: o.values,
      })),
      available: product.variants.some(v => v.available),
      handle: product.handle,
      url: `https://${this.storeDomain}.myshopify.com/products/${product.handle}`,
    };
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Get all products
   * GET /products.json
   */
  async getProducts(params?: {
    limit?: number;
    page?: number;
    collection_id?: number;
    product_type?: string;
    vendor?: string;
  }): Promise<Product[]> {
    const response = await this.client.get<ShopifyProductsResponse>('/products.json', {
      params: {
        limit: params?.limit ?? 50,
        page: params?.page ?? 1,
        collection_id: params?.collection_id,
        product_type: params?.product_type,
        vendor: params?.vendor,
      },
      cacheKey: `shopify_products_${this.storeDomain}_${JSON.stringify(params)}`,
    });

    return response.products.map(p => this.normalizeProduct(p));
  }

  /**
   * Get product by handle
   * GET /products/{handle}.json
   */
  async getProductByHandle(handle: string): Promise<Product | null> {
    try {
      const response = await this.client.get<ShopifyProductResponse>(
        `/products/${handle}.json`,
        { cacheKey: `shopify_product_${this.storeDomain}_${handle}` }
      );
      return this.normalizeProduct(response.product);
    } catch {
      return null;
    }
  }

  /**
   * Search products by title
   */
  async searchProducts(query: string): Promise<Product[]> {
    // Shopify doesn't have a search endpoint, so we filter locally
    const allProducts = await this.getProducts({ limit: 250 });
    const lowerQuery = query.toLowerCase();

    return allProducts.filter(
      p =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get products by type
   */
  async getProductsByType(productType: string): Promise<Product[]> {
    return this.getProducts({ product_type: productType });
  }

  /**
   * Get products by vendor
   */
  async getProductsByVendor(vendor: string): Promise<Product[]> {
    return this.getProducts({ vendor });
  }

  /**
   * Get all product types (categories)
   */
  async getProductTypes(): Promise<string[]> {
    const products = await this.getProducts({ limit: 250 });
    const types = new Set<string>();
    products.forEach(p => {
      if (p.productType) types.add(p.productType);
    });
    return Array.from(types).sort();
  }

  /**
   * Get all vendors (brands)
   */
  async getVendors(): Promise<string[]> {
    const products = await this.getProducts({ limit: 250 });
    const vendors = new Set<string>();
    products.forEach(p => {
      if (p.vendor) vendors.add(p.vendor);
    });
    return Array.from(vendors).sort();
  }

  /**
   * Get featured products (first N products)
   */
  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    return this.getProducts({ limit });
  }

  /**
   * Get on-sale products
   */
  async getSaleProducts(): Promise<Product[]> {
    const products = await this.getProducts({ limit: 250 });
    return products.filter(p => p.compareAtPrice && p.compareAtPrice > p.price);
  }

  /**
   * Get store domain
   */
  getStoreDomain(): string {
    return `${this.storeDomain}.myshopify.com`;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEMO STORE CLIENT (For testing without a real store)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Use these public demo stores for testing:
export const DEMO_STORES = {
  // Hydrogen demo store (Shopify's official demo)
  hydrogen: 'hydrogen-preview',
  // Popular public stores
  allbirds: 'allbirds',
  gymshark: 'gymshark',
  fashionnova: 'fashionnova',
  // Generic demo
  demo: 'shopify-demo-store',
};

/**
 * Create a Shopify client from environment or default to demo
 */
export function createShopifyClient(storeDomain?: string): ShopifyClient {
  const domain =
    storeDomain ||
    process.env.EXPO_PUBLIC_SHOPIFY_STORE ||
    DEMO_STORES.hydrogen;

  return new ShopifyClient(domain);
}

/**
 * Validate if a Shopify store domain is accessible
 */
export async function validateShopifyStore(storeDomain: string): Promise<boolean> {
  try {
    const client = new ShopifyClient(storeDomain);
    const products = await client.getProducts({ limit: 1 });
    return products.length > 0;
  } catch {
    return false;
  }
}
