# Docker PostgreSQL and Prisma SSL Issues Explained

## Understanding the Errors

When setting up a Next.js application with Prisma and PostgreSQL in Docker, you might encounter two common errors:

### 1. PostgreSQL Initialization Error
```
initdb: error: directory "/var/lib/postgresql/data" exists but is not empty
```

**Why it happens:**
- PostgreSQL attempts to initialize a new database in a directory that already contains data
- This occurs when Docker reuses an existing volume with corrupted or partially initialized data
- The root cause is improper specification of PostgreSQL's data storage location within the volume

**Solution:**
- Add `PGDATA: /var/lib/postgresql/data/pgdata` to your PostgreSQL environment variables
- This tells PostgreSQL to use a specific subdirectory, avoiding conflicts with Docker volume mounting

### 2. Prisma SSL Error
```
Error loading shared library libssl.so.1.1: No such file or directory
```

**Why it happens:**
- Alpine Linux (used as base Docker image for its small size) uses `musl` instead of `glibc`
- Prisma's binary requires specific SSL libraries not included in base Alpine image
- The combination of Alpine Linux and Prisma needs special configuration

**Solution requires two parts:**
1. Install OpenSSL dependencies:
   ```dockerfile
   RUN apk add --no-cache \
       openssl \
       openssl-dev \
       libc6-compat \
       ca-certificates \
       netcat-openbsd
   ```
2. Configure Prisma to use the correct binary platform:
   ```yaml
   environment:
     - PRISMA_BINARY_PLATFORM=linux-musl
   ```

## Why These Issues Are Connected

The setup complexity comes from the need for services to initialize and connect in the correct order:
1. Database must initialize correctly first
2. Migrations must run with proper Prisma configuration
3. Application must connect to database with all dependencies in place

## Best Practices Solution

### 1. Configure PostgreSQL Service
```yaml
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: merchx
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - type: volume
        source: postgres_data
        target: /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### 2. Set Up Migration Service
```yaml
services:
  migration:
    build:
      context: .
      dockerfile: Dockerfile
    command: sh -c "while ! nc -z db 5432; do sleep 1; done; npx prisma migrate deploy"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/merchx
      - NODE_ENV=development
      - PRISMA_BINARY_PLATFORM=linux-musl
    depends_on:
      db:
        condition: service_healthy
```

### 3. Configure Application Service
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/merchx
      - PRISMA_BINARY_PLATFORM=linux-musl
    depends_on:
      migration:
        condition: service_completed_successfully
```

## Key Points to Remember

1. **Volume Configuration**
   - Use `PGDATA` to specify a subdirectory for PostgreSQL data
   - Use Docker volumes for data persistence
   - Properly configure volume mounting points

2. **Dependencies**
   - Install necessary OpenSSL packages in Dockerfile
   - Set correct Prisma binary platform for Alpine Linux
   - Include health checks for service orchestration

3. **Service Order**
   - Database must be healthy before migrations run
   - Migrations must complete before application starts
   - Use `depends_on` with conditions to enforce order

4. **Environment Variables**
   - Set consistent database connection strings across services
   - Use environment variables with defaults where appropriate
   - Configure Prisma platform specifically for Alpine Linux

These solutions represent best practices for containerizing Node.js applications with Prisma and PostgreSQL, especially when using Alpine-based images. 