# bashrometer-api/Dockerfile
# ------------------------
FROM node:18-slim AS deps
WORKDIR /app
# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose port and run
EXPOSE 3000
CMD ["node", "server.js"]