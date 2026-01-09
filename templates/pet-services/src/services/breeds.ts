/**
 * Pet Breeds Service
 *
 * Fetches real breed data from TheDogAPI and TheCatAPI
 * Provides breed information, images, and characteristics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const DOG_API_BASE = 'https://api.thedogapi.com/v1';
const CAT_API_BASE = 'https://api.thecatapi.com/v1';
const DOG_CEO_BASE = 'https://dog.ceo/api';

// Cache configuration
const CACHE_KEY_PREFIX = 'pet_breeds_';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Types
export interface DogBreed {
  id: number;
  name: string;
  bred_for?: string;
  breed_group?: string;
  life_span: string;
  temperament?: string;
  origin?: string;
  weight: { imperial: string; metric: string };
  height: { imperial: string; metric: string };
  reference_image_id?: string;
  image?: { id: string; url: string; width: number; height: number };
}

export interface CatBreed {
  id: string;
  name: string;
  description: string;
  temperament: string;
  origin: string;
  life_span: string;
  weight: { imperial: string; metric: string };
  adaptability: number;
  affection_level: number;
  child_friendly: number;
  dog_friendly: number;
  energy_level: number;
  grooming: number;
  health_issues: number;
  intelligence: number;
  reference_image_id?: string;
  image?: { id: string; url: string; width: number; height: number };
}

export interface BreedImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Helper: Cache utilities
async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      return null; // Cache expired
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Ignore cache errors
  }
}

// Helper: Fetch with retry
async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  throw lastError ?? new Error('Failed to fetch');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOG BREEDS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get all dog breeds
 */
export async function getDogBreeds(): Promise<DogBreed[]> {
  const cached = await getFromCache<DogBreed[]>('dog_breeds');
  if (cached) return cached;

  const breeds = await fetchWithRetry<DogBreed[]>(`${DOG_API_BASE}/breeds`);
  await setCache('dog_breeds', breeds);
  return breeds;
}

/**
 * Search dog breeds by name
 */
export async function searchDogBreeds(query: string): Promise<DogBreed[]> {
  if (!query.trim()) return [];

  const cacheKey = `dog_search_${query.toLowerCase()}`;
  const cached = await getFromCache<DogBreed[]>(cacheKey);
  if (cached) return cached;

  const breeds = await fetchWithRetry<DogBreed[]>(
    `${DOG_API_BASE}/breeds/search?q=${encodeURIComponent(query)}`
  );
  await setCache(cacheKey, breeds);
  return breeds;
}

/**
 * Get dog breed by ID
 */
export async function getDogBreedById(id: number): Promise<DogBreed | null> {
  const breeds = await getDogBreeds();
  return breeds.find(b => b.id === id) ?? null;
}

/**
 * Get random dog images
 */
export async function getRandomDogImages(count: number = 10): Promise<BreedImage[]> {
  // Use Dog CEO API for random images (completely free, no limits)
  try {
    const response = await fetchWithRetry<{ message: string[]; status: string }>(
      `${DOG_CEO_BASE}/breeds/image/random/${Math.min(count, 50)}`
    );
    return response.message.map((url, i) => ({
      id: `dog_${i}_${Date.now()}`,
      url,
    }));
  } catch {
    return [];
  }
}

/**
 * Get images for a specific dog breed
 */
export async function getDogBreedImages(breedId: number, limit = 5): Promise<BreedImage[]> {
  const cacheKey = `dog_images_${breedId}`;
  const cached = await getFromCache<BreedImage[]>(cacheKey);
  if (cached) return cached;

  try {
    const images = await fetchWithRetry<BreedImage[]>(
      `${DOG_API_BASE}/images/search?breed_ids=${breedId}&limit=${limit}`
    );
    await setCache(cacheKey, images);
    return images;
  } catch {
    return [];
  }
}

/**
 * Get popular dog breeds
 */
export async function getPopularDogBreeds(): Promise<DogBreed[]> {
  const popularNames = [
    'labrador', 'german shepherd', 'golden retriever', 'french bulldog',
    'bulldog', 'poodle', 'beagle', 'rottweiler', 'husky', 'boxer'
  ];

  const breeds = await getDogBreeds();
  return breeds.filter(b =>
    popularNames.some(name => b.name.toLowerCase().includes(name))
  );
}

/**
 * Get dog breed groups
 */
