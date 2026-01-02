import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointments,
  getAppointmentById,
  getAvailableSlots,
  createAppointment,
  cancelAppointment,
} from '@/services';
import type { Appointment } from '@/types';

export function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: () => getAppointments(),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointmentById(id),
    enabled: !!id,
  });
}

export function useAvailableSlots(staffId: string, date: string) {
  return useQuery({
    queryKey: ['slots', staffId, date],
    queryFn: () => getAvailableSlots(staffId, date),
    enabled: !!staffId && !!date,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointment: Omit<Appointment, 'id' | 'createdAt'>) =>
      createAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}
