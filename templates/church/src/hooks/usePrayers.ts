import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPrayerRequests, submitPrayerRequest, prayForRequest } from '../services/prayers';

export function usePrayerRequests() {
  return useQuery({
    queryKey: ['prayers'],
    queryFn: getPrayerRequests,
  });
}

export function useSubmitPrayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      description,
      category,
      isPrivate,
    }: {
      title: string;
      description: string;
      category: string;
      isPrivate: boolean;
    }) => submitPrayerRequest(title, description, category, isPrivate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },
  });
}

export function usePrayFor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => prayForRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },
  });
}
