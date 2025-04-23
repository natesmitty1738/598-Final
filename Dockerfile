FROM node:18-alpine

# Install dependencies for Prisma and other required packages
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    ca-certificates \
    netcat-openbsd \
    postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install

# Copy the rest of the application
COPY . .

# Make wait-for-db.sh executable
RUN chmod +x wait-for-db.sh

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV development

CMD ["sh", "-c", "./wait-for-db.sh npm run dev"] 