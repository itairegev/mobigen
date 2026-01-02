import { Reminder } from '@/types';

export const MOCK_REMINDERS: Reminder[] = [
  {
    id: '1',
    petId: '1',
    type: 'vaccination',
    title: 'Annual DHPP Vaccination',
    dueDate: new Date('2026-02-15'),
    completed: false,
    notes: 'Distemper, Hepatitis, Parvovirus, Parainfluenza',
    createdAt: new Date('2025-12-01'),
  },
  {
    id: '2',
    petId: '2',
    type: 'medication',
    title: 'Flea & Tick Treatment',
    dueDate: new Date('2026-01-10'),
    completed: false,
    notes: 'Monthly topical treatment',
    createdAt: new Date('2025-12-10'),
  },
  {
    id: '3',
    petId: '1',
    type: 'checkup',
    title: 'Dental Checkup',
    dueDate: new Date('2026-03-01'),
    completed: false,
    notes: 'Annual dental examination',
    createdAt: new Date('2025-12-15'),
  },
  {
    id: '4',
    petId: '3',
    type: 'grooming',
    title: 'Nail Trim',
    dueDate: new Date('2026-01-28'),
    completed: false,
    notes: 'Trim every 4 weeks',
    createdAt: new Date('2025-12-28'),
  },
  {
    id: '5',
    petId: '2',
    type: 'vaccination',
    title: 'Rabies Booster',
    dueDate: new Date('2026-06-20'),
    completed: false,
    notes: '3-year rabies vaccine',
    createdAt: new Date('2023-06-20'),
  },
];

export async function getReminders(petId?: string): Promise<Reminder[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let reminders = [...MOCK_REMINDERS];
  if (petId) {
    reminders = reminders.filter(r => r.petId === petId);
  }
  return reminders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export async function getUpcomingReminders(): Promise<Reminder[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  return MOCK_REMINDERS.filter(r =>
    !r.completed && r.dueDate >= today && r.dueDate <= thirtyDaysFromNow
  ).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export async function completeReminder(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
}

export async function addReminder(
  reminder: Omit<Reminder, 'id' | 'createdAt'>
): Promise<Reminder> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newReminder: Reminder = {
    ...reminder,
    id: String(Date.now()),
    createdAt: new Date(),
  };
  return newReminder;
}
