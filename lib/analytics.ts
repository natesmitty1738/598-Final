import { PrismaClient } from '@prisma/client';
import { cache } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, addMonths, addDays, isFuture, differenceInDays } from 'date-fns';
import { optimizePriceForRevenue } from './utils';
import { RevenueOverTime, RevenueTrendAnalysis } from './analytics/revenue-over-time';

// initialize the Prisma client
const prisma = new PrismaClient();

// interface for metrics results
export interface MetricsResult {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  median?: number;
  percentiles: {
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

// interface for price elasticity result
export interface PriceElasticityResult {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  priceElasticity: number;
  expectedSalesChange: number;
  expectedRevenueChange: number;
  potential?: number; // Add optional potential property
  confidence: 'high' | 'medium' | 'low';
  historyDataPoints: number;
}

// interface for pricing factors
export interface PricingFactors {
  productId: string;
  costFactor: number;
  competitiveFactor: number;
  seasonalityFactor: number;
  inventoryFactor: number;
}

// interface for projected earnings data
export interface ProjectedEarning {
  month: string;
  actual: number | null;
  projected: number | null;
}

// interface for peak selling hours data
export interface PeakSellingHour {
  hour: string;
  sales: number;
  topProducts?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

// Enhanced interface for price suggestions
export interface PriceSuggestion {
  productId: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  potential: number; // revenue potential change in percentage
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
}

// Interface for optimal product data
export interface OptimalProduct {
  id: string;
  name: string;
  score: number;
  reason: string;
  category?: string;
  metrics: {
    salesVolume: number;
    profitMargin: number;
    returnRate: number;
    restockRate: number;
    growthRate: number;
  };
}

// cache common queries for better performance
export const getRevenueMetrics = cache(async (timeframe: 'day' | 'week' | 'month' | 'year'): Promise<MetricsResult> => {
  // determine date range based on timeframe
  let startDate = new Date();
  
  switch (timeframe) {
    case 'day':
      startDate = subDays(new Date(), 1);
      break;
    case 'week':
      startDate = subDays(new Date(), 7);
      break;
    case 'month':
      startDate = subMonths(new Date(), 1);
      break;
    case 'year':
      startDate = subMonths(new Date(), 12);
      break;
  }
  
  // fetch orders within the time period
  // Note: Update these queries based on your actual database schema
  const orders = await prisma.$queryRaw<Array<{total: number}>>`
    SELECT total FROM "sales"
    WHERE "createdAt" >= ${startDate}
    AND status = 'COMPLETED'
  `;
  
  // calculate metrics from the results
  return calculateMetrics(orders.map((o: {total: number}) => o.total));
});

// get sales data over time for charts
export const getSalesTimeSeries = cache(async (
  interval: 'day' | 'week' | 'month', 
  startDate?: Date, 
  endDate?: Date
) => {
  // default to last 30 days if no dates provided
  const effectiveStartDate = startDate || subDays(new Date(), 30);
  const effectiveEndDate = endDate || new Date();
  
  // format the interval for grouping in the database
  let dateFormat: string;
  let dateGroup: string;
  
  switch (interval) {
    case 'day':
      dateFormat = 'yyyy-MM-dd';
      dateGroup = 'day';
      break;
    case 'week':
      dateFormat = 'yyyy-ww'; // ISO week
      dateGroup = 'week';
      break;
    case 'month':
      dateFormat = 'yyyy-MM';
      dateGroup = 'month';
      break;
  }
  
  // aggregate sales by time period (day, week, month)
  const salesData = await prisma.$queryRaw<Array<{time_period: Date, total_sales: string, order_count: string}>>`
    SELECT 
      DATE_TRUNC(${dateGroup}, "createdAt") as time_period,
      SUM(total) as total_sales,
      COUNT(*) as order_count
    FROM "sales"
    WHERE 
      "createdAt" >= ${effectiveStartDate} AND
      "createdAt" <= ${effectiveEndDate} AND
      status = 'COMPLETED'
    GROUP BY DATE_TRUNC(${dateGroup}, "createdAt")
    ORDER BY time_period ASC
  `;
  
  // format the results for the chart component
  return salesData.map(row => ({
    period: format(new Date(row.time_period), dateFormat),
    totalSales: parseFloat(row.total_sales) || 0,
    orderCount: parseInt(row.order_count) || 0
  }));
});

// get top products by sales
export const getTopProducts = cache(async (limit: number = 10) => {
  // Using raw SQL query as a workaround for the Prisma type issue
  const topProductsData = await prisma.$queryRaw<Array<{
    productId: string,
    total_quantity: string,
    order_count: string
  }>>`
    SELECT 
      "productId",
      SUM(quantity) as total_quantity,
      COUNT(DISTINCT "saleId") as order_count
    FROM "sale_items"
    GROUP BY "productId"
    ORDER BY total_quantity DESC
    LIMIT ${limit}
  `;
  
  // fetch the product details
  const productIds = topProductsData.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds
      }
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      images: true
    }
  });
  
