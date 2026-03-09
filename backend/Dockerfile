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
# Compile standalone scripts (not in NestJS module graph, so nest build skips them).
# --incremental false forces full emit even if a stale .tsbuildinfo exists.
RUN npx tsc --project tsconfig.scripts.json --incremental false

EXPOSE 3000

# Start: run migrations, seed product catalog (skips if already seeded), then launch the app.
# Uses exec so Node.js is PID 1 and Railway can send SIGTERM directly.
# Diagnostic echoes pinpoint where startup stalls (will remove once stable).
CMD ["sh", "-c", "echo '[1] migrate' && npx prisma migrate deploy 2>&1 && echo '[2] seed' && (timeout 60 node dist/scripts/seed-product-catalog.js 2>&1; echo \"[3] seed-exit:$?\") && echo '[4] launch' && ls dist/main.js 2>&1 && exec node dist/main.js"]
