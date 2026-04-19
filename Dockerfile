# Build stage
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files from root (package.json + package-lock.json)
COPY package*.json ./

# Install dependencies
RUN npm install

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package*.json ./

# Copy ONLY src directory (bot code)
COPY --from=builder /build/src ./src

# Start command
CMD ["npm", "start"]
