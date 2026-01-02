import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversations,
  fetchConversation,
  fetchMessages,
  sendMessage,
  createConversation,
} from '@/services';

export function useConversations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });

  const totalUnread = data?.reduce((sum, conv) => sum + conv.unreadCount, 0) || 0;

  return {
    conversations: data || [],
    totalUnread,
    isLoading,
    error,
  };
}

export function useConversation(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => fetchConversation(id),
    enabled: !!id,
  });

  return {
    conversation: data,
    isLoading,
    error,
  };
}

export function useMessages(conversationId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  });

  return {
    messages: data || [],
    isLoading,
    error,
  };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendMessage(conversationId, text),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    sendMessage: mutateAsync,
    isSending: isPending,
    error,
  };
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ listingId, message }: { listingId: string; message: string }) =>
      createConversation(listingId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    createConversation: mutateAsync,
    isCreating: isPending,
    error,
  };
}
