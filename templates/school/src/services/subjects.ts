// ============================================================================
// Mock Subjects Service
// ============================================================================

import type { Subject } from '../types';
import { colors } from '../theme/colors';

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'math-101',
    name: 'Algebra II',
    teacher: 'Mrs. Johnson',
    color: colors.subjects.mathematics,
    room: 'Room 204',
    period: 1,
    currentGrade: 87.5,
    letterGrade: 'B+',
  },
  {
    id: 'eng-101',
    name: 'English Literature',
    teacher: 'Mr. Peterson',
    color: colors.subjects.english,
    room: 'Room 112',
    period: 2,
    currentGrade: 92.3,
    letterGrade: 'A-',
  },
  {
    id: 'sci-101',
    name: 'Biology',
    teacher: 'Dr. Martinez',
    color: colors.subjects.science,
    room: 'Lab 301',
    period: 3,
    currentGrade: 89.7,
    letterGrade: 'B+',
  },
  {
    id: 'hist-101',
    name: 'World History',
    teacher: 'Ms. Davis',
    color: colors.subjects.history,
    room: 'Room 218',
    period: 4,
    currentGrade: 91.0,
    letterGrade: 'A-',
  },
  {
    id: 'cs-101',
    name: 'Computer Science',
    teacher: 'Mr. Anderson',
    color: colors.subjects.computer_science,
    room: 'Lab 405',
    period: 5,
    currentGrade: 95.2,
    letterGrade: 'A',
  },
  {
    id: 'pe-101',
    name: 'Physical Education',
    teacher: 'Coach Williams',
    color: colors.subjects.physical_education,
    room: 'Gymnasium',
    period: 6,
    currentGrade: 96.0,
    letterGrade: 'A',
  },
];

export async function getSubjects(): Promise<Subject[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_SUBJECTS;
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_SUBJECTS.find((s) => s.id === id) || null;
}
