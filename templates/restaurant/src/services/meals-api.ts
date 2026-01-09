/**
 * TheMealDB Integration for Restaurant Template
 *
 * Fetches real meal/recipe data from TheMealDB API
 * https://www.themealdb.com/api.php
 *
 * FREE - No API key required, unlimited requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem, Category } from '@/types';

const MEAL_DB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_PREFIX = 'mealdb_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// MealDB types
interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  [key: string]: string | null;
}

interface MealDbCategory {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

// Cache helpers
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

// Fetch helper
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Parse ingredients from meal
function parseIngredients(meal: MealDbMeal): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure?.trim() || ''} ${ingredient.trim()}`.trim());
    }
  }
  return ingredients;
}

// Convert MealDB meal to app MenuItem format
function mealToMenuItem(meal: MealDbMeal, categoryId: string): MenuItem {
  const ingredients = parseIngredients(meal);

  // Generate a price based on category (for demo purposes)
  const categoryPrices: Record<string, number> = {
    Beef: 24.99,
    Chicken: 18.99,
    Dessert: 8.99,
    Lamb: 26.99,
    Pasta: 16.99,
    Pork: 22.99,
    Seafood: 28.99,
    Vegetarian: 14.99,
    Breakfast: 12.99,
    Starter: 9.99,
    Side: 6.99,
  };
  const basePrice = categoryPrices[meal.strCategory] || 15.99;

  // Generate dietary tags
  const dietaryTags: string[] = [];
  const name = meal.strMeal.toLowerCase();
  const category = meal.strCategory.toLowerCase();

  if (category === 'vegetarian' || name.includes('vegetarian') || name.includes('veggie')) {
    dietaryTags.push('vegetarian');
  }
  if (name.includes('vegan')) {
    dietaryTags.push('vegan');
  }
  if (name.includes('spicy') || name.includes('hot')) {
    dietaryTags.push('spicy');
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    description: meal.strInstructions.slice(0, 200) + '...',
    price: basePrice,
    image: meal.strMealThumb,
    categoryId,
    dietaryTags,
    available: true,
    prepTime: Math.floor(Math.random() * 20) + 15, // 15-35 minutes
    calories: Math.floor(Math.random() * 400) + 300, // 300-700 calories
    featured: Math.random() > 0.7, // 30% chance of being featured
    ingredients,
    fullInstructions: meal.strInstructions,
    youtubeUrl: meal.strYoutube || undefined,
    area: meal.strArea,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get all meal categories
 */
