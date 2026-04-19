# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy project files
COPY package*.json ./
COPY tsconfig.json ./

# Copy ONLY src directory (bot code)
COPY src ./src

# Install dependencies
RUN npm install

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./

# Start command
CMD ["npm", "start"]
