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

# Build stage
FROM node:22.12.0-alpine AS build
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React application
RUN npm run build

# Serve stage
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Copy built files from the build stage
COPY --from=build /app/build .

# Expose the port for the static files
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]
