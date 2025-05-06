const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser(email, name) {
  return prisma.user.create({
    data: {
      email,
      name,
      hashedPassword: 'test-password-hash',
    }
  });
}

async function importSalesData(user, salesData) {
  console.log(`Importing sales data for user: ${user.email}`);
  
  // Process unique products
  const productMap = new Map();
  const productsCreated = [];
  
  const uniqueProducts = new Map();
  for (const item of salesData) {
    const key = item.productName.toLowerCase();
    if (!uniqueProducts.has(key) || (uniqueProducts.get(key)?.unitPrice || 0) < item.unitPrice) {
      uniqueProducts.set(key, item);
    }
  }
  
  console.log(`Processing ${uniqueProducts.size} unique products`);
  
  // Create products
  for (const [key, item] of uniqueProducts.entries()) {
    try {
      // Generate product ID
      const slug = item.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const userPrefix = user.id.substring(0, 6);
      const timestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const productId = `${userPrefix}-${slug}-${timestamp}${randomSuffix}`;
      
      console.log(`Creating product: ${item.productName} with ID: ${productId}`);
      
      const newProduct = await prisma.product.create({
        data: {
          id: productId,
          name: item.productName,
          description: `Test product: ${item.productName}`,
          sellingPrice: item.unitPrice || 0,
          stockQuantity: Math.max(100, item.quantity * 5),
          userId: user.id,
          category: 'Test',
          isActive: true,
        }
      });
      
      productMap.set(key, newProduct.id);
      productsCreated.push(newProduct.id);
    } catch (error) {
      console.error(`Error creating product ${item.productName}:`, error);
    }
  }
  
  console.log(`Created ${productsCreated.length} products`);
  
  // Group sales by date
  const salesByDate = {};
  for (const item of salesData) {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = [];
    }
    salesByDate[date].push(item);
  }
  
  console.log(`Grouped into ${Object.keys(salesByDate).length} sale dates`);
  
  // Create sales records
  const salesCreated = [];
  const salesItemsCreated = [];
  
  for (const [dateStr, items] of Object.entries(salesByDate)) {
    try {
      const dailyTotal = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const date = new Date(dateStr);
      
      console.log(`Creating sale for date ${dateStr} with ${items.length} items, total: ${dailyTotal}`);
      
      // Create sale with items in a transaction
      const sale = await prisma.$transaction(async (tx) => {
        const newSale = await tx.sale.create({
          data: {
            date,
            totalAmount: dailyTotal,
            paymentMethod: "CASH",
            paymentStatus: "COMPLETED",
            userId: user.id,
          }
        });
        
        for (const item of items) {
          if (item.quantity <= 0) continue;
          
          const productKey = item.productName.toLowerCase();
          const productId = productMap.get(productKey);
          
          if (!productId) {
            console.warn(`Product not found in map: ${item.productName}`);
            continue;
          }
          
          const saleItem = await tx.saleItem.create({
            data: {
              quantity: item.quantity,
              price: item.unitPrice || 0,
              productId,
              productName: item.productName,
              saleId: newSale.id,
            }
          });
          
          salesItemsCreated.push(saleItem.id);
        }
        
        return newSale;
      });
      
      salesCreated.push(sale.id);
    } catch (error) {
      console.error(`Error creating sale for date ${dateStr}:`, error);
    }
  }
  
  console.log(`Created ${salesCreated.length} sales with ${salesItemsCreated.length} sale items`);
  return { productsCreated, salesCreated, salesItemsCreated };
}

async function main() {
  try {
    // Sample sales data - same data for both users
    const sampleSalesData = [
      {
        date: '2025-01-01',
        productName: 'Premium T-Shirt (Black)',
        quantity: 2,
        unitPrice: 29.99,
        totalAmount: 59.98
      },
      {
        date: '2025-01-01',
        productName: 'Canvas Tote Bag',
        quantity: 1,
        unitPrice: 24.99,
        totalAmount: 24.99
      },
      {
        date: '2025-01-02',
        productName: 'Vintage Hoodie',
        quantity: 1,
        unitPrice: 49.99,
        totalAmount: 49.99
      },
      {
        date: '2025-01-02',
        productName: 'Designer Jeans',
        quantity: 1,
        unitPrice: 59.99,
        totalAmount: 59.99
      }
    ];
    
    // Create two test users
    const user1 = await createTestUser('test1@example.com', 'Test User 1');
    const user2 = await createTestUser('test2@example.com', 'Test User 2');
    
    console.log('Created test users:');
    console.log('User 1:', user1.id, user1.email);
    console.log('User 2:', user2.id, user2.email);
    
    // Import the same sales data for both users
    const results1 = await importSalesData(user1, sampleSalesData);
    const results2 = await importSalesData(user2, sampleSalesData);
    
    // Verify products have different IDs despite same names
    const user1Products = await prisma.product.findMany({
      where: { userId: user1.id }
    });
    
    const user2Products = await prisma.product.findMany({
      where: { userId: user2.id }
    });
    
    console.log('\nVerification results:');
    console.log('User 1 products:', user1Products.length);
    console.log('User 2 products:', user2Products.length);
    
    // Check if product IDs are unique per user
    const productMap = new Map();
    let duplicateFound = false;
    
    for (const product of [...user1Products, ...user2Products]) {
      if (productMap.has(product.id)) {
        console.error(`DUPLICATE PRODUCT ID FOUND: ${product.id}`);
        duplicateFound = true;
      } else {
        productMap.set(product.id, true);
      }
    }
    
    if (!duplicateFound) {
      console.log('SUCCESS: All product IDs are unique across users!');
    }
    
    // Verify sales items are correctly linked to products
    const user1SaleItems = await prisma.saleItem.findMany({
      where: { sale: { userId: user1.id } },
      include: { product: true }
    });
    
    const user2SaleItems = await prisma.saleItem.findMany({
      where: { sale: { userId: user2.id } },
      include: { product: true }
    });
    
    console.log('User 1 sale items:', user1SaleItems.length);
    console.log('User 2 sale items:', user2SaleItems.length);
    
    let incorrectRelations = 0;
    
    for (const item of user1SaleItems) {
      if (item.product.userId !== user1.id) {
        console.error(`INCORRECT RELATION: Sale item ${item.id} links to product owned by another user`);
        incorrectRelations++;
      }
    }
    
    for (const item of user2SaleItems) {
      if (item.product.userId !== user2.id) {
        console.error(`INCORRECT RELATION: Sale item ${item.id} links to product owned by another user`);
        incorrectRelations++;
      }
    }
    
    if (incorrectRelations === 0) {
      console.log('SUCCESS: All sale items correctly linked to user-owned products!');
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 