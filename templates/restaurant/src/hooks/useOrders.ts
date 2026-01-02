import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrder, getActiveOrders, placeOrder } from '@/services';
import { CartItem } from '@/types';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useActiveOrders() {
  return useQuery({
    queryKey: ['activeOrders'],
    queryFn: getActiveOrders,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      items,
      type,
      addressId,
      tip,
      customerNotes,
    }: {
      items: CartItem[];
      type: 'pickup' | 'delivery';
      addressId?: string;
      tip?: number;
      customerNotes?: string;
    }) => placeOrder(items, type, addressId, tip, customerNotes),
    onSuccess: () => {
      // Invalidate orders cache to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
    },
  });
}