  // combine the product data with sales data
  return topProductsData.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      id: item.productId,
      name: product?.name || 'Unknown Product',
      sku: product?.sku || 'N/A',
      image: product?.images?.[0] || null,
      quantitySold: parseFloat(item.total_quantity) || 0,
      orderCount: parseInt(item.order_count) || 0
    };
  });
});

// get inventory levels with low stock indicators
export const getInventoryLevels = cache(async (lowStockThreshold: number = 5) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      images: true
    },
    orderBy: {
      stockQuantity: 'asc'
    }
  });
  
  return products.map(product => ({
    ...product,
    quantity: product.stockQuantity || 0,
    lowStock: (product.stockQuantity || 0) <= lowStockThreshold
  }));
});

// get customer segments by signup date (user growth)
export const getCustomerGrowth = cache(async (period: 'month' | 'quarter' | 'year' = 'month') => {
  let dateFormat: string;
  let dateGroup: string;
  
  switch (period) {
    case 'month':
      dateFormat = 'yyyy-MM';
      dateGroup = 'month';
      break;
    case 'quarter':
      dateFormat = 'yyyy-Q';
      dateGroup = 'quarter';
      break;
    case 'year':
      dateFormat = 'yyyy';
      dateGroup = 'year';
      break;
  }
  
  // aggregate user signups by time period
  const userGrowth = await prisma.$queryRaw<Array<{time_period: Date, user_count: string}>>`
    SELECT 
      DATE_TRUNC(${dateGroup}, "createdAt") as time_period,
      COUNT(*) as user_count
    FROM "users"
    GROUP BY DATE_TRUNC(${dateGroup}, "createdAt")
    ORDER BY time_period ASC
  `;
  
  // format for chart component
  return userGrowth.map(row => ({
    period: format(new Date(row.time_period), dateFormat),
    userCount: parseInt(row.user_count) || 0
  }));
});

