import { useState, useMemo } from 'react';

export interface UseSearchOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  filterFn?: (item: T, query: string) => boolean;
}

export interface UseSearchReturn<T> {
  query: string;
  setQuery: (query: string) => void;
  results: T[];
  isSearching: boolean;
  clearSearch: () => void;
}

export function useSearch<T>({
  data,
  searchKeys,
  filterFn,
}: UseSearchOptions<T>): UseSearchReturn<T> {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) {
      return data;
    }

    const lowerQuery = query.toLowerCase();

    return data.filter(item => {
      // Use custom filter function if provided
      if (filterFn) {
        return filterFn(item, lowerQuery);
      }

      // Default search: check if any of the searchKeys contains the query
      return searchKeys.some(key => {
        const value = item[key];
        if (value === null || value === undefined) return false;

        return String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [data, query, searchKeys, filterFn]);

  const clearSearch = () => {
    setQuery('');
  };

  return {
    query,
    setQuery,
    results,
    isSearching: query.trim().length > 0,
    clearSearch,
  };
}
