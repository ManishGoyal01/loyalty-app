#!/bin/bash
set -e

# Install server dependencies
cd /app/server
npm install

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Build client
cd /app/client
npm install
npm run build

# Copy client build to server/public
cp -r /app/client/dist /app/server/public
