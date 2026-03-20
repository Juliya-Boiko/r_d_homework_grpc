# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Copy built code
COPY --from=builder /app/dist ./dist

# Copy proto files
COPY proto ./proto

EXPOSE 3021
ENV PORT=3021

CMD ["node", "dist/orders-service/main.js"]