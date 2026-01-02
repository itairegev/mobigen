import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGivingFunds, getDonationHistory, submitDonation } from '../services/giving';

export function useGivingFunds() {
  return useQuery({
    queryKey: ['giving', 'funds'],
    queryFn: getGivingFunds,
  });
}

export function useDonationHistory() {
  return useQuery({
    queryKey: ['giving', 'history'],
    queryFn: getDonationHistory,
  });
}

export function useSubmitDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      amount,
      frequency,
      fundId,
      method,
    }: {
      amount: number;
      frequency: 'one-time' | 'weekly' | 'monthly';
      fundId: string;
      method: string;
    }) => submitDonation(amount, frequency, fundId, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giving'] });
    },
  });
}
