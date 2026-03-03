# Use Node 20 with Debian (has OpenSSL 3)
FROM node:20-bookworm-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl libssl3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Copy source and build with tsc (not webpack)
COPY . .
RUN npm run build

EXPOSE 3000

# Start: migrations then app with proper error visibility
CMD ["sh", "-c", "echo 'Running migrations...' && npx prisma migrate deploy && echo 'Starting app on port ${PORT:-4000}...' && node dist/main.js"]
