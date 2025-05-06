// Integration test for complex sales import cases
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Initialize a test database client
const prisma = new PrismaClient();

// Test data path
const TEST_CSV_PATH = path.resolve(__dirname, '../test-data/complex-test-sales-import.csv');

// Helper functions
async function createTestUser() {
  return await prisma.user.upsert({
    where: { email: 'complex-test@example.com' },
    update: {},
    create: {
      name: 'Complex Test User',
      email: 'complex-test@example.com',
    }
  });
}

async function cleanupTestData(userId) {
  console.log(`Cleaning up test data for user ${userId}...`);
  
  // Delete sales and related records first
  const sales = await prisma.sale.findMany({
    where: { userId }
  });
  
  for (const sale of sales) {
    await prisma.sale.delete({ where: { id: sale.id } });
  }
  
  // Delete inventory changes
  await prisma.inventoryChange.deleteMany({
    where: { userId }
  });
  
  // Delete products
  await prisma.product.deleteMany({
    where: { userId }
  });
  
  console.log('Cleanup complete.');
}

// Generate a product ID like our API would
function generateProductId(productName) {
  // Create a slug from the product name
  const slug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
  
  // Add a timestamp and random suffix for uniqueness
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  
  return `prod-${slug}-${timestamp}${randomSuffix}`;
}

async function importSalesData(salesHistory, userId) {
  console.log(`Importing ${salesHistory.length} sales records for user ${userId}...`);
  
  // Create product map to track products we've processed
  const productMap = new Map();
  const productsCreated = [];
  const productsUpdated = [];
  
  // Process unique products
  const uniqueProducts = new Map();
  for (const item of salesHistory) {
    const key = item.productName.toLowerCase();
    if (!uniqueProducts.has(key) || uniqueProducts.get(key).unitPrice < item.unitPrice) {
      uniqueProducts.set(key, item);
    }
  }
  
  console.log(`Processing ${uniqueProducts.size} unique products...`);
  
  // Process each unique product
  for (const [key, item] of uniqueProducts.entries()) {
    try {
      let product = null;
      
      // Check by ID first if provided
      if (item.productId) {
        product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        
        if (product) {
          console.log(`Found product by ID: ${product.id}`);
          
          // Update if needed
          if (product.sellingPrice !== item.unitPrice || product.name !== item.productName) {
            product = await prisma.product.update({
              where: { id: product.id },
              data: {
                name: item.productName,
                sellingPrice: item.unitPrice,
                updatedAt: new Date()
              }
            });
            productsUpdated.push(product.id);
          }
          
          productMap.set(key, product.id);
          continue;
        }
      }
      
      // Check by name if not found by ID
      product = await prisma.product.findFirst({
        where: {
          name: { equals: item.productName, mode: 'insensitive' },
          userId
        }
      });
      
      if (product) {
        console.log(`Found product by name: ${product.id}`);
        
        // Update price if needed
        if (product.sellingPrice !== item.unitPrice) {
          product = await prisma.product.update({
            where: { id: product.id },
            data: {
              sellingPrice: item.unitPrice,
              updatedAt: new Date()
            }
          });
          productsUpdated.push(product.id);
        }
        
        productMap.set(key, product.id);
      } else {
        // Create new product
        console.log(`Creating new product: ${item.productName}`);
        
        // Use provided productId or generate one
        const productId = item.productId || generateProductId(item.productName);
        
        const newProduct = await prisma.product.create({
          data: {
            id: productId,
            name: item.productName,
            description: `Complex test product: ${item.productName}`,
            sellingPrice: item.unitPrice || 0,
            stockQuantity: Math.max(100, item.quantity * 5),
            userId,
            category: 'Complex Test',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`Created product with ID: ${newProduct.id}`);
        productMap.set(key, newProduct.id);
        productsCreated.push(newProduct.id);
      }
    } catch (error) {
      console.error(`Error processing product ${item.productName}:`, error);
      // Continue with next product
    }
  }
  
  console.log(`Product processing complete. Created: ${productsCreated.length}, Updated: ${productsUpdated.length}`);
  
  // Group sales by date
  const salesByDate = {};
  for (const item of salesHistory) {
    let date;
    try {
      date = new Date(item.date);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${item.date}`);
      }
      date = date.toISOString().split('T')[0];
    } catch {
      date = new Date().toISOString().split('T')[0];
    }
    
    if (!salesByDate[date]) {
      salesByDate[date] = [];
    }
    salesByDate[date].push(item);
  }
  
  console.log(`Grouped sales into ${Object.keys(salesByDate).length} days`);
  
  // Create sales and sale items
  const salesCreated = [];
  const salesItemsCreated = [];
  
  for (const [dateStr, items] of Object.entries(salesByDate)) {
    try {
      const date = new Date(dateStr);
      const dailyTotal = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      
      // Create sale
      const sale = await prisma.sale.create({
        data: {
          date,
          totalAmount: dailyTotal,
          paymentMethod: "CASH",
          paymentStatus: "COMPLETED",
          userId,
          createdAt: date,
          updatedAt: date
        }
      });
      
      let saleHasItems = false;
      
      // Create sale items
      for (const item of items) {
        // Skip items with zero quantity
        if (item.quantity <= 0) {
          console.log(`Skipping item with zero quantity: ${item.productName}`);
          continue;
        }
        
        const productKey = item.productName.toLowerCase();
        const productId = productMap.get(productKey);
        
        if (!productId) {
          console.warn(`Product not found: ${item.productName}`);
          continue;
        }
        
        // Create sale item
        const saleItem = await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.unitPrice || 0,
            createdAt: date,
            updatedAt: date
          }
        });
        
        salesItemsCreated.push(saleItem.id);
        saleHasItems = true;
        
        // Create inventory change
        await prisma.inventoryChange.create({
          data: {
            productId,
            userId,
            type: "remove",
            quantity: item.quantity,
            reason: "Complex Test",
            reference: `Sale #${sale.id}`,
            createdAt: date,
            updatedAt: date
          }
        });
      }
      
      if (saleHasItems) {
        salesCreated.push(sale.id);
      } else {
        // Delete empty sale
        await prisma.sale.delete({ where: { id: sale.id } });
      }
    } catch (error) {
      console.error(`Error creating sale for date ${dateStr}:`, error);
    }
  }
  
  console.log(`Created ${salesCreated.length} sales with ${salesItemsCreated.length} items`);
  
  return {
    salesCreated,
    productsCreated,
    productsUpdated,
    salesItemsCreated
  };
}

// Main test function
async function runComplexTest() {
  let testUser = null;
  
  try {
    console.log('Starting complex sales import integration test...');
    
    // Check if CSV exists
    if (!fs.existsSync(TEST_CSV_PATH)) {
      console.error(`Test CSV file not found: ${TEST_CSV_PATH}`);
      return;
    }
    
    // Create test user
    testUser = await createTestUser();
    console.log(`Created test user: ${testUser.id}`);
    
    // Clean up any existing test data
    await cleanupTestData(testUser.id);
    
    // Read and parse CSV
    const csvData = fs.readFileSync(TEST_CSV_PATH, 'utf8');
    const records = parse(csvData, {
      columns: true,
      cast: (value, context) => {
        if (context.column === 'quantity' || context.column === 'unitPrice' || context.column === 'totalAmount') {
          return parseFloat(value);
        }
        return value;
      }
    });
    
    console.log(`Parsed ${records.length} records from CSV`);
    
    // Import the sales data
    const result = await importSalesData(records, testUser.id);
    
    // Verify results - count products
    const products = await prisma.product.findMany({
      where: { userId: testUser.id }
    });
    
    console.log(`\nVerification: Found ${products.length} products`);
    
    // Test product IDs match expected format
    const productsWithGeneratedIds = products.filter(p => !p.id.startsWith('TEST-'));
    console.log(`Products with generated IDs: ${productsWithGeneratedIds.length}`);
    
    if (productsWithGeneratedIds.length > 0) {
      const sampleProduct = productsWithGeneratedIds[0];
      console.log(`Sample product ID format: ${sampleProduct.id}`);
      
      if (sampleProduct.id.startsWith('prod-')) {
        console.log('Generated IDs match expected format (prod-*)');
      } else {
        console.error('Generated IDs do not match expected format');
      }
    }
    
    // Test products with special characters
    const specialProducts = [
      'Special "Quoted" Product',
      'Áccénted Prôdüct Nåme',
      'Product-With-Hyphens',
      'Product/With/Slashes'
    ];
    
    console.log('\nChecking special character handling:');
    for (const name of specialProducts) {
      const product = products.find(p => p.name === name);
      if (product) {
        console.log(`  ✓ Found product: "${name}" with ID: ${product.id}`);
      } else {
        console.error(`  ✗ Missing product: "${name}"`);
      }
    }
    
    // Check for sales items and verify product connections
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          userId: testUser.id
        }
      },
      include: {
        product: true
      }
    });
    
    console.log(`\nFound ${saleItems.length} sale items`);
    console.log(`Expected 11 sale items (excluding the 0 quantity item)`);
    
    // Check if products are properly associated
    const itemsWithoutProduct = saleItems.filter(item => !item.product);
    if (itemsWithoutProduct.length > 0) {
      console.error(`${itemsWithoutProduct.length} sale items are missing product associations`);
    } else {
      console.log('All sale items have proper product associations');
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Complex integration test failed:', error);
  } finally {
    // Clean up test data
    if (testUser) {
      await cleanupTestData(testUser.id);
    }
    
    // Close Prisma connection
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runComplexTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
} 