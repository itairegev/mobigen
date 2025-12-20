# @mobigen/db

Prisma database schema and client for Mobigen.

## Overview

This package defines the database schema and provides the Prisma client for all Mobigen services. It uses PostgreSQL as the primary database.

## Tech Stack

- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Language**: TypeScript

## Installation

```bash
pnpm add @mobigen/db
```

## Features

- Type-safe database queries
- Automatic migrations
- Seed data scripts
- Multi-tenant support
- Soft delete patterns

## Directory Structure

```
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration files
│   └── seed.ts          # Seed script
├── src/
│   └── index.ts         # Prisma client export
└── package.json
```

## Usage

### Basic Queries

```typescript
import { prisma } from '@mobigen/db';

// Find all projects for a user
const projects = await prisma.project.findMany({
  where: { userId: 'user-id' },
  include: { builds: true },
});

// Create a new project
const project = await prisma.project.create({
  data: {
    name: 'My App',
    userId: 'user-id',
    templateId: 'ecommerce',
    status: 'draft',
  },
});

// Update project
await prisma.project.update({
  where: { id: 'project-id' },
  data: { status: 'generating' },
});
```

### Transactions

```typescript
import { prisma } from '@mobigen/db';

// Atomic operations
const result = await prisma.$transaction(async (tx) => {
  const project = await tx.project.create({
    data: { name: 'My App', userId: 'user-id' },
  });

  await tx.projectSession.create({
    data: { projectId: project.id, sessionId: 'session-id' },
  });

  return project;
});
```

## Schema

### Core Models

#### User

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  image         String?
  tier          UserTier  @default(FREE)
  projects      Project[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum UserTier {
  FREE
  PRO
  ENTERPRISE
}
```

#### Project

```prisma
model Project {
  id          String          @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus   @default(DRAFT)
  templateId  String?
  config      Json?
  branding    Json?
  s3Prefix    String?
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  builds      Build[]
  sessions    ProjectSession[]
  changes     ProjectChange[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

enum ProjectStatus {
  DRAFT
  GENERATING
  READY
  BUILDING
  FAILED
}
```

#### Build

```prisma
model Build {
  id           String       @id @default(cuid())
  projectId    String
  project      Project      @relation(fields: [projectId], references: [id])
  platform     Platform
  profile      BuildProfile @default(DEVELOPMENT)
  status       BuildStatus  @default(QUEUED)
  version      String?
  easBuildId   String?
  artifactUrl  String?
  logs         Json?
  error        String?
  createdAt    DateTime     @default(now())
  completedAt  DateTime?
}

enum Platform {
  IOS
  ANDROID
}

enum BuildStatus {
  QUEUED
  BUILDING
  COMPLETED
  FAILED
  CANCELED
}
```

### Analytics Models

#### AnalyticsEvent

```prisma
model AnalyticsEvent {
  id        String   @id @default(cuid())
  event     String
  userId    String?
  projectId String?
  metadata  Json?
  timestamp DateTime @default(now())
}
```

#### ApiUsage

```prisma
model ApiUsage {
  id           String   @id @default(cuid())
  userId       String
  projectId    String?
  model        String
  inputTokens  Int
  outputTokens Int
  requestId    String?
  timestamp    DateTime @default(now())
}
```

## Commands

### Generate Client

```bash
pnpm --filter @mobigen/db prisma generate
```

### Push Schema (Development)

```bash
pnpm --filter @mobigen/db prisma db push
```

### Create Migration

```bash
pnpm --filter @mobigen/db prisma migrate dev --name <migration-name>
```

### Apply Migrations (Production)

```bash
pnpm --filter @mobigen/db prisma migrate deploy
```

### Open Prisma Studio

```bash
pnpm --filter @mobigen/db prisma studio
```

### Seed Database

```bash
pnpm --filter @mobigen/db prisma db seed
```

## Environment Variables

```env
DATABASE_URL=postgresql://mobigen:password@localhost:5432/mobigen
```

### Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

## Best Practices

### Soft Deletes

```typescript
// Instead of deleting
await prisma.project.update({
  where: { id: 'project-id' },
  data: { deletedAt: new Date() },
});

// Query with filter
const activeProjects = await prisma.project.findMany({
  where: { deletedAt: null },
});
```

### Pagination

```typescript
const page = 1;
const pageSize = 10;

const projects = await prisma.project.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

### Includes and Selects

```typescript
// Include related data
const project = await prisma.project.findUnique({
  where: { id: 'project-id' },
  include: {
    builds: true,
    user: { select: { name: true, email: true } },
  },
});

// Select specific fields
const projectNames = await prisma.project.findMany({
  select: { id: true, name: true },
});
```

## Related Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Main README](../../README.md)
