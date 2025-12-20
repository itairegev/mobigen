# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat git
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/analytics/package.json ./services/analytics/
COPY packages/db/package.json ./packages/db/
COPY packages/config/tsconfig/package.json ./packages/config/tsconfig/
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/analytics/node_modules ./services/analytics/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client
RUN cd packages/db && pnpm prisma generate

# Build service (uses tsup)
RUN pnpm --filter @mobigen/analytics build

# Production image
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 analytics

# Copy built application
COPY --from=builder --chown=analytics:nodejs /app/services/analytics/dist ./services/analytics/dist
COPY --from=builder --chown=analytics:nodejs /app/services/analytics/package.json ./services/analytics/
COPY --from=builder --chown=analytics:nodejs /app/packages ./packages
COPY --from=builder --chown=analytics:nodejs /app/node_modules ./node_modules

USER analytics
EXPOSE 7000
ENV PORT=7000

WORKDIR /app/services/analytics
CMD ["node", "dist/index.js"]
