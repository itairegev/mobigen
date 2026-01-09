/**
 * WGER Workout Manager API Client
 * Free API for exercises, muscles, and workout data
 * https://wger.de/en/software/api
 *
 * Completely FREE - No API key required for read operations
 * 1000+ exercises with images and instructions
 */

import { TemplateApiClient, createApiClient } from '../client';

const WGER_BASE_URL = 'https://wger.de/api/v2';

// Types
export interface Exercise {
  id: number;
  uuid: string;
  name: string;
  exercise_base: number;
  description: string;
  creation_date: string;
  category: number;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
  language: number;
  license: number;
  license_author: string;
  variations: number[];
}

export interface ExerciseInfo {
  id: number;
  name: string;
  aliases: string[];
  uuid: string;
  description: string;
  notes: string[];
  category: ExerciseCategory;
  muscles: Muscle[];
  muscles_secondary: Muscle[];
  equipment: Equipment[];
  images: ExerciseImage[];
  videos: ExerciseVideo[];
}

export interface ExerciseCategory {
  id: number;
  name: string;
}

export interface Muscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

export interface Equipment {
  id: number;
  name: string;
}

export interface ExerciseImage {
  id: number;
  uuid: string;
  exercise_base: number;
  image: string;
  is_main: boolean;
}

export interface ExerciseVideo {
  id: number;
  uuid: string;
  exercise_base: number;
  video: string;
  is_main: boolean;
}

// Response types
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Predefined exercise categories
export const EXERCISE_CATEGORIES = {
  ABS: 10,
  ARMS: 8,
  BACK: 12,
  CALVES: 14,
  CARDIO: 15,
  CHEST: 11,
  LEGS: 9,
  SHOULDERS: 13,
} as const;

// Predefined equipment
export const EQUIPMENT = {
  BARBELL: 1,
  SZ_BAR: 2,
  DUMBBELL: 3,
  GYM_MAT: 4,
  SWISS_BALL: 5,
  PULL_UP_BAR: 6,
  NONE: 7,
  BENCH: 8,
  INCLINE_BENCH: 9,
  KETTLEBELL: 10,
} as const;

export class WgerClient {
  private client: TemplateApiClient;

  constructor() {
    this.client = createApiClient(WGER_BASE_URL, undefined, {
      cacheTime: 60 * 60 * 1000, // 1 hour cache (data doesn't change often)
    });
  }

  /**
   * Get exercises (English only)
   * GET /exercise/?language=2
   */
  async getExercises(params?: {
    limit?: number;
    offset?: number;
    category?: number;
    equipment?: number;
  }): Promise<PaginatedResponse<Exercise>> {
    return this.client.get<PaginatedResponse<Exercise>>('/exercise/', {
      params: {
        language: 2, // English
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        category: params?.category,
        equipment: params?.equipment,
      },
      cacheKey: `exercises_${JSON.stringify(params)}`,
    });
  }

  /**
   * Get exercise info with all details (images, muscles, etc.)
   * GET /exerciseinfo/{id}/
   */
  async getExerciseInfo(id: number): Promise<ExerciseInfo> {
    return this.client.get<ExerciseInfo>(`/exerciseinfo/${id}/`, {
      cacheKey: `exercise_info_${id}`,
    });
  }

  /**
   * Get exercise base info (includes all translations)
   * GET /exercisebaseinfo/{id}/
   */
  async getExerciseBaseInfo(id: number): Promise<ExerciseInfo> {
    return this.client.get<ExerciseInfo>(`/exercisebaseinfo/${id}/`, {
      cacheKey: `exercise_base_${id}`,
    });
  }

  /**
   * Search exercises by name
   * GET /exercise/search/?term={term}
   */
  async searchExercises(term: string): Promise<{ suggestions: Array<{ value: string; data: { id: number; base_id: number; category: string; image: string | null } }> }> {
    return this.client.get('/exercise/search/', {
      params: { term, language: 2 },
      cacheKey: `exercise_search_${term.toLowerCase()}`,
    });
  }

  /**
   * Get all exercise categories
   * GET /exercisecategory/
   */
  async getCategories(): Promise<ExerciseCategory[]> {
    const response = await this.client.get<PaginatedResponse<ExerciseCategory>>('/exercisecategory/', {
      cacheKey: 'exercise_categories',
    });
    return response.results;
  }

  /**
   * Get all muscles
   * GET /muscle/
   */
  async getMuscles(): Promise<Muscle[]> {
    const response = await this.client.get<PaginatedResponse<Muscle>>('/muscle/', {
      cacheKey: 'muscles',
    });
    return response.results;
  }

  /**
   * Get all equipment
   * GET /equipment/
   */
  async getEquipment(): Promise<Equipment[]> {
    const response = await this.client.get<PaginatedResponse<Equipment>>('/equipment/', {
      cacheKey: 'equipment',
    });
    return response.results;
  }

  /**
   * Get exercise images
   * GET /exerciseimage/
   */
  async getExerciseImages(exerciseBaseId?: number): Promise<ExerciseImage[]> {
    const response = await this.client.get<PaginatedResponse<ExerciseImage>>('/exerciseimage/', {
      params: {
        limit: 100,
        exercise_base: exerciseBaseId,
      },
      cacheKey: exerciseBaseId ? `exercise_images_${exerciseBaseId}` : 'exercise_images_all',
    });
    return response.results;
  }

  /**
   * Get exercises by category
   */
  async getExercisesByCategory(categoryId: number, limit = 20): Promise<Exercise[]> {
    const response = await this.getExercises({ category: categoryId, limit });
    return response.results;
  }

  /**
   * Get exercises by equipment
   */
  async getExercisesByEquipment(equipmentId: number, limit = 20): Promise<Exercise[]> {
    const response = await this.getExercises({ equipment: equipmentId, limit });
    return response.results;
  }

  /**
   * Get bodyweight exercises (no equipment)
   */
  async getBodyweightExercises(limit = 20): Promise<Exercise[]> {
    return this.getExercisesByEquipment(EQUIPMENT.NONE, limit);
  }

  /**
   * Get exercises with full info (images, muscles, etc.)
   */
  async getExercisesWithInfo(params?: {
    limit?: number;
    category?: number;
  }): Promise<ExerciseInfo[]> {
    const exercises = await this.getExercises({
      limit: params?.limit ?? 10,
      category: params?.category,
    });

    const infos: ExerciseInfo[] = [];
    for (const exercise of exercises.results) {
      try {
        const info = await this.getExerciseInfo(exercise.id);
        infos.push(info);
      } catch {
        // Skip exercises without full info
      }
    }

    return infos;
  }

  /**
   * Get featured exercises (mix from different categories)
   */
  async getFeaturedExercises(limit = 12): Promise<ExerciseInfo[]> {
    const categories = [
      EXERCISE_CATEGORIES.CHEST,
      EXERCISE_CATEGORIES.BACK,
      EXERCISE_CATEGORIES.LEGS,
      EXERCISE_CATEGORIES.SHOULDERS,
      EXERCISE_CATEGORIES.ARMS,
      EXERCISE_CATEGORIES.ABS,
    ];

    const perCategory = Math.ceil(limit / categories.length);
    const allExercises: ExerciseInfo[] = [];

    for (const cat of categories) {
      try {
        const exercises = await this.getExercisesWithInfo({
          limit: perCategory,
          category: cat,
        });
        allExercises.push(...exercises);
      } catch {
        // Continue on error
      }
    }

    return allExercises.slice(0, limit);
  }
}

// Singleton instance
let wgerInstance: WgerClient | null = null;

export function getWgerApi(): WgerClient {
  if (!wgerInstance) {
    wgerInstance = new WgerClient();
  }
  return wgerInstance;
}

// Helper: Get category name from ID
export function getCategoryName(categoryId: number): string {
  const names: Record<number, string> = {
    8: 'Arms',
    9: 'Legs',
    10: 'Abs',
    11: 'Chest',
    12: 'Back',
    13: 'Shoulders',
    14: 'Calves',
    15: 'Cardio',
  };
  return names[categoryId] || 'Other';
}

// Helper: Get equipment name from ID
export function getEquipmentName(equipmentId: number): string {
  const names: Record<number, string> = {
    1: 'Barbell',
    2: 'SZ-Bar',
    3: 'Dumbbell',
    4: 'Gym Mat',
    5: 'Swiss Ball',
    6: 'Pull-up Bar',
    7: 'None (Bodyweight)',
    8: 'Bench',
    9: 'Incline Bench',
    10: 'Kettlebell',
  };
  return names[equipmentId] || 'Other';
}
