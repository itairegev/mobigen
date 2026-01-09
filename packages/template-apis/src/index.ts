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

// Meals/Food API (TheMealDB)
export {
  MealDbClient,
  getMealDbApi,
  parseIngredients,
  parseTags,
} from './apis/meals';
export type {
  Meal,
  MealCategory,
  MealArea,
  MealIngredient,
  SimpleMeal,
  ParsedIngredient,
} from './apis/meals';

// Exercise/Fitness API (WGER)
export {
  WgerClient,
  getWgerApi,
  EXERCISE_CATEGORIES,
  EQUIPMENT,
  getCategoryName,
  getEquipmentName,
} from './apis/exercises';
export type {
  Exercise,
  ExerciseInfo,
  ExerciseCategory,
  Muscle,
  Equipment,
  ExerciseImage,
  ExerciseVideo,
} from './apis/exercises';

// News APIs
export {
  GNewsClient,
  NewsApiClient,
  MockNewsClient,
  createNewsClient,
  getNewsClient,
  NEWS_CATEGORIES,
} from './apis/news';
export type {
  NewsArticle,
  NewsCategory,
  NewsProvider,
} from './apis/news';

// Shopify API
export {
  ShopifyClient,
  createShopifyClient,
  validateShopifyStore,
  DEMO_STORES,
} from './apis/shopify';
export type {
  ShopifyProduct,
  ShopifyVariant,
  ShopifyImage,
  ShopifyOption,
  Product,
  ProductVariant,
  ProductOption,
} from './apis/shopify';
