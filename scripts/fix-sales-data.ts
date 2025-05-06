import { PrismaClient } from '@prisma/client';

// initialize prisma client
const prisma = new PrismaClient();

/**
 * this script ensures data consistency in the sales model
 * it checks for and fixes the following:
 * 1. missing productName in SaleItems from imported data
 * 2. missing date field in Sale records
 * 3. inconsistent importSource values
 */
async function fixSalesData() {
  console.log('Starting sales data fix process...');
  
  try {
    // 1. find all saleItems without productName but with a valid product
    const saleItemsWithoutNames = await prisma.saleItem.findMany({
      where: {
        productName: null,
      },
      include: {
        product: true,
      },
    });
    
    console.log(`Found ${saleItemsWithoutNames.length} sale items without product names`);
    
    // update them with product names
    if (saleItemsWithoutNames.length > 0) {
      for (const item of saleItemsWithoutNames) {
        if (item.product) {
          await prisma.saleItem.update({
            where: { id: item.id },
            data: { productName: item.product.name }
          });
        }
      }
      console.log(`Updated ${saleItemsWithoutNames.length} sale items with product names`);
    }
    
    // 2. check for sales without proper date field
    const salesWithoutDate = await prisma.sale.findMany({
      where: {
        date: null,
      },
    });
    
    console.log(`Found ${salesWithoutDate.length} sales without date field`);
    
    // update them with date from createdAt
    if (salesWithoutDate.length > 0) {
      for (const sale of salesWithoutDate) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { date: sale.createdAt }
        });
      }
      console.log(`Updated ${salesWithoutDate.length} sales with date field`);
    }
    
    // 3. check for CSV imported sales without importSource field
    const importedSales = await prisma.sale.findMany({
      where: {
        OR: [
          {
            importSource: null,
            items: {
              some: {
                productName: { not: null }
              }
            }
          }
        ]
      },
    });
    
    console.log(`Found ${importedSales.length} potential imported sales without importSource field`);
    
    // update them with importSource = 'CSV'
    if (importedSales.length > 0) {
      for (const sale of importedSales) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { importSource: 'CSV' }
        });
      }
      console.log(`Updated ${importedSales.length} sales with importSource field`);
    }
    
    console.log('Sales data fix completed successfully!');
  } catch (error) {
    console.error('Error fixing sales data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// run the function
fixSalesData()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 