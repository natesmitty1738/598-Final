import { PrismaClient } from '@prisma/client';
import { ProjectedEarningsCalculator } from '../lib/analytics/projected-earnings';
import { PriceRecommendationCalculator } from '../lib/analytics/price-recommendations';
import { SalesRecommendationCalculator } from '../lib/analytics/sales-recommendations';

async function testCalculators() {
  // Create a new Prisma client
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful!');
    
    // Get the first user ID from the database to use for testing
    const firstUser = await prisma.user.findFirst();
    const userId = firstUser?.id || undefined;
    console.log('Using userId for tests:', userId || 'none');
    
    // Test ProjectedEarningsCalculator
    console.log('\n----- Testing ProjectedEarningsCalculator -----');
    const projectedEarningsCalculator = new ProjectedEarningsCalculator(prisma);
    try {
      const projectedEarningsResult = await projectedEarningsCalculator.calculateProjectedEarnings(90, userId);
      console.log('ProjectedEarningsCalculator result:');
      console.log('- Actual data points:', projectedEarningsResult.actual.length);
      console.log('- Projected data points:', projectedEarningsResult.projected.length);
      console.log('- First actual point:', projectedEarningsResult.actual[0]);
    } catch (error) {
      console.error('ProjectedEarningsCalculator error:', error instanceof Error ? error.message : error);
    }
    
    // Test PriceRecommendationCalculator
    console.log('\n----- Testing PriceRecommendationCalculator -----');
    const priceRecommendationCalculator = new PriceRecommendationCalculator(prisma);
    try {
      const priceRecommendations = await priceRecommendationCalculator.getPriceRecommendations(90, 'low', userId);
      console.log('PriceRecommendationCalculator result:');
      console.log('- Recommendations count:', priceRecommendations.length);
      if (priceRecommendations.length > 0) {
        console.log('- First recommendation:', priceRecommendations[0]);
      }
    } catch (error) {
      console.error('PriceRecommendationCalculator error:', error instanceof Error ? error.message : error);
    }
    
    // Test SalesRecommendationCalculator
    console.log('\n----- Testing SalesRecommendationCalculator -----');
    const salesRecommendationCalculator = new SalesRecommendationCalculator(prisma);
    try {
      const optimalProducts = await salesRecommendationCalculator.getOptimalProducts(90, 'low', userId);
      console.log('SalesRecommendationCalculator result:');
      console.log('- Optimal products count:', optimalProducts.length);
      if (optimalProducts.length > 0) {
        console.log('- First optimal product:', optimalProducts[0]);
      }
    } catch (error) {
      console.error('SalesRecommendationCalculator error:', error instanceof Error ? error.message : error);
    }
    
    // Examine the database structure
    console.log('\n----- Database Schema Analysis -----');
    
    // Count the number of products
    const productCount = await prisma.product.count();
    console.log('Product count:', productCount);
    
    // Count the number of sales
    const saleCount = await prisma.sale.count();
    console.log('Sale count:', saleCount);
    
    // Count the number of sale items
    const saleItemCount = await prisma.saleItem.count();
    console.log('SaleItem count:', saleItemCount);
    
    // Check if our test imported data is there
    if (saleCount > 0) {
      const latestSale = await prisma.sale.findFirst({
        orderBy: { date: 'desc' },
        include: { items: true }
      });
      
      console.log('Latest sale data:');
      console.log('- Date:', latestSale?.date);
      console.log('- Total amount:', latestSale?.totalAmount);
      console.log('- Items count:', latestSale?.items.length);
      
      // Get a sample of sale items with their products
      const sampleSaleItems = await prisma.saleItem.findMany({
        take: 5,
        include: {
          product: true
        }
      });
      
      console.log('Sample Sale Items:');
      for (const item of sampleSaleItems) {
        console.log(`- Item ID: ${item.id}, Quantity: ${item.quantity}, Product ID: ${item.productId}`);
        console.log(`  Product exists: ${item.product !== null}`);
        if (item.product) {
          console.log(`  Product name: ${item.product.name}, Price: ${item.product.sellingPrice}`);
        }
      }
      
      // Check for recent sales data
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 90);
      
      const recentSalesCount = await prisma.sale.count({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      console.log(`Sales in last 90 days: ${recentSalesCount}`);
      
      // Count items in recent sales
      const recentSales = await prisma.sale.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { items: true },
        take: 10
      });
      
      const totalItems = recentSales.reduce((sum, sale) => sum + sale.items.length, 0);
      console.log(`Items in recent sales (sample of 10): ${totalItems}`);
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the Prisma client
    await prisma.$disconnect();
  }
}

// Run the tests
testCalculators()
  .then(() => console.log('Tests completed!'))
  .catch(console.error); 