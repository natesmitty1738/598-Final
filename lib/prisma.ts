import { PrismaClient } from "@prisma/client";

// Debug environment variables
console.log("lib/prisma.ts - DATABASE_URL:", process.env.DATABASE_URL);

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

const prisma = global.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma; 