FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Next.js app
ENV NEXT_PUBLIC_API_BASE_URL=/api
ENV NEXT_PUBLIC_API_URL=/api/agents
ENV NEXT_PUBLIC_SOCKET_URL=/
RUN npm run build

# Expose port
ENV PORT=3060
EXPOSE 3060

# Start Next.js
CMD ["npm", "start"]