export async function getDogBreedGroups(): Promise<string[]> {
  const breeds = await getDogBreeds();
  const groups = new Set<string>();
  breeds.forEach(b => {
    if (b.breed_group) groups.add(b.breed_group);
  });
  return Array.from(groups).sort();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAT BREEDS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get all cat breeds
 */
export async function getCatBreeds(): Promise<CatBreed[]> {
  const cached = await getFromCache<CatBreed[]>('cat_breeds');
  if (cached) return cached;

  const breeds = await fetchWithRetry<CatBreed[]>(`${CAT_API_BASE}/breeds`);
  await setCache('cat_breeds', breeds);
  return breeds;
}

/**
 * Search cat breeds by name
 */
export async function searchCatBreeds(query: string): Promise<CatBreed[]> {
  if (!query.trim()) return [];

  const cacheKey = `cat_search_${query.toLowerCase()}`;
  const cached = await getFromCache<CatBreed[]>(cacheKey);
  if (cached) return cached;

  const breeds = await fetchWithRetry<CatBreed[]>(
    `${CAT_API_BASE}/breeds/search?q=${encodeURIComponent(query)}`
  );
  await setCache(cacheKey, breeds);
  return breeds;
}

/**
 * Get cat breed by ID
 */
export async function getCatBreedById(id: string): Promise<CatBreed | null> {
  const cacheKey = `cat_breed_${id}`;
  const cached = await getFromCache<CatBreed>(cacheKey);
  if (cached) return cached;

  try {
    const breed = await fetchWithRetry<CatBreed>(`${CAT_API_BASE}/breeds/${id}`);
    await setCache(cacheKey, breed);
    return breed;
  } catch {
    return null;
  }
}

/**
 * Get random cat images
 */
export async function getRandomCatImages(count: number = 10): Promise<BreedImage[]> {
  try {
    const images = await fetchWithRetry<BreedImage[]>(
      `${CAT_API_BASE}/images/search?limit=${Math.min(count, 100)}`
    );
    return images;
  } catch {
    return [];
  }
}

/**
 * Get images for a specific cat breed
 */
export async function getCatBreedImages(breedId: string, limit = 5): Promise<BreedImage[]> {
  const cacheKey = `cat_images_${breedId}`;
  const cached = await getFromCache<BreedImage[]>(cacheKey);
  if (cached) return cached;

  try {
    const images = await fetchWithRetry<BreedImage[]>(
      `${CAT_API_BASE}/images/search?breed_ids=${breedId}&limit=${limit}`
    );
    await setCache(cacheKey, images);
    return images;
  } catch {
    return [];
  }
}

/**
 * Get popular cat breeds
 */
export async function getPopularCatBreeds(): Promise<CatBreed[]> {
  const popularIds = ['abys', 'beng', 'birm', 'bsho', 'mcoo', 'pers', 'ragd', 'sfol', 'siam'];

  const breeds = await getCatBreeds();
  return breeds.filter(b => popularIds.includes(b.id));
}

/**
 * Get family-friendly cat breeds
 */
export async function getFamilyFriendlyCatBreeds(): Promise<CatBreed[]> {
  const breeds = await getCatBreeds();
  return breeds.filter(b => b.child_friendly >= 4).sort((a, b) => b.child_friendly - a.child_friendly);
}

/**
 * Get dog-friendly cat breeds
 */
export async function getDogFriendlyCatBreeds(): Promise<CatBreed[]> {
  const breeds = await getCatBreeds();
  return breeds.filter(b => b.dog_friendly >= 4).sort((a, b) => b.dog_friendly - a.dog_friendly);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED BREED UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface UnifiedBreed {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  description?: string;
  temperament?: string;
  origin?: string;
  lifeSpan: string;
  weight: string;
  imageUrl?: string;
  traits?: Record<string, number>;
}

/**
 * Convert dog breed to unified format
 */
export function dogToUnified(breed: DogBreed): UnifiedBreed {
  return {
    id: `dog_${breed.id}`,
    name: breed.name,
    species: 'dog',
    description: breed.bred_for,
    temperament: breed.temperament,
    origin: breed.origin,
    lifeSpan: breed.life_span,
    weight: breed.weight.metric + ' kg',
    imageUrl: breed.image?.url,
  };
}

/**
 * Convert cat breed to unified format
 */
export function catToUnified(breed: CatBreed): UnifiedBreed {
  return {
    id: `cat_${breed.id}`,
    name: breed.name,
    species: 'cat',
    description: breed.description,
    temperament: breed.temperament,
    origin: breed.origin,
    lifeSpan: breed.life_span + ' years',
    weight: breed.weight.metric + ' kg',
    imageUrl: breed.image?.url,
    traits: {
      adaptability: breed.adaptability,
      affection: breed.affection_level,
      childFriendly: breed.child_friendly,
      dogFriendly: breed.dog_friendly,
      energy: breed.energy_level,
      grooming: breed.grooming,
      intelligence: breed.intelligence,
    },
  };
}

/**
 * Get featured breeds (mix of dogs and cats)
 */
export async function getFeaturedBreeds(limit = 6): Promise<UnifiedBreed[]> {
  const [dogs, cats] = await Promise.all([
    getPopularDogBreeds(),
    getPopularCatBreeds(),
  ]);

  const dogBreeds = dogs.slice(0, Math.ceil(limit / 2)).map(dogToUnified);
  const catBreeds = cats.slice(0, Math.floor(limit / 2)).map(catToUnified);

  // Interleave dogs and cats
  const result: UnifiedBreed[] = [];
  const maxLen = Math.max(dogBreeds.length, catBreeds.length);

  for (let i = 0; i < maxLen && result.length < limit; i++) {
    if (dogBreeds[i]) result.push(dogBreeds[i]);
    if (catBreeds[i] && result.length < limit) result.push(catBreeds[i]);
  }

  return result;
}

/**
 * Search all breeds (dogs and cats)
 */
export async function searchAllBreeds(query: string): Promise<UnifiedBreed[]> {
  const [dogs, cats] = await Promise.all([
    searchDogBreeds(query),
    searchCatBreeds(query),
  ]);

  return [
    ...dogs.map(dogToUnified),
    ...cats.map(catToUnified),
  ];
}
