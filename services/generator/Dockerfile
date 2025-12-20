# syntax=docker/dockerfile:1

FROM node:25-alpine AS base
RUN apk add --no-cache libc6-compat git
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/generator/package.json ./services/generator/
COPY packages/ai/package.json ./packages/ai/
COPY packages/db/package.json ./packages/db/
COPY packages/storage/package.json ./packages/storage/
COPY packages/testing/package.json ./packages/testing/
COPY packages/config/tsconfig/package.json ./packages/config/tsconfig/
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/generator/node_modules ./services/generator/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client
RUN cd packages/db && pnpm prisma generate

# Build packages and service
RUN pnpm --filter @mobigen/ai build
RUN pnpm --filter @mobigen/storage build
RUN pnpm --filter @mobigen/testing build
RUN pnpm --filter @mobigen/generator build

# Production image
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 generator

# Copy built application
COPY --from=builder --chown=generator:nodejs /app/services/generator/dist ./services/generator/dist
COPY --from=builder --chown=generator:nodejs /app/services/generator/package.json ./services/generator/
COPY --from=builder --chown=generator:nodejs /app/packages ./packages
COPY --from=builder --chown=generator:nodejs /app/node_modules ./node_modules

# Create directories for templates and projects
RUN mkdir -p /app/templates /app/templates-bare /app/projects
RUN chown -R generator:nodejs /app/templates /app/templates-bare /app/projects

USER generator
EXPOSE 4000
ENV PORT=4000

WORKDIR /app/services/generator
CMD ["node", "dist/index.js"]
