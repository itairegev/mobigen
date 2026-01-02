import { useQuery } from '@tanstack/react-query';
import { NewsArticle } from '@/types';
import {
  getNews,
  getNewsArticle,
  getNewsByCategory,
  getLatestNews,
} from '@/services/news';

export function useNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: getNews,
  });
}

export function useNewsArticle(id: string) {
  return useQuery({
    queryKey: ['news', id],
    queryFn: () => getNewsArticle(id),
    enabled: !!id,
  });
}

export function useNewsByCategory(category: NewsArticle['category']) {
  return useQuery({
    queryKey: ['news', 'category', category],
    queryFn: () => getNewsByCategory(category),
    enabled: !!category,
  });
}

export function useLatestNews(limit = 3) {
  return useQuery({
    queryKey: ['news', 'latest', limit],
    queryFn: () => getLatestNews(limit),
  });
}
