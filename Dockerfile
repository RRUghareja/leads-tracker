# syntax=docker/dockerfile:1
#
# One Dockerfile, two images. Build the one you need with --target:
#   docker build --target api -t leads-api .
#   docker build --target web -t leads-web .
# or run both with `docker compose up --build` (see docker-compose.yml).

# ---------------------------------------------------------------------------
# build: install everything and compile both apps
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Dependency manifests first, so this layer is cached until a dependency changes.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------------
# api: Express + SQLite
# ---------------------------------------------------------------------------
FROM node:20-alpine AS api
ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_PATH=/data/leads.db
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
# Production dependencies of the API only (no TypeScript, Jest, Next.js, ...).
RUN npm ci --omit=dev -w apps/api && npm cache clean --force

COPY --from=build /app/apps/api/dist apps/api/dist

# The database lives in a volume so leads survive container restarts and upgrades.
RUN mkdir -p /data && chown node:node /data
VOLUME /data

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/api/dist/server.js"]

# ---------------------------------------------------------------------------
# web: Next.js
# ---------------------------------------------------------------------------
FROM node:20-alpine AS web
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    API_URL=http://api:4000
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev -w apps/web && npm cache clean --force

COPY --from=build /app/apps/web/.next apps/web/.next
COPY apps/web/next.config.ts apps/web/

USER node
WORKDIR /app/apps/web
EXPOSE 3000

CMD ["node", "/app/node_modules/next/dist/bin/next", "start"]
