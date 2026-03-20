# Use official Node.js 20 image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port the app listens on
EXPOSE 3021

# Run the compiled JS
CMD ["node", "dist/main.js"]