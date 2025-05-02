import { PrismaClient, PaymentStatus, PaymentMethod, Role } from '@prisma/client';
import { hash } from 'bcrypt';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// User data
const users = [
  {
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123',
    role: 'USER',
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN',
  },
];

// Business profile data
const businessProfiles = [
  {
    businessName: 'Coffee Shop Demo',
    industry: 'Food & Beverage',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA',
    phone: '(555) 123-4567',
    website: 'www.coffeeshopdemo.com',
    taxId: '12-3456789',
    logo: 'https://placehold.co/200x200?text=Coffee+Shop',
  },
  {
    businessName: 'Admin Store',
    industry: 'Retail',
    address: '456 Market St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    country: 'USA',
    phone: '(555) 987-6543',
    website: 'www.adminstore.com',
    taxId: '98-7654321',
    logo: 'https://placehold.co/200x200?text=Admin+Store',
  },
];

// Product categories and attributes
const productCategories = [
  'Coffee',
  'Tea',
  'Pastries',
  'Sandwiches',
  'Snacks',
  'Accessories',
];

const productSizes = [
  'Small',
  'Medium',
  'Large',
  'One Size',
];

const productColors = [
  'Black',
  'White',
  'Brown',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Purple',
  'Pink',
  'Orange',
];

function generateProducts(userId: string, count: number) {
  const products = [];
  
  for (let i = 0; i < count; i++) {
    const category = productCategories[Math.floor(Math.random() * productCategories.length)];
    const size = productSizes[Math.floor(Math.random() * productSizes.length)];
    const color = productColors[Math.floor(Math.random() * productColors.length)];
    
    const unitCost = parseFloat((Math.random() * 10 + 1).toFixed(2));
    const sellingPrice = parseFloat((unitCost * (1 + Math.random() * 0.5 + 0.5)).toFixed(2));
    const stockQuantity = Math.floor(Math.random() * 100);
    
    products.push({
      sku: `SKU${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: `${category} ${color} ${size}`,
      description: `A delicious ${color.toLowerCase()} ${category.toLowerCase()} in ${size.toLowerCase()} size.`,
      unitCost,
      sellingPrice,
      stockQuantity,
      location: `Shelf ${Math.floor(Math.random() * 10) + 1}`,
      category,
      size,
      color,
      userId,
      images: {
        create: [
          {
            url: `https://placehold.co/300x300?text=${category}+${color}`,
            alt: `${category} ${color}`,
          },
        ],
      },
      documents: {
        create: [
          {
            url: `https://example.com/docs/${category.toLowerCase()}-specs.pdf`,
            name: `${category} Specifications`,
            type: 'pdf',
          },
        ],
      },
    });
  }
  
  return products;
}

function generateSales(userId: string, products: any[], count: number) {
  const sales = [];
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.STRIPE];
  const paymentStatuses = [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.REFUNDED];
  
  // Generate sales for the last 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  for (let i = 0; i < count; i++) {
    const createdAt = new Date(
      ninetyDaysAgo.getTime() + Math.random() * (now.getTime() - ninetyDaysAgo.getTime())
    );
    
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    
    // Generate 1-5 items for this sale
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let totalAmount = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = product.sellingPrice;
      
      items.push({
        quantity,
        price,
        productId: product.id,
      });
      
      totalAmount += quantity * price;
    }
    
    sales.push({
      totalAmount,
      paymentStatus,
      paymentMethod,
      createdAt,
      userId,
      items: {
        create: items,
      },
    });
  }
  
  return sales;
}

async function seedUsers(prisma: PrismaClient) {
  console.log('Creating users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
      role: 'USER',
      permissions: []
    },
  });
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      permissions: ['MANAGE_INVENTORY', 'MANAGE_SALES', 'VIEW_REPORTS', 'MANAGE_EMPLOYEES', 'MANAGE_SETTINGS', 'VIEW_ANALYTICS']
    },
  });
  
  const onboardingUser = await prisma.user.upsert({
    where: { email: 'onboarding@example.com' },
    update: {},
    create: {
      email: 'onboarding@example.com',
      name: 'Onboarding User',
      password: hashedPassword,
      role: 'USER',
      permissions: []
    },
  });
  
  await prisma.onboarding.upsert({
    where: { userId: onboardingUser.id },
    update: {},
    create: {
      userId: onboardingUser.id,
      completedSteps: ['welcome'],
      completed: false
    }
  });
  
  console.log('Created user:', demoUser.email);
  console.log('Created user:', adminUser.email);
  console.log('Created onboarding test user:', onboardingUser.email);
  
  return { demoUser, adminUser, onboardingUser };
}

async function main() {
  console.log('Starting database seeding...');
  
  // Create users
  const { demoUser, adminUser, onboardingUser } = await seedUsers(prisma);
  
  // Create business profiles
  console.log('Creating business profiles...');
  
  for (let i = 0; i < businessProfiles.length; i++) {
    const profile = businessProfiles[i];
    const user = i === 0 ? demoUser : adminUser;
    
    await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        ...profile,
        userId: user.id,
      },
    });
    
    console.log(`Created business profile for: ${user.email}`);
  }
  
  // Create products
  console.log('Creating products...');
  const allProducts = [];
  
  for (const user of [demoUser, adminUser]) {
    const productCount = Math.floor(Math.random() * 20) + 10; // 10-30 products per user
    const products = generateProducts(user.id, productCount);
    
    for (const product of products) {
      const createdProduct = await prisma.product.create({
        data: product,
      });
      
      allProducts.push(createdProduct);
    }
    
    console.log(`Created ${productCount} products for user: ${user.email}`);
  }
  
  // Create sales
  console.log('Creating sales...');
  
  for (const user of [demoUser, adminUser]) {
    const userProducts = allProducts.filter(p => p.userId === user.id);
    const saleCount = Math.floor(Math.random() * 50) + 20; // 20-70 sales per user
    const sales = generateSales(user.id, userProducts, saleCount);
    
    for (const sale of sales) {
      await prisma.sale.create({
        data: sale,
      });
    }
    
    console.log(`Created ${saleCount} sales for user: ${user.email}`);
  }
  
  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 