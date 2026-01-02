// ============================================================================
// Type Definitions for Recipe Template
// ============================================================================

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  categoryId: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  totalTime: number; // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  steps: Step[];
  nutrition?: NutritionInfo;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  author?: string;
  dateAdded?: string; // ISO string
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string; // "cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "whole", "pinch"
  notes?: string; // e.g., "diced", "chopped", "room temperature"
}

export interface Step {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number; // minutes (optional, for steps with timing)
  image?: string; // Optional step image
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string; // Ionicons name
  color: string; // Hex color
  recipeCount?: number;
}

export interface ShoppingItem {
  id: string;
  ingredientId: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  recipeId?: string;
  recipeName?: string;
  addedAt: string; // ISO string
}

export interface MealPlan {
  id: string;
  weekStartDate: string; // ISO string (Monday)
  meals: PlannedMeal[];
}

export interface PlannedMeal {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeImage: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dietaryPreferences?: DietaryPreference[];
  favoriteRecipes: string[]; // Recipe IDs
  mealPlans: MealPlan[];
}

export type DietaryPreference =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'keto'
  | 'paleo'
  | 'low-carb'
  | 'nut-free';

// Zustand Store Types
export interface ShoppingListState {
  items: ShoppingItem[];
  addItem: (item: Omit<ShoppingItem, 'id' | 'checked' | 'addedAt'>) => void;
  removeItem: (itemId: string) => void;
  toggleItem: (itemId: string) => void;
  clearChecked: () => void;
  clearAll: () => void;
  addIngredientsFromRecipe: (recipe: Recipe) => void;
}

export interface MealPlanState {
  currentWeek: MealPlan | null;
  setWeek: (weekStartDate: string) => void;
  addMeal: (meal: Omit<PlannedMeal, 'id'>) => void;
  removeMeal: (mealId: string) => void;
  updateMeal: (mealId: string, updates: Partial<PlannedMeal>) => void;
  clearDay: (dayOfWeek: number) => void;
  clearWeek: () => void;
}

export interface FavoritesState {
  favoriteIds: string[];
  addFavorite: (recipeId: string) => void;
  removeFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => void;
}

export interface TimerState {
  timers: CookingTimer[];
  addTimer: (timer: Omit<CookingTimer, 'id' | 'createdAt'>) => void;
  removeTimer: (timerId: string) => void;
  updateTimer: (timerId: string, updates: Partial<CookingTimer>) => void;
}

export interface CookingTimer {
  id: string;
  name: string;
  duration: number; // seconds
  remaining: number; // seconds
  isRunning: boolean;
  recipeId?: string;
  stepNumber?: number;
  createdAt: string; // ISO string
}
