# Use Node 20 with Debian (has OpenSSL 3)
FROM node:20-bookworm-slim

# Install OpenSSL 3 and other dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start command (migrations + start)
CMD npx prisma migrate deploy && npm run start:prod
