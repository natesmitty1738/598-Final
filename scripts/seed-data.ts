import { PrismaClient, PaymentStatus, PaymentMethod, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// Mock data for users
const users = [
  {
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123',
    role: Role.USER,
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: Role.ADMIN,
  },
];

// Mock data for business profiles
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

// Mock data for products
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

// Generate mock products
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

// Generate mock sales
function generateSales(userId: string, products: any[], count: number) {
  const sales = [];
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.STRIPE];
  const paymentStatuses = [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.REFUNDED];
  
  // Generate sales for the last 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  for (let i = 0; i < count; i++) {
    // Random date between 90 days ago and now
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

async function main() {
  console.log('Starting database seeding...');
  
  // Create users
  console.log('Creating users...');
  const createdUsers = [];
  
  for (const user of users) {
    const hashedPassword = await hash(user.password, 10);
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role as any,
      },
    });
    
    createdUsers.push(createdUser);
    console.log(`Created user: ${createdUser.email}`);
  }
  
  // Create business profiles
  console.log('Creating business profiles...');
  
  for (let i = 0; i < businessProfiles.length; i++) {
    const profile = businessProfiles[i];
    const user = createdUsers[i];
    
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
  
  for (const user of createdUsers) {
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
  
  for (const user of createdUsers) {
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