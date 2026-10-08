# Multi-stage production build for SAHAYAK React Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy application source code
COPY frontend/ ./

# Build production bundle with Vite
RUN npm run build

# Stage 2: Serve optimized assets via high-performance Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