// Compute dynamic price elasticity and generate pricing suggestions
export const getPricingSuggestions = cache(async (
  productIds?: string[],
  confidenceThreshold: 'high' | 'medium' | 'low' = 'medium',
  lookbackDays: number = 90
): Promise<PriceElasticityResult[]> => {
  // Default to all products if no IDs provided
  const targetProductIds = productIds || (await prisma.product.findMany({
    select: { id: true }
  })).map(p => p.id);
  
  // Get the current date and lookback date
  const endDate = new Date();
  const startDate = subDays(endDate, lookbackDays);
  
  // For each product, analyze historical price changes and resulting sales
  const results: PriceElasticityResult[] = [];
  
  for (const productId of targetProductIds) {
    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        stockQuantity: true,
        unitCost: true
      }
    });
    
    if (!product || product.sellingPrice === null) continue;
    
    // Fetch historical price changes and sales data
    const priceChangeData = await prisma.$queryRaw<Array<{
      price: number,
      date: Date,
      units_sold: number,
      prev_price?: number,
      next_sales?: number
    }>>`
      WITH price_changes AS (
        SELECT 
          p."sellingPrice" as price,
          p."updatedAt" as date,
          LAG(p."sellingPrice") OVER (ORDER BY p."updatedAt") as prev_price
        FROM "products" p
        WHERE p.id = ${productId}
        AND p."updatedAt" >= ${startDate}
        AND p."updatedAt" <= ${endDate}
        AND p."sellingPrice" IS NOT NULL
      ),
      sales_after_change AS (
        SELECT 
          pc.date,
          SUM(oi.quantity) as units_sold
        FROM price_changes pc
        JOIN "sale_items" oi ON oi."productId" = ${productId}
        JOIN "sales" o ON oi."saleId" = o.id
        WHERE o."createdAt" >= pc.date
        AND o."createdAt" <= (
          SELECT MIN(date) FROM price_changes
          WHERE date > pc.date
        )
        GROUP BY pc.date
      )
      SELECT 
        pc.price,
        pc.date,
        pc.prev_price,
        COALESCE(sac.units_sold, 0) as units_sold
      FROM price_changes pc
      LEFT JOIN sales_after_change sac ON pc.date = sac.date
      WHERE pc.prev_price IS NOT NULL
      ORDER BY pc.date
    `;
    
    // If not enough data points, use a basic algorithm
    const dataPoints = priceChangeData.length;
    let priceElasticity = -1.2; // Default assumption
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    if (dataPoints >= 5) {
      // Calculate price elasticity using regression analysis
      // E = (% change in quantity) / (% change in price)
      const elasticityValues: number[] = [];
      
      for (let i = 0; i < priceChangeData.length; i++) {
        const record = priceChangeData[i];
        if (record.prev_price && record.price !== record.prev_price) {
          // Calculate % change in price
          const priceChange = (record.price - record.prev_price) / record.prev_price;
          
          // Get sales data before and after price change
          const salesBefore = await getAverageDailySales(productId, subDays(record.date, 30), record.date);
          const salesAfter = await getAverageDailySales(productId, record.date, addDays(record.date, 30));
          
          if (salesBefore > 0) {
            // Calculate % change in quantity
            const quantityChange = (salesAfter - salesBefore) / salesBefore;
            
            // Calculate elasticity
            const elasticity = quantityChange / priceChange;
            elasticityValues.push(elasticity);
          }
        }
      }
      
      // Use median to eliminate outliers
      if (elasticityValues.length > 0) {
        elasticityValues.sort((a, b) => a - b);
        const mid = Math.floor(elasticityValues.length / 2);
        priceElasticity = elasticityValues.length % 2 === 0
          ? (elasticityValues[mid - 1] + elasticityValues[mid]) / 2
          : elasticityValues[mid];
          
        confidence = elasticityValues.length >= 10 ? 'high' : 
                     elasticityValues.length >= 5 ? 'medium' : 'low';
      }
    }
    
    // Skip if confidence doesn't meet threshold
    const confidenceLevels = { 'high': 3, 'medium': 2, 'low': 1 };
    if (confidenceLevels[confidence] < confidenceLevels[confidenceThreshold]) {
      continue;
    }
    
    // Get additional pricing factors
    const factors = await getPricingFactors(productId);
    
    // Current price and cost
    const currentPrice = product.sellingPrice;
    const cost = product.unitCost || currentPrice * 0.5; // Default to 50% margin if cost not available
    
    // Use our new optimized price function with price elasticity
    const { optimizedPrice, expectedSalesChange, expectedRevenueChange } = optimizePriceForRevenue({
      currentPrice,
      priceElasticity,
      minPriceChange: -0.2, // Max 20% decrease
      maxPriceChange: 0.2,  // Max 20% increase
      costPrice: cost
    });
    
    // Apply additional business factors
    let suggestedPrice = optimizedPrice;
    suggestedPrice *= factors.costFactor;
    suggestedPrice *= factors.competitiveFactor;
    suggestedPrice *= factors.seasonalityFactor;
    suggestedPrice *= factors.inventoryFactor;
    
    // Round to appropriate pricing point
    suggestedPrice = roundToNicePricePoint(suggestedPrice);
    
    // Only suggest changes that improve revenue
    if (expectedRevenueChange > 1.0) { // At least 1% improvement
      results.push({
        productId: product.id,
        productName: product.name,
        currentPrice,
        suggestedPrice,
        priceElasticity,
        expectedSalesChange,
        expectedRevenueChange,
        confidence,
        historyDataPoints: dataPoints
      });
    }
  }
  
  // Sort by expected revenue impact (descending)
  return results.sort((a, b) => b.expectedRevenueChange - a.expectedRevenueChange);
});

