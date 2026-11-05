# Dockerfile for Backend
FROM node:20-slim

# Install Chromium and required font packages for headless PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose API port
EXPOSE 3000

# Start backend for production
CMD ["node", "server.js"]
