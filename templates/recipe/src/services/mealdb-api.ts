/**
 * TheMealDB API Integration for Recipe Template
 * https://www.themealdb.com/api.php
 *
 * FREE - No API key required, unlimited requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, Category, Ingredient, Step } from '@/types';

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_PREFIX = 'mealdb_recipe_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// MealDB response types
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

// Parse ingredients from MealDB meal
function parseIngredients(meal: MealDbMeal): Ingredient[] {
  const ingredients: Ingredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      // Parse amount and unit from measure
      const { amount, unit, notes } = parseMeasure(measure?.trim() || '');
      ingredients.push({
        id: `${meal.idMeal}-ing-${i}`,
        name: name.trim(),
        amount,
        unit,
        notes,
      });
    }
  }
  return ingredients;
}

// Parse measure string into amount and unit
function parseMeasure(measure: string): { amount: number; unit: string; notes?: string } {
  if (!measure) return { amount: 1, unit: 'whole' };

  // Common patterns: "1 cup", "2 tbsp", "1/2 tsp", "100g", etc.
  const patterns = [
    /^(\d+(?:\/\d+)?)\s*(cups?|cup|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|whole|pieces?|slices?)/i,
    /^(\d+(?:\.\d+)?)\s*(cups?|cup|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|whole|pieces?|slices?)/i,
  ];

  for (const pattern of patterns) {
    const match = measure.match(pattern);
    if (match) {
      let amount: number;
      if (match[1].includes('/')) {
        const [num, denom] = match[1].split('/');
        amount = parseInt(num) / parseInt(denom);
      } else {
        amount = parseFloat(match[1]);
      }
      return { amount, unit: match[2].toLowerCase() };
    }
  }

  // If just a number
  const numMatch = measure.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return { amount: parseFloat(numMatch[1]), unit: 'whole' };
  }

  // Default to 1 whole with the measure as notes
  return { amount: 1, unit: 'whole', notes: measure };
}

// Parse instructions into steps
function parseInstructions(instructions: string): Step[] {
  if (!instructions) return [];

  // Split by numbered steps, paragraphs, or sentences
  let steps: string[];

  // Try splitting by numbered steps (1., 2., etc.)
  const numberedPattern = /(?:^|\n)\s*\d+[\.\)]\s*/;
  if (numberedPattern.test(instructions)) {
    steps = instructions.split(numberedPattern).filter(s => s.trim());
  } else {
    // Split by paragraphs or double newlines
    steps = instructions.split(/\n\n+/).filter(s => s.trim());
    if (steps.length === 1) {
      // Split by periods for single paragraph
      steps = instructions.split(/(?<=\.)\s+/).filter(s => s.trim().length > 15);
    }
  }

  return steps.map((instruction, index) => ({
    id: `step-${index + 1}`,
    stepNumber: index + 1,
    instruction: instruction.trim().replace(/\n/g, ' '),
  }));
}

// Convert MealDB meal to app Recipe format
function mealToRecipe(meal: MealDbMeal): Recipe {
  const ingredients = parseIngredients(meal);
  const steps = parseInstructions(meal.strInstructions);

  // Map category names to IDs
  const categoryMap: Record<string, string> = {
    Breakfast: '1',
    Dessert: '4',
    Starter: '5',
    Side: '6',
    Beef: '3',
    Chicken: '2',
    Seafood: '3',
    Lamb: '3',
    Pork: '3',
    Vegetarian: '2',
    Vegan: '2',
    Pasta: '3',
    Miscellaneous: '7',
    Goat: '3',
  };

  // Generate tags from category and area
  const tags: string[] = [];
  if (meal.strCategory) tags.push(meal.strCategory.toLowerCase());
  if (meal.strArea) tags.push(meal.strArea.toLowerCase());
  if (meal.strTags) {
    tags.push(...meal.strTags.split(',').map(t => t.trim().toLowerCase()));
  }

  // Estimate prep time based on ingredients count
  const prepTime = Math.max(10, ingredients.length * 2);
  // Estimate cook time based on steps
  const cookTime = Math.max(15, steps.length * 5);

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    description: meal.strInstructions.slice(0, 200) + '...',
    image: meal.strMealThumb,
    categoryId: categoryMap[meal.strCategory] || '7',
    prepTime,
    cookTime,
    totalTime: prepTime + cookTime,
    servings: 4, // Default serving size
    difficulty: steps.length > 8 ? 'hard' : steps.length > 5 ? 'medium' : 'easy',
    ingredients,
    steps,
    tags,
    rating: 4.0 + Math.random() * 1.0, // Random rating 4.0-5.0
    reviewCount: Math.floor(Math.random() * 500) + 50,
    featured: Math.random() > 0.7,
    dateAdded: new Date().toISOString(),
  };
}

