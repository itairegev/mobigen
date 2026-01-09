/**
 * TheMealDB API Client
 * Free API for meals, recipes, and food data
 * https://www.themealdb.com/api.php
 *
 * Completely FREE - No API key required
 * Unlimited requests
 */

import { TemplateApiClient, createApiClient } from '../client';

const MEAL_DB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Types
export interface Meal {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate: string | null;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  strImageSource: string | null;
  strCreativeCommonsConfirmed: string | null;
  dateModified: string | null;
  // Ingredients (strIngredient1-20)
  [key: `strIngredient${number}`]: string | null;
  // Measures (strMeasure1-20)
  [key: `strMeasure${number}`]: string | null;
}

export interface MealCategory {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export interface MealArea {
  strArea: string;
}

export interface MealIngredient {
  idIngredient: string;
  strIngredient: string;
  strDescription: string | null;
  strType: string | null;
}

export interface SimpleMeal {
  strMeal: string;
  strMealThumb: string;
  idMeal: string;
}

// Response types
interface MealsResponse {
  meals: Meal[] | null;
}

interface CategoriesResponse {
  categories: MealCategory[];
}

interface SimpleMealsResponse {
  meals: SimpleMeal[] | null;
}

interface AreasResponse {
  meals: MealArea[];
}

interface IngredientsResponse {
  meals: MealIngredient[];
}

// Parsed ingredient with measure
export interface ParsedIngredient {
  ingredient: string;
  measure: string;
}

/**
 * Parse ingredients from meal object
 */
export function parseIngredients(meal: Meal): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof Meal] as string | null;
    const measure = meal[`strMeasure${i}` as keyof Meal] as string | null;

    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure?.trim() || '',
      });
    }
  }

  return ingredients;
}

/**
 * Parse tags from meal
 */
export function parseTags(meal: Meal): string[] {
  if (!meal.strTags) return [];
  return meal.strTags.split(',').map(t => t.trim()).filter(Boolean);
}

export class MealDbClient {
  private client: TemplateApiClient;

  constructor() {
    this.client = createApiClient(MEAL_DB_BASE_URL, undefined, {
      cacheTime: 30 * 60 * 1000, // 30 minute cache
    });
  }

  /**
   * Search meals by name
   * GET /search.php?s={name}
   */
  async searchMealsByName(query: string): Promise<Meal[]> {
    const response = await this.client.get<MealsResponse>('/search.php', {
      params: { s: query },
      cacheKey: `meals_search_${query.toLowerCase()}`,
    });
    return response.meals || [];
  }

  /**
   * Search meals by first letter
   * GET /search.php?f={letter}
   */
  async searchMealsByLetter(letter: string): Promise<Meal[]> {
    const response = await this.client.get<MealsResponse>('/search.php', {
      params: { f: letter.charAt(0) },
      cacheKey: `meals_letter_${letter.toLowerCase()}`,
    });
    return response.meals || [];
  }

  /**
   * Get meal by ID
   * GET /lookup.php?i={id}
   */
  async getMealById(id: string): Promise<Meal | null> {
    const response = await this.client.get<MealsResponse>('/lookup.php', {
      params: { i: id },
      cacheKey: `meal_${id}`,
    });
    return response.meals?.[0] || null;
  }

  /**
   * Get random meal
   * GET /random.php
   */
  async getRandomMeal(): Promise<Meal | null> {
    const response = await this.client.get<MealsResponse>('/random.php', {
      cache: false, // Don't cache random
    });
    return response.meals?.[0] || null;
  }

  /**
   * Get all meal categories
   * GET /categories.php
   */
  async getCategories(): Promise<MealCategory[]> {
    const response = await this.client.get<CategoriesResponse>('/categories.php', {
      cacheKey: 'meal_categories',
    });
    return response.categories || [];
  }

  /**
   * Get all areas/cuisines
   * GET /list.php?a=list
   */
  async getAreas(): Promise<string[]> {
    const response = await this.client.get<AreasResponse>('/list.php', {
      params: { a: 'list' },
      cacheKey: 'meal_areas',
    });
    return response.meals?.map(a => a.strArea) || [];
  }

  /**
   * Get all ingredients
   * GET /list.php?i=list
   */
  async getIngredients(): Promise<MealIngredient[]> {
    const response = await this.client.get<IngredientsResponse>('/list.php', {
      params: { i: 'list' },
      cacheKey: 'meal_ingredients',
    });
    return response.meals || [];
  }

  /**
   * Filter meals by category
   * GET /filter.php?c={category}
   */
  async getMealsByCategory(category: string): Promise<SimpleMeal[]> {
    const response = await this.client.get<SimpleMealsResponse>('/filter.php', {
      params: { c: category },
      cacheKey: `meals_category_${category.toLowerCase()}`,
    });
    return response.meals || [];
  }

  /**
   * Filter meals by area/cuisine
   * GET /filter.php?a={area}
   */
  async getMealsByArea(area: string): Promise<SimpleMeal[]> {
    const response = await this.client.get<SimpleMealsResponse>('/filter.php', {
      params: { a: area },
      cacheKey: `meals_area_${area.toLowerCase()}`,
    });
    return response.meals || [];
  }

  /**
   * Filter meals by main ingredient
   * GET /filter.php?i={ingredient}
   */
  async getMealsByIngredient(ingredient: string): Promise<SimpleMeal[]> {
    const response = await this.client.get<SimpleMealsResponse>('/filter.php', {
      params: { i: ingredient },
      cacheKey: `meals_ingredient_${ingredient.toLowerCase()}`,
    });
    return response.meals || [];
  }

  /**
   * Get multiple random meals
   */
  async getRandomMeals(count: number): Promise<Meal[]> {
    const meals: Meal[] = [];
    const promises = Array(Math.min(count, 10))
      .fill(null)
      .map(() => this.getRandomMeal());

    const results = await Promise.all(promises);
    results.forEach(meal => {
      if (meal && !meals.find(m => m.idMeal === meal.idMeal)) {
        meals.push(meal);
      }
    });

    return meals;
  }

  /**
   * Get featured meals (popular categories)
   */
  async getFeaturedMeals(limit = 10): Promise<Meal[]> {
    // Get meals from popular categories
    const categories = ['Chicken', 'Beef', 'Seafood', 'Pasta', 'Dessert'];
    const allMeals: SimpleMeal[] = [];

    for (const cat of categories) {
      const meals = await this.getMealsByCategory(cat);
      allMeals.push(...meals.slice(0, 3));
    }

    // Get full details for first N meals
    const detailedMeals: Meal[] = [];
    for (const simpleMeal of allMeals.slice(0, limit)) {
      const meal = await this.getMealById(simpleMeal.idMeal);
      if (meal) detailedMeals.push(meal);
    }

    return detailedMeals;
  }
}

// Singleton instance
let mealDbInstance: MealDbClient | null = null;

export function getMealDbApi(): MealDbClient {
  if (!mealDbInstance) {
    mealDbInstance = new MealDbClient();
  }
  return mealDbInstance;
}
