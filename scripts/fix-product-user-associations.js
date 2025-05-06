// Script to fix product-user associations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProductUserAssociations() {
  try {
    console.log('=== Starting Product-User Association Fix ===');
    
    // Get the user we want to fix
    const user = await prisma.user.findUnique({
      where: { email: 'test-import@example.com' }
    });
    
    if (!user) {
      console.error('Test user not found. Please run the test-sales-import.js script first.');
      return;
    }
    
    console.log(`Using user: ${user.name} (${user.id})`);
    
    // Find all unique product IDs from sale items
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          userId: user.id
        }
      },
      distinct: ['productId'],
      select: {
        productId: true,
        productName: true
      }
    });
    
    console.log(`Found ${saleItems.length} unique products in sale items`);
    
    // For each product ID, check if it exists and associate with user
    let updated = 0;
    let notFound = 0;
    let alreadyAssociated = 0;
    
    for (const item of saleItems) {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      
      if (!product) {
        console.log(`Product not found: ${item.productId} (${item.productName})`);
        notFound++;
        continue;
      }
      
      // If product exists but has no user or different user, update it
      if (!product.userId || product.userId !== user.id) {
        await prisma.product.update({
          where: { id: product.id },
          data: { userId: user.id }
        });
        console.log(`Updated product: ${product.id} (${product.name})`);
        updated++;
      } else {
        alreadyAssociated++;
      }
    }
    
    // Create any missing products if needed
    const missingProducts = saleItems.filter(item => item.productId.startsWith('SKU'));
    
    for (const item of missingProducts) {
      const existingProduct = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      
      if (!existingProduct) {
        // Get sample price from sale items
        const sampleSaleItem = await prisma.saleItem.findFirst({
          where: { productId: item.productId },
          orderBy: { createdAt: 'desc' }
        });
        
        const newProduct = await prisma.product.create({
          data: {
            id: item.productId,
            name: item.productName,
            description: `Recovered product: ${item.productName}`,
            sellingPrice: sampleSaleItem?.price || 0,
            stockQuantity: 100,
            userId: user.id,
            isActive: true,
            category: 'Recovered',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`Created missing product: ${newProduct.id} (${newProduct.name})`);
        updated++;
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`- ${updated} products updated or created`);
    console.log(`- ${alreadyAssociated} products already correctly associated`);
    console.log(`- ${notFound} products not found and could not be updated`);
    
    // Verify the fix worked by checking products with sales
    const productsWithSales = await prisma.product.findMany({
      where: { userId: user.id },
      include: {
        saleItems: {
          take: 1
        }
      }
    });
    
    const productsWithSalesCount = productsWithSales.filter(p => p.saleItems.length > 0).length;
    console.log(`\nVerification: Found ${productsWithSalesCount} products with sales data`);
    
    if (productsWithSalesCount > 0) {
      console.log(`Fix successful! You should now see price recommendations in your dashboard.`);
    } else {
      console.log(`Something's still wrong. Products found but no sales are linked.`);
    }
    
    console.log('=== Fix Complete ===');
    
  } catch (error) {
    console.error('Error fixing product-user associations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductUserAssociations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 