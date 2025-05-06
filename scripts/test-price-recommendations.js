const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPriceRecommendations() {
  try {
    console.log('=== Testing Price Recommendations Calculator ===');
    
    // Get the test user we created in the previous script
    const user = await prisma.user.findUnique({
      where: { email: 'test-import@example.com' }
    });
    
    if (!user) {
      console.error('Test user not found. Please run the test-sales-import.js script first.');
      return;
    }
    
    console.log(`Using test user: ${user.name} (${user.id})`);
    
    // Verify products with sales exist in the database
    const products = await prisma.product.findMany({
      where: { userId: user.id },
      include: {
        saleItems: true
      }
    });
    
    console.log(`Found ${products.length} products for user`);
    
    const productsWithSales = products.filter(p => p.saleItems.length > 0);
    console.log(`Found ${productsWithSales.length} products with sales data`);
    
    if (productsWithSales.length === 0) {
      console.error('No products with sales found. Please run the test-sales-import.js script first.');
      return;
    }
    
    // Log some sample products with their sales data
    console.log('\nSample product sales data:');
    for (let i = 0; i < Math.min(3, productsWithSales.length); i++) {
      const product = productsWithSales[i];
      console.log(`- ${product.name}: ${product.saleItems.length} sale records, Price: $${product.sellingPrice}`);
    }
    
    // Import the price recommendations calculator dynamically
    console.log('\nImporting PriceRecommendationCalculator...');
    
    // We need to use dynamic require because we can't directly use the import path with @ symbol
    const modulePath = '../lib/analytics/price-recommendations';
    let PriceRecommendationCalculator;
    
    try {
      const module = require(modulePath);
      PriceRecommendationCalculator = module.PriceRecommendationCalculator;
      console.log('Successfully imported PriceRecommendationCalculator');
    } catch (error) {
      console.error(`Failed to import from ${modulePath}:`, error);
      // Try alternative path
      try {
        const altModulePath = './lib/analytics/price-recommendations';
        const module = require(altModulePath);
        PriceRecommendationCalculator = module.PriceRecommendationCalculator;
        console.log('Successfully imported PriceRecommendationCalculator from alternative path');
      } catch (altError) {
        console.error('Failed to import from alternative path:', altError);
        throw new Error('Could not import PriceRecommendationCalculator');
      }
    }
    
    if (!PriceRecommendationCalculator) {
      throw new Error('PriceRecommendationCalculator not found in the module');
    }
    
    // Create an instance of the calculator
    console.log('Creating calculator instance...');
    const calculator = new PriceRecommendationCalculator(prisma);
    
    // Check each confidence level
    for (const confidence of ['low', 'medium', 'high']) {
      console.log(`\nGetting price recommendations with ${confidence} confidence...`);
      
      const recommendations = await calculator.getPriceRecommendations(
        365, // 1 year time range
        confidence,
        user.id
      );
      
      console.log(`Generated ${recommendations.length} recommendations with ${confidence} confidence`);
      
      // Display some recommendations if available
      if (recommendations.length > 0) {
        console.log('\nTop recommendations:');
        recommendations.slice(0, 3).forEach((rec, idx) => {
          console.log(`${idx+1}. ${rec.productName}: $${rec.currentPrice.toFixed(2)} → $${rec.recommendedPrice.toFixed(2)} (${rec.percentageChange > 0 ? '+' : ''}${rec.percentageChange.toFixed(2)}%)`);
        });
      }
    }
    
    // Test the full calculatePriceRecommendations method for more details
    console.log('\nTesting full calculatePriceRecommendations method...');
    
    const fullResults = await calculator.calculatePriceRecommendations(
      365, // 1 year time range
      user.id,
      'low' // Low confidence threshold
    );
    
    console.log(`Full results: ${fullResults.recommendations.length} recommendations, ${fullResults.revenueProjections.length} revenue projections`);
    
    // Show revenue projections
    if (fullResults.revenueProjections.length > 0) {
      console.log('\nRevenue projections:');
      fullResults.revenueProjections.forEach((proj, idx) => {
        console.log(`${proj.date}: Current $${proj.currentRevenue.toFixed(2)}, Optimized $${proj.optimizedRevenue.toFixed(2)}`);
      });
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPriceRecommendations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 