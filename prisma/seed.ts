import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user if it doesn't exist
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'test123',
      role: 'USER',
    },
  });

  // Create test products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Test Product 1',
        sku: 'TP001',
        description: 'Test product description',
        unitCost: 10.00,
        sellingPrice: 19.99,
        stockQuantity: 100,
        userId: user.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Test Product 2',
        sku: 'TP002',
        description: 'Another test product',
        unitCost: 15.00,
        sellingPrice: 29.99,
        stockQuantity: 50,
        userId: user.id,
      },
    }),
  ]);

  console.log('Created test products:', products);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 