// Helper functions for dynamic pricing

// Get average daily sales for a product in a period
async function getAverageDailySales(productId: string, startDate: Date, endDate: Date): Promise<number> {
  const result = await prisma.$queryRaw<Array<{avg_sales: number}>>`
    SELECT AVG(daily_sales) as avg_sales FROM (
      SELECT 
        DATE_TRUNC('day', o."createdAt") as sale_date,
        SUM(oi.quantity) as daily_sales
      FROM "sale_items" oi
      JOIN "sales" o ON oi."saleId" = o.id
      WHERE oi."productId" = ${productId}
      AND o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('day', o."createdAt")
    ) daily_sales
  `;
  
  return result[0]?.avg_sales || 0;
}

// Get pricing factors for a product
async function getPricingFactors(productId: string): Promise<PricingFactors> {
  // In a real implementation, these would be computed from actual data
  // Simplified version for demonstration
  const stock = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true }
  });
  
  // Stock levels can affect pricing
  const inventoryFactor = stock?.stockQuantity 
    ? (stock.stockQuantity > 100 ? 0.95 : // Large stock, reduce price
       stock.stockQuantity < 10 ? 1.02 : // Low stock, increase price
       1.0)
    : 1.0;
  
  // Mock other factors for demonstration
  // These would be calculated from competitor data, seasonality models, etc.
  const costFactor = 1.0;
  const competitiveFactor = 0.98; // Assume slight discount needed to compete
  
  // Get current month for seasonal factor
  const currentMonth = new Date().getMonth();
  // Example: Higher prices during holiday season (Nov-Dec)
  const seasonalityFactor = (currentMonth === 10 || currentMonth === 11) ? 1.05 : 1.0;
  
  return {
    productId,
    costFactor,
    competitiveFactor,
    seasonalityFactor,
    inventoryFactor
  };
}

// Round to "nice" price points (e.g., $19.99 instead of $20.12)
function roundToNicePricePoint(price: number): number {
  if (price <= 0) return 0;
  
  // Different strategies based on price level
  if (price < 10) {
    // For very low prices, round to X.99
    return Math.floor(price) + 0.99;
  } else if (price < 100) {
    // For medium prices, round to X9.99
    return Math.floor(price / 10) * 10 - 0.01;
  } else {
    // For higher prices, round to X99
    return Math.floor(price / 100) * 100 - 1;
  }
}

// Helper function to calculate statistics from an array of numeric values
function calculateMetrics(values: number[]): MetricsResult {
  // handle empty dataset
  if (!values || values.length === 0) {
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      percentiles: { p25: 0, p75: 0, p90: 0, p95: 0, p99: 0 }
    };
  }
  
  // sort values for percentile calculations
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // basic metrics
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / count;
  const min = sortedValues[0];
  const max = sortedValues[count - 1];
  
  // calculate median
  let median: number;
  const midpoint = Math.floor(count / 2);
  
  if (count % 2 === 0) {
    median = (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2;
  } else {
    median = sortedValues[midpoint];
  }
  
  // calculate percentiles
  const getPercentile = (percentile: number): number => {
    const index = Math.floor(percentile * count);
    return sortedValues[Math.min(index, count - 1)];
  };
  
  return {
    count,
    sum,
    avg,
    min,
    max,
    median,
    percentiles: {
      p25: getPercentile(0.25),
      p75: getPercentile(0.75),
      p90: getPercentile(0.90),
      p95: getPercentile(0.95),
      p99: getPercentile(0.99)
    }
  };
}

/**
 * Generate projected earnings based on historical sales data and trends
 * This uses time-series forecasting techniques to project future earnings
 */
