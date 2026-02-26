# ---------- Base ----------
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Prisma engines need OpenSSL on slim images (usually present, but ensure ca certs exist)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Build ----------
FROM base AS builder
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (important for standalone)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ---------- Runtime ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs

# Copy Next standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma runtime bits sometimes need explicit copy (safe even if redundant)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Optional: run migrations on container start (recommended for prod)
# You can remove this if you prefer migrations done in CI/CD.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Entrypoint script (runs prisma migrate deploy then starts server)
RUN printf '#!/bin/sh\nset -e\nif [ -n "$DATABASE_URL" ]; then\n  echo "Running prisma migrate deploy..."\n  npx prisma migrate deploy || true\nfi\nexec node server.js\n' > /app/entrypoint.sh \
    && chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]