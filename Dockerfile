# Dockerfile for the server
FROM node:20-bullseye

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
FROM node:20-bullseye

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY ./client/package*.json ./

RUN npm install

# Copy the entire client directory, ensuring tsconfig.json is included
COPY ./client /app

# Ensure the frontend is built
RUN npm run build

EXPOSE 5175

CMD ["npm", "start"]

# Use lightweight Nginx image
FROM nginx:stable-alpine

# Set working directory to Nginx default HTML folder
WORKDIR /usr/share/nginx/html

# Copy built frontend files from the client build stage
COPY ./client/dist .

# Copy custom Nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
CMD envsubst < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf && nginx -g "daemon off;"

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
