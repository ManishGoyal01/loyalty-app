#!/bin/bash
set -e

# Install server dependencies
cd /app/server
npm install --legacy-peer-deps

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Build client
cd /app/client
npm install --legacy-peer-deps
npm run build

# Copy client build to server/public
mkdir -p /app/server/public
cp -r /app/client/dist/* /app/server/public/