// Category colors and icons
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  Beef: { icon: 'restaurant', color: '#8B4513' },
  Breakfast: { icon: 'sunny', color: '#FFB84D' },
  Chicken: { icon: 'restaurant', color: '#FFA500' },
  Dessert: { icon: 'ice-cream', color: '#EC4899' },
  Goat: { icon: 'restaurant', color: '#A0522D' },
  Lamb: { icon: 'restaurant', color: '#CD853F' },
  Miscellaneous: { icon: 'grid', color: '#718096' },
  Pasta: { icon: 'pizza', color: '#FFD700' },
  Pork: { icon: 'restaurant', color: '#FFC0CB' },
  Seafood: { icon: 'fish', color: '#4682B4' },
  Side: { icon: 'leaf', color: '#228B22' },
  Starter: { icon: 'fast-food', color: '#8B5CF6' },
  Vegan: { icon: 'leaf', color: '#32CD32' },
  Vegetarian: { icon: 'leaf', color: '#10B981' },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get all recipe categories
 */
export async function getRecipeCategories(): Promise<Category[]> {
  const cached = await getFromCache<Category[]>('categories');
  if (cached) return cached;

  try {
    const response = await fetchJson<{ categories: MealDbCategory[] }>(
      `${MEALDB_BASE}/categories.php`
    );

    const categories: Category[] = response.categories.map((cat, index) => {
      const style = CATEGORY_STYLES[cat.strCategory] || { icon: 'restaurant', color: '#FF6B35' };
      return {
        id: cat.idCategory,
        name: cat.strCategory,
        description: cat.strCategoryDescription.slice(0, 100) + '...',
        icon: style.icon,
        color: style.color,
        recipeCount: 10 + Math.floor(Math.random() * 20),
      };
    });

    await setCache('categories', categories);
    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

/**
 * Get recipes by category
 */
export async function getRecipesByCategory(categoryName: string): Promise<Recipe[]> {
  const cacheKey = `recipes_${categoryName.toLowerCase()}`;
  const cached = await getFromCache<Recipe[]>(cacheKey);
  if (cached) return cached;

  try {
    // First get meal list for category
    const listResponse = await fetchJson<{
      meals: { strMeal: string; strMealThumb: string; idMeal: string }[] | null;
    }>(`${MEALDB_BASE}/filter.php?c=${encodeURIComponent(categoryName)}`);

    if (!listResponse.meals) return [];

    // Get full details for first 12 meals
    const recipes: Recipe[] = [];
    for (const simpleMeal of listResponse.meals.slice(0, 12)) {
      try {
        const detailResponse = await fetchJson<{ meals: MealDbMeal[] | null }>(
          `${MEALDB_BASE}/lookup.php?i=${simpleMeal.idMeal}`
        );

        if (detailResponse.meals?.[0]) {
          recipes.push(mealToRecipe(detailResponse.meals[0]));
        }
      } catch {
        // Skip meals that fail
      }
    }

    await setCache(cacheKey, recipes);
    return recipes;
  } catch (error) {
    console.error('Failed to fetch recipes by category:', error);
    return [];
  }
}

/**
 * Get recipe by ID
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  const cacheKey = `recipe_${id}`;
  const cached = await getFromCache<Recipe>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchJson<{ meals: MealDbMeal[] | null }>(
      `${MEALDB_BASE}/lookup.php?i=${id}`
    );

    if (!response.meals?.[0]) return null;

    const recipe = mealToRecipe(response.meals[0]);
    await setCache(cacheKey, recipe);
    return recipe;
  } catch (error) {
    console.error('Failed to fetch recipe:', error);
    return null;
  }
}

/**
 * Search recipes
 */
export async function searchRecipesApi(query: string): Promise<Recipe[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetchJson<{ meals: MealDbMeal[] | null }>(
      `${MEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`
    );

    if (!response.meals) return [];

    return response.meals.slice(0, 20).map(meal => mealToRecipe(meal));
  } catch (error) {
    console.error('Failed to search recipes:', error);
    return [];
  }
}

/**
 * Get random recipes (for featured section)
 */
export async function getRandomRecipes(count: number = 6): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < count * 2 && recipes.length < count; i++) {
    try {
      const response = await fetchJson<{ meals: MealDbMeal[] | null }>(
        `${MEALDB_BASE}/random.php`
      );

      if (response.meals?.[0] && !seenIds.has(response.meals[0].idMeal)) {
        seenIds.add(response.meals[0].idMeal);
        const recipe = mealToRecipe(response.meals[0]);
        recipes.push({ ...recipe, featured: true });
      }
    } catch {
      // Continue on error
    }
  }

  return recipes;
}

