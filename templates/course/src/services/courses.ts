import { Course, Lesson, Quiz, Question } from '@/types';

export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Complete React Native Development',
    description: 'Master React Native and build professional mobile apps from scratch. Learn navigation, state management, APIs, and deployment.',
    instructor: 'Sarah Johnson',
    duration: 480,
    lessonsCount: 12,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    category: 'Mobile Development',
    level: 'intermediate',
    rating: 4.8,
    studentsCount: 12450,
    price: 49.99,
    tags: ['React Native', 'Mobile', 'JavaScript', 'Expo'],
  },
  {
    id: '2',
    title: 'TypeScript Fundamentals',
    description: 'Learn TypeScript from basics to advanced concepts. Understand types, interfaces, generics, and best practices for type-safe code.',
    instructor: 'Michael Chen',
    duration: 360,
    lessonsCount: 10,
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
    category: 'Programming',
    level: 'beginner',
    rating: 4.9,
    studentsCount: 8920,
    price: 39.99,
    tags: ['TypeScript', 'JavaScript', 'Programming'],
  },
  {
    id: '3',
    title: 'UI/UX Design Principles',
    description: 'Create beautiful and user-friendly interfaces. Learn color theory, typography, layout, and modern design patterns.',
    instructor: 'Emily Rodriguez',
    duration: 420,
    lessonsCount: 14,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    category: 'Design',
    level: 'beginner',
    rating: 4.7,
    studentsCount: 15680,
    price: 44.99,
    tags: ['UI Design', 'UX Design', 'Figma', 'Design Systems'],
  },
  {
    id: '4',
    title: 'Advanced API Development',
    description: 'Build scalable REST and GraphQL APIs. Master authentication, authorization, database design, and cloud deployment.',
    instructor: 'David Park',
    duration: 540,
    lessonsCount: 16,
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    category: 'Backend',
    level: 'advanced',
    rating: 4.9,
    studentsCount: 6340,
    price: 59.99,
    tags: ['API', 'REST', 'GraphQL', 'Node.js', 'Database'],
  },
];

export const MOCK_LESSONS: Record<string, Lesson[]> = {
  '1': [
    {
      id: '1-1',
      courseId: '1',
      title: 'Introduction to React Native',
      description: 'Overview of React Native, its benefits, and what we will build in this course.',
      duration: 12,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80',
      order: 1,
      isLocked: false,
      resources: [
        { id: 'r1', title: 'Course Materials', type: 'pdf', url: 'https://example.com/materials.pdf' },
        { id: 'r2', title: 'React Native Docs', type: 'link', url: 'https://reactnative.dev' },
      ],
    },
    {
      id: '1-2',
      courseId: '1',
      title: 'Setting Up Your Development Environment',
      description: 'Install and configure Node.js, Expo CLI, and your code editor.',
      duration: 18,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80',
      order: 2,
      isLocked: false,
    },
    {
      id: '1-3',
      courseId: '1',
      title: 'Core Components and Styling',
      description: 'Learn about View, Text, Image, and how to style components with StyleSheet.',
      duration: 25,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
      order: 3,
      isLocked: false,
    },
    {
      id: '1-4',
      courseId: '1',
      title: 'Navigation with React Navigation',
      description: 'Implement stack, tab, and drawer navigation in your apps.',
      duration: 32,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
      order: 4,
      isLocked: true,
    },
    {
      id: '1-5',
      courseId: '1',
      title: 'State Management with Hooks',
      description: 'Master useState, useEffect, useContext, and custom hooks.',
      duration: 28,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&q=80',
      order: 5,
      isLocked: true,
    },
  ],
  '2': [
    {
      id: '2-1',
      courseId: '2',
      title: 'What is TypeScript?',
      description: 'Introduction to TypeScript and why you should use it.',
      duration: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
      order: 1,
      isLocked: false,
    },
    {
      id: '2-2',
      courseId: '2',
      title: 'Basic Types',
      description: 'Learn about string, number, boolean, arrays, and tuples.',
      duration: 22,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&q=80',
      order: 2,
      isLocked: false,
    },
    {
      id: '2-3',
      courseId: '2',
      title: 'Interfaces and Type Aliases',
      description: 'Define complex types for objects and functions.',
      duration: 26,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80',
      order: 3,
      isLocked: true,
    },
  ],
};

export const MOCK_QUIZZES: Record<string, Quiz> = {
  '1-3': {
    id: 'q1-3',
    lessonId: '1-3',
    title: 'Core Components Quiz',
    description: 'Test your knowledge of React Native core components and styling.',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        question: 'Which component is used for displaying text in React Native?',
        options: ['Text', 'Label', 'Paragraph', 'TextView'],
        correctAnswer: 0,
        explanation: 'The Text component is the fundamental component for displaying text in React Native.',
      },
      {
        id: 'q2',
        question: 'How do you apply styles to components in React Native?',
        options: [
          'Using CSS files',
          'Using StyleSheet.create()',
          'Using inline HTML attributes',
          'Using SASS',
        ],
        correctAnswer: 1,
        explanation: 'StyleSheet.create() is the recommended way to define styles in React Native.',
      },
      {
        id: 'q3',
        question: 'Which layout system does React Native use?',
        options: ['Grid', 'Flexbox', 'Float', 'Table'],
        correctAnswer: 1,
        explanation: 'React Native uses Flexbox for layouts, which is familiar to web developers.',
      },
      {
        id: 'q4',
        question: 'What is the root container component in React Native?',
        options: ['Container', 'View', 'Div', 'Box'],
        correctAnswer: 1,
        explanation: 'View is the most fundamental component and serves as a container for other components.',
      },
      {
        id: 'q5',
        question: 'Which prop is used to make an Image component resizable?',
        options: ['resizable', 'resizeMode', 'scalable', 'fit'],
        correctAnswer: 1,
        explanation: 'The resizeMode prop controls how the image is resized to fit its container.',
      },
    ],
  },
  '2-2': {
    id: 'q2-2',
    lessonId: '2-2',
    title: 'TypeScript Basic Types Quiz',
    description: 'Test your understanding of TypeScript basic types.',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        question: 'What is the type of the variable? let age: number = 25',
        options: ['string', 'number', 'boolean', 'any'],
        correctAnswer: 1,
        explanation: 'The variable is explicitly typed as number.',
      },
      {
        id: 'q2',
        question: 'How do you define an array of strings in TypeScript?',
        options: ['Array<string>', 'string[]', 'Both are correct', 'None are correct'],
        correctAnswer: 2,
        explanation: 'Both Array<string> and string[] are valid ways to define an array of strings.',
      },
      {
        id: 'q3',
        question: 'What does the "any" type mean in TypeScript?',
        options: [
          'Only accepts numbers',
          'Only accepts strings',
          'Accepts any value type',
          'Accepts only objects',
        ],
        correctAnswer: 2,
        explanation: 'The "any" type disables type checking and accepts any value.',
      },
    ],
  },
};

// Service functions
export async function getCourses(): Promise<Course[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_COURSES;
}

export async function getCourse(id: string): Promise<Course | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_COURSES.find((course) => course.id === id);
}

export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_LESSONS[courseId] || [];
}

export async function getLesson(lessonId: string): Promise<Lesson | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  for (const lessons of Object.values(MOCK_LESSONS)) {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

export async function getQuiz(lessonId: string): Promise<Quiz | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_QUIZZES[lessonId];
}
