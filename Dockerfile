# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Копіюємо package.json та tsconfig файли
COPY package*.json tsconfig*.json ./

# Встановлюємо залежності
RUN npm ci

# Копіюємо весь код
COPY . .

# Запускаємо збірку TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Копіюємо лише production залежності
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Копіюємо зібраний код
COPY --from=builder /app/dist ./dist

# Виставляємо порт
EXPOSE 3021

# Старт
CMD ["node", "dist/main.js"]