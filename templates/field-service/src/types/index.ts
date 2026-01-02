// Field Service App Type Definitions

export type JobStatus =
  | 'scheduled'
  | 'en-route'
  | 'in-progress'
  | 'on-hold'
  | 'completed'
  | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  priority: JobPriority;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // HH:mm format
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  client: Client;
  location: Location;
  assignedTechnician: string;
  tags: string[];
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  avatar?: string;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  instructions?: string; // Access instructions, gate code, etc.
}

export interface TimeEntry {
  id: string;
  jobId: string;
  technicianId: string;
  clockIn: string; // ISO datetime
  clockOut?: string; // ISO datetime
  duration?: number; // minutes
  notes?: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  jobId: string;
  uri: string;
  caption?: string;
  type: 'before' | 'during' | 'after' | 'issue' | 'completion';
  uploadedAt: string;
}

export interface Message {
  id: string;
  jobId?: string;
  clientId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'system';
}

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  jobId?: string;
}

export interface JobStats {
  today: {
    total: number;
    completed: number;
    inProgress: number;
    scheduled: number;
  };
  week: {
    total: number;
    completed: number;
    hoursWorked: number;
  };
  month: {
    total: number;
    completed: number;
    revenue: number;
  };
}

export interface DailySchedule {
  date: string;
  jobs: Job[];
  totalDuration: number;
  firstJobTime?: string;
  lastJobTime?: string;
}
