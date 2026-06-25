# ─── build: compile the SPA with Vite ─────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install deps first so source changes don't bust the dependency cache layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# API base URL is baked into the bundle at build time. Default is same-origin
# (/api/v1) so the host nginx routes /api → welllite-api with no CORS.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build


# ─── prod: serve the static build with nginx ──────────────────────────────────
FROM nginx:1.27-alpine AS prod

# SPA-aware server config (try_files fallback to index.html).
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
