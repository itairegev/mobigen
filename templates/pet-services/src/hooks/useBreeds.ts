import { useState, useEffect, useCallback } from 'react';
import {
  getDogBreeds,
  getCatBreeds,
  getPopularDogBreeds,
  getPopularCatBreeds,
  searchDogBreeds,
  searchCatBreeds,
  getFeaturedBreeds,
  getRandomDogImages,
  getRandomCatImages,
  getDogBreedById,
  getCatBreedById,
  DogBreed,
  CatBreed,
  UnifiedBreed,
  BreedImage,
} from '@/services/breeds';

interface UseBreedsState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all dog breeds
 */
export function useDogBreeds(): UseBreedsState<DogBreed> {
  const [data, setData] = useState<DogBreed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const breeds = await getDogBreeds();
      setData(breeds);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch dog breeds'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to fetch all cat breeds
 */
export function useCatBreeds(): UseBreedsState<CatBreed> {
  const [data, setData] = useState<CatBreed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const breeds = await getCatBreeds();
      setData(breeds);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch cat breeds'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to fetch popular breeds (for homepage)
 */
export function usePopularBreeds(): UseBreedsState<DogBreed | CatBreed> {
  const [data, setData] = useState<(DogBreed | CatBreed)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dogs, cats] = await Promise.all([
        getPopularDogBreeds(),
        getPopularCatBreeds(),
      ]);
      // Interleave dogs and cats
      const combined: (DogBreed | CatBreed)[] = [];
      const maxLen = Math.max(dogs.length, cats.length);
      for (let i = 0; i < maxLen; i++) {
        if (dogs[i]) combined.push(dogs[i]);
        if (cats[i]) combined.push(cats[i]);
      }
      setData(combined.slice(0, 10)); // Limit to 10
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch popular breeds'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to fetch featured breeds (unified format)
 */
export function useFeaturedBreeds(limit = 6): UseBreedsState<UnifiedBreed> {
  const [data, setData] = useState<UnifiedBreed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const breeds = await getFeaturedBreeds(limit);
      setData(breeds);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch featured breeds'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to search breeds
 */
export function useBreedSearch(query: string): UseBreedsState<DogBreed | CatBreed> {
  const [data, setData] = useState<(DogBreed | CatBreed)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!query.trim()) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [dogs, cats] = await Promise.all([
        searchDogBreeds(query),
        searchCatBreeds(query),
      ]);
      setData([...dogs, ...cats]);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Search failed'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const debounce = setTimeout(fetch, 300);
    return () => clearTimeout(debounce);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to fetch random pet images
 */
export function useRandomPetImages(count = 10) {
  const [images, setImages] = useState<BreedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dogImages, catImages] = await Promise.all([
        getRandomDogImages(Math.ceil(count / 2)),
        getRandomCatImages(Math.floor(count / 2)),
      ]);
      // Shuffle and combine
      const combined = [...dogImages, ...catImages].sort(() => Math.random() - 0.5);
      setImages(combined);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch images'));
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { images, loading, error, refetch: fetch };
}

/**
 * Hook to fetch a single breed by ID
 */
export function useBreedDetails(id: string | number, species: 'dog' | 'cat') {
  const [breed, setBreed] = useState<DogBreed | CatBreed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: DogBreed | CatBreed | null = null;

      if (species === 'dog') {
        result = await getDogBreedById(Number(id));
      } else {
        result = await getCatBreedById(String(id));
      }

      setBreed(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch breed details'));
    } finally {
      setLoading(false);
    }
  }, [id, species]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { breed, loading, error, refetch: fetch };
}
