// ============================================================================
// Mock Assignments Service
// ============================================================================

import type { Assignment } from '../types';
import { MOCK_SUBJECTS } from './subjects';

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 7);
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(now);
lastWeek.setDate(lastWeek.getDate() - 7);

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'hw-1',
    title: 'Quadratic Equations Worksheet',
    description: 'Complete problems 1-25 on page 184. Show all work and check your answers.',
    subjectId: 'math-101',
    subjectName: 'Algebra II',
    subjectColor: MOCK_SUBJECTS[0].color,
    dueDate: tomorrow.toISOString(),
    assignedDate: lastWeek.toISOString(),
    status: 'pending',
    type: 'homework',
    points: 25,
    instructions: 'Use the quadratic formula to solve. Remember to simplify radicals.',
  },
  {
    id: 'hw-2',
    title: 'Chapter 5 Reading Response',
    description: 'Write a 2-page analysis of the themes in Chapter 5 of "To Kill a Mockingbird".',
    subjectId: 'eng-101',
    subjectName: 'English Literature',
    subjectColor: MOCK_SUBJECTS[1].color,
    dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in-progress',
    type: 'homework',
    points: 50,
    instructions: 'Focus on symbolism and character development. Use specific quotes to support your analysis.',
  },
  {
    id: 'quiz-1',
    title: 'Cell Structure Quiz',
    description: 'Quiz covering cell organelles and their functions.',
    subjectId: 'sci-101',
    subjectName: 'Biology',
    subjectColor: MOCK_SUBJECTS[2].color,
    dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    type: 'quiz',
    points: 20,
    instructions: 'Study your notes and the diagrams from class. This quiz is open tomorrow during class.',
  },
  {
    id: 'test-1',
    title: 'World War II Exam',
    description: 'Comprehensive exam covering WWII events, causes, and outcomes.',
    subjectId: 'hist-101',
    subjectName: 'World History',
    subjectColor: MOCK_SUBJECTS[3].color,
    dueDate: nextWeek.toISOString(),
    assignedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    type: 'test',
    points: 100,
    instructions: 'Review chapters 12-15. Bring a #2 pencil. The test will include multiple choice, short answer, and essay questions.',
  },
  {
    id: 'proj-1',
    title: 'Web Development Project',
    description: 'Create a responsive website using HTML, CSS, and JavaScript.',
    subjectId: 'cs-101',
    subjectName: 'Computer Science',
    subjectColor: MOCK_SUBJECTS[4].color,
    dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    assignedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in-progress',
    type: 'project',
    points: 150,
    instructions: 'Project must include: homepage, about page, contact form. Must be mobile responsive. Submit GitHub repository link.',
    attachments: [
      {
        id: 'att-1',
        name: 'project-requirements.pdf',
        type: 'application/pdf',
        url: 'https://example.com/requirements.pdf',
        size: 245000,
      },
    ],
  },
  {
    id: 'hw-3',
    title: 'Graphing Practice',
    description: 'Graph the following functions and identify key features.',
    subjectId: 'math-101',
    subjectName: 'Algebra II',
    subjectColor: MOCK_SUBJECTS[0].color,
    dueDate: yesterday.toISOString(),
    assignedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'overdue',
    type: 'homework',
    points: 20,
  },
  {
    id: 'hw-4',
    title: 'Poetry Analysis',
    description: 'Analyze the use of metaphor in Robert Frost\'s "The Road Not Taken".',
    subjectId: 'eng-101',
    subjectName: 'English Literature',
    subjectColor: MOCK_SUBJECTS[1].color,
    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedDate: now.toISOString(),
    status: 'pending',
    type: 'homework',
    points: 30,
  },
  {
    id: 'hw-5',
    title: 'Lab Report: Photosynthesis',
    description: 'Write a formal lab report on the photosynthesis experiment we conducted.',
    subjectId: 'sci-101',
    subjectName: 'Biology',
    subjectColor: MOCK_SUBJECTS[2].color,
    dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    assignedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in-progress',
    type: 'homework',
    points: 40,
    submittedAt: now.toISOString(),
    earnedPoints: 38,
    feedback: 'Great observations! Make sure to include units in your measurements.',
  },
  {
    id: 'read-1',
    title: 'Read Chapters 6-8',
    description: 'Read chapters 6-8 of the textbook and take notes.',
    subjectId: 'hist-101',
    subjectName: 'World History',
    subjectColor: MOCK_SUBJECTS[3].color,
    dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    type: 'reading',
    points: 10,
  },
  {
    id: 'hw-6',
    title: 'Algorithm Design Homework',
    description: 'Design algorithms for the given sorting problems.',
    subjectId: 'cs-101',
    subjectName: 'Computer Science',
    subjectColor: MOCK_SUBJECTS[4].color,
    dueDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    assignedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'submitted',
    type: 'homework',
    points: 25,
    submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    earnedPoints: 24,
    feedback: 'Excellent work! Your bubble sort implementation is very efficient.',
  },
];

export async function getAssignments(
  status?: 'pending' | 'in-progress' | 'submitted' | 'graded' | 'overdue'
): Promise<Assignment[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (status) {
    return MOCK_ASSIGNMENTS.filter((a) => a.status === status);
  }

  return MOCK_ASSIGNMENTS;
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_ASSIGNMENTS.find((a) => a.id === id) || null;
}

export async function getUpcomingAssignments(limit: number = 5): Promise<Assignment[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_ASSIGNMENTS
    .filter((a) => a.status === 'pending' || a.status === 'in-progress')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, limit);
}

export async function getAssignmentsBySubject(subjectId: string): Promise<Assignment[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ASSIGNMENTS.filter((a) => a.subjectId === subjectId);
}

export async function submitAssignment(assignmentId: string): Promise<Assignment> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const assignment = MOCK_ASSIGNMENTS.find((a) => a.id === assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  return {
    ...assignment,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
}
