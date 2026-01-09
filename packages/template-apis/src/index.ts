/**
 * @mobigen/template-apis
 *
 * Unified API client and wrappers for Mobigen templates.
 * Provides real API integrations with caching, retry, and offline support.
 */

// Core client
export { TemplateApiClient, createApiClient } from './client';

// Types
export type {
  ApiConfig,
  ApiResponse,
  ApiError,
  CacheEntry,
  RetryConfig,
  PaginatedRequest,
  PaginatedResponse,
  ImageAsset,
  Category,
} from './types';

// Dog APIs
export {
  DogApiClient,
  getDogApi,
  DogCeoApiClient,
  getDogCeoApi,
} from './apis/dogs';
export type {
  DogBreed,
  DogImage,
  DogFact,
  SearchBreedsParams,
  GetImagesParams as DogImagesParams,
  DogCeoBreedList,
  DogCeoImage,
  DogCeoImages,
} from './apis/dogs';

// Cat APIs
export { CatApiClient, getCatApi } from './apis/cats';
export type {
  CatBreed,
  CatImage,
  CatCategory,
  GetImagesParams as CatImagesParams,
} from './apis/cats';

// Pet Care Tips
export {
  getAllTips,
  getTipsByPetType,
  getTipsByCategory,
  getTipById,
  searchTips,
  getFeaturedTips,
  getCategories as getPetCareCategories,
  getCategoryDisplayName,
} from './apis/pet-care';
export type { PetCareTip, PetCareCategory } from './apis/pet-care';
