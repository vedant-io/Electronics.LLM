# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the API Port
EXPOSE 3050

# Start the server
CMD ["npm", "start"]
