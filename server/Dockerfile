# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the server port
EXPOSE 5000

# Run the dev server
CMD ["npm", "run", "dev"]
