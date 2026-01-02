import type { Job, Client, TimeEntry, Photo, Message, Conversation, JobStats } from '../types';

// Mock clients
export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    company: 'Johnson Residence',
    address: '123 Oak Street, Springfield, IL 62701',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@techcorp.com',
    phone: '(555) 234-5678',
    company: 'TechCorp Inc',
    address: '456 Business Park Dr, Springfield, IL 62702',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '(555) 345-6789',
    address: '789 Maple Ave, Springfield, IL 62703',
  },
  {
    id: '4',
    name: 'David Thompson',
    email: 'david.t@email.com',
    phone: '(555) 456-7890',
    company: 'Thompson & Associates',
    address: '321 Pine Street, Springfield, IL 62704',
  },
  {
    id: '5',
    name: 'Lisa Martinez',
    email: 'lisa.m@email.com',
    phone: '(555) 567-8901',
    address: '654 Cedar Lane, Springfield, IL 62705',
  },
];

// Mock jobs with realistic field service scenarios
export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'HVAC System Maintenance',
    description: 'Annual HVAC system inspection and filter replacement. Check refrigerant levels and clean coils.',
    status: 'scheduled',
    priority: 'normal',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    estimatedDuration: 90,
    client: MOCK_CLIENTS[0],
    location: {
      address: '123 Oak Street',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      latitude: 39.7817,
      longitude: -89.6501,
      instructions: 'Gate code: #1234. HVAC unit in backyard.',
    },
    assignedTechnician: 'tech-001',
    tags: ['HVAC', 'Maintenance', 'Annual'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Network Infrastructure Repair',
    description: 'Diagnose and repair intermittent network connectivity issues. Check all switches and routers.',
    status: 'in-progress',
    priority: 'high',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '10:30',
    estimatedDuration: 120,
    client: MOCK_CLIENTS[1],
    location: {
      address: '456 Business Park Dr',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
      latitude: 39.7856,
      longitude: -89.6545,
      instructions: 'Report to reception on 3rd floor. Server room requires access badge.',
    },
    assignedTechnician: 'tech-001',
    tags: ['Networking', 'Repair', 'Urgent'],
    notes: 'Customer reports dropped connections every 2-3 hours.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Plumbing - Leaky Faucet Repair',
    description: 'Kitchen faucet dripping. Replace washers and check water pressure.',
    status: 'completed',
    priority: 'normal',
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: '14:00',
    estimatedDuration: 60,
    actualDuration: 45,
    client: MOCK_CLIENTS[2],
    location: {
      address: '789 Maple Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62703',
      latitude: 39.7789,
      longitude: -89.6423,
    },
    assignedTechnician: 'tech-001',
    tags: ['Plumbing', 'Repair'],
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Electrical Panel Inspection',
    description: 'Inspect electrical panel and test circuit breakers. Check for any safety issues.',
    status: 'scheduled',
    priority: 'high',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '13:00',
    estimatedDuration: 90,
    client: MOCK_CLIENTS[3],
    location: {
      address: '321 Pine Street',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      latitude: 39.7901,
      longitude: -89.6612,
      instructions: 'Basement access through side door.',
    },
    assignedTechnician: 'tech-001',
    tags: ['Electrical', 'Inspection', 'Safety'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Appliance Installation - Dishwasher',
    description: 'Install new dishwasher unit. Connect water supply and drainage. Test all functions.',
    status: 'scheduled',
    priority: 'normal',
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: '10:00',
    estimatedDuration: 120,
    client: MOCK_CLIENTS[4],
    location: {
      address: '654 Cedar Lane',
      city: 'Springfield',
      state: 'IL',
      zip: '62705',
      latitude: 39.7845,
      longitude: -89.6389,
    },
    assignedTechnician: 'tech-001',
    tags: ['Installation', 'Appliance'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'Security System Upgrade',
    description: 'Replace old cameras with new IP cameras. Configure mobile app access.',
    status: 'scheduled',
    priority: 'high',
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: '14:30',
    estimatedDuration: 180,
    client: MOCK_CLIENTS[1],
    location: {
      address: '456 Business Park Dr',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
      latitude: 39.7856,
      longitude: -89.6545,
      instructions: 'Contact security team upon arrival.',
    },
    assignedTechnician: 'tech-001',
    tags: ['Security', 'Upgrade', 'Installation'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    title: 'Water Heater Replacement',
    description: 'Remove old 40-gallon water heater and install new energy-efficient model.',
    status: 'completed',
    priority: 'urgent',
    scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: '08:00',
    estimatedDuration: 240,
    actualDuration: 210,
    client: MOCK_CLIENTS[0],
    location: {
      address: '123 Oak Street',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      latitude: 39.7817,
      longitude: -89.6501,
    },
    assignedTechnician: 'tech-001',
    tags: ['Plumbing', 'Installation', 'Emergency'],
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    title: 'Garage Door Opener Repair',
    description: 'Garage door not responding to remote. Check motor and sensors.',
    status: 'on-hold',
    priority: 'low',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: '11:00',
    estimatedDuration: 60,
    client: MOCK_CLIENTS[2],
    location: {
      address: '789 Maple Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62703',
      latitude: 39.7789,
      longitude: -89.6423,
    },
    assignedTechnician: 'tech-001',
    tags: ['Repair', 'Garage Door'],
    notes: 'Waiting for replacement part to arrive.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '9',
    title: 'Commercial HVAC - Rooftop Unit',
    description: 'Emergency repair for rooftop HVAC unit. Building temperature critical.',
    status: 'en-route',
    priority: 'urgent',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '15:00',
    estimatedDuration: 150,
    client: MOCK_CLIENTS[3],
    location: {
      address: '321 Pine Street',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      latitude: 39.7901,
      longitude: -89.6612,
      instructions: 'Roof access via building manager. Elevator key required.',
    },
    assignedTechnician: 'tech-001',
    tags: ['HVAC', 'Emergency', 'Commercial'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'Smart Thermostat Installation',
    description: 'Install Nest thermostat and configure with existing HVAC system. Set up app and schedules.',
    status: 'scheduled',
    priority: 'normal',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: '09:30',
    estimatedDuration: 90,
    client: MOCK_CLIENTS[4],
    location: {
      address: '654 Cedar Lane',
      city: 'Springfield',
      state: 'IL',
      zip: '62705',
      latitude: 39.7845,
      longitude: -89.6389,
    },
    assignedTechnician: 'tech-001',
    tags: ['HVAC', 'Installation', 'Smart Home'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock time entries
export const MOCK_TIME_ENTRIES: TimeEntry[] = [
  {
    id: '1',
    jobId: '2',
    technicianId: 'tech-001',
    clockIn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    notes: 'Started network diagnostics',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    jobId: '3',
    technicianId: 'tech-001',
    clockIn: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    clockOut: new Date(Date.now() - 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
    duration: 45,
    notes: 'Replaced faucet washers',
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    jobId: '7',
    technicianId: 'tech-001',
    clockIn: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    clockOut: new Date(Date.now() - 50 * 60 * 60 * 1000 + 210 * 60 * 1000).toISOString(),
    duration: 210,
    notes: 'Water heater replacement completed',
    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock conversations
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Sarah Johnson',
    lastMessage: 'Thanks for the quick service!',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unreadCount: 0,
    jobId: '1',
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Michael Chen',
    lastMessage: 'When will you arrive?',
    lastMessageTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unreadCount: 1,
    jobId: '2',
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Emily Rodriguez',
    lastMessage: 'The faucet is working perfectly now.',
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    jobId: '3',
  },
];

// Service functions
export async function getJobs(filter?: {
  status?: string;
  date?: string;
}): Promise<Job[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let jobs = [...MOCK_JOBS];

  if (filter?.status) {
    jobs = jobs.filter((job) => job.status === filter.status);
  }

  if (filter?.date) {
    jobs = jobs.filter((job) => job.scheduledDate === filter.date);
  }

  return jobs.sort((a, b) => {
    const timeA = new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime();
    const timeB = new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
    return timeA - timeB;
  });
}

export async function getJobById(id: string): Promise<Job | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_JOBS.find((job) => job.id === id) || null;
}

export async function updateJobStatus(id: string, status: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const job = MOCK_JOBS.find((job) => job.id === id);
  if (!job) throw new Error('Job not found');

  job.status = status as any;
  job.updatedAt = new Date().toISOString();

  if (status === 'completed') {
    job.completedAt = new Date().toISOString();
  }

  return job;
}

export async function getTimeEntries(jobId?: string): Promise<TimeEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (jobId) {
    return MOCK_TIME_ENTRIES.filter((entry) => entry.jobId === jobId);
  }

  return MOCK_TIME_ENTRIES;
}

export async function clockIn(jobId: string, notes?: string): Promise<TimeEntry> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const entry: TimeEntry = {
    id: `time-${Date.now()}`,
    jobId,
    technicianId: 'tech-001',
    clockIn: new Date().toISOString(),
    notes,
    createdAt: new Date().toISOString(),
  };

  MOCK_TIME_ENTRIES.push(entry);
  return entry;
}

export async function clockOut(entryId: string, notes?: string): Promise<TimeEntry> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const entry = MOCK_TIME_ENTRIES.find((e) => e.id === entryId);
  if (!entry) throw new Error('Time entry not found');

  const clockOutTime = new Date();
  const clockInTime = new Date(entry.clockIn);
  const duration = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));

  entry.clockOut = clockOutTime.toISOString();
  entry.duration = duration;
  if (notes) entry.notes = notes;

  return entry;
}

export async function getConversations(): Promise<Conversation[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_CONVERSATIONS.sort((a, b) =>
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );
}

export async function getJobStats(): Promise<JobStats> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const today = new Date().toISOString().split('T')[0];
  const todayJobs = MOCK_JOBS.filter((job) => job.scheduledDate === today);

  return {
    today: {
      total: todayJobs.length,
      completed: todayJobs.filter((j) => j.status === 'completed').length,
      inProgress: todayJobs.filter((j) => j.status === 'in-progress').length,
      scheduled: todayJobs.filter((j) => j.status === 'scheduled').length,
    },
    week: {
      total: MOCK_JOBS.length,
      completed: MOCK_JOBS.filter((j) => j.status === 'completed').length,
      hoursWorked: 28.5,
    },
    month: {
      total: MOCK_JOBS.length,
      completed: MOCK_JOBS.filter((j) => j.status === 'completed').length,
      revenue: 12450,
    },
  };
}
