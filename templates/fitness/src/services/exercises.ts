import { Exercise } from '@/types';
import {
  getWgerExercises,
  getWgerExerciseById,
  searchWgerExercises,
  getWgerExercisesByCategory,
  getFeaturedWgerExercises,
  getBodyweightExercises,
} from './wger-api';

// ============================================================================
// Mock Exercises (Fallback when API fails)
// ============================================================================

export const MOCK_EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Squat',
    description: 'Compound lower body exercise targeting quads, glutes, and hamstrings.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    equipment: ['Barbell', 'Squat Rack'],
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [
      'Position barbell on upper back',
      'Stand with feet shoulder-width apart',
      'Descend by bending knees and hips',
      'Lower until thighs are parallel to ground',
      'Drive through heels to return to start',
    ],
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800',
  },
  {
    id: '2',
    name: 'Romanian Deadlift',
    description: 'Hip-hinge movement targeting posterior chain.',
    muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back', 'Core'],
    equipment: ['Barbell', 'Dumbbells'],
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [
      'Hold barbell with overhand grip',
      'Stand with feet hip-width apart',
      'Hinge at hips, keeping back straight',
      'Lower bar to mid-shin',
      'Drive hips forward to return to standing',
    ],
    image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800',
  },
  {
    id: '3',
    name: 'Bench Press',
    description: 'Upper body compound movement for chest, shoulders, and triceps.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Barbell', 'Bench'],
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [
      'Lie on bench with feet flat on floor',
      'Grip bar slightly wider than shoulder-width',
      'Lower bar to mid-chest',
      'Press bar up until arms are extended',
      'Control the descent on each rep',
    ],
    image: 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=800',
  },
  {
    id: '4',
    name: 'Downward Dog',
    description: 'Classic yoga pose for full-body stretch and strength.',
    muscleGroups: ['Shoulders', 'Hamstrings', 'Calves', 'Core'],
    equipment: [],
    difficulty: 'beginner',
    category: 'flexibility',
    instructions: [
      'Start on hands and knees',
      'Lift hips up and back',
      'Straighten arms and legs',
      'Press heels toward floor',
      'Hold position, breathing deeply',
    ],
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800',
  },
  {
    id: '5',
    name: 'Pull-Ups',
    description: 'Bodyweight exercise for back and biceps development.',
    muscleGroups: ['Lats', 'Biceps', 'Upper Back', 'Core'],
    equipment: ['Pull-up Bar'],
    difficulty: 'advanced',
    category: 'strength',
    instructions: [
      'Hang from bar with overhand grip',
      'Pull chest toward bar',
      'Lead with elbows',
      'Lower with control',
      'Maintain full range of motion',
    ],
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800',
  },
  {
    id: '6',
    name: 'Bent-Over Row',
    description: 'Back exercise for thickness and strength.',
    muscleGroups: ['Upper Back', 'Lats', 'Biceps', 'Core'],
    equipment: ['Barbell', 'Dumbbells'],
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [
      'Hinge at hips with slight knee bend',
      'Hold barbell with overhand grip',
      'Pull bar to lower chest',
      'Squeeze shoulder blades together',
      'Lower with control',
    ],
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
  },
  {
    id: '7',
    name: 'Shoulder Press',
    description: 'Overhead pressing movement for shoulder development.',
    muscleGroups: ['Shoulders', 'Triceps', 'Upper Chest'],
    equipment: ['Dumbbells', 'Barbell'],
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [
      'Hold dumbbells at shoulder height',
      'Press weights overhead',
      'Fully extend arms',
      'Lower with control',
      'Keep core engaged throughout',
    ],
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
  },
  {
    id: '8',
    name: 'Dumbbell Lunge',
    description: 'Unilateral leg exercise for balance and strength.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    equipment: ['Dumbbells'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Hold dumbbells at sides',
      'Step forward into lunge position',
      'Lower back knee toward ground',
      'Push through front heel to return',
      'Alternate legs',
    ],
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800',
  },
  {
    id: '9',
    name: 'Dumbbell Chest Fly',
    description: 'Isolation exercise for chest muscle development.',
    muscleGroups: ['Chest', 'Shoulders'],
    equipment: ['Dumbbells', 'Bench'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Lie on bench holding dumbbells',
      'Start with arms extended above chest',
      'Lower arms out to sides',
      'Maintain slight elbow bend',
      'Bring dumbbells back together',
    ],
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
  },
  {
    id: '10',
    name: 'Lat Pulldown',
    description: 'Machine exercise for lat development.',
    muscleGroups: ['Lats', 'Biceps', 'Upper Back'],
    equipment: ['Cable Machine'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Sit at pulldown machine',
      'Grip bar wider than shoulder-width',
      'Pull bar down to upper chest',
      'Squeeze shoulder blades',
      'Control the return',
    ],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  },
  {
    id: '11',
    name: 'Bicep Curls',
    description: 'Isolation exercise for biceps development.',
    muscleGroups: ['Biceps', 'Forearms'],
    equipment: ['Dumbbells', 'Barbell'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Stand with dumbbells at sides',
      'Keep elbows close to body',
      'Curl weights up to shoulders',
      'Squeeze biceps at top',
      'Lower with control',
    ],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
  },
  {
    id: '12',
    name: 'Tricep Dips',
    description: 'Bodyweight exercise for triceps strength.',
    muscleGroups: ['Triceps', 'Chest', 'Shoulders'],
    equipment: ['Dip Station', 'Bench'],
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [
      'Support body on dip bars',
      'Lower body by bending elbows',
      'Descend until upper arms are parallel',
      'Push back up to starting position',
      'Keep core tight throughout',
    ],
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
  },
  {
    id: '13',
    name: 'Face Pulls',
    description: 'Rear delt and upper back exercise for shoulder health.',
    muscleGroups: ['Rear Delts', 'Upper Back', 'Rotator Cuff'],
    equipment: ['Cable Machine'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Set cable at face height',
      'Pull rope toward face',
      'Separate hands at end of pull',
      'Focus on rear delts',
      'Control the return',
    ],
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
  },
  {
    id: '14',
    name: 'Leg Press',
    description: 'Machine-based leg exercise for quad development.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: ['Leg Press Machine'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Sit in leg press machine',
      'Place feet shoulder-width on platform',
      'Lower platform by bending knees',
      'Push through heels to extend',
      'Maintain controlled tempo',
    ],
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800',
  },
  {
    id: '15',
    name: 'Plank',
    description: 'Core stability exercise.',
    muscleGroups: ['Core', 'Shoulders', 'Glutes'],
    equipment: [],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Start in push-up position',
      'Lower onto forearms',
      'Keep body in straight line',
      'Engage core throughout',
      'Hold position',
    ],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
  },
  {
    id: '16',
    name: 'Leg Curls',
    description: 'Isolation exercise for hamstrings.',
    muscleGroups: ['Hamstrings'],
    equipment: ['Leg Curl Machine'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Lie face down on machine',
      'Position ankles under pad',
      'Curl legs toward glutes',
      'Squeeze hamstrings',
      'Lower with control',
    ],
    image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800',
  },
  {
    id: '17',
    name: 'Calf Raises',
    description: 'Exercise for calf development.',
    muscleGroups: ['Calves'],
    equipment: ['Calf Machine', 'Dumbbells'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Stand with balls of feet on edge',
      'Rise up onto toes',
      'Squeeze calves at top',
      'Lower heels below platform',
      'Maintain balance throughout',
    ],
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800',
  },
  {
    id: '18',
    name: 'Goblet Squat',
    description: 'Squat variation with dumbbell or kettlebell.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
    equipment: ['Dumbbell', 'Kettlebell'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Hold weight at chest level',
      'Stand with feet shoulder-width',
      'Squat down keeping chest up',
      'Drive through heels',
      'Return to standing',
    ],
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800',
  },
  {
    id: '19',
    name: 'Jumping Jacks',
    description: 'Classic cardio warm-up exercise.',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: [],
    difficulty: 'beginner',
    category: 'cardio',
    instructions: [
      'Start with feet together',
      'Jump feet apart while raising arms',
      'Jump back to starting position',
      'Maintain steady rhythm',
      'Continue for desired time',
    ],
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  },
  {
    id: '20',
    name: 'Push-Ups',
    description: 'Classic bodyweight upper body exercise.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    equipment: [],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Start in plank position',
      'Lower body until chest near ground',
      'Keep elbows at 45 degrees',
      'Push back to start',
      'Maintain straight body line',
    ],
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
  },
  {
    id: '21',
    name: 'Burpees',
    description: 'Full-body explosive cardio exercise.',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: [],
    difficulty: 'intermediate',
    category: 'cardio',
    instructions: [
      'Start standing',
      'Drop into squat position',
      'Kick feet back to plank',
      'Perform push-up',
      'Jump feet forward and jump up',
    ],
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  },
  {
    id: '22',
    name: 'Mountain Climbers',
    description: 'Dynamic core and cardio exercise.',
    muscleGroups: ['Core', 'Shoulders', 'Cardiovascular'],
    equipment: [],
    difficulty: 'beginner',
    category: 'cardio',
    instructions: [
      'Start in plank position',
      'Drive one knee toward chest',
      'Quickly switch legs',
      'Maintain plank position',
      'Continue alternating',
    ],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
  },
  {
    id: '23',
    name: 'Box Jumps',
    description: 'Plyometric exercise for explosive power.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
    equipment: ['Plyo Box'],
    difficulty: 'intermediate',
    category: 'cardio',
    instructions: [
      'Stand facing box',
      'Swing arms and jump onto box',
      'Land softly with bent knees',
      'Step down carefully',
      'Reset and repeat',
    ],
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  },
  {
    id: '24',
    name: 'Side Plank',
    description: 'Lateral core stability exercise.',
    muscleGroups: ['Obliques', 'Core', 'Shoulders'],
    equipment: [],
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [
      'Lie on side, prop on elbow',
      'Lift hips off ground',
      'Keep body in straight line',
      'Hold position',
      'Switch sides',
    ],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
  },
  {
    id: '25',
    name: 'Russian Twists',
    description: 'Rotational core exercise.',
    muscleGroups: ['Obliques', 'Core'],
    equipment: ['Medicine Ball', 'Dumbbell'],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Sit with knees bent, feet elevated',
      'Hold weight at chest',
      'Rotate torso side to side',
      'Touch weight to ground each side',
      'Keep core engaged',
    ],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
  },
  {
    id: '26',
    name: 'Bicycle Crunches',
    description: 'Dynamic ab exercise.',
    muscleGroups: ['Abs', 'Obliques'],
    equipment: [],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Lie on back, hands behind head',
      'Lift shoulders off ground',
      'Bring knee to opposite elbow',
      'Alternate sides in cycling motion',
      'Keep lower back pressed down',
    ],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
  },
  {
    id: '27',
    name: 'Dead Bug',
    description: 'Core stability and coordination exercise.',
    muscleGroups: ['Core', 'Hip Flexors'],
    equipment: [],
    difficulty: 'beginner',
    category: 'strength',
    instructions: [
      'Lie on back with arms extended up',
      'Lift knees to 90 degrees',
      'Lower opposite arm and leg',
      'Return to start',
      'Alternate sides',
    ],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
  },
  {
    id: '28',
    name: 'Running',
    description: 'Classic cardiovascular exercise.',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: ['Treadmill'],
    difficulty: 'beginner',
    category: 'cardio',
    instructions: [
      'Start at comfortable pace',
      'Maintain good posture',
      'Land midfoot',
      'Swing arms naturally',
      'Breathe rhythmically',
    ],
    image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800',
  },
  {
    id: '29',
    name: 'Jump Rope',
    description: 'High-intensity cardio exercise.',
    muscleGroups: ['Calves', 'Shoulders', 'Cardiovascular'],
    equipment: ['Jump Rope'],
    difficulty: 'beginner',
    category: 'cardio',
    instructions: [
      'Hold rope handles at sides',
      'Swing rope overhead',
      'Jump as rope passes under feet',
      'Land on balls of feet',
      'Maintain steady rhythm',
    ],
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  },
  {
    id: '30',
    name: 'Cool Down Walk',
    description: 'Light walking for recovery.',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: [],
    difficulty: 'beginner',
    category: 'cardio',
    instructions: [
      'Walk at easy pace',
      'Focus on breathing',
      'Gradually lower heart rate',
      'Swing arms gently',
      'Prepare body for stretching',
    ],
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
  },
];

// ============================================================================
// Service Functions (Real API with mock fallback)
// ============================================================================

/**
 * Get exercises, optionally filtered by category
 * Uses WGER API with fallback to mock data
 */
export async function getExercises(category?: string): Promise<Exercise[]> {
  try {
    if (category && category !== 'all') {
      const exercises = await getWgerExercisesByCategory(category);
      if (exercises.length > 0) {
        return exercises;
      }
    } else {
      const exercises = await getWgerExercises({ limit: 20 });
      if (exercises.length > 0) {
        return exercises;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch exercises from API, using mock data:', error);
  }

  // Fallback to mock data
  let exercises = [...MOCK_EXERCISES];
  if (category && category !== 'all') {
    exercises = exercises.filter((e) => e.category === category);
  }
  return exercises;
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  try {
    const exercise = await getWgerExerciseById(id);
    if (exercise) {
      return exercise;
    }
  } catch (error) {
    console.warn('Failed to fetch exercise from API, using mock data:', error);
  }

  return MOCK_EXERCISES.find((e) => e.id === id) || null;
}

/**
 * Search exercises by query
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  if (!query.trim()) return [];

  try {
    const results = await searchWgerExercises(query);
    if (results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn('Failed to search exercises from API, using mock data:', error);
  }

  // Fallback to mock search
  const lowerQuery = query.toLowerCase();
  return MOCK_EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.description.toLowerCase().includes(lowerQuery) ||
      e.muscleGroups.some((m) => m.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get featured exercises for home screen
 */
export async function getFeaturedExercises(): Promise<Exercise[]> {
  try {
    const exercises = await getFeaturedWgerExercises(8);
    if (exercises.length > 0) {
      return exercises;
    }
  } catch (error) {
    console.warn('Failed to fetch featured exercises, using mock data:', error);
  }

  // Return a mix of mock exercises
  return MOCK_EXERCISES.slice(0, 8);
}

/**
 * Get bodyweight exercises (no equipment needed)
 */
export async function getNoEquipmentExercises(): Promise<Exercise[]> {
  try {
    const exercises = await getBodyweightExercises(15);
    if (exercises.length > 0) {
      return exercises;
    }
  } catch (error) {
    console.warn('Failed to fetch bodyweight exercises, using mock data:', error);
  }

  // Filter mock exercises without equipment
  return MOCK_EXERCISES.filter(
    (e) => !e.equipment || e.equipment.length === 0
  );
}

// Re-export WGER API functions for direct use if needed
export {
  getWgerExercises,
  getWgerExerciseById,
  searchWgerExercises,
  getWgerCategories,
  WGER_CATEGORIES,
} from './wger-api';
