import { useQuery } from '@tanstack/react-query';
import { getTestimonials } from '@/services';

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: getTestimonials,
  });
}
