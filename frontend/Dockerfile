FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port
ENV PORT=3060
EXPOSE 3060

# Start Next.js
CMD ["npm", "start"]
