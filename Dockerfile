# Dockerfile for the server
FROM node:23.0-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json from the server directory
COPY ./server/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the server code and the `env` directory
COPY ./server /app

# Create a non-root user
RUN adduser --system appuser
USER appuser

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]


# Dockerfile for the client
# Development stage
FROM node:23.0-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the development server port
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]

# Base stage
FROM node:22.12.0-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build stage (for React apps)
FROM base AS build
COPY . .
RUN if [ -f "package.json" ] && grep -q '"build":' package.json; then npm run build; else mkdir build && echo "Skipping build step (no React app detected)."; fi

# Final stage (for running Express server)
FROM node:22.12.0-alpine AS server
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY . .
EXPOSE 8082
CMD ["node", "server.js"]

# Serve stage
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Copy built files from the build stage
COPY --from=build /app/build .

# Expose the port for the static files
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]
