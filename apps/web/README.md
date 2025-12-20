# @mobigen/web

Next.js 14 web dashboard for the Mobigen AI-powered mobile app generator.

## Overview

The web dashboard is the primary user interface for Mobigen. It provides project management, real-time generation progress tracking, build management, and user settings.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **API**: tRPC (type-safe API calls)
- **Real-time**: Socket.IO client
- **State Management**: React hooks + Context

## Features

- User authentication (credentials + OAuth)
- Project creation wizard (4-step flow)
- Real-time generation progress via WebSocket
- Build monitoring and artifact downloads
- User settings and API key management
- Usage statistics and billing dashboard

## Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (grouped route)
│   │   ├── login/           # Login page
│   │   └── signup/          # Signup page
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth handlers
│   │   ├── generate/        # Generation proxy
│   │   ├── health/          # Health check
│   │   └── trpc/            # tRPC handler
│   ├── dashboard/           # Dashboard page
│   ├── projects/            # Project pages
│   │   ├── new/             # Project wizard
│   │   └── [id]/            # Project detail
│   ├── settings/            # User settings
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Base UI components
│   ├── project/             # Project-specific components
│   └── layout/              # Layout components
├── hooks/                   # Custom React hooks
│   ├── useGenerator.ts      # WebSocket generation hook
│   └── useProject.ts        # Project data hook
├── lib/                     # Utilities
│   ├── auth.ts              # NextAuth configuration
│   ├── trpc.ts              # tRPC client setup
│   └── utils.ts             # Helper functions
└── types/                   # TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (via Docker or local)
- Redis (via Docker or local)

### Development

```bash
# From monorepo root
pnpm install

# Start infrastructure
docker compose up -d postgres redis

# Generate Prisma client
pnpm --filter @mobigen/db prisma generate

# Start development server
pnpm --filter @mobigen/web dev
```

### Environment Variables

Create `.env.local` in the `apps/web` directory:

```env
# Database
DATABASE_URL=postgresql://mobigen:mobigen_dev_password@localhost:5432/mobigen

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Generator Service
NEXT_PUBLIC_GENERATOR_URL=http://localhost:4000
GENERATOR_URL=http://localhost:4000

# Simulation Mode (for development without generator)
NEXT_PUBLIC_SIMULATION_MODE=false

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Pages

### Landing Page (`/`)

Public landing page with product information and call-to-action.

### Dashboard (`/dashboard`)

Authenticated users' main view showing:
- Project list with status indicators
- Quick actions (create new project)
- Usage statistics

### Project Creation (`/projects/new`)

4-step wizard:
1. **Basic Info**: Name, description
2. **Template Selection**: Choose from available templates
3. **Customization**: Branding, features, configuration
4. **Review**: Confirm and start generation

### Project Detail (`/projects/[id]`)

Project management view with:
- Generation progress (real-time)
- Build history and triggers
- Project settings
- Download artifacts

### Settings (`/settings`)

User account management:
- Profile settings
- Notification preferences
- API keys (Anthropic, Expo)
- Usage and billing

## API Routes

### `/api/auth/[...nextauth]`

NextAuth.js authentication handlers for:
- Credentials login
- OAuth providers (Google, GitHub)
- Session management

### `/api/generate`

Proxy to the Generator service:
- Validates user session
- Forwards generation requests
- Returns session ID for WebSocket connection

### `/api/health`

Health check endpoint returning:
- Service status
- Database connectivity
- Generator service connectivity

### `/api/trpc/[trpc]`

tRPC API handler for type-safe operations:
- Project CRUD
- Build management
- User settings

## Hooks

### `useGenerator`

WebSocket hook for real-time generation updates:

```typescript
const {
  status,
  progress,
  currentPhase,
  files,
  error,
  startGeneration
} = useGenerator(projectId);
```

### `useProject`

Project data and operations:

```typescript
const {
  project,
  isLoading,
  updateProject,
  deleteProject
} = useProject(projectId);
```

## Building

```bash
# Build for production
pnpm --filter @mobigen/web build

# Start production server
pnpm --filter @mobigen/web start
```

## Docker

```bash
# Build image
docker build -t mobigen-web -f apps/web/Dockerfile .

# Run container
docker run -p 3000:3000 --env-file .env mobigen-web
```

## Testing

```bash
# Run tests
pnpm --filter @mobigen/web test

# Run tests with coverage
pnpm --filter @mobigen/web test:coverage
```

## Related Documentation

- [Main README](../../README.md)
- [API Documentation](../../docs/API.md)
- [Architecture](../../docs/ARCHITECTURE.md)
