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

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
