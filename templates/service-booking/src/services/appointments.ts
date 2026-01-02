import { Appointment, TimeSlot } from '@/types';
import { addDays, format } from 'date-fns';

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    serviceId: '1',
    staffId: '1',
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'upcoming',
    notes: 'Looking for a modern layered cut',
    createdAt: new Date(),
  },
  {
    id: '2',
    serviceId: '4',
    staffId: '5',
    date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '15:00',
    status: 'upcoming',
    createdAt: new Date(),
  },
  {
    id: '3',
    serviceId: '7',
    staffId: '3',
    date: format(addDays(new Date(), -3), 'yyyy-MM-dd'),
    startTime: '11:00',
    endTime: '11:45',
    status: 'completed',
    createdAt: addDays(new Date(), -10),
  },
  {
    id: '4',
    serviceId: '5',
    staffId: '6',
    date: format(addDays(new Date(), -7), 'yyyy-MM-dd'),
    startTime: '15:30',
    endTime: '17:00',
    status: 'completed',
    notes: 'Focus on shoulders and back',
    createdAt: addDays(new Date(), -14),
  },
];

// Generate time slots for a given staff member and date
function generateTimeSlots(staffId: string, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const hours = [9, 10, 11, 13, 14, 15, 16, 17];
  const bookedSlots = MOCK_APPOINTMENTS.filter(
    (apt) => apt.staffId === staffId && apt.date === date && apt.status !== 'cancelled'
  );

  hours.forEach((hour, index) => {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

    // Check if slot is already booked
    const isBooked = bookedSlots.some((apt) => apt.startTime === startTime);

    // Randomly make some slots unavailable for variety
    const randomUnavailable = Math.random() < 0.15;

    slots.push({
      id: `${staffId}-${date}-${index}`,
      staffId,
      date,
      startTime,
      endTime,
      available: !isBooked && !randomUnavailable,
    });
  });

  return slots;
}

// Simulated API with delay
export async function getAppointments(userId?: string): Promise<Appointment[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Sort by date, upcoming first
  return [...MOCK_APPOINTMENTS].sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_APPOINTMENTS.find((apt) => apt.id === id) || null;
}

export async function getAvailableSlots(
  staffId: string,
  date: string
): Promise<TimeSlot[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return generateTimeSlots(staffId, date);
}

export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'createdAt'>
): Promise<Appointment> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const newAppointment: Appointment = {
    ...appointment,
    id: Date.now().toString(),
    createdAt: new Date(),
  };

  MOCK_APPOINTMENTS.push(newAppointment);
  return newAppointment;
}

export async function cancelAppointment(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const appointment = MOCK_APPOINTMENTS.find((apt) => apt.id === id);
  if (appointment) {
    appointment.status = 'cancelled';
  }
}