export async function getMealCategories(): Promise<Category[]> {
  const cached = await getFromCache<Category[]>('categories');
  if (cached) return cached;

  try {
    const response = await fetchJson<{ categories: MealDbCategory[] }>(
      `${MEAL_DB_BASE}/categories.php`
    );

    const categories: Category[] = response.categories.map((cat, index) => ({
      id: cat.idCategory,
      name: cat.strCategory,
      sortOrder: index + 1,
      description: cat.strCategoryDescription.slice(0, 100) + '...',
      image: cat.strCategoryThumb,
    }));

    await setCache('categories', categories);
    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

/**
 * Get meals by category
 */
export async function getMealsByCategory(categoryName: string): Promise<MenuItem[]> {
  const cacheKey = `meals_${categoryName.toLowerCase()}`;
  const cached = await getFromCache<MenuItem[]>(cacheKey);
  if (cached) return cached;

  try {
    // First get meal list
    const listResponse = await fetchJson<{ meals: { strMeal: string; strMealThumb: string; idMeal: string }[] | null }>(
      `${MEAL_DB_BASE}/filter.php?c=${encodeURIComponent(categoryName)}`
    );

    if (!listResponse.meals) return [];

    // Get full details for first 10 meals
    const meals: MenuItem[] = [];
    for (const simpleMeal of listResponse.meals.slice(0, 10)) {
      try {
        const detailResponse = await fetchJson<{ meals: MealDbMeal[] | null }>(
          `${MEAL_DB_BASE}/lookup.php?i=${simpleMeal.idMeal}`
        );

        if (detailResponse.meals?.[0]) {
          meals.push(mealToMenuItem(detailResponse.meals[0], categoryName));
        }
      } catch {
        // Skip meals that fail
      }
    }

    await setCache(cacheKey, meals);
    return meals;
  } catch (error) {
    console.error('Failed to fetch meals:', error);
    return [];
  }
}

/**
 * Get meal by ID
 */
export async function getMealById(id: string): Promise<MenuItem | null> {
  const cacheKey = `meal_${id}`;
  const cached = await getFromCache<MenuItem>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchJson<{ meals: MealDbMeal[] | null }>(
      `${MEAL_DB_BASE}/lookup.php?i=${id}`
    );

    if (!response.meals?.[0]) return null;

    const meal = mealToMenuItem(response.meals[0], response.meals[0].strCategory);
    await setCache(cacheKey, meal);
    return meal;
  } catch (error) {
    console.error('Failed to fetch meal:', error);
    return null;
  }
}

/**
 * Search meals
 */
export async function searchMeals(query: string): Promise<MenuItem[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetchJson<{ meals: MealDbMeal[] | null }>(
      `${MEAL_DB_BASE}/search.php?s=${encodeURIComponent(query)}`
    );

    if (!response.meals) return [];

    return response.meals.slice(0, 20).map(meal =>
      mealToMenuItem(meal, meal.strCategory)
    );
  } catch (error) {
    console.error('Failed to search meals:', error);
    return [];
  }
}

/**
 * Get random meals (for featured section)
 */
export async function getRandomMeals(count: number = 5): Promise<MenuItem[]> {
  const meals: MenuItem[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < count * 2 && meals.length < count; i++) {
    try {
      const response = await fetchJson<{ meals: MealDbMeal[] | null }>(
        `${MEAL_DB_BASE}/random.php`
      );

      if (response.meals?.[0] && !seenIds.has(response.meals[0].idMeal)) {
        seenIds.add(response.meals[0].idMeal);
        meals.push(mealToMenuItem(response.meals[0], response.meals[0].strCategory));
      }
    } catch {
      // Continue on error
    }
  }

  return meals;
}

/**
 * Get meals by area/cuisine
 */
export async function getMealsByArea(area: string): Promise<MenuItem[]> {
  const cacheKey = `meals_area_${area.toLowerCase()}`;
  const cached = await getFromCache<MenuItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const listResponse = await fetchJson<{ meals: { strMeal: string; strMealThumb: string; idMeal: string }[] | null }>(
      `${MEAL_DB_BASE}/filter.php?a=${encodeURIComponent(area)}`
    );

    if (!listResponse.meals) return [];

    const meals: MenuItem[] = [];
    for (const simpleMeal of listResponse.meals.slice(0, 10)) {
      try {
        const detailResponse = await fetchJson<{ meals: MealDbMeal[] | null }>(
          `${MEAL_DB_BASE}/lookup.php?i=${simpleMeal.idMeal}`
        );

        if (detailResponse.meals?.[0]) {
          meals.push(mealToMenuItem(detailResponse.meals[0], detailResponse.meals[0].strCategory));
        }
      } catch {}
    }

    await setCache(cacheKey, meals);
    return meals;
  } catch (error) {
    console.error('Failed to fetch meals by area:', error);
    return [];
  }
}

/**
 * Get all areas/cuisines
 */
export async function getMealAreas(): Promise<string[]> {
  const cached = await getFromCache<string[]>('areas');
  if (cached) return cached;

  try {
    const response = await fetchJson<{ meals: { strArea: string }[] }>(
      `${MEAL_DB_BASE}/list.php?a=list`
    );

    const areas = response.meals.map(a => a.strArea);
    await setCache('areas', areas);
    return areas;
  } catch (error) {
    console.error('Failed to fetch areas:', error);
    return [];
  }
}
