# Використовуємо легкий Node.js образ
FROM node:20-alpine

# Робоча директорія всередині контейнера
WORKDIR /app

# Копіюємо package.json і package-lock.json та встановлюємо залежності
COPY package*.json ./
RUN npm ci

# Копіюємо всі файли проекту
COPY . .

# Будуємо TypeScript код
RUN npm run build

# Виставляємо порт, на якому слухає додаток
EXPOSE 3021

# Стартовий командний рядок
CMD ["node", "dist/main.js"]