# Development image for local development
FROM node:20-alpine

# Install essential packages for Prisma and OpenSSL
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    openssl-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set environment
ENV NODE_ENV=development
ENV PORT=3000
ENV TZ=Asia/Tokyo
ENV TS_NODE_PROJECT=tsconfig.json
ENV TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'

EXPOSE 3000

# For development, we'll use nodemon
CMD ["npm", "run", "dev:express"]
