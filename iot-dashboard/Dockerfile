# iot-dashboard/Dockerfile
# Multi-stage: base → dev (Vite HMR) → production (nginx static)
#
# Build context is the PROJECT ROOT (set in docker-compose.yml) so that:
#   - production stage can reach infra/nginx/nginx.conf
# All COPY paths below are relative to the project root.

# ── base: install deps ────────────────────────────────────────────────────────
FROM node:22-alpine AS base

WORKDIR /app

# Prefix paths with iot-dashboard/ because context is the project root
COPY iot-dashboard/package.json iot-dashboard/package-lock.json ./
RUN npm ci --prefer-offline

COPY iot-dashboard/ .

# ── dev: Vite dev server with hot-module replacement ─────────────────────────
FROM base AS dev

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ── builder: compile static assets ───────────────────────────────────────────
FROM base AS builder

RUN npm run build

# ── production: lean nginx image serving the built dist/ ─────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist              /usr/share/nginx/html
COPY infra/nginx/nginx.conf                /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]