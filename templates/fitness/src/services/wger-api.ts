/**
 * WGER Workout Manager API Integration
 * https://wger.de/en/software/api
 *
 * FREE - No API key required for read operations
 * 1000+ exercises with images and instructions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '@/types';

const WGER_BASE = 'https://wger.de/api/v2';
const CACHE_PREFIX = 'wger_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (data doesn't change often)

// WGER API types
interface WgerExercise {
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
}

interface WgerExerciseInfo {
  id: number;
  name: string;
  aliases: string[];
  uuid: string;
  description: string;
  notes: string[];
  category: { id: number; name: string };
  muscles: { id: number; name: string; name_en: string; is_front: boolean }[];
  muscles_secondary: { id: number; name: string; name_en: string }[];
  equipment: { id: number; name: string }[];
  images: { id: number; image: string; is_main: boolean }[];
  videos: { id: number; video: string; is_main: boolean }[];
}

interface WgerPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Category mapping from WGER IDs to our categories
const WGER_CATEGORY_MAP: Record<number, Exercise['category']> = {
  8: 'strength',  // Arms
  9: 'strength',  // Legs
  10: 'strength', // Abs
  11: 'strength', // Chest
  12: 'strength', // Back
  13: 'strength', // Shoulders
  14: 'strength', // Calves
  15: 'cardio',   // Cardio
};

// Difficulty based on equipment complexity
function inferDifficulty(equipment: string[]): Exercise['difficulty'] {
  if (equipment.length === 0 || equipment.includes('None (Bodyweight)')) {
    return 'beginner';
  }
  if (equipment.some(e => ['Barbell', 'Cable Machine'].includes(e))) {
    return 'intermediate';
  }
  return 'beginner';
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

// Convert WGER exercise info to app Exercise format
function wgerToExercise(info: WgerExerciseInfo): Exercise {
  const muscleGroups = [
    ...info.muscles.map(m => m.name_en || m.name),
    ...info.muscles_secondary.map(m => m.name_en || m.name),
  ];

  const equipment = info.equipment.map(e => e.name);

  // Extract instructions from description (split by sentences)
  const instructions = info.description
    ? info.description
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .split(/(?<=\.)\s+/)
        .filter(s => s.trim().length > 10)
        .slice(0, 5)
    : ['Perform the exercise with proper form'];

  // Get primary image
  const mainImage = info.images.find(img => img.is_main) || info.images[0];
  const image = mainImage?.image;

  // Get video if available
  const mainVideo = info.videos.find(v => v.is_main) || info.videos[0];
  const video = mainVideo?.video;

  return {
    id: String(info.id),
    name: info.name,
    description: info.description?.replace(/<[^>]*>/g, '').slice(0, 200) || 'No description available',
    muscleGroups: muscleGroups.length > 0 ? muscleGroups : ['Full Body'],
    equipment: equipment.length > 0 ? equipment : undefined,
    instructions: instructions.length > 0 ? instructions : ['Perform with proper form'],
    image: image ? `https://wger.de${image}` : 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
    video: video ? `https://wger.de${video}` : undefined,
    difficulty: inferDifficulty(equipment),
    category: WGER_CATEGORY_MAP[info.category?.id] || 'strength',
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get exercises from WGER API
 */
export async function getWgerExercises(params?: {
  category?: number;
  limit?: number;
  offset?: number;
}): Promise<Exercise[]> {
  const cacheKey = `exercises_${params?.category || 'all'}_${params?.limit || 20}_${params?.offset || 0}`;
  const cached = await getFromCache<Exercise[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(`${WGER_BASE}/exercise/`);
    url.searchParams.set('language', '2'); // English only
    url.searchParams.set('limit', String(params?.limit || 20));
    url.searchParams.set('offset', String(params?.offset || 0));
    if (params?.category) {
      url.searchParams.set('category', String(params.category));
    }

    const response = await fetchJson<WgerPaginatedResponse<WgerExercise>>(url.toString());

    // Get detailed info for each exercise
    const exercises: Exercise[] = [];
    for (const exercise of response.results.slice(0, 15)) {
      try {
        const info = await fetchJson<WgerExerciseInfo>(
          `${WGER_BASE}/exerciseinfo/${exercise.id}/`
        );
        exercises.push(wgerToExercise(info));
      } catch {
        // Skip exercises without full info
      }
    }

    await setCache(cacheKey, exercises);
    return exercises;
  } catch (error) {
    console.error('Failed to fetch exercises from WGER:', error);
    return [];
  }
}

/**
 * Get exercise by ID
 */
export async function getWgerExerciseById(id: string): Promise<Exercise | null> {
  const cacheKey = `exercise_${id}`;
  const cached = await getFromCache<Exercise>(cacheKey);
  if (cached) return cached;

  try {
    const info = await fetchJson<WgerExerciseInfo>(
      `${WGER_BASE}/exerciseinfo/${id}/`
    );
    const exercise = wgerToExercise(info);
    await setCache(cacheKey, exercise);
    return exercise;
  } catch (error) {
    console.error('Failed to fetch exercise from WGER:', error);
    return null;
  }
}

/**
 * Search exercises
 */
export async function searchWgerExercises(term: string): Promise<Exercise[]> {
  if (!term.trim()) return [];

  try {
    const response = await fetchJson<{
      suggestions: Array<{
        value: string;
        data: { id: number; base_id: number; category: string; image: string | null };
      }>;
    }>(`${WGER_BASE}/exercise/search/?term=${encodeURIComponent(term)}&language=2`);

    // Get full info for search results
    const exercises: Exercise[] = [];
    for (const suggestion of response.suggestions.slice(0, 10)) {
      try {
        const info = await fetchJson<WgerExerciseInfo>(
          `${WGER_BASE}/exerciseinfo/${suggestion.data.id}/`
        );
        exercises.push(wgerToExercise(info));
      } catch {
        // Skip on error
      }
    }

    return exercises;
  } catch (error) {
    console.error('Failed to search exercises:', error);
    return [];
  }
}

/**
 * Get exercise categories
 */
export async function getWgerCategories(): Promise<{ id: number; name: string }[]> {
  const cached = await getFromCache<{ id: number; name: string }[]>('categories');
  if (cached) return cached;

  try {
    const response = await fetchJson<WgerPaginatedResponse<{ id: number; name: string }>>(
      `${WGER_BASE}/exercisecategory/`
    );
    await setCache('categories', response.results);
    return response.results;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

/**
 * Get exercises by category name
 */
export async function getWgerExercisesByCategory(
  categoryName: string
): Promise<Exercise[]> {
  // Map category names to WGER category IDs
  const categoryNameToId: Record<string, number> = {
    arms: 8,
    legs: 9,
    abs: 10,
    chest: 11,
    back: 12,
    shoulders: 13,
    calves: 14,
    cardio: 15,
    strength: 11, // Default to chest for strength
    flexibility: 10, // Use abs for flexibility exercises
  };

  const categoryId = categoryNameToId[categoryName.toLowerCase()];
  if (!categoryId) {
    return getWgerExercises({ limit: 20 });
  }

  return getWgerExercises({ category: categoryId, limit: 15 });
}

/**
 * Get featured exercises (mix from different categories)
 */
export async function getFeaturedWgerExercises(limit = 12): Promise<Exercise[]> {
  const cached = await getFromCache<Exercise[]>('featured');
  if (cached) return cached;

  const categories = [11, 12, 9, 13, 8, 10]; // Chest, Back, Legs, Shoulders, Arms, Abs
  const perCategory = Math.ceil(limit / categories.length);
  const allExercises: Exercise[] = [];

  for (const cat of categories) {
    try {
      const exercises = await getWgerExercises({ category: cat, limit: perCategory });
      allExercises.push(...exercises);
    } catch {
      // Continue on error
    }
  }

  const result = allExercises.slice(0, limit);
  await setCache('featured', result);
  return result;
}

/**
 * Get bodyweight exercises (no equipment)
 */
export async function getBodyweightExercises(limit = 15): Promise<Exercise[]> {
  const cacheKey = 'bodyweight';
  const cached = await getFromCache<Exercise[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(`${WGER_BASE}/exercise/`);
    url.searchParams.set('language', '2');
    url.searchParams.set('limit', '50');
    url.searchParams.set('equipment', '7'); // 7 = None (bodyweight)

    const response = await fetchJson<WgerPaginatedResponse<WgerExercise>>(url.toString());

    const exercises: Exercise[] = [];
    for (const exercise of response.results.slice(0, limit)) {
      try {
        const info = await fetchJson<WgerExerciseInfo>(
          `${WGER_BASE}/exerciseinfo/${exercise.id}/`
        );
        exercises.push(wgerToExercise(info));
      } catch {}
    }

    await setCache(cacheKey, exercises);
    return exercises;
  } catch (error) {
    console.error('Failed to fetch bodyweight exercises:', error);
    return [];
  }
}

// Exercise category constants
export const WGER_CATEGORIES = {
  ARMS: 8,
  LEGS: 9,
  ABS: 10,
  CHEST: 11,
  BACK: 12,
  SHOULDERS: 13,
  CALVES: 14,
  CARDIO: 15,
} as const;
