# Multi-stage build for PFMT backend
FROM node:20-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# --- Development dependencies stage ---
FROM base AS deps
COPY backend/package*.json ./
RUN npm ci

# --- Build stage ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./
# Run build if it exists, otherwise skip
RUN npm run build 2>/dev/null || echo "No build step defined; skipping."

# --- Production stage ---
FROM base AS production
ENV NODE_ENV=production

# Copy built application
COPY --from=build /app ./

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

EXPOSE 3000

CMD ["npm", "run", "start"]

