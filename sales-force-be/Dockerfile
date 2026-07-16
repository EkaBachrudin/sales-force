# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY src ./src

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Build TypeScript
RUN npm install -D typescript && \
    npx tsc

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
# Copy src folder (needed for ts-node migrations in production)
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./
# Copy public folder for static file serving
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
RUN mkdir -p /app/public/uploads/siteplans

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
