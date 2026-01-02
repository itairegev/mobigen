import { useQuery } from '@tanstack/react-query';
import { getAllStaff, getStaffById, getStaffForService } from '@/services';

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: getAllStaff,
  });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: () => getStaffById(id),
    enabled: !!id,
  });
}

export function useStaffForService(serviceId: string) {
  return useQuery({
    queryKey: ['staff', 'service', serviceId],
    queryFn: () => getStaffForService(serviceId),
    enabled: !!serviceId,
  });
}
