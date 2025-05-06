// Direct implementation of price recommendation calculations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Confidence levels and thresholds
const CONFIDENCE_THRESHOLDS = {
  low: 0.1,     // 10% threshold for low confidence
  medium: 0.15, // 15% threshold for medium confidence
  high: 0.25    // 25% threshold for high confidence
};

async function testPriceRecommendations() {
  try {
    console.log('=== Testing Direct Price Recommendations Implementation ===');
    
    // Get the test user we created in the previous script
    const user = await prisma.user.findUnique({
      where: { email: 'test-import@example.com' }
    });
    
    if (!user) {
      console.error('Test user not found. Please run the test-sales-import.js script first.');
      return;
    }
    
    console.log(`Using test user: ${user.name} (${user.id})`);
    
    // Step 1: Fetch products with sales data
    console.log('\nFetching products with sales data...');
    
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 10); // Look back 10 years
    
    console.log(`Date range: ${oneYearAgo.toISOString()} to ${today.toISOString()}`);
    
    const productsWithSales = await fetchProductsWithSales(user.id, oneYearAgo, today);
    console.log(`Found ${productsWithSales.length} products with sales data`);
    
    if (productsWithSales.length === 0) {
      console.error('No products with sales found in the database.');
      return;
    }
    
    // Display sample products
    for (let i = 0; i < Math.min(3, productsWithSales.length); i++) {
      const product = productsWithSales[i];
      console.log(`- ${product.name}: ${product.saleItems.length} sale records, Current price: $${product.sellingPrice}`);
    }
    
    // Step 2: Calculate recommendations for each confidence level
    for (const [confidenceLevel, threshold] of Object.entries(CONFIDENCE_THRESHOLDS)) {
      console.log(`\nGenerating recommendations with ${confidenceLevel} confidence (threshold: ${threshold * 100}%)...`);
      
      // Calculate recommendations for each product
      const recommendations = [];
      
      for (const product of productsWithSales) {
        const recommendation = calculateRecommendationForProduct(product, threshold);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
      
      // Sort by potential revenue impact
      recommendations.sort((a, b) => b.revenueImpact - a.revenueImpact);
      
      console.log(`Generated ${recommendations.length} recommendations with ${confidenceLevel} confidence`);
      
      // Display top recommendations
      if (recommendations.length > 0) {
        console.log('\nTop recommendations:');
        recommendations.slice(0, 3).forEach((rec, idx) => {
          console.log(`${idx+1}. ${rec.productName}: $${rec.currentPrice.toFixed(2)} → $${rec.recommendedPrice.toFixed(2)} (${rec.percentageChange > 0 ? '+' : ''}${rec.percentageChange.toFixed(2)}%), Impact: $${rec.revenueImpact.toFixed(2)}`);
        });
      }
    }
    
    // Step 3: Calculate revenue projections
    console.log('\nCalculating revenue projections...');
    
    const revenueProjections = calculateRevenueProjections(productsWithSales, CONFIDENCE_THRESHOLDS.low);
    
    if (revenueProjections.length > 0) {
      console.log('\nRevenue projections (6 months):');
      revenueProjections.forEach((projection) => {
        console.log(`${projection.date}: Current $${projection.currentRevenue.toFixed(2)}, Optimized $${projection.optimizedRevenue.toFixed(2)}, Diff: ${((projection.optimizedRevenue / projection.currentRevenue - 1) * 100).toFixed(2)}%`);
      });
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to fetch products with sales
async function fetchProductsWithSales(userId, startDate, endDate) {
  console.log(`Querying for products with userId: ${userId}`);
  
  // Check if there are any sale items
  const totalSaleItemsCount = await prisma.saleItem.count();
  console.log(`Total sale items in database: ${totalSaleItemsCount}`);
  
  // Check products
  const totalProductsCount = await prisma.product.count({
    where: { userId }
  });
  console.log(`Total products for user: ${totalProductsCount}`);
  
  // Fetch products with their sale items
  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      saleItems: {
        include: {
          sale: true
        },
        where: {
          sale: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    }
  });
  
  console.log(`Found ${products.length} products in total`);
  
  // Filter to only products with sales
  const productsWithSales = products.filter(product => 
    product.saleItems && product.saleItems.length > 0
  );
  
  console.log(`Found ${productsWithSales.length} products with sales`);
  
  return productsWithSales;
}

// Calculate price recommendation for a single product
function calculateRecommendationForProduct(product, confidenceThreshold) {
  // Need at least 2 sales to calculate elasticity
  if (!product.saleItems || product.saleItems.length < 2) {
    return null;
  }
  
  // Calculate price elasticity
  const elasticity = calculatePriceElasticity(product.saleItems);
  
  // Skip if elasticity is too close to zero (inelastic) or invalid
  if (Math.abs(elasticity) < 0.1 || !isFinite(elasticity)) {
    return null;
  }
  
  // Determine price change direction based on elasticity
  const shouldIncreasePrice = elasticity > -1; // If elasticity > -1, product is inelastic, price increase will increase revenue
  
  // Calculate price change percentage
  let priceChangePercentage = shouldIncreasePrice ? confidenceThreshold : -confidenceThreshold;
  
  // Calculate new price
  const currentPrice = product.sellingPrice;
  const recommendedPrice = currentPrice * (1 + priceChangePercentage);
  
  // Project revenue impact
  const currentMonthlyRevenue = calculateCurrentMonthlyRevenue(product.saleItems);
  const projectedRevenue = projectProductRevenue(currentMonthlyRevenue, elasticity, priceChangePercentage);
  const revenueImpact = projectedRevenue - currentMonthlyRevenue;
  
  return {
    productId: product.id,
    productName: product.name,
    currentPrice,
    recommendedPrice,
    percentageChange: priceChangePercentage * 100,
    elasticity,
    currentRevenue: currentMonthlyRevenue,
    projectedRevenue,
    revenueImpact,
    confidence: determineConfidenceLevel(confidenceThreshold)
  };
}

// Calculate price elasticity of demand
function calculatePriceElasticity(saleItems) {
  // Group sales by price to detect demand at different price points
  const salesByPrice = {};
  
  // Track sales by date to calculate average demand over time
  const salesByDate = {};
  
  saleItems.forEach(item => {
    const price = parseFloat(item.price);
    const date = item.sale.date.toISOString().split('T')[0];
    const quantity = item.quantity;
    
    // Aggregate by price
    if (!salesByPrice[price]) {
      salesByPrice[price] = { totalQuantity: 0, occurrences: 0 };
    }
    salesByPrice[price].totalQuantity += quantity;
    salesByPrice[price].occurrences++;
    
    // Aggregate by date
    if (!salesByDate[date]) {
      salesByDate[date] = 0;
    }
    salesByDate[date] += quantity;
  });
  
  // Need at least 2 different price points to calculate elasticity
  const prices = Object.keys(salesByPrice).map(p => parseFloat(p));
  if (prices.length < 2) {
    return 0;
  }
  
  // Calculate average demands at each price point
  const pricePoints = prices.map(price => {
    return {
      price,
      averageDemand: salesByPrice[price].totalQuantity / salesByPrice[price].occurrences
    };
  });
  
  // Sort by price
  pricePoints.sort((a, b) => a.price - b.price);
  
  // Use the lowest and highest price points to calculate elasticity
  const lowestPricePoint = pricePoints[0];
  const highestPricePoint = pricePoints[pricePoints.length - 1];
  
  // Calculate percent changes
  const priceChange = (highestPricePoint.price - lowestPricePoint.price) / lowestPricePoint.price;
  const demandChange = (highestPricePoint.averageDemand - lowestPricePoint.averageDemand) / lowestPricePoint.averageDemand;
  
  // Calculate elasticity
  const elasticity = demandChange / priceChange;
  
  return elasticity;
}

// Calculate current monthly revenue
function calculateCurrentMonthlyRevenue(saleItems) {
  const salesByDate = {};
  
  saleItems.forEach(item => {
    const date = item.sale.date.toISOString().split('T')[0];
    const revenue = item.price * item.quantity;
    
    if (!salesByDate[date]) {
      salesByDate[date] = 0;
    }
    salesByDate[date] += revenue;
  });
  
  // Calculate average daily revenue
  const totalDays = Object.keys(salesByDate).length || 1;
  const totalRevenue = Object.values(salesByDate).reduce((sum, revenue) => sum + revenue, 0);
  const averageDailyRevenue = totalRevenue / totalDays;
  
  // Calculate monthly revenue (30 days)
  return averageDailyRevenue * 30;
}

// Project product revenue after price change
function projectProductRevenue(currentRevenue, elasticity, priceChangePercentage) {
  // Calculate quantity change percentage based on elasticity
  const quantityChangePercentage = elasticity * priceChangePercentage;
  
  // Calculate new revenue
  return currentRevenue * (1 + priceChangePercentage) * (1 + quantityChangePercentage);
}

// Calculate revenue projections for next 6 months
function calculateRevenueProjections(products, confidenceThreshold) {
  const projections = [];
  const monthsToProject = 6;
  
  // Get current date and create a date for each month
  const today = new Date();
  
  for (let i = 0; i < monthsToProject; i++) {
    const projectionDate = new Date(today);
    projectionDate.setMonth(today.getMonth() + i + 1);
    projectionDate.setDate(1); // First day of the month
    
    const dateString = projectionDate.toISOString().split('T')[0];
    
    let currentRevenue = 0;
    let optimizedRevenue = 0;
    
    // Calculate revenue for each product
    for (const product of products) {
      if (!product.saleItems || product.saleItems.length < 2) {
        continue;
      }
      
      const elasticity = calculatePriceElasticity(product.saleItems);
      
      // Skip invalid elasticities
      if (!isFinite(elasticity) || Math.abs(elasticity) < 0.1) {
        continue;
      }
      
      // Determine optimal price change
      const shouldIncreasePrice = elasticity > -1;
      const priceChangePercentage = shouldIncreasePrice ? confidenceThreshold : -confidenceThreshold;
      
      // Calculate monthly revenues
      const monthlyRevenue = calculateCurrentMonthlyRevenue(product.saleItems);
      currentRevenue += monthlyRevenue;
      
      // Apply growth factor for future months (simple 2% monthly growth)
      const growthFactor = Math.pow(1.02, i);
      
      // Calculate projected revenue with price change
      const projectedRevenue = projectProductRevenue(monthlyRevenue, elasticity, priceChangePercentage) * growthFactor;
      optimizedRevenue += projectedRevenue;
    }
    
    // Add projection to results
    projections.push({
      date: dateString,
      currentRevenue,
      optimizedRevenue
    });
  }
  
  return projections;
}

// Helper to determine confidence level from threshold
function determineConfidenceLevel(threshold) {
  if (threshold === CONFIDENCE_THRESHOLDS.high) return 'high';
  if (threshold === CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

// Run the test
testPriceRecommendations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 