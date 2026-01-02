import { Workout } from '@/types';

export const MOCK_WORKOUTS: Workout[] = [
  {
    id: '1',
    name: 'Full Body Strength',
    description: 'Complete full-body workout targeting all major muscle groups.',
    duration: 60,
    difficulty: 'intermediate',
    category: 'full-body',
    caloriesBurned: 450,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    exercises: [
      { exerciseId: '1', sets: 3, reps: 10, restTime: 60 },
      { exerciseId: '2', sets: 3, reps: 12, restTime: 60 },
      { exerciseId: '5', sets: 3, reps: 10, restTime: 90 },
      { exerciseId: '8', sets: 3, reps: 15, restTime: 45 },
      { exerciseId: '15', sets: 3, reps: 20, restTime: 45 },
    ],
  },
  {
    id: '2',
    name: 'Upper Body Builder',
    description: 'Focus on chest, back, shoulders, and arms for upper body development.',
    duration: 50,
    difficulty: 'advanced',
    category: 'upper-body',
    caloriesBurned: 380,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
    exercises: [
      { exerciseId: '3', sets: 4, reps: 8, restTime: 90 },
      { exerciseId: '6', sets: 4, reps: 10, restTime: 75 },
      { exerciseId: '9', sets: 3, reps: 12, restTime: 60 },
      { exerciseId: '11', sets: 3, reps: 12, restTime: 60 },
      { exerciseId: '13', sets: 3, reps: 15, restTime: 45 },
    ],
  },
  {
    id: '3',
    name: 'Leg Day Destroyer',
    description: 'Intense lower body workout for building leg strength and power.',
    duration: 55,
    difficulty: 'advanced',
    category: 'lower-body',
    caloriesBurned: 520,
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800',
    exercises: [
      { exerciseId: '1', sets: 4, reps: 8, restTime: 120 },
      { exerciseId: '2', sets: 4, reps: 10, restTime: 90 },
      { exerciseId: '14', sets: 3, reps: 12, restTime: 75 },
      { exerciseId: '16', sets: 3, reps: 15, restTime: 60 },
      { exerciseId: '18', sets: 3, reps: 20, restTime: 45 },
    ],
  },
  {
    id: '4',
    name: 'Beginner HIIT',
    description: 'Introduction to high-intensity interval training with bodyweight exercises.',
    duration: 25,
    difficulty: 'beginner',
    category: 'cardio',
    caloriesBurned: 280,
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
    exercises: [
      { exerciseId: '19', sets: 3, reps: 30, duration: 30, restTime: 30 },
      { exerciseId: '20', sets: 3, reps: 20, restTime: 30 },
      { exerciseId: '21', sets: 3, reps: 15, restTime: 30 },
      { exerciseId: '22', sets: 3, reps: 20, restTime: 30 },
      { exerciseId: '23', sets: 3, reps: 10, restTime: 45 },
    ],
  },
  {
    id: '5',
    name: 'Core & Abs Blast',
    description: 'Targeted core workout for building a strong, stable midsection.',
    duration: 30,
    difficulty: 'intermediate',
    category: 'strength',
    caloriesBurned: 200,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    exercises: [
      { exerciseId: '15', sets: 3, reps: 25, restTime: 30 },
      { exerciseId: '24', sets: 3, duration: 45, restTime: 30, reps: 0 },
      { exerciseId: '25', sets: 3, reps: 20, restTime: 30 },
      { exerciseId: '26', sets: 3, reps: 15, restTime: 30 },
      { exerciseId: '27', sets: 3, duration: 30, restTime: 30, reps: 0 },
    ],
  },
  {
    id: '6',
    name: 'Cardio Endurance',
    description: 'Build cardiovascular endurance with varied cardio exercises.',
    duration: 40,
    difficulty: 'intermediate',
    category: 'cardio',
    caloriesBurned: 400,
    image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800',
    exercises: [
      { exerciseId: '28', sets: 1, duration: 300, restTime: 60, reps: 0 },
      { exerciseId: '19', sets: 4, reps: 50, duration: 60, restTime: 30 },
      { exerciseId: '21', sets: 4, reps: 20, restTime: 30 },
      { exerciseId: '29', sets: 3, duration: 60, restTime: 30, reps: 0 },
      { exerciseId: '30', sets: 1, duration: 180, restTime: 0, reps: 0 },
    ],
  },
  {
    id: '7',
    name: 'Mobility & Flexibility',
    description: 'Improve range of motion and flexibility with dynamic stretches.',
    duration: 35,
    difficulty: 'beginner',
    category: 'flexibility',
    caloriesBurned: 120,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    exercises: [
      { exerciseId: '4', sets: 3, duration: 45, restTime: 15, reps: 0 },
      { exerciseId: '10', sets: 2, reps: 10, restTime: 15 },
      { exerciseId: '17', sets: 2, reps: 12, restTime: 15 },
      { exerciseId: '7', sets: 2, reps: 10, restTime: 15 },
    ],
  },
  {
    id: '8',
    name: 'Power & Explosiveness',
    description: 'Develop explosive power with plyometric and dynamic movements.',
    duration: 45,
    difficulty: 'advanced',
    category: 'strength',
    caloriesBurned: 480,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    exercises: [
      { exerciseId: '23', sets: 4, reps: 8, restTime: 90 },
      { exerciseId: '21', sets: 4, reps: 12, restTime: 75 },
      { exerciseId: '20', sets: 4, reps: 15, restTime: 60 },
      { exerciseId: '12', sets: 3, reps: 10, restTime: 90 },
      { exerciseId: '8', sets: 3, reps: 12, restTime: 60 },
    ],
  },
];

export async function getWorkouts(category?: string): Promise<Workout[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let workouts = [...MOCK_WORKOUTS];

  if (category && category !== 'all') {
    workouts = workouts.filter((w) => w.category === category);
  }

  return workouts;
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_WORKOUTS.find((w) => w.id === id) || null;
}
