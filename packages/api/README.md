# @mobigen/api

tRPC API routers for type-safe API calls in Mobigen.

## Overview

This package provides the API layer for Mobigen using tRPC, enabling end-to-end type safety between the frontend and backend.

## Tech Stack

- **API Framework**: tRPC v10
- **Validation**: Zod
- **Database**: Prisma (via @mobigen/db)
- **Language**: TypeScript

## Installation

```bash
pnpm add @mobigen/api
```

## Features

- Type-safe API endpoints
- Automatic TypeScript inference
- Input validation with Zod
- Middleware support
- Context-based authentication

## Directory Structure

```
src/
├── index.ts              # Main exports
├── root.ts               # Root router
├── context.ts            # Context creation
├── trpc.ts               # tRPC instance
├── routers/              # API routers
│   ├── index.ts          # Router exports
│   ├── projects.ts       # Project operations
│   ├── builds.ts         # Build operations
│   └── users.ts          # User operations
└── middleware/           # Middleware
    ├── auth.ts           # Authentication
    └── rateLimit.ts      # Rate limiting
```

## Usage

### Server Setup (Next.js)

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@mobigen/api';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### Client Setup

```typescript
// lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@mobigen/api';

export const trpc = createTRPCReact<AppRouter>();
```

### Using the API

```typescript
// In React components
import { trpc } from '@/lib/trpc';

function ProjectList() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.projects.list.invalidate();
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: 'My App',
      templateId: 'ecommerce',
    });
  };

  // ...
}
```

## Routers

### Projects Router

```typescript
// Available procedures
projects.list        // Query: Get all user projects
projects.getById     // Query: Get project by ID
projects.create      // Mutation: Create new project
projects.update      // Mutation: Update project
projects.delete      // Mutation: Delete project
```

**Input/Output Types:**

```typescript
// projects.create
input: {
  name: string;
  templateId: string;
  description?: string;
  config?: Record<string, any>;
}

output: {
  id: string;
  name: string;
  status: ProjectStatus;
  templateId: string;
  createdAt: Date;
  // ...
}
```

### Builds Router

```typescript
// Available procedures
builds.list          // Query: List project builds
builds.getStatus     // Query: Get build status
builds.trigger       // Mutation: Trigger new build
builds.cancel        // Mutation: Cancel build
```

**Input/Output Types:**

```typescript
// builds.trigger
input: {
  projectId: string;
  platform: 'ios' | 'android';
  profile?: 'development' | 'preview' | 'production';
}

output: {
  id: string;
  status: 'queued';
  message: string;
}
```

### Users Router

```typescript
// Available procedures
users.me             // Query: Get current user
users.updateProfile  // Mutation: Update profile
users.updateSettings // Mutation: Update settings
users.getUsage       // Query: Get usage stats
users.deleteAccount  // Mutation: Delete account
```

## Context

The context provides:
- Database client (Prisma)
- Session information
- User data

```typescript
// context.ts
export async function createContext({ req, res }: CreateContextOptions) {
  const session = await getServerSession(authOptions);

  return {
    prisma,
    session,
    user: session?.user,
  };
}
```

## Middleware

### Authentication Middleware

```typescript
import { protectedProcedure } from '@mobigen/api';

// Requires authenticated user
const protectedRouter = router({
  secretData: protectedProcedure.query(({ ctx }) => {
    // ctx.user is guaranteed to exist
    return { userId: ctx.user.id };
  }),
});
```

### Rate Limiting

```typescript
import { rateLimitedProcedure } from '@mobigen/api';

const rateLimitedRouter = router({
  expensiveOperation: rateLimitedProcedure
    .input(z.object({ data: z.string() }))
    .mutation(async ({ input }) => {
      // Rate limited to prevent abuse
    }),
});
```

## Error Handling

```typescript
import { TRPCError } from '@trpc/server';

// Throwing errors
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Project not found',
});

// Error codes
// - UNAUTHORIZED
// - FORBIDDEN
// - NOT_FOUND
// - BAD_REQUEST
// - CONFLICT
// - INTERNAL_SERVER_ERROR
```

## Building

```bash
# Build package
pnpm --filter @mobigen/api build

# Type checking
pnpm --filter @mobigen/api typecheck
```

## Related Documentation

- [tRPC Documentation](https://trpc.io/docs)
- [Main README](../../README.md)
- [API Documentation](../../docs/API.md)
