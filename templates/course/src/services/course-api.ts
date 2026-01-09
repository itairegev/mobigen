/**
 * Course Service - Learning management with progress tracking
 *
 * Configuration:
 * - EXPO_PUBLIC_PLATFORM_NAME: Name of the learning platform
 * - EXPO_PUBLIC_ENABLE_CERTIFICATES: Enable course completion certificates
 * - EXPO_PUBLIC_YOUTUBE_API_KEY: YouTube API key for video integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Course, Lesson, Quiz, Question } from '@/types';
import { MOCK_COURSES, MOCK_LESSONS, MOCK_QUIZZES } from './courses';

// Configuration
const PLATFORM_NAME = process.env.EXPO_PUBLIC_PLATFORM_NAME || 'Learn Academy';
const ENABLE_CERTIFICATES = process.env.EXPO_PUBLIC_ENABLE_CERTIFICATES !== 'false';
const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';

// Storage keys
const STORAGE_KEYS = {
  ENROLLED_COURSES: '@course/enrolledCourses',
  LESSON_PROGRESS: '@course/lessonProgress',
  QUIZ_RESULTS: '@course/quizResults',
  BOOKMARKS: '@course/bookmarks',
  NOTES: '@course/notes',
  CERTIFICATES: '@course/certificates',
  LAST_WATCHED: '@course/lastWatched',
};

// Interfaces
interface LessonProgress {
  lessonId: string;
  courseId: string;
  completed: boolean;
  progressSeconds: number;
  totalSeconds: number;
  lastWatchedAt: string;
}

interface QuizResult {
  quizId: string;
  lessonId: string;
  courseId: string;
  score: number;
  passed: boolean;
  answers: number[];
  completedAt: string;
}

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  completedAt: string;
  studentName: string;
}

/**
 * Get all courses
 */
export async function getCourses(): Promise<Course[]> {
  return [...MOCK_COURSES];
}

/**
 * Get course by ID
 */
export async function getCourse(id: string): Promise<Course | undefined> {
  return MOCK_COURSES.find(c => c.id === id);
}

/**
 * Get course lessons
 */
export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  return MOCK_LESSONS[courseId] || [];
}

/**
 * Get lesson by ID
 */
export async function getLesson(lessonId: string): Promise<Lesson | undefined> {
  for (const lessons of Object.values(MOCK_LESSONS)) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

/**
 * Get quiz for a lesson
 */
export async function getQuiz(lessonId: string): Promise<Quiz | undefined> {
  return MOCK_QUIZZES[lessonId];
}

/**
 * Enroll in a course
 */
export async function enrollInCourse(courseId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLED_COURSES);
    const enrolled: string[] = stored ? JSON.parse(stored) : [];

    if (enrolled.includes(courseId)) {
      return true; // Already enrolled
    }

    enrolled.push(courseId);
    await AsyncStorage.setItem(STORAGE_KEYS.ENROLLED_COURSES, JSON.stringify(enrolled));
    return true;
  } catch (error) {
    console.error('Failed to enroll:', error);
    return false;
  }
}

/**
 * Get enrolled courses
 */
export async function getEnrolledCourses(): Promise<Course[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLED_COURSES);
    const enrolledIds: string[] = stored ? JSON.parse(stored) : [];
    return MOCK_COURSES.filter(c => enrolledIds.includes(c.id));
  } catch (error) {
    console.error('Failed to get enrolled courses:', error);
    return [];
  }
}

/**
 * Check if enrolled in a course
 */
export async function isEnrolled(courseId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLED_COURSES);
    const enrolled: string[] = stored ? JSON.parse(stored) : [];
    return enrolled.includes(courseId);
  } catch (error) {
    console.error('Failed to check enrollment:', error);
    return false;
  }
}

/**
 * Save lesson progress
 */
export async function saveLessonProgress(
  lessonId: string,
  courseId: string,
  progressSeconds: number,
  totalSeconds: number
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LESSON_PROGRESS);
    const progressMap: Record<string, LessonProgress> = stored ? JSON.parse(stored) : {};

    const completed = progressSeconds >= totalSeconds * 0.9; // 90% = complete

    progressMap[lessonId] = {
      lessonId,
      courseId,
      completed,
      progressSeconds,
      totalSeconds,
      lastWatchedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(progressMap));

    // Update last watched
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_WATCHED,
      JSON.stringify({ lessonId, courseId })
    );

    // Check if course is complete and issue certificate
    if (completed && ENABLE_CERTIFICATES) {
      await checkCourseCompletion(courseId);
    }
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

/**
 * Get lesson progress
 */
export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LESSON_PROGRESS);
    const progressMap: Record<string, LessonProgress> = stored ? JSON.parse(stored) : {};
    return progressMap[lessonId] || null;
  } catch (error) {
    console.error('Failed to get progress:', error);
    return null;
  }
}

/**
 * Get course progress percentage
 */
export async function getCourseProgress(courseId: string): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LESSON_PROGRESS);
    const progressMap: Record<string, LessonProgress> = stored ? JSON.parse(stored) : {};

    const lessons = MOCK_LESSONS[courseId] || [];
    if (lessons.length === 0) return 0;

    const completedCount = lessons.filter(l => progressMap[l.id]?.completed).length;
    return Math.round((completedCount / lessons.length) * 100);
  } catch (error) {
    console.error('Failed to get course progress:', error);
    return 0;
  }
}

/**
 * Get last watched lesson
 */
export async function getLastWatched(): Promise<{ lessonId: string; courseId: string } | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_WATCHED);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get last watched:', error);
    return null;
  }
}

/**
 * Submit quiz answers
 */
export async function submitQuiz(
  quizId: string,
  lessonId: string,
  courseId: string,
  answers: number[]
): Promise<QuizResult> {
  const quiz = MOCK_QUIZZES[lessonId];
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Calculate score
  let correctCount = 0;
  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.correctAnswer) {
      correctCount++;
    }
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  const result: QuizResult = {
    quizId,
    lessonId,
    courseId,
    score,
    passed,
    answers,
    completedAt: new Date().toISOString(),
  };

  // Save result
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    const results: Record<string, QuizResult> = stored ? JSON.parse(stored) : {};
    results[quizId] = result;
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to save quiz result:', error);
  }

  return result;
}

/**
 * Get quiz result
 */
export async function getQuizResult(quizId: string): Promise<QuizResult | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    const results: Record<string, QuizResult> = stored ? JSON.parse(stored) : {};
    return results[quizId] || null;
  } catch (error) {
    console.error('Failed to get quiz result:', error);
    return null;
  }
}

/**
 * Check if course is complete and issue certificate
 */
async function checkCourseCompletion(courseId: string): Promise<void> {
  const progress = await getCourseProgress(courseId);

  if (progress === 100) {
    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course) return;

    // Check if certificate already exists
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    const certificates: Certificate[] = stored ? JSON.parse(stored) : [];

    if (certificates.some(c => c.courseId === courseId)) return;

    // Issue certificate
    const certificate: Certificate = {
      id: `cert-${Date.now()}`,
      courseId,
      courseName: course.title,
      completedAt: new Date().toISOString(),
      studentName: 'Student', // Would come from user profile
    };

    certificates.push(certificate);
    await AsyncStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
  }
}

/**
 * Get certificates
 */
export async function getCertificates(): Promise<Certificate[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get certificates:', error);
    return [];
  }
}

/**
 * Toggle bookmark
 */
export async function toggleBookmark(lessonId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    let bookmarks: string[] = stored ? JSON.parse(stored) : [];

    const index = bookmarks.indexOf(lessonId);
    if (index >= 0) {
      bookmarks.splice(index, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return false; // Removed
    } else {
      bookmarks.push(lessonId);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return true; // Added
    }
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return false;
  }
}

/**
 * Get bookmarked lessons
 */
export async function getBookmarks(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get bookmarks:', error);
    return [];
  }
}

/**
 * Save lesson notes
 */
export async function saveNote(lessonId: string, note: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
    const notes: Record<string, string> = stored ? JSON.parse(stored) : {};
    notes[lessonId] = note;
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to save note:', error);
  }
}

/**
 * Get lesson notes
 */
export async function getNote(lessonId: string): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
    const notes: Record<string, string> = stored ? JSON.parse(stored) : {};
    return notes[lessonId] || '';
  } catch (error) {
    console.error('Failed to get note:', error);
    return '';
  }
}

/**
 * Search courses
 */
export async function searchCourses(query: string): Promise<Course[]> {
  const lowerQuery = query.toLowerCase();
  return MOCK_COURSES.filter(
    c =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.instructor.toLowerCase().includes(lowerQuery) ||
      c.category.toLowerCase().includes(lowerQuery) ||
      c.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get courses by category
 */
export async function getCoursesByCategory(category: string): Promise<Course[]> {
  return MOCK_COURSES.filter(c => c.category === category);
}

/**
 * Get course categories
 */
export function getCourseCategories(): string[] {
  return [...new Set(MOCK_COURSES.map(c => c.category))];
}

/**
 * Get platform configuration
 */
export function getCourseConfig() {
  return {
    platformName: PLATFORM_NAME,
    certificatesEnabled: ENABLE_CERTIFICATES,
    hasYouTubeIntegration: !!YOUTUBE_API_KEY,
  };
}

/**
 * Clear all course data (for testing)
 */
export async function clearCourseData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.ENROLLED_COURSES),
    AsyncStorage.removeItem(STORAGE_KEYS.LESSON_PROGRESS),
    AsyncStorage.removeItem(STORAGE_KEYS.QUIZ_RESULTS),
    AsyncStorage.removeItem(STORAGE_KEYS.BOOKMARKS),
    AsyncStorage.removeItem(STORAGE_KEYS.NOTES),
    AsyncStorage.removeItem(STORAGE_KEYS.CERTIFICATES),
    AsyncStorage.removeItem(STORAGE_KEYS.LAST_WATCHED),
  ]);
}
