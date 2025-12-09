FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install Sharp dependencies for Alpine Linux
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    vips-cpp \
    build-base \
    python3 \
    make \
    g++ \
    gcc \
    cairo-dev \
    pango-dev \
    giflib-dev
WORKDIR /app

COPY package.json package-lock.json* ./
# Set environment to use pre-built Sharp binaries for musl
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install runtime dependencies for Sharp
RUN apk add --no-cache vips

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
