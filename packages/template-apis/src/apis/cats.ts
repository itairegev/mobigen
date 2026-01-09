/**
 * TheCatAPI Client
 * Free API for cat breeds, images, and information
 * https://thecatapi.com/
 *
 * Free tier: 100k requests/month
 * No API key required for basic endpoints
 */

import { TemplateApiClient, createApiClient } from '../client';
import type { PaginatedRequest } from '../types';

const CAT_API_BASE_URL = 'https://api.thecatapi.com/v1';

// Cat API specific types
export interface CatBreed {
  id: string;
  name: string;
  description: string;
  temperament: string;
  origin: string;
  life_span: string;
  weight: {
    imperial: string;
    metric: string;
  };
  adaptability: number;
  affection_level: number;
  child_friendly: number;
  dog_friendly: number;
  energy_level: number;
  grooming: number;
  health_issues: number;
  intelligence: number;
  shedding_level: number;
  social_needs: number;
  stranger_friendly: number;
  vocalisation: number;
  wikipedia_url?: string;
  reference_image_id?: string;
  image?: CatImage;
}

export interface CatImage {
  id: string;
  url: string;
  width: number;
  height: number;
  breeds?: CatBreed[];
}

export interface GetImagesParams extends PaginatedRequest {
  breed_ids?: string;
  category_ids?: string;
  mime_types?: string;
  order?: 'RANDOM' | 'ASC' | 'DESC';
  has_breeds?: boolean;
}

export interface CatCategory {
  id: number;
  name: string;
}

export class CatApiClient {
  private client: TemplateApiClient;

  constructor(apiKey?: string) {
    this.client = createApiClient(CAT_API_BASE_URL, apiKey, {
      cacheTime: 10 * 60 * 1000, // 10 minute cache for breed data
    });
  }

  /**
   * Get all cat breeds
   * GET /breeds
   */
  async getBreeds(params?: PaginatedRequest): Promise<CatBreed[]> {
    return this.client.get<CatBreed[]>('/breeds', {
      params: {
        limit: params?.limit,
        page: params?.page,
      },
      cacheKey: 'cat_breeds_all',
    });
  }

  /**
   * Get a specific breed by ID
   * GET /breeds/{breed_id}
   */
  async getBreedById(id: string): Promise<CatBreed> {
    return this.client.get<CatBreed>(`/breeds/${id}`, {
      cacheKey: `cat_breed_${id}`,
    });
  }

  /**
   * Search breeds by name
   * GET /breeds/search
   */
  async searchBreeds(query: string): Promise<CatBreed[]> {
    return this.client.get<CatBreed[]>('/breeds/search', {
      params: { q: query },
      cacheKey: `cat_breeds_search_${query.toLowerCase()}`,
    });
  }

  /**
   * Get random cat images
   * GET /images/search
   */
  async getRandomImages(params?: GetImagesParams): Promise<CatImage[]> {
    return this.client.get<CatImage[]>('/images/search', {
      params: {
        limit: params?.limit ?? 10,
        page: params?.page,
        breed_ids: params?.breed_ids,
        category_ids: params?.category_ids,
        mime_types: params?.mime_types,
        order: params?.order ?? 'RANDOM',
        has_breeds: params?.has_breeds ? 1 : undefined,
      },
      cache: false, // Don't cache random images
    });
  }

  /**
   * Get images for a specific breed
   */
  async getBreedImages(breedId: string, limit: number = 10): Promise<CatImage[]> {
    return this.client.get<CatImage[]>('/images/search', {
      params: {
        breed_ids: breedId,
        limit,
      },
      cacheKey: `cat_images_breed_${breedId}_${limit}`,
    });
  }

  /**
   * Get a single random cat image
   */
  async getRandomImage(): Promise<CatImage | null> {
    const images = await this.getRandomImages({ limit: 1 });
    return images[0] ?? null;
  }

  /**
   * Get image by ID
   * GET /images/{image_id}
   */
  async getImageById(imageId: string): Promise<CatImage> {
    return this.client.get<CatImage>(`/images/${imageId}`, {
      cacheKey: `cat_image_${imageId}`,
    });
  }

  /**
   * Get image categories (hats, sunglasses, etc.)
   * GET /categories
   */
  async getCategories(): Promise<CatCategory[]> {
    return this.client.get<CatCategory[]>('/categories', {
      cacheKey: 'cat_categories',
    });
  }

  /**
   * Get breeds by origin country
   */
  async getBreedsByOrigin(origin: string): Promise<CatBreed[]> {
    const breeds = await this.getBreeds();
    return breeds.filter(
      b => b.origin.toLowerCase().includes(origin.toLowerCase())
    );
  }

  /**
   * Get breeds sorted by a trait
   */
  async getBreedsByTrait(
    trait: keyof Pick<
      CatBreed,
      | 'adaptability'
      | 'affection_level'
      | 'child_friendly'
      | 'dog_friendly'
      | 'energy_level'
      | 'intelligence'
    >,
    minLevel: number = 4
  ): Promise<CatBreed[]> {
    const breeds = await this.getBreeds();
    return breeds
      .filter(b => (b[trait] as number) >= minLevel)
      .sort((a, b) => (b[trait] as number) - (a[trait] as number));
  }

  /**
   * Get popular cat breeds (predefined list)
   */
  async getPopularBreeds(): Promise<CatBreed[]> {
    const popularIds = [
      'abys', // Abyssinian
      'beng', // Bengal
      'birm', // Birman
      'bsho', // British Shorthair
      'mau',  // Egyptian Mau
      'mcoo', // Maine Coon
      'pers', // Persian
      'ragd', // Ragdoll
      'sfol', // Scottish Fold
      'siam', // Siamese
    ];

    const breeds = await this.getBreeds();
    return breeds.filter(b => popularIds.includes(b.id));
  }

  /**
   * Get family-friendly breeds
   */
  async getFamilyFriendlyBreeds(): Promise<CatBreed[]> {
    return this.getBreedsByTrait('child_friendly', 4);
  }

  /**
   * Get dog-friendly breeds
   */
  async getDogFriendlyBreeds(): Promise<CatBreed[]> {
    return this.getBreedsByTrait('dog_friendly', 4);
  }

  /**
   * Get low-maintenance breeds (low grooming needs)
   */
  async getLowMaintenanceBreeds(): Promise<CatBreed[]> {
    const breeds = await this.getBreeds();
    return breeds.filter(b => b.grooming <= 2);
  }
}

// Export a singleton instance for convenience
let catApiInstance: CatApiClient | null = null;

export function getCatApi(apiKey?: string): CatApiClient {
  if (!catApiInstance) {
    catApiInstance = new CatApiClient(apiKey);
  }
  return catApiInstance;
}