export const getProjectedEarnings = cache(async (
  pastMonths: number = 6, 
  futureMonths: number = 6
): Promise<ProjectedEarning[]> => {
  try {
    // Use actual past sales data to make projections
    const startDate = subMonths(new Date(), pastMonths);
    const endDate = new Date();

    // Get monthly sales totals for the past months
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfMonth(startDate),
          lte: endOfMonth(endDate)
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (sales.length === 0) {
      return []; // Return empty array if no sales data
    }

    // Group sales by month
    const monthlySales = new Map();
    
    // Initialize with all months in the range
    let currentDate = startOfMonth(startDate);
    while (currentDate <= endOfMonth(endDate)) {
      const monthKey = format(currentDate, 'MMM yyyy');
      monthlySales.set(monthKey, {
        month: format(currentDate, 'MMM'),
        year: format(currentDate, 'yyyy'),
        totalSales: 0
      });
      currentDate = addMonths(currentDate, 1);
    }
    
    // Populate with actual sales data
    sales.forEach(sale => {
      const monthKey = format(sale.createdAt, 'MMM yyyy');
      if (monthlySales.has(monthKey)) {
        const monthData = monthlySales.get(monthKey);
        monthData.totalSales += sale.totalAmount;
      }
    });
    
    // Convert to array with only month names for display
    const monthlyData = Array.from(monthlySales.values())
      .map(({ month, totalSales }) => ({
        month,
        actual: totalSales
      }));
    
    // Calculate trend for projection
    // Simple linear regression on the available data
    const xValues = monthlyData.map((_, i) => i);
    const yValues = monthlyData.map(data => data.actual);
    
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
    const sumXX = xValues.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Create projected data for future months
    const projectedData: ProjectedEarning[] = [];
    
    // Add past months with actual data
    monthlyData.forEach(data => {
      projectedData.push({
        month: data.month,
        actual: data.actual,
        projected: null
      });
    });
    
    // Add future months with projections
    for (let i = 1; i <= futureMonths; i++) {
      const futureDate = addMonths(endDate, i);
      const projectedValue = intercept + slope * (monthlyData.length + i - 1);
      
      projectedData.push({
        month: format(futureDate, 'MMM'),
        actual: null,
        projected: Math.max(0, Math.round(projectedValue)) // Ensure no negative projections
      });
    }
    
    return projectedData;
  } catch (error) {
    console.error("Error generating projected earnings:", error);
    return [];
  }
});

/**
 * Analyzes order timestamps to determine peak selling hours
 * and optionally includes top products sold during those hours
 */
export const getPeakSellingHours = cache(async (
  days: number = 30,
  normalize: boolean = false
): Promise<PeakSellingHour[]> => {
  try {
    const startDate = subDays(new Date(), days);
    
    // Get all orders with their creation timestamps
    const orders = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true
      }
    });
    
    if (orders.length === 0) {
      return []; // Return empty array if no orders
    }
    
    // Define time slots (2-hour blocks)
    const timeSlots = [
      { start: 0, end: 2, label: '12-2 AM' },
      { start: 2, end: 4, label: '2-4 AM' },
      { start: 4, end: 6, label: '4-6 AM' },
      { start: 6, end: 8, label: '6-8 AM' },
      { start: 8, end: 10, label: '8-10 AM' },
      { start: 10, end: 12, label: '10-12 PM' },
      { start: 12, end: 14, label: '12-2 PM' },
      { start: 14, end: 16, label: '2-4 PM' },
      { start: 16, end: 18, label: '4-6 PM' },
      { start: 18, end: 20, label: '6-8 PM' },
      { start: 20, end: 22, label: '8-10 PM' },
      { start: 22, end: 24, label: '10-12 AM' }
    ];
    
    // Initialize sales count for each time slot
    const hourlyData = timeSlots.map(slot => ({
      hour: slot.label,
      sales: 0
    }));
    
    // Count orders for each time slot
    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      const slotIndex = Math.floor(hour / 2);
      if (slotIndex >= 0 && slotIndex < hourlyData.length) {
        hourlyData[slotIndex].sales++;
      }
    });
    
    // Normalize if requested (convert to percentages)
    if (normalize) {
      const totalSales = hourlyData.reduce((sum, slot) => sum + slot.sales, 0);
      if (totalSales > 0) {
        hourlyData.forEach(slot => {
          slot.sales = Math.round((slot.sales / totalSales) * 100);
        });
      }
    }
    
    // Sort by time slot for proper display
    return hourlyData;
  } catch (error) {
    console.error("Error generating peak selling hours:", error);
    return [];
  }
});

