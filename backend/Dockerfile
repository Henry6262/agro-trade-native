# Use Node 20 with Debian (has OpenSSL 3)
FROM node:20-bookworm-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl libssl3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files + prisma schema first so postinstall (prisma generate) has the schema
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Explicitly regenerate with binaryTargets to guarantee correct binary for this OS
RUN npx prisma generate

# Copy remaining source and build
COPY . .
RUN npm run build
# Compile standalone scripts (not in NestJS module graph, so nest build skips them)
RUN npx tsc --project tsconfig.scripts.json

EXPOSE 3000

# Start: run migrations, seed product catalog (skips if already seeded), then launch the app.
# Uses exec so Node.js is PID 1 and Railway can send SIGTERM directly.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/scripts/seed-product-catalog.js && exec node dist/main.js"]
