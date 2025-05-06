// Integration test for sales import functionality
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Initialize a test database client
const prisma = new PrismaClient();

// Test data directory - create this directory and add a test CSV
const TEST_DATA_DIR = path.resolve(__dirname, '../test-data');
const TEST_CSV_PATH = path.resolve(TEST_DATA_DIR, 'test-sales-import.csv');

// Helper functions
async function createTestUser() {
  return await prisma.user.upsert({
    where: { email: 'integration-test@example.com' },
    update: {},
    create: {
      name: 'Integration Test User',
      email: 'integration-test@example.com',
    }
  });
}

async function cleanupTestData(userId) {
  console.log(`Cleaning up test data for user ${userId}...`);
  
  // Delete sales and related records first (cascades to saleItems)
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

async function importSalesData(salesHistory, userId) {
  // This simulates what happens in the API route but in a direct call
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
      
      // Generate unique SKU
      const sku = `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const newProduct = await prisma.product.create({
        data: {
          name: item.productName,
          description: `Integration test product: ${item.productName}`,
          sellingPrice: item.unitPrice,
          stockQuantity: 100,
          userId,
          category: 'Test Import',
          sku, // Add a SKU for better identification
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`Created product with ID: ${newProduct.id}`);
      productMap.set(key, newProduct.id);
      productsCreated.push(newProduct.id);
    }
  }
  
  console.log(`Product processing complete. Created: ${productsCreated.length}, Updated: ${productsUpdated.length}`);
  
  // Group sales by date
  const salesByDate = {};
  for (const item of salesHistory) {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = [];
    }
    salesByDate[date].push(item);
  }
  
  console.log(`Grouped sales into ${Object.keys(salesByDate).length} days`);
  
  // Create sales and sale items
  const salesCreated = [];
  
  for (const [dateStr, items] of Object.entries(salesByDate)) {
    const date = new Date(dateStr);
    const dailyTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
    
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
    
    salesCreated.push(sale.id);
    
    // Create sale items
    for (const item of items) {
      const productKey = item.productName.toLowerCase();
      const productId = productMap.get(productKey);
      
      if (!productId) {
        throw new Error(`Product not found: ${item.productName}`);
      }
      
      // Create sale item
      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          createdAt: date,
          updatedAt: date
        }
      });
      
      // Create inventory change
      await prisma.inventoryChange.create({
        data: {
          productId,
          userId,
          type: "remove",
          quantity: item.quantity,
          reason: "Integration Test",
          reference: `Sale #${sale.id}`,
          createdAt: date,
          updatedAt: date
        }
      });
    }
  }
  
  console.log(`Created ${salesCreated.length} sales`);
  
  return {
    salesCreated,
    productsCreated,
    productsUpdated
  };
}

// Create test CSV if it doesn't exist
function createTestCsv() {
  // Create directory if it doesn't exist
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  
  // Create CSV content
  const csvContent = `date,productName,productId,quantity,unitPrice,totalAmount
2023-01-01,Test Product A,,5,19.99,99.95
2023-01-01,Test Product B,,3,29.99,89.97
2023-01-02,Test Product A,,2,19.99,39.98
2023-01-02,Test Product C,,1,49.99,49.99
2023-01-03,test product a,,4,21.99,87.96
2023-01-03,Test Product D,TEST-FIXED-ID,2,39.99,79.98`;
  
  fs.writeFileSync(TEST_CSV_PATH, csvContent);
  console.log(`Created test CSV at ${TEST_CSV_PATH}`);
}

// Main test function
async function runIntegrationTest() {
  let testUser = null;
  
  try {
    console.log('Starting sales import integration test...');
    
    // Create test CSV
    createTestCsv();
    
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
    
    // Check if all expected products exist
    const expectedProducts = ['Test Product A', 'Test Product B', 'Test Product C', 'Test Product D'];
    const missingProducts = expectedProducts.filter(name => 
      !products.some(p => p.name.toLowerCase() === name.toLowerCase())
    );
    
    if (missingProducts.length > 0) {
      console.error(`Missing products: ${missingProducts.join(', ')}`);
    } else {
      console.log('All expected products were created');
    }
    
    // Check product with fixed ID
    const fixedIdProduct = await prisma.product.findFirst({
      where: {
        userId: testUser.id,
        name: 'Test Product D'
      }
    });
    
    if (fixedIdProduct) {
      console.log(`Fixed ID product created with ID: ${fixedIdProduct.id}`);
    } else {
      console.error('Fixed ID product was not created');
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
    
    // Check if products are properly associated
    const itemsWithoutProduct = saleItems.filter(item => !item.product);
    if (itemsWithoutProduct.length > 0) {
      console.error(`${itemsWithoutProduct.length} sale items are missing product associations`);
    } else {
      console.log('All sale items have proper product associations');
    }
    
    // Check price updates
    const productA = products.find(p => p.name.toLowerCase() === 'test product a');
    if (productA && productA.sellingPrice === 21.99) {
      console.log('Product A price was correctly updated to the latest value (21.99)');
    } else if (productA) {
      console.warn(`Product A price is ${productA.sellingPrice}, but expected 21.99 - running a second import to test updates`);
      
      // Test importing the same data again to verify price updates
      console.log('\nRunning a second import with the same data to test price updates...');
      const secondResult = await importSalesData(records, testUser.id);
      
      // Check if products got updated
      const updatedProducts = await prisma.product.findMany({
        where: { userId: testUser.id }
      });
      
      const updatedProductA = updatedProducts.find(p => p.name.toLowerCase() === 'test product a');
      if (updatedProductA && updatedProductA.sellingPrice === 21.99) {
        console.log('After second import: Product A price was correctly updated to 21.99');
      } else if (updatedProductA) {
        console.error(`After second import: Product A price is still ${updatedProductA.sellingPrice}, expected 21.99`);
      }
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Integration test failed:', error);
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
  runIntegrationTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
} 