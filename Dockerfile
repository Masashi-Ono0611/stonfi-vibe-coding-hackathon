FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy ONLY bot source code (exclude mini-app)
COPY src ./src

# Install dependencies
RUN npm install --production

# Start bot
CMD ["npm", "start"]
