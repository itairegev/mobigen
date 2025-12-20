# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat git python3 make g++ vips-dev
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/tester/package.json ./services/tester/
COPY packages/db/package.json ./packages/db/
COPY packages/config/tsconfig/package.json ./packages/config/tsconfig/
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/tester/node_modules ./services/tester/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client
RUN cd packages/db && pnpm prisma generate

# Build service (uses tsup)
RUN pnpm --filter @mobigen/tester build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat vips chromium

ENV NODE_ENV=production
ENV CHROME_BIN=/usr/bin/chromium-browser

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 tester

WORKDIR /app

# Copy built application
COPY --from=builder --chown=tester:nodejs /app/services/tester/dist ./services/tester/dist
COPY --from=builder --chown=tester:nodejs /app/services/tester/package.json ./services/tester/
COPY --from=builder --chown=tester:nodejs /app/packages ./packages
COPY --from=builder --chown=tester:nodejs /app/node_modules ./node_modules

# Create directories for screenshots and test results
RUN mkdir -p /app/screenshots /app/test-results
RUN chown -R tester:nodejs /app/screenshots /app/test-results

USER tester
EXPOSE 6000
ENV PORT=6000

WORKDIR /app/services/tester
CMD ["node", "dist/index.js"]
