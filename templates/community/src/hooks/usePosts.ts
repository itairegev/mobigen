import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, getPost, createPost, getComments, toggleReaction } from '../services';
import { ReactionType } from '../types';

export function usePosts(page: number = 1) {
  return useQuery({
    queryKey: ['posts', page],
    queryFn: () => getPosts(page),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => getPost(id),
    enabled: !!id,
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, images }: { content: string; images?: string[] }) =>
      createPost(content, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      type,
      userId,
    }: {
      postId: string;
      type: ReactionType;
      userId: string;
    }) => toggleReaction(postId, type, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
