# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV NODE_ENV=development
WORKDIR /app

# Install OS deps
RUN apk add --no-cache bash tini postgresql-client

# Use tini as PID 1
ENTRYPOINT ["/sbin/tini", "--"]

# Install deps separately for better caching
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build stage (not used for dev, but useful for prod later)
FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN npm run build

# Dev runtime
FROM base AS dev
ENV PORT=3000 HOSTNAME=0.0.0.0
COPY --from=deps /app/node_modules /app/node_modules
COPY . .

# Copy and make entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Next.js caches to improve DX inside container
RUN mkdir -p .next

EXPOSE 3000

CMD ["/usr/local/bin/docker-entrypoint.sh"]


