// ============================================================================
// Mock Grades Service
// ============================================================================

import type { Grade, SubjectGradesSummary, LetterGrade } from '../types';
import { MOCK_SUBJECTS } from './subjects';

const now = new Date();

export const MOCK_GRADES: Grade[] = [
  // Math grades
  {
    id: 'grade-1',
    subjectId: 'math-101',
    subjectName: 'Algebra II',
    subjectColor: MOCK_SUBJECTS[0].color,
    assignmentId: 'hw-1',
    assignmentName: 'Quadratic Equations Worksheet',
    score: 22,
    maxScore: 25,
    percentage: 88,
    letterGrade: 'B+',
    gradedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'homework',
    weight: 0.2,
  },
  {
    id: 'grade-2',
    subjectId: 'math-101',
    subjectName: 'Algebra II',
    subjectColor: MOCK_SUBJECTS[0].color,
    assignmentId: 'quiz-1',
    assignmentName: 'Functions Quiz',
    score: 17,
    maxScore: 20,
    percentage: 85,
    letterGrade: 'B',
    gradedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'quiz',
    weight: 0.3,
  },
  {
    id: 'grade-3',
    subjectId: 'math-101',
    subjectName: 'Algebra II',
    subjectColor: MOCK_SUBJECTS[0].color,
    assignmentId: 'test-1',
    assignmentName: 'Chapter 4 Test',
    score: 88,
    maxScore: 100,
    percentage: 88,
    letterGrade: 'B+',
    gradedDate: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'test',
    weight: 0.5,
    feedback: 'Good work! Review problem #15 - you had the right approach but made a calculation error.',
  },

  // English grades
  {
    id: 'grade-4',
    subjectId: 'eng-101',
    subjectName: 'English Literature',
    subjectColor: MOCK_SUBJECTS[1].color,
    assignmentId: 'hw-2',
    assignmentName: 'Chapter Analysis',
    score: 47,
    maxScore: 50,
    percentage: 94,
    letterGrade: 'A',
    gradedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'homework',
    weight: 0.2,
    feedback: 'Excellent analysis of the symbolism! Your use of textual evidence was particularly strong.',
  },
  {
    id: 'grade-5',
    subjectId: 'eng-101',
    subjectName: 'English Literature',
    subjectColor: MOCK_SUBJECTS[1].color,
    assignmentId: 'proj-1',
    assignmentName: 'Book Report',
    score: 90,
    maxScore: 100,
    percentage: 90,
    letterGrade: 'A-',
    gradedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'project',
    weight: 0.3,
  },

  // Science grades
  {
    id: 'grade-6',
    subjectId: 'sci-101',
    subjectName: 'Biology',
    subjectColor: MOCK_SUBJECTS[2].color,
    assignmentId: 'hw-5',
    assignmentName: 'Lab Report: Photosynthesis',
    score: 38,
    maxScore: 40,
    percentage: 95,
    letterGrade: 'A',
    gradedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'homework',
    weight: 0.25,
  },
  {
    id: 'grade-7',
    subjectId: 'sci-101',
    subjectName: 'Biology',
    subjectColor: MOCK_SUBJECTS[2].color,
    assignmentId: 'quiz-2',
    assignmentName: 'Cell Structure Quiz',
    score: 17,
    maxScore: 20,
    percentage: 85,
    letterGrade: 'B',
    gradedDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'quiz',
    weight: 0.25,
  },

  // History grades
  {
    id: 'grade-8',
    subjectId: 'hist-101',
    subjectName: 'World History',
    subjectColor: MOCK_SUBJECTS[3].color,
    assignmentId: 'test-2',
    assignmentName: 'WWI Exam',
    score: 92,
    maxScore: 100,
    percentage: 92,
    letterGrade: 'A-',
    gradedDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'test',
    weight: 0.4,
  },
  {
    id: 'grade-9',
    subjectId: 'hist-101',
    subjectName: 'World History',
    subjectColor: MOCK_SUBJECTS[3].color,
    assignmentId: 'hw-8',
    assignmentName: 'Timeline Project',
    score: 27,
    maxScore: 30,
    percentage: 90,
    letterGrade: 'A-',
    gradedDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'homework',
    weight: 0.2,
  },

  // Computer Science grades
  {
    id: 'grade-10',
    subjectId: 'cs-101',
    subjectName: 'Computer Science',
    subjectColor: MOCK_SUBJECTS[4].color,
    assignmentId: 'hw-6',
    assignmentName: 'Algorithm Design',
    score: 24,
    maxScore: 25,
    percentage: 96,
    letterGrade: 'A',
    gradedDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'homework',
    weight: 0.2,
  },
  {
    id: 'grade-11',
    subjectId: 'cs-101',
    subjectName: 'Computer Science',
    subjectColor: MOCK_SUBJECTS[4].color,
    assignmentId: 'proj-2',
    assignmentName: 'Final Project',
    score: 145,
    maxScore: 150,
    percentage: 97,
    letterGrade: 'A+',
    gradedDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'project',
    weight: 0.4,
    feedback: 'Outstanding work! Your code is clean, well-documented, and efficient. Great job implementing the bonus features!',
  },

  // PE grades
  {
    id: 'grade-12',
    subjectId: 'pe-101',
    subjectName: 'Physical Education',
    subjectColor: MOCK_SUBJECTS[5].color,
    assignmentName: 'Participation',
    score: 96,
    maxScore: 100,
    percentage: 96,
    letterGrade: 'A',
    gradedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'participation',
    weight: 1.0,
  },
];

export async function getGrades(): Promise<Grade[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_GRADES.sort(
    (a, b) => new Date(b.gradedDate).getTime() - new Date(a.gradedDate).getTime()
  );
}

export async function getGradesBySubject(subjectId: string): Promise<Grade[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_GRADES.filter((g) => g.subjectId === subjectId).sort(
    (a, b) => new Date(b.gradedDate).getTime() - new Date(a.gradedDate).getTime()
  );
}

export async function getSubjectGradesSummary(): Promise<SubjectGradesSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return MOCK_SUBJECTS.map((subject) => {
    const subjectGrades = MOCK_GRADES.filter((g) => g.subjectId === subject.id);
    const weightedSum = subjectGrades.reduce((sum, g) => sum + g.percentage * g.weight, 0);
    const totalWeight = subjectGrades.reduce((sum, g) => sum + g.weight, 0);
    const average = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Calculate trend (simplified - compare recent vs older grades)
    const recentGrades = subjectGrades.slice(0, 2);
    const olderGrades = subjectGrades.slice(2, 4);
    const recentAvg = recentGrades.reduce((sum, g) => sum + g.percentage, 0) / (recentGrades.length || 1);
    const olderAvg = olderGrades.reduce((sum, g) => sum + g.percentage, 0) / (olderGrades.length || 1);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 3) trend = 'up';
    if (recentAvg < olderAvg - 3) trend = 'down';

    return {
      subject,
      grades: subjectGrades,
      average,
      letterGrade: percentageToLetterGrade(average),
      trend,
    };
  });
}

export async function calculateGPA(): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const summaries = await getSubjectGradesSummary();
  const totalGPA = summaries.reduce((sum, s) => sum + letterGradeToGPA(s.letterGrade), 0);
  return totalGPA / summaries.length;
}

function percentageToLetterGrade(percentage: number): LetterGrade {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 60) return 'D';
  return 'F';
}

function letterGradeToGPA(grade: LetterGrade): number {
  const gpaMap: Record<LetterGrade, number> = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'F': 0.0,
  };
  return gpaMap[grade];
}
