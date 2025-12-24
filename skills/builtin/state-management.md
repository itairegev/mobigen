---
id: state-management
name: State Management
description: Implement state management with Zustand for local state and React Query for server state
category: Development
capabilities:
  - state-management
  - data-fetching
  - caching
tools:
  - Read
  - Write
  - Edit
compatibleAgents:
  - developer
  - technical-architect
parallelizable: true
priority: 8
inputs:
  - name: storeName
    description: Name of the store
    type: string
    required: true
  - name: storeType
    description: Type of store (zustand, context)
    type: string
    required: false
    default: zustand
outputs:
  - name: storePath
    description: Path to the store file
    type: file
---

# State Management Skill

Use a combination of Zustand for local/global state and React Query for server state.

## Zustand Store Pattern

```typescript
// src/stores/{storeName}.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Define types
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

// 2. Create store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// 3. Selector hooks (for performance)
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
```

## Cart Store Example

```typescript
// src/stores/cart.ts
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
      ).filter((i) => i.quantity > 0),
    })),

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
```

## React Query Setup

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## Server State with React Query

```typescript
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/products';

// Query keys factory
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Queries
export function useProducts(filters?: string) {
  return useQuery({
    queryKey: productKeys.list(filters ?? ''),
    queryFn: () => productService.getAll(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Optimistic updates
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      productService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });
      const previous = queryClient.getQueryData(productKeys.detail(id));
      queryClient.setQueryData(productKeys.detail(id), (old: Product) => ({
        ...old,
        ...data,
      }));
      return { previous };
    },

    onError: (err, { id }, context) => {
      queryClient.setQueryData(productKeys.detail(id), context?.previous);
    },

    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}
```

## Best Practices

1. **Zustand**
   - Keep stores focused and small
   - Use selectors for performance
   - Persist only necessary data
   - Define actions inside the store

2. **React Query**
   - Use query key factories
   - Configure appropriate stale times
   - Implement optimistic updates for UX
   - Handle loading and error states

3. **General**
   - Separate local and server state
   - Use TypeScript for type safety
   - Test state changes independently
