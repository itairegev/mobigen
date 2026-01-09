/**
 * TheDogAPI Client
 * Free API for dog breeds, images, and information
 * https://thedogapi.com/
 *
 * Free tier: 100k requests/month
 * No API key required for basic endpoints
 */

import { TemplateApiClient, createApiClient } from '../client';
import type { PaginatedRequest, ImageAsset, Category } from '../types';

const DOG_API_BASE_URL = 'https://api.thedogapi.com/v1';

// Dog API specific types
export interface DogBreed {
  id: number;
  name: string;
  bred_for?: string;
  breed_group?: string;
  life_span: string;
  temperament?: string;
  origin?: string;
  weight: {
    imperial: string;
    metric: string;
  };
  height: {
    imperial: string;
    metric: string;
  };
  reference_image_id?: string;
  image?: DogImage;
}

export interface DogImage {
  id: string;
  url: string;
  width: number;
  height: number;
  breeds?: DogBreed[];
}

export interface DogFact {
  id: string;
  text: string;
}

export interface SearchBreedsParams extends PaginatedRequest {
  q?: string;
  attach_breed?: number;
}

export interface GetImagesParams extends PaginatedRequest {
  breed_ids?: string;
  mime_types?: string;
  order?: 'RANDOM' | 'ASC' | 'DESC';
  has_breeds?: boolean;
}

export class DogApiClient {
  private client: TemplateApiClient;

  constructor(apiKey?: string) {
    this.client = createApiClient(DOG_API_BASE_URL, apiKey, {
      cacheTime: 10 * 60 * 1000, // 10 minute cache for breed data
    });
  }

  /**
   * Get all dog breeds
   * GET /breeds
   */
  async getBreeds(params?: PaginatedRequest): Promise<DogBreed[]> {
    return this.client.get<DogBreed[]>('/breeds', {
      params: {
        limit: params?.limit,
        page: params?.page,
      },
      cacheKey: 'dog_breeds_all',
    });
  }

  /**
   * Get a specific breed by ID
   */
  async getBreedById(id: number): Promise<DogBreed | null> {
    const breeds = await this.getBreeds();
    return breeds.find(b => b.id === id) ?? null;
  }

  /**
   * Search breeds by name
   * GET /breeds/search
   */
  async searchBreeds(query: string): Promise<DogBreed[]> {
    return this.client.get<DogBreed[]>('/breeds/search', {
      params: { q: query },
      cacheKey: `dog_breeds_search_${query.toLowerCase()}`,
    });
  }

  /**
   * Get random dog images
   * GET /images/search
   */
  async getRandomImages(params?: GetImagesParams): Promise<DogImage[]> {
    return this.client.get<DogImage[]>('/images/search', {
      params: {
        limit: params?.limit ?? 10,
        page: params?.page,
        breed_ids: params?.breed_ids,
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
  async getBreedImages(breedId: number, limit: number = 10): Promise<DogImage[]> {
    return this.client.get<DogImage[]>('/images/search', {
      params: {
        breed_ids: String(breedId),
        limit,
      },
      cacheKey: `dog_images_breed_${breedId}_${limit}`,
    });
  }

  /**
   * Get a single random dog image
   */
  async getRandomImage(): Promise<DogImage | null> {
    const images = await this.getRandomImages({ limit: 1 });
    return images[0] ?? null;
  }

  /**
   * Get image by ID
   * GET /images/{image_id}
   */
  async getImageById(imageId: string): Promise<DogImage> {
    return this.client.get<DogImage>(`/images/${imageId}`, {
      cacheKey: `dog_image_${imageId}`,
    });
  }

  /**
   * Get breed categories/groups
   */
  async getBreedGroups(): Promise<string[]> {
    const breeds = await this.getBreeds();
    const groups = new Set<string>();

    breeds.forEach(breed => {
      if (breed.breed_group) {
        groups.add(breed.breed_group);
      }
    });

    return Array.from(groups).sort();
  }

  /**
   * Get breeds by group
   */
  async getBreedsByGroup(group: string): Promise<DogBreed[]> {
    const breeds = await this.getBreeds();
    return breeds.filter(
      b => b.breed_group?.toLowerCase() === group.toLowerCase()
    );
  }

  /**
   * Get popular breeds (predefined list)
   */
  async getPopularBreeds(): Promise<DogBreed[]> {
    const popularNames = [
      'Labrador Retriever',
      'German Shepherd',
      'Golden Retriever',
      'French Bulldog',
      'Bulldog',
      'Poodle',
      'Beagle',
      'Rottweiler',
      'Dachshund',
      'Yorkshire Terrier',
    ];

    const breeds = await this.getBreeds();
    return breeds.filter(b =>
      popularNames.some(name =>
        b.name.toLowerCase().includes(name.toLowerCase())
      )
    );
  }
}

// Export a singleton instance for convenience
let dogApiInstance: DogApiClient | null = null;

export function getDogApi(apiKey?: string): DogApiClient {
  if (!dogApiInstance) {
    dogApiInstance = new DogApiClient(apiKey);
  }
  return dogApiInstance;
}

// Also export the Dog CEO API (completely free, no key needed)
// https://dog.ceo/dog-api/
const DOG_CEO_BASE_URL = 'https://dog.ceo/api';

export interface DogCeoBreedList {
  message: Record<string, string[]>;
  status: string;
}

export interface DogCeoImage {
  message: string;
  status: string;
}

export interface DogCeoImages {
  message: string[];
  status: string;
}

export class DogCeoApiClient {
  private client: TemplateApiClient;

  constructor() {
    this.client = createApiClient(DOG_CEO_BASE_URL, undefined, {
      cacheTime: 30 * 60 * 1000, // 30 minute cache
    });
  }

  /**
   * Get list of all breeds
   */
  async getAllBreeds(): Promise<Record<string, string[]>> {
    const response = await this.client.get<DogCeoBreedList>('/breeds/list/all');
    return response.message;
  }

  /**
   * Get random dog image
   */
  async getRandomImage(): Promise<string> {
    const response = await this.client.get<DogCeoImage>('/breeds/image/random', {
      cache: false,
    });
    return response.message;
  }

  /**
   * Get multiple random images
   */
  async getRandomImages(count: number = 10): Promise<string[]> {
    const response = await this.client.get<DogCeoImages>(
      `/breeds/image/random/${Math.min(count, 50)}`
    , { cache: false });
    return response.message;
  }

  /**
   * Get random image by breed
   */
  async getBreedImage(breed: string): Promise<string> {
    const response = await this.client.get<DogCeoImage>(
      `/breed/${breed.toLowerCase()}/images/random`,
      { cache: false }
    );
    return response.message;
  }

  /**
   * Get all images for a breed
   */
  async getBreedImages(breed: string): Promise<string[]> {
    const response = await this.client.get<DogCeoImages>(
      `/breed/${breed.toLowerCase()}/images`
    );
    return response.message;
  }

  /**
   * Get sub-breeds for a breed
   */
  async getSubBreeds(breed: string): Promise<string[]> {
    const response = await this.client.get<DogCeoImages>(
      `/breed/${breed.toLowerCase()}/list`
    );
    return response.message;
  }
}

let dogCeoInstance: DogCeoApiClient | null = null;

export function getDogCeoApi(): DogCeoApiClient {
  if (!dogCeoInstance) {
    dogCeoInstance = new DogCeoApiClient();
  }
  return dogCeoInstance;
}
