import { PrismaClient } from '@prisma/client';

// Explicitly use the environment variable
const databaseUrl = process.env.DATABASE_URL || 'postgresql://natesmith@localhost:5432/merchx_fresh_db?schema=public';

console.log('API Prisma Client - Using DATABASE_URL:', databaseUrl);

// Create a new PrismaClient with explicit connection string
const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prismaClient; 