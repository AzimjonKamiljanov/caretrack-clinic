FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port 3001
EXPOSE 3001

# Command to run the application (start server and run seeds before starting if needed)
CMD ["sh", "-c", "npm run seed && npm start"]
