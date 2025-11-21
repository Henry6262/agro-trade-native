# Multi-stage build for production
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache libc6-compat curl
RUN apk update

# Create non-root user
RUN addgroup --system --gid 1001 agro-trade
RUN adduser --system --uid 1001 agro-trade

# Set working directory
WORKDIR /app

# Copy built application from base stage
COPY --from=base --chown=agro-trade:agro-trade /app/dist ./dist
COPY --from=base --chown=agro-trade:agro-trade /app/node_modules ./node_modules
COPY --from=base --chown=agro-trade:agro-trade /app/package*.json ./
COPY --from=base --chown=agro-trade:agro-trade /app/prisma ./prisma

# Switch to non-root user
USER agro-trade

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/status || exit 1

# Start the application
CMD ["node", "dist/main.js"]