import { Appointment } from '@/types';

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    petId: '1',
    serviceId: '1',
    date: '2026-01-15',
    startTime: '10:00',
    endTime: '10:30',
    status: 'upcoming',
    veterinarian: 'Dr. Sarah Mitchell',
    notes: 'Annual wellness checkup',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: '2',
    petId: '2',
    serviceId: '4',
    date: '2026-01-20',
    startTime: '14:00',
    endTime: '15:30',
    status: 'upcoming',
    notes: 'First grooming session',
    createdAt: new Date('2026-01-02'),
  },
  {
    id: '3',
    petId: '1',
    serviceId: '2',
    date: '2025-12-15',
    startTime: '09:00',
    endTime: '09:20',
    status: 'completed',
    veterinarian: 'Dr. James Chen',
    notes: 'Rabies vaccination',
    createdAt: new Date('2025-12-01'),
  },
  {
    id: '4',
    petId: '2',
    serviceId: '1',
    date: '2025-11-20',
    startTime: '11:00',
    endTime: '11:30',
    status: 'completed',
    veterinarian: 'Dr. Sarah Mitchell',
    notes: 'Regular checkup - all healthy',
    createdAt: new Date('2025-11-10'),
  },
  {
    id: '5',
    petId: '3',
    serviceId: '6',
    date: '2025-12-28',
    startTime: '15:00',
    endTime: '15:15',
    status: 'completed',
    notes: 'Nail trimming',
    createdAt: new Date('2025-12-20'),
  },
];

export async function getAppointments(petId?: string): Promise<Appointment[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let appointments = [...MOCK_APPOINTMENTS];
  if (petId) {
    appointments = appointments.filter(apt => apt.petId === petId);
  }
  return appointments.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateB.getTime() - dateA.getTime();
  });
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const today = new Date();
  return MOCK_APPOINTMENTS.filter(apt => {
    const aptDate = new Date(apt.date);
    return apt.status === 'upcoming' && aptDate >= today;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_APPOINTMENTS.find(apt => apt.id === id) || null;
}

export async function bookAppointment(
  appointment: Omit<Appointment, 'id' | 'createdAt'>
): Promise<Appointment> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newAppointment: Appointment = {
    ...appointment,
    id: String(Date.now()),
    createdAt: new Date(),
  };
  return newAppointment;
}

export async function cancelAppointment(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
}
