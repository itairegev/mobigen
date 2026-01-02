import { FitnessClass } from '@/types';

export const MOCK_CLASSES: FitnessClass[] = [
  {
    id: '1',
    name: 'Morning Yoga Flow',
    description: 'Start your day with energizing yoga sequences focusing on flexibility and breath work.',
    instructor: 'Sarah Johnson',
    instructorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    duration: 60,
    capacity: 20,
    enrolled: 15,
    datetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    location: 'Studio A',
    category: 'yoga',
    difficulty: 'beginner',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  },
  {
    id: '2',
    name: 'HIIT Burn',
    description: 'High-intensity interval training to maximize calorie burn in minimal time.',
    instructor: 'Mike Chen',
    instructorImage: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200',
    duration: 45,
    capacity: 25,
    enrolled: 22,
    datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    location: 'Main Gym',
    category: 'hiit',
    difficulty: 'advanced',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
  },
  {
    id: '3',
    name: 'Strength & Conditioning',
    description: 'Build muscle and improve overall strength with compound movements and progressive overload.',
    instructor: 'Alex Rodriguez',
    instructorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    duration: 75,
    capacity: 15,
    enrolled: 12,
    datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    location: 'Weight Room',
    category: 'strength',
    difficulty: 'intermediate',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  },
  {
    id: '4',
    name: 'Spin Class',
    description: 'Indoor cycling class with energizing music and varied terrain simulations.',
    instructor: 'Emma Wilson',
    instructorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    duration: 50,
    capacity: 30,
    enrolled: 28,
    datetime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    location: 'Spin Studio',
    category: 'spin',
    difficulty: 'intermediate',
    image: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=800',
  },
  {
    id: '5',
    name: 'Pilates Core',
    description: 'Focus on core strength, flexibility, and body awareness through controlled movements.',
    instructor: 'Lisa Anderson',
    instructorImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
    duration: 55,
    capacity: 18,
    enrolled: 10,
    datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    location: 'Studio B',
    category: 'pilates',
    difficulty: 'beginner',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
  },
  {
    id: '6',
    name: 'CrossFit WOD',
    description: 'Constantly varied functional movements performed at high intensity.',
    instructor: 'Tom Harris',
    instructorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    duration: 60,
    capacity: 20,
    enrolled: 18,
    datetime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    location: 'CrossFit Box',
    category: 'crossfit',
    difficulty: 'advanced',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  },
  {
    id: '7',
    name: 'Cardio Kickboxing',
    description: 'Combine martial arts techniques with fast-paced cardio for a full-body workout.',
    instructor: 'Rachel Kim',
    instructorImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    duration: 45,
    capacity: 25,
    enrolled: 20,
    datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: 'Main Gym',
    category: 'cardio',
    difficulty: 'intermediate',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800',
  },
  {
    id: '8',
    name: 'Evening Yoga Restore',
    description: 'Wind down with gentle stretches and relaxation techniques.',
    instructor: 'Sarah Johnson',
    instructorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    duration: 60,
    capacity: 20,
    enrolled: 14,
    datetime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    location: 'Studio A',
    category: 'yoga',
    difficulty: 'beginner',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
  },
  {
    id: '9',
    name: 'Power Strength',
    description: 'Advanced strength training focusing on powerlifting movements.',
    instructor: 'Alex Rodriguez',
    instructorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    duration: 90,
    capacity: 12,
    enrolled: 9,
    datetime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    location: 'Weight Room',
    category: 'strength',
    difficulty: 'advanced',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
  },
  {
    id: '10',
    name: 'HIIT & Abs',
    description: 'Intense cardio intervals combined with core-focused exercises.',
    instructor: 'Mike Chen',
    instructorImage: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200',
    duration: 40,
    capacity: 25,
    enrolled: 23,
    datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    location: 'Main Gym',
    category: 'hiit',
    difficulty: 'intermediate',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
  },
];

export async function getClasses(
  category?: string,
  difficulty?: string
): Promise<FitnessClass[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let classes = [...MOCK_CLASSES];

  if (category && category !== 'all') {
    classes = classes.filter((c) => c.category === category);
  }

  if (difficulty && difficulty !== 'all') {
    classes = classes.filter((c) => c.difficulty === difficulty);
  }

  return classes.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
}

export async function getClassById(id: string): Promise<FitnessClass | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_CLASSES.find((c) => c.id === id) || null;
}

export async function bookClass(classId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const classToBook = MOCK_CLASSES.find((c) => c.id === classId);
  if (classToBook && classToBook.enrolled < classToBook.capacity) {
    classToBook.enrolled += 1;
    return true;
  }

  return false;
}

export async function cancelBooking(classId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const classToCancel = MOCK_CLASSES.find((c) => c.id === classId);
  if (classToCancel && classToCancel.enrolled > 0) {
    classToCancel.enrolled -= 1;
    return true;
  }

  return false;
}