/**
 * Enhanced price suggestion algorithm based on sales data, inventory levels, 
 * competitor pricing, and elasticity of demand
 */
export const getPriceSuggestions = cache(async (
  limit: number = 10,
  confidenceThreshold: 'high' | 'medium' | 'low' = 'medium'
): Promise<PriceSuggestion[]> => {
  try {
    // Get elasticity based results first
    const elasticityResults = await getPricingSuggestions(undefined, confidenceThreshold);
    
    // Get product details for all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        unitCost: true,
        stockQuantity: true,
        category: true
      }
    });
    
    // Get order counts for each product
    let orderItemCounts: any[] = [];
    try {
      // Try to use database if available
      const rawResults = await prisma.$queryRaw`
        SELECT 
          "productId",
          SUM(quantity) as _sum_quantity
        FROM "sale_items"
        GROUP BY "productId"
      `;
      
      // Cast the unknown type to any[]
      orderItemCounts = rawResults as any[];
      
      // Convert BigInt values to Number
      orderItemCounts = orderItemCounts.map(item => ({
        productId: item.productId,
        _sum_quantity: Number(item._sum_quantity)
      }));
    } catch (error) {
      console.error("Error fetching order items:", error);
      // Use empty array as fallback
      orderItemCounts = [];
    }
    
    // Build a map of product IDs to their order quantities
    const productOrderQuantities = new Map();
    orderItemCounts.forEach(item => {
      productOrderQuantities.set(item.productId, item._sum_quantity || 0);
    });
    
    if (products.length === 0) {
      return []; // Return empty if no products
    }
    
    // Create enhanced pricing suggestions
    const suggestions: PriceSuggestion[] = products.map(product => {
      // Get elasticity data for this product if available
      const elasticityData = elasticityResults.find(e => e.productId === product.id);
      
      // Default values if no elasticity data
      let suggestedPrice = product.sellingPrice || 0;
      let potential = 0;
      
      if (elasticityData) {
        suggestedPrice = elasticityData.suggestedPrice;
        potential = elasticityData.potential || elasticityData.expectedRevenueChange * 100;
      } else {
        // Basic suggestion based on cost and inventory if no elasticity data
        const salesVolume = productOrderQuantities.get(product.id) || 0;
        
        // Adjust price based on sales volume and inventory
        if (salesVolume > 0 && product.stockQuantity < salesVolume * 0.5) {
          // Low inventory compared to sales - increase price
          suggestedPrice = (product.sellingPrice || 0) * 1.1;
          potential = 10;
        } else if (product.stockQuantity > salesVolume * 2) {
          // High inventory compared to sales - decrease price
          suggestedPrice = Math.max((product.unitCost || 0) * 1.2, (product.sellingPrice || 0) * 0.9);
          potential = -10;
        }
      }
      
      return {
        productId: product.id,
        name: product.name,
        currentPrice: product.sellingPrice || 0, 
        suggestedPrice: Math.round((suggestedPrice || 0) * 100) / 100,
        potential: Math.round(potential),
        recommendation: potential > 0 ? "Increase price" : "Decrease price",
        confidence: elasticityData?.confidence || 'low'
      };
    });
    
    // Filter for significant changes and sort by potential
    return suggestions
      .filter(s => Math.abs(s.potential) >= 5) // Only show significant changes
      .sort((a, b) => Math.abs(b.potential) - Math.abs(a.potential))
      .slice(0, limit);
  } catch (error) {
    console.error("Error in price suggestions:", error);
    return [];
  }
});

