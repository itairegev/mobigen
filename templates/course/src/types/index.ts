export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: number; // in minutes
  lessonsCount: number;
  thumbnail: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  studentsCount: number;
  price: number;
  tags: string[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number; // in minutes
  videoUrl: string;
  thumbnail: string;
  order: number;
  isLocked: boolean;
  resources?: LessonResource[];
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'file';
  url: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Answer[];
  score: number;
  passed: boolean;
  completedAt: Date;
}

export interface Answer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: Date;
  progress: CourseProgress;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: string[];
  currentLesson: string | null;
  percentComplete: number;
  lastAccessedAt: Date;
  quizScores: Record<string, number>;
}

export interface Certificate {
  id: string;
  courseId: string;
  userId: string;
  issuedAt: Date;
  certificateUrl: string;
}

export interface LessonNote {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  timestamp: number; // video timestamp in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLessonsCompleted: number;
  totalMinutesWatched: number;
  averageQuizScore: number;
  certificatesEarned: number;
}
