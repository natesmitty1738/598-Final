// Script to create varied price sales for existing products
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createVariedPriceSales() {
  try {
    console.log('=== Starting Varied Price Sales Generation ===');
    
    // Get the test user
    const user = await prisma.user.findUnique({
      where: { email: 'test-import@example.com' }
    });
    
    if (!user) {
      console.error('Test user not found. Please run the test-sales-import.js script first.');
      return;
    }
    
    console.log(`Using user: ${user.name} (${user.id})`);
    
    // Get all products for this user
    const products = await prisma.product.findMany({
      where: { userId: user.id }
    });
    
    if (products.length === 0) {
      console.error('No products found for this user. Please run fix-product-user-associations.js first.');
      return;
    }
    
    console.log(`Found ${products.length} products to generate varied price sales for`);
    
    // Price variation percentages (±10-20% from base price)
    const priceVariations = [-0.20, -0.15, -0.10, 0, 0.10, 0.15, 0.20];
    
    // Date range for past year (one sale per month)
    const months = 12;
    const salesCreated = [];
    
    // Generate one sale per month with varied prices
    for (let i = 0; i < months; i++) {
      const saleDate = new Date();
      saleDate.setMonth(saleDate.getMonth() - i);
      saleDate.setDate(15); // Middle of the month
      
      // Calculate total for this sale
      let saleTotal = 0;
      const saleItems = [];
      
      // Add each product to this sale with a different price variation
      for (let j = 0; j < products.length; j++) {
        const product = products[j];
        
        // Choose a random price variation for each product in each month
        const variationIndex = Math.floor(Math.random() * priceVariations.length);
        const priceVariation = priceVariations[variationIndex];
        
        // Apply price variation
        const basePrice = product.sellingPrice;
        const adjustedPrice = Math.round((basePrice * (1 + priceVariation)) * 100) / 100;
        
        // Determine quantity based on price (simulate elasticity)
        // When price is lower, quantity should be higher
        let quantity;
        if (priceVariation < 0) {
          // Lower price means higher sales (higher elasticity)
          quantity = Math.floor(10 - (priceVariation * 20)); // e.g., -0.20 => 14 units
        } else if (priceVariation > 0) {
          // Higher price means lower sales
          quantity = Math.max(3, Math.floor(10 - (priceVariation * 25))); // e.g., 0.20 => 5 units
        } else {
          // Base price, base quantity
          quantity = 10;
        }
        
        // Total for this line item
        const lineTotal = adjustedPrice * quantity;
        saleTotal += lineTotal;
        
        // Add to sale items array
        saleItems.push({
          productId: product.id,
          productName: product.name,
          price: adjustedPrice,
          quantity: quantity
        });
      }
      
      // Create the sale with all items
      const sale = await prisma.sale.create({
        data: {
          date: saleDate,
          totalAmount: saleTotal,
          paymentMethod: "CASH",
          paymentStatus: "COMPLETED",
          userId: user.id,
          createdAt: saleDate,
          updatedAt: saleDate
        }
      });
      
      // Create all the sale items and inventory changes
      for (const item of saleItems) {
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            createdAt: saleDate,
            updatedAt: saleDate
          }
        });
        
        // Create inventory change record
        await prisma.inventoryChange.create({
          data: {
            productId: item.productId,
            userId: user.id,
            type: "remove",
            quantity: item.quantity,
            reason: "Varied Price Test",
            reference: `Sale #${sale.id}`,
            createdAt: saleDate,
            updatedAt: saleDate
          }
        });
      }
      
      salesCreated.push(sale.id);
      console.log(`Created sale for ${saleDate.toISOString().split('T')[0]} with ${saleItems.length} items at varied prices`);
    }
    
    console.log(`\nCreated ${salesCreated.length} sales with varied price points`);
    console.log(`You should now be able to see price recommendations in your dashboard.`);
    console.log('=== Generation Complete ===');
    
  } catch (error) {
    console.error('Error creating varied price sales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the generator
createVariedPriceSales()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 