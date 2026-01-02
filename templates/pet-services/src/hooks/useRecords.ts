import { useQuery } from '@tanstack/react-query';
import { getHealthRecords } from '@/services';

export function useHealthRecords(petId?: string) {
  return useQuery({
    queryKey: ['healthRecords', petId],
    queryFn: () => getHealthRecords(petId),
  });
}