/**
 * Get recipes by area/cuisine
 */
export async function getRecipesByArea(area: string): Promise<Recipe[]> {
  const cacheKey = `recipes_area_${area.toLowerCase()}`;
  const cached = await getFromCache<Recipe[]>(cacheKey);
  if (cached) return cached;

  try {
    const listResponse = await fetchJson<{
      meals: { strMeal: string; strMealThumb: string; idMeal: string }[] | null;
    }>(`${MEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`);

    if (!listResponse.meals) return [];

    const recipes: Recipe[] = [];
    for (const simpleMeal of listResponse.meals.slice(0, 10)) {
      try {
        const detailResponse = await fetchJson<{ meals: MealDbMeal[] | null }>(
          `${MEALDB_BASE}/lookup.php?i=${simpleMeal.idMeal}`
        );

        if (detailResponse.meals?.[0]) {
          recipes.push(mealToRecipe(detailResponse.meals[0]));
        }
      } catch {}
    }

    await setCache(cacheKey, recipes);
    return recipes;
  } catch (error) {
    console.error('Failed to fetch recipes by area:', error);
    return [];
  }
}

/**
 * Get all available areas/cuisines
 */
export async function getRecipeAreas(): Promise<string[]> {
  const cached = await getFromCache<string[]>('areas');
  if (cached) return cached;

  try {
    const response = await fetchJson<{ meals: { strArea: string }[] }>(
      `${MEALDB_BASE}/list.php?a=list`
    );

    const areas = response.meals.map(a => a.strArea);
    await setCache('areas', areas);
    return areas;
  } catch (error) {
    console.error('Failed to fetch areas:', error);
    return [];
  }
}

/**
 * Get recipes by first letter (useful for browsing)
 */
export async function getRecipesByLetter(letter: string): Promise<Recipe[]> {
  if (!letter || letter.length !== 1) return [];

  const cacheKey = `recipes_letter_${letter.toLowerCase()}`;
  const cached = await getFromCache<Recipe[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchJson<{ meals: MealDbMeal[] | null }>(
      `${MEALDB_BASE}/search.php?f=${letter}`
    );

    if (!response.meals) return [];

    const recipes = response.meals.map(meal => mealToRecipe(meal));
    await setCache(cacheKey, recipes);
    return recipes;
  } catch (error) {
    console.error('Failed to fetch recipes by letter:', error);
    return [];
  }
}
