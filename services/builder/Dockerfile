# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat git
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/builder/package.json ./services/builder/
COPY packages/db/package.json ./packages/db/
COPY packages/storage/package.json ./packages/storage/
COPY packages/config/tsconfig/package.json ./packages/config/tsconfig/
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/builder/node_modules ./services/builder/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client
RUN cd packages/db && pnpm prisma generate

# Build packages and service
RUN pnpm --filter @mobigen/storage build
RUN pnpm --filter @mobigen/builder build

# Production image
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 builder

# Copy built application
COPY --from=builder --chown=builder:nodejs /app/services/builder/dist ./services/builder/dist
COPY --from=builder --chown=builder:nodejs /app/services/builder/package.json ./services/builder/
COPY --from=builder --chown=builder:nodejs /app/packages ./packages
COPY --from=builder --chown=builder:nodejs /app/node_modules ./node_modules

USER builder
EXPOSE 5000
ENV PORT=5000

WORKDIR /app/services/builder
CMD ["node", "dist/index.js"]
