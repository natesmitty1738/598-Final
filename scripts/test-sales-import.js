// JavaScript version to avoid TypeScript issues
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Create a Prisma client
const prisma = new PrismaClient();

// Path to test CSV file
const csvFilePath = path.resolve('public/sample_data/sample_sales_import.csv');

async function testSalesImport() {
  try {
    console.log('=== Starting Test: Sales Import ===');
    console.log('Reading sample CSV file...');
    
    // Read and parse the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(csvData, {
      columns: true,
      cast: (value, context) => {
        if (context.column === 'quantity' || context.column === 'unitPrice' || context.column === 'totalAmount') {
          return parseFloat(value);
        }
        return value;
      }
    });
    
    console.log(`Found ${records.length} records in CSV file`);
    
    // Create a test user if not exists
    const user = await prisma.user.upsert({
      where: { email: 'test-import@example.com' },
      update: {},
      create: {
        name: 'Test Import User',
        email: 'test-import@example.com',
      }
    });
    
    console.log(`Using test user: ${user.name} (${user.id})`);
    
    // Delete any existing data for this user for clean test
    console.log('Cleaning up existing data...');
    
    // First delete sales and sale items (they reference products)
    const existingSales = await prisma.sale.findMany({
      where: { userId: user.id },
      include: { items: true }
    });
    
    console.log(`Found ${existingSales.length} existing sales to delete`);
    
    for (const sale of existingSales) {
      // Delete individual sales to cascade to items
      await prisma.sale.delete({ where: { id: sale.id } });
    }
    
    // Delete any inventory changes
    await prisma.inventoryChange.deleteMany({
      where: { userId: user.id }
    });
    
    // Delete existing products
    const deletedProducts = await prisma.product.deleteMany({
      where: { userId: user.id }
    });
    
    console.log(`Deleted ${deletedProducts.count} existing products`);
    
    // Process the sales history records
    console.log('Processing sales history records...');
    
    // Create a Map to store product IDs
    const productMap = new Map();
    
    // First pass: Create unique products
    console.log('Creating products...');
    const uniqueProducts = new Map();
    
    // Group by product name
    records.forEach(record => {
      const key = record.productName.toLowerCase();
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, record);
      }
    });
    
    for (const [key, item] of uniqueProducts.entries()) {
      // Create the product
      const product = await prisma.product.create({
        data: {
          name: item.productName,
          description: `Test product: ${item.productName}`,
          sellingPrice: item.unitPrice,
          stockQuantity: 100,
          isActive: true,
          userId: user.id,
          category: 'Test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      productMap.set(key, product.id);
    }
    
    console.log(`Created ${productMap.size} products`);
    
    // Second pass: Group sales by date
    console.log('Creating sales...');
    const salesByDate = new Map();
    
    records.forEach(record => {
      const date = new Date(record.date).toISOString().split('T')[0];
      if (!salesByDate.has(date)) {
        salesByDate.set(date, []);
      }
      salesByDate.get(date).push(record);
    });
    
    // Create sales with items
    let totalSaleItems = 0;
    const createdSaleIds = [];
    
    for (const [dateStr, items] of salesByDate.entries()) {
      const date = new Date(dateStr);
      const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
      
      const sale = await prisma.sale.create({
        data: {
          date,
          totalAmount,
          paymentMethod: "CASH",
          paymentStatus: "COMPLETED",
          userId: user.id,
          createdAt: date,
          updatedAt: date
        }
      });
      
      createdSaleIds.push(sale.id);
      
      // Create sale items
      for (const item of items) {
        const productKey = item.productName.toLowerCase();
        const productId = productMap.get(productKey);
        
        if (!productId) {
          throw new Error(`Product not found: ${item.productName}`);
        }
        
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
        
        totalSaleItems++;
      }
    }
    
    console.log(`Created ${salesByDate.size} sales with ${totalSaleItems} sale items`);
    
    // Verify sale items were created correctly
    const verificationItems = await prisma.saleItem.findMany({
      where: {
        saleId: { in: createdSaleIds }
      },
      include: {
        product: true,
        sale: true
      }
    });
    
    console.log(`Verification: Found ${verificationItems.length} sale items`);
    
    if (verificationItems.length > 0) {
      const sample = verificationItems[0];
      console.log(`Sample sale item: ProductID=${sample.productId}, Product=${sample.product.name}, Quantity=${sample.quantity}`);
    }
    
    // Check if products have sale items attached
    console.log('Checking products with sales...');
    const productsWithSales = await prisma.product.findMany({
      where: { userId: user.id },
      include: {
        saleItems: true
      }
    });
    
    const productsWithSalesCount = productsWithSales.filter(p => p.saleItems.length > 0).length;
    console.log(`Found ${productsWithSalesCount} out of ${productsWithSales.length} products with linked sales items`);
    
    // Check using direct join
    const saleItemsWithProducts = await prisma.saleItem.findMany({
      where: {
        sale: {
          userId: user.id
        }
      },
      include: {
        product: true
      },
      take: 5
    });
    
    console.log(`Direct query found ${saleItemsWithProducts.length} sale items with products`);
    
    if (saleItemsWithProducts.length > 0) {
      saleItemsWithProducts.forEach((item, idx) => {
        console.log(`SaleItem ${idx+1}: ID=${item.id}, ProductID=${item.productId}, ProductName=${item.product?.name || 'NULL'}`);
      });
    }
    
    console.log('=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSalesImport()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 