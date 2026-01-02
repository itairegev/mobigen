import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitContactMessage } from '@/services';
import type { ContactMessage } from '@/types';

export function useContact() {
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) =>
      submitContactMessage(data),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  return {
    submit: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    success,
  };
}
