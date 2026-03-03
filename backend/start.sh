#!/bin/sh
set -e
echo "Running migrations..."
npx prisma migrate deploy
echo "Migrations complete. Starting NestJS..."
exec node dist/main.js
