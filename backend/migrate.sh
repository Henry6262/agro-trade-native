#!/bin/bash
cd /Users/henry/agro-trade/backend

# Generate migration
echo "Generating migration..."
npx prisma migrate dev --name add-transport-company-driver-management --skip-seed --create-only

# Apply migration
echo "Applying migration..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Migration completed successfully!"