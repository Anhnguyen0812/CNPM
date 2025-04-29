# Multi-stage build for Node.js backend

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean cache
RUN npm install && npm cache clean --force

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Set NODE_ENV
ENV NODE_ENV=production

# Copy built node modules and source code
COPY --from=build /app/node_modules ./node_modules
COPY . .

# Expose the API port
EXPOSE 5000

# Set non-root user for better security
USER node

# Start the server
CMD ["node", "src/index.js"]