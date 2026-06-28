# ============================================
# Multi-stage Dockerfile for React + Vite Frontend
# ============================================

# --------------------------------------------
# Stage 1: Dependencies
# --------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# --------------------------------------------
# Stage 2: Development
# --------------------------------------------
FROM node:20-alpine AS development

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --------------------------------------------
# Stage 3: Builder
# --------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Build argument for VITE_API_URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --------------------------------------------
# Stage 4: Production (nginx serve static SPA)
# --------------------------------------------
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
