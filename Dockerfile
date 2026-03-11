FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy everything
COPY . .

# Install server dependencies and generate Prisma client
WORKDIR /app/server
RUN npm install
RUN npx prisma generate

# Install client dependencies and build
WORKDIR /app/client
RUN npm ci
RUN npm run build

# Copy built client to server/public
RUN mkdir -p /app/server/public && cp -r /app/client/dist/* /app/server/public/

# Clean up client node_modules to reduce image size
RUN rm -rf /app/client/node_modules

# Run from server directory
WORKDIR /app/server
EXPOSE ${PORT:-3000}
CMD ["node", "server.js"]
