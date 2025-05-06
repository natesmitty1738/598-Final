import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

// create a new prisma client
const prisma = new PrismaClient();

// path to the CSV file
const csvFilePath = path.resolve('public/sample_data/test-sales-data-full.csv');

// interface for the CSV data
interface SaleRecord {
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

async function importSalesData() {
  try {
    console.log('Starting import of test sales data...');
    
    // read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // parse the CSV data
    const records: SaleRecord[] = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        cast: (value, context) => {
          // convert numeric values
          if (context.column === 'quantity' || context.column === 'unitPrice' || context.column === 'totalAmount') {
            return parseFloat(value);
          }
          return value;
        }
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    console.log(`Found ${records.length} records in CSV file`);
    
    // group records by date to create sales
    const salesByDate = new Map<string, SaleRecord[]>();
    
    records.forEach(record => {
      const date = record.date;
      if (!salesByDate.has(date)) {
        salesByDate.set(date, []);
      }
      salesByDate.get(date)!.push(record);
    });
    
    console.log(`Grouped into ${salesByDate.size} distinct sale dates`);
    
    // import data in transaction
    await prisma.$transaction(async (tx) => {
      // create a test user if not exists
      const user = await tx.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
          name: 'Test User',
          email: 'test@example.com',
        }
      });
      
      console.log(`Using user: ${user.name} (${user.id})`);
      
      // create products first (avoiding duplicates)
      const uniqueProducts = new Map<string, { id: string, name: string }>();
      
      records.forEach(record => {
        if (!uniqueProducts.has(record.productId)) {
          uniqueProducts.set(record.productId, {
            id: record.productId,
            name: record.productName
          });
        }
      });
      
      // create all products
      for (const [productId, productData] of uniqueProducts.entries()) {
        await tx.product.upsert({
          where: { id: productId },
          update: {
            name: productData.name,
            sellingPrice: records.find(r => r.productId === productId)?.unitPrice || 0
          },
          create: {
            id: productId,
            name: productData.name,
            sellingPrice: records.find(r => r.productId === productId)?.unitPrice || 0,
            description: `Test product: ${productData.name}`,
            userId: user.id,
            category: 'Test Category',
            stockQuantity: 100,
            isActive: true,
            color: 'Various'
          }
        });
      }
      
      console.log(`Created/updated ${uniqueProducts.size} products`);
      
      // now create sales with their items
      let salesCreated = 0;
      
      for (const [date, saleRecords] of salesByDate.entries()) {
        // calculate total amount
        const totalAmount = saleRecords.reduce((sum, record) => sum + record.totalAmount, 0);
        
        // create the sale
        const sale = await tx.sale.create({
          data: {
            userId: user.id,
            createdAt: new Date(date),
            date: new Date(date),
            totalAmount: totalAmount,
            paymentMethod: "CASH",
            paymentStatus: "COMPLETED",
            items: {
              create: saleRecords.map(record => ({
                productId: record.productId,
                quantity: record.quantity,
                price: record.unitPrice,
                productName: record.productName
              }))
            }
          }
        });
        
        salesCreated++;
      }
      
      console.log(`Created ${salesCreated} sales with their items`);
    });
    
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// run the import function
importSalesData()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 