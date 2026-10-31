# syntax=docker/dockerfile:1

# Release build: type-check, bundle and obfuscate the app code.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:release

# Static site. Serves /data/smith.json from the updater volume, falling back to the snapshot baked at build time.
FROM nginx:1.28-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q --spider http://127.0.0.1/ || exit 1

# Daily data refresh from the Forge repository.
FROM python:3.13-alpine AS updater
RUN apk add --no-cache git \
    && adduser -D -u 10001 forgesmith \
    && mkdir -p /forge /data \
    && chown forgesmith:forgesmith /forge /data
WORKDIR /app
COPY scripts/build_data.py scripts/updater.py ./
USER forgesmith
ENV PYTHONUNBUFFERED=1 \
    FORGE_DIR=/forge \
    DATA_FILE=/data/smith.json
HEALTHCHECK --interval=10m --timeout=10s --start-period=15m \
    CMD python -c "import os, sys, time; sys.exit(0 if time.time() - os.path.getmtime('/data/smith.json') < 50 * 3600 else 1)"
CMD ["python", "updater.py"]
