// ============================================================================
// Type Definitions for School/Classroom Template
// ============================================================================

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  dueDate: string; // ISO string
  assignedDate: string; // ISO string
  status: AssignmentStatus;
  type: AssignmentType;
  points: number;
  earnedPoints?: number;
  attachments?: Attachment[];
  instructions?: string;
  submittedAt?: string; // ISO string
  feedback?: string;
}

export type AssignmentStatus = 'pending' | 'in-progress' | 'submitted' | 'graded' | 'overdue';
export type AssignmentType = 'homework' | 'quiz' | 'test' | 'project' | 'reading';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  postedBy: string;
  postedByRole: 'teacher' | 'admin' | 'principal';
  postedAt: string; // ISO string
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: AnnouncementCategory;
  read: boolean;
  attachments?: Attachment[];
  expiresAt?: string; // ISO string
}

export type AnnouncementCategory = 'general' | 'academic' | 'event' | 'deadline' | 'emergency';

export interface Grade {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  assignmentId?: string;
  assignmentName?: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: LetterGrade;
  gradedDate: string; // ISO string
  category: GradeCategory;
  weight: number; // 0.0 to 1.0
  feedback?: string;
}

export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
export type GradeCategory = 'homework' | 'quiz' | 'test' | 'project' | 'participation';

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  color: string;
  room: string;
  period?: number;
  currentGrade?: number;
  letterGrade?: LetterGrade;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO string
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  type: EventType;
  location?: string;
  subjectId?: string;
  subjectName?: string;
  color?: string;
  allDay: boolean;
  recurring?: boolean;
}

export type EventType = 'class' | 'assignment-due' | 'test' | 'event' | 'holiday' | 'meeting' | 'deadline';

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  subjectId: string;
  subjectName: string;
  uploadedBy: string;
  uploadedAt: string; // ISO string
  fileSize?: number; // bytes
  downloads: number;
  thumbnail?: string;
}

export type ResourceType = 'pdf' | 'doc' | 'video' | 'link' | 'image' | 'presentation' | 'spreadsheet';

export interface Message {
  id: string;
  threadId: string;
  subject: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student' | 'parent' | 'admin';
  receiverId: string;
  sentAt: string; // ISO string
  read: boolean;
  attachments?: Attachment[];
  replyTo?: string; // Message ID
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageAt: string; // ISO string
  unreadCount: number;
  messages: Message[];
}

export interface Participant {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'parent' | 'admin';
  avatar?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  url: string;
  size: number; // bytes
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  grade: string; // "9th Grade", "10th Grade", etc.
  studentId: string;
  gpa: number;
  subjects: Subject[];
  attendance: AttendanceStats;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  tardy: number;
  excused: number;
  total: number;
  percentage: number;
}

// Stats & Summary Types
export interface AcademicStats {
  overallGPA: number;
  subjectCount: number;
  assignmentsDue: number;
  assignmentsOverdue: number;
  unreadAnnouncements: number;
  unreadMessages: number;
  upcomingEvents: number;
}

export interface SubjectGradesSummary {
  subject: Subject;
  grades: Grade[];
  average: number;
  letterGrade: LetterGrade;
  trend: 'up' | 'down' | 'stable';
}
