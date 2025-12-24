---
id: api-integration
name: API Integration
description: Create type-safe API integrations with proper error handling and caching
category: Development
capabilities:
  - api-integration
  - typescript
  - networking
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
  - name: apiName
    description: Name of the API service
    type: string
    required: true
  - name: baseUrl
    description: Base URL of the API
    type: string
    required: true
outputs:
  - name: servicePath
    description: Path to the created service file
    type: file
---

# API Integration Skill

When creating API integrations, follow these patterns:

## File Structure

```
src/services/
├── api.ts              # Base API client configuration
├── {serviceName}.ts    # Service-specific API calls
└── types/
    └── {serviceName}.ts # API types
```

## Base API Client

```typescript
// src/services/api.ts
import { API_BASE_URL } from '@/config';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: options.method,
      headers: { ...this.defaultHeaders, ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
```

## Service Pattern

```typescript
// src/services/{serviceName}.ts
import { api } from './api';
import type { Entity, CreateEntityInput, UpdateEntityInput } from './types/{serviceName}';

export const {serviceName}Service = {
  getAll: () => api.get<Entity[]>('/entities'),

  getById: (id: string) => api.get<Entity>(`/entities/${id}`),

  create: (input: CreateEntityInput) => api.post<Entity>('/entities', input),

  update: (id: string, input: UpdateEntityInput) =>
    api.put<Entity>(`/entities/${id}`, input),

  delete: (id: string) => api.delete<void>(`/entities/${id}`),
};
```

## React Query Integration

```typescript
// src/hooks/use{Entity}.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { {serviceName}Service } from '@/services/{serviceName}';

export function use{Entity}List() {
  return useQuery({
    queryKey: ['{entity}s'],
    queryFn: {serviceName}Service.getAll,
  });
}

export function use{Entity}(id: string) {
  return useQuery({
    queryKey: ['{entity}', id],
    queryFn: () => {serviceName}Service.getById(id),
    enabled: !!id,
  });
}

export function useCreate{Entity}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: {serviceName}Service.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{entity}s'] });
    },
  });
}
```

## Error Handling

```typescript
class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
```

## Best Practices

1. **Type Safety**
   - Define input/output types for all endpoints
   - Use generics for the request method
   - Export types for consumers

2. **Error Handling**
   - Create custom error classes
   - Handle network errors gracefully
   - Provide meaningful error messages

3. **Caching**
   - Use React Query for data caching
   - Configure stale time appropriately
   - Invalidate queries on mutations

4. **Security**
   - Never store tokens in plain text
   - Use secure storage for credentials
   - Implement token refresh logic