/**
 * Identifies optimal products based on a composite score across multiple metrics:
 * - Sales volume
 * - Profit margin
 * - Return rate (lower is better)
 * - Restock frequency
 * - Growth trajectory
 */
export const getOptimalProducts = cache(async (
  limit: number = 10,
  days: number = 90
): Promise<OptimalProduct[]> => {
  try {
    const startDate = subDays(new Date(), days);
    
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        unitCost: true,
        stockQuantity: true,
        category: true
      }
    });
    
    // If no products, return empty array
    if (products.length === 0) {
      return [];
    }
    
    // Initialize metrics for all products
    const productMetrics = new Map();
    products.forEach(product => {
      productMetrics.set(product.id, {
        id: product.id,
        name: product.name,
        category: product.category,
        margin: 0,                  // Profit margin
        salesVolume: 0,             // Total units sold
        revenue: 0,                 // Total revenue
        profitability: 0,           // Profit per unit
        returnRate: 0,              // Return rate
        turnoverRate: 0,            // Inventory turnover
        lastSaleDate: null          // Date of last sale
      });
    });
    
    // Get return records for the period
    let returns: any[] = [];
    try {
      // Try to use database if available
      const rawResults = await prisma.$queryRaw`
        SELECT "productId", COUNT(*) as return_count
        FROM "returns"
        WHERE "createdAt" >= ${startDate}
        GROUP BY "productId"
      `;
      
      // Cast the unknown type to any[]
      returns = rawResults as any[];
      
      // Convert BigInt values to Number
      returns = returns.map(item => ({
        productId: item.productId,
        return_count: Number(item.return_count)
      }));
    } catch (error) {
      console.error("Error fetching return data:", error);
      // Use empty array as fallback
      returns = [];
    }
    
    // Calculate return metrics
    const returnCounts = new Map();
    returns.forEach(returnItem => {
      const productId = returnItem.productId;
      returnCounts.set(productId, (returnCounts.get(productId) || 0) + returnItem.return_count);
    });
    
    // Get order items with their products for the period
    let orderItems: any[] = [];
    try {
      // Try to use database if available
      const rawResults = await prisma.$queryRaw`
        SELECT 
          si."productId",
          si.quantity,
          si.price,
          s."createdAt"
        FROM "sale_items" si
        JOIN "sales" s ON si."saleId" = s.id
        WHERE s."createdAt" >= ${startDate}
      `;
      
      // Cast the unknown type to any[]
      orderItems = rawResults as any[];
      
      // Convert BigInt values to Number
      orderItems = orderItems.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        createdAt: item.createdAt
      }));
    } catch (error) {
      console.error("Error fetching order items for optimal products:", error);
      // Use empty array as fallback
      orderItems = [];
    }
    
    // Calculate sales metrics
    orderItems.forEach(item => {
      const metrics = productMetrics.get(item.productId);
      if (metrics) {
        // Update sales volume
        metrics.salesVolume += item.quantity;
        
        // Update revenue
        const itemRevenue = item.price * item.quantity;
        metrics.revenue += itemRevenue;
        
        // Update profitability (based on the product's current cost)
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const profit = (item.price - (product.unitCost || 0)) * item.quantity;
          metrics.profitability += profit;
        }
        
        // Update last sale date
        const saleDate = new Date(item.createdAt);
        if (!metrics.lastSaleDate || saleDate > metrics.lastSaleDate) {
          metrics.lastSaleDate = saleDate;
        }
      }
    });
    
    // Finalize metrics
    products.forEach(product => {
      const metrics = productMetrics.get(product.id);
      
      // Calculate profit margin
      if (metrics.revenue > 0) {
        metrics.margin = (metrics.profitability / metrics.revenue) * 100;
      }
      
      // Calculate return rate
      const returnCount = returnCounts.get(product.id) || 0;
      if (metrics.salesVolume > 0) {
        metrics.returnRate = (returnCount / metrics.salesVolume) * 100;
      }
      
      // Calculate inventory turnover
      if (product.stockQuantity > 0) {
        metrics.turnoverRate = metrics.salesVolume / product.stockQuantity;
      }
    });
    
    // Calculate scores for each product based on the metrics
    const scoredProducts = Array.from(productMetrics.values())
      .filter(metrics => metrics.salesVolume > 0) // Only score products with sales
      .map(metrics => {
        // Calculate recency score (days since last sale)
        let recencyScore = 0;
        if (metrics.lastSaleDate) {
          const daysSinceLastSale = differenceInDays(new Date(), metrics.lastSaleDate);
          recencyScore = Math.max(0, 100 - (daysSinceLastSale * 2)); // Lower score for older sales
        }
        
        // Calculate margin score (0-100)
        const marginScore = Math.min(100, metrics.margin * 2);
        
        // Calculate volume score (relative to highest selling product)
        const volumeScore = metrics.salesVolume;
        
        // Calculate return rate score (inverse - lower returns are better)
        const returnScore = Math.max(0, 100 - metrics.returnRate * 10);
        
        // Calculate turnover score
        const turnoverScore = Math.min(100, metrics.turnoverRate * 20);
        
        // Overall score calculation
        // Weight the factors based on importance
        const factorWeights = {
          margin: 0.25,     // Profit margin
          volume: 0.20,     // Sales volume
          returns: 0.15,    // Low return rate
          turnover: 0.20,   // Inventory turnover
          recency: 0.20     // Recency of sales
        };
        
        // Normalize the volume score relative to the highest one
        // We'll do this afterward since we need all calculated values
        
        return {
          id: metrics.id,
          name: metrics.name,
          score: 0, // Placeholder, calculated after normalization
          factors: {
            margin: marginScore,
            volume: volumeScore,
            returns: returnScore,
            turnover: turnoverScore,
            recency: recencyScore
          }
        };
      });
    
    // Find maximum volume to normalize
    const maxVolume = Math.max(...scoredProducts.map(p => p.factors.volume), 1);
    
    // Calculate final scores with normalization
    scoredProducts.forEach(product => {
      const normalizedVolume = (product.factors.volume / maxVolume) * 100;
      product.factors.volume = normalizedVolume;
      
      // Calculate weighted score
      const weightedFactors = {
        margin: product.factors.margin * 0.25,
        volume: normalizedVolume * 0.20,
        returns: product.factors.returns * 0.15,
        turnover: product.factors.turnover * 0.20,
        recency: product.factors.recency * 0.20
      };
      
      // Overall score (0-100)
      product.score = Math.round(
        weightedFactors.margin +
        weightedFactors.volume +
        weightedFactors.returns +
        weightedFactors.turnover +
        weightedFactors.recency
      );
    });
    
    // Return top N products by score
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(product => {
        // Ensure we have all required properties
        return {
          id: product.id,
          name: product.name,
          score: product.score,
          reason: product.score > 75 ? "High performer across all metrics" :
                  product.score > 50 ? "Good balanced performance" : "Average performer",
          category: product.category,
          metrics: {
            salesVolume: product.factors.volume || 0,
            profitMargin: product.factors.margin || 0,
            returnRate: 100 - (product.factors.returns || 0),
            restockRate: product.factors.turnover || 0,
            growthRate: product.factors.recency || 0
          }
        };
      });
  } catch (error) {
    console.error("Error calculating optimal products:", error);
    return [];
  }
});

// Analyze revenue trends over time with detailed insights
export const analyzeRevenueTrends = cache(async (
  timeRangeInDays: number,
  userId?: string,
  includeForecast: boolean = false
): Promise<RevenueTrendAnalysis> => {
  // Create an instance of RevenueOverTime with the existing Prisma client
  const revenueAnalyzer = new RevenueOverTime(prisma);
  
  try {
    // Get the revenue analysis with trend data
    const analysis = await revenueAnalyzer.analyzeRevenue(
      timeRangeInDays,
      userId,
      includeForecast
    );
    
    return analysis;
  } catch (error) {
    // Log the error but return a default empty structure to prevent breaking the UI
    console.error('Error analyzing revenue trends:', error);
    throw error;
  }
}); 