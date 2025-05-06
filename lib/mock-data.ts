// mock-data.ts - Functions to generate mock data for analytics when database is not available

import { format, startOfDay, addDays, subDays, subMonths, addMonths, parseISO } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

// Types for analytics data
export interface ProjectedEarning {
  month: string;
  actual: number | null;
  projected: number | null;
}

export interface PeakSellingHour {
  hour: string;
  sales: number;
}

export interface PriceSuggestion {
  id: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  potential: number;
}

export interface OptimalProduct {
  id: string;
  name: string;
  score: number;
  factors: {
    margin: number;
    volume: number;
    returns: number;
    turnover: number;
    recency: number;
  };
}

// Generate projected earnings data based on resolution and selected time period
export function getProjectedEarningsMock(
  resolution: string = 'daily', 
  pastMonths: number = 3, 
  futureMonths: number = 3
): ProjectedEarning[] {
  // try to read real data from CSV first
  try {
    // for server-side file access
    const csvPath = path.join(process.cwd(), 'public', 'sample_data', 'sales_history.csv');
    
    if (fs.existsSync(csvPath)) {
      // read and parse the CSV file synchronously
      const fileContent = fs.readFileSync(csvPath, 'utf8');
      const rows = fileContent.split('\n').slice(1); // Skip header
      
      // get current date for determining which data is "actual" vs "projected"
      const currentDate = new Date();
      // create date boundaries
      const pastDate = subMonths(currentDate, pastMonths);
      const futureDate = addMonths(currentDate, pastMonths); // same duration into future
      
      // First, create a map to aggregate sales by month
      const salesByMonth: Record<string, {date: Date, revenue: number}> = {};
      
      // Process all CSV rows
      rows.forEach(row => {
        if (!row.trim()) return; // skip empty rows
        
        const [dateStr, , , , , totalAmount] = row.split(',');
        if (!dateStr || !totalAmount) return;
        
        try {
          const saleDate = new Date(dateStr);
          // Skip data outside our time range (past period to current)
          if (saleDate < pastDate || saleDate > currentDate) return;
          
          // Create a consistent key for each month - always include year for proper sorting
          const monthKey = format(saleDate, 'yyyy-MM');
          const displayKey = resolution === 'monthly' 
            ? format(saleDate, 'MMM yyyy')
            : format(saleDate, 'MMM');
          
          if (!salesByMonth[monthKey]) {
            salesByMonth[monthKey] = {
              date: new Date(format(saleDate, 'yyyy-MM-01')), // first day of month
              revenue: 0
            };
          }
          
          salesByMonth[monthKey].revenue += parseFloat(totalAmount);
        } catch (err) {
          // skip invalid rows
          console.error('Error parsing date in CSV:', err);
        }
      });
      
      // Convert to array and sort chronologically
      const sortedMonths = Object.entries(salesByMonth)
        .map(([monthKey, data]) => ({
          monthKey,
          date: data.date,
          revenue: data.revenue,
          display: resolution === 'monthly' 
            ? format(data.date, 'MMM yyyy') 
            : format(data.date, 'MMM')
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Now build our result with actual data (historical) and projected data (future)
      const result: ProjectedEarning[] = [];
      
      // 1. Add actual data points from past period to current
      sortedMonths.forEach(item => {
        result.push({
          month: item.display,
          actual: Math.round(item.revenue),
          projected: 0 // Initialize with zero instead of null for past data
        });
      });
      
      // 2. Add projection points for future months (current date forward)
      // Use the most recent actual data point as our base for projections
      if (result.length > 0) {
        const lastActualMonth = result[result.length - 1];
        const baseValue = lastActualMonth.actual || 0;
        
        // Add future months for same duration as the past period
        for (let i = 1; i <= pastMonths; i++) {
          const futureMonth = addMonths(currentDate, i);
          
          // Use a format that makes the timeline clear
          const monthName = resolution === 'monthly' 
            ? format(futureMonth, 'MMM yyyy')
            : format(futureMonth, 'MMM');
          
          // Apply growth rate for projections (8% monthly growth)
          const growthRate = 1.08; 
          const projectedValue = baseValue * Math.pow(growthRate, i);
          
          result.push({
            month: monthName,
            actual: null, // no actual data for future
            projected: Math.round(projectedValue)
          });
        }
      }
      
      return result;
    }
  } catch (err) {
    console.error('Error reading sales history CSV:', err);
    // Fall back to random data if CSV read fails
  }
  
  // fallback to random data with proper time formatting
  const result: ProjectedEarning[] = [];
  const now = new Date();
  
  // Generate past months with actual data (from now - period)
  for (let i = pastMonths; i >= 0; i--) {
    const date = subMonths(now, i);
    const monthName = resolution === 'monthly' 
      ? format(date, 'MMM yyyy')
      : format(date, 'MMM');
    
    // Create some realistic data with slight random variations
    const baseValue = 50000 - (i * 5000) + (Math.random() * 10000 - 5000);
    
    result.push({
      month: monthName,
      actual: Math.round(baseValue),
      projected: 0 // Initialize with zero instead of null for past data
    });
  }
  
  // Generate future months with only projections (from now + period)
  // Use the same duration as the past period
  if (result.length > 0) {
    const lastActual = result[result.length - 1].actual || 0;
    
    for (let i = 1; i <= pastMonths; i++) {
      const date = addMonths(now, i);
      const monthName = resolution === 'monthly' 
        ? format(date, 'MMM yyyy')
        : format(date, 'MMM');
      
      // Use 8% monthly growth rate for projections
      const projectedValue = lastActual * Math.pow(1.08, i);
      
      result.push({
        month: monthName,
        actual: null, // no actual data for future
        projected: Math.round(projectedValue)
      });
    }
  }
  
  return result;
}

// Generate peak selling hours data
export function getPeakSellingHoursMock(normalize: boolean = false): PeakSellingHour[] {
  const timeSlots = [
    '12-2 AM', '2-4 AM', '4-6 AM', '6-8 AM', '8-10 AM', '10-12 PM',
    '12-2 PM', '2-4 PM', '4-6 PM', '6-8 PM', '8-10 PM', '10-12 AM'
  ];
  
  // Create a realistic distribution with morning and evening peaks
  const salesDistribution = [
    5, 3, 2, 8, 20, 35,
    45, 38, 50, 90, 65, 30
  ];
  
  // Normalize if requested
  if (normalize) {
    const total = salesDistribution.reduce((sum, val) => sum + val, 0);
    return timeSlots.map((hour, index) => ({
      hour,
      sales: Math.round((salesDistribution[index] / total) * 100)
    }));
  }
  
  return timeSlots.map((hour, index) => ({
    hour,
    sales: salesDistribution[index]
  }));
}

// Generate price suggestion data
export function getPriceSuggestionsMock(limit: number = 10): PriceSuggestion[] {
  const productNames = [
    'Premium T-Shirt', 'Classic Hoodie', 'Winter Jacket', 'Canvas Tote Bag',
    'Knit Beanie', 'Logo Cap', 'Graphic Print Tee', 'Slim Fit Jeans',
    'Athletic Shorts', 'Workout Tank', 'Zip Fleece', 'Eco-Friendly Water Bottle'
  ];
  
  return productNames.slice(0, limit).map((name, index) => {
    // Generate a base price between $15 and $80
    const basePrice = 15 + (index * 5) + Math.floor(Math.random() * 10);
    
    // Determine if price should go up or down based on index
    const direction = index % 3 === 0 ? -1 : 1;
    
    // Calculate potential change (between 5% and 15%)
    const potentialChange = 5 + Math.floor(Math.random() * 10);
    
    // Calculate suggested price
    const suggestedPrice = basePrice * (1 + (direction * potentialChange / 100));
    
    return {
      id: `prod-${index + 1}`,
      name,
      currentPrice: basePrice,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      potential: direction * potentialChange
    };
  });
}

// Generate optimal products data
export function getOptimalProductsMock(limit: number = 10): OptimalProduct[] {
  const productNames = [
    'Signature Collection T-Shirt', 'Premium Hoodie', 'Limited Edition Jacket',
    'Organic Cotton Tote', 'Embroidered Hat', 'Designer Sunglasses',
    'Graphic Novel Collection', 'Exclusive Sneakers', 'Fitness Tracker', 
    'Smart Water Bottle', 'Wireless Earbuds', 'Sustainable Notebook'
  ];
  
  return productNames.slice(0, limit).map((name, index) => {
    // Create realistic scoring with decreasing values
    const baseScore = 95 - (index * 4) + Math.floor(Math.random() * 5);
    
    // Generate realistic factors for each product
    return {
      id: `prod-${index + 1}`,
      name,
      score: baseScore,
      factors: {
        margin: 90 - (index * 3) + Math.floor(Math.random() * 10),
        volume: 85 - (index * 4) + Math.floor(Math.random() * 15),
        returns: 95 - (index * 2) + Math.floor(Math.random() * 5), // Higher is better (fewer returns)
        turnover: 80 - (index * 4) + Math.floor(Math.random() * 20),
        recency: 90 - (index * 5) + Math.floor(Math.random() * 10)
      }
    };
  });
}

// Generate daily sales data for time-series charts
export function getDailySalesMock(days: number = 30, resolution: string = 'daily'): Array<{
  date: string;
  sales: number;
  revenue: number;
}> {
  const result = [];
  const endDate = new Date();
  
  if (resolution === 'monthly') {
    // Generate monthly data
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(endDate, i);
      const monthKey = format(date, 'MMM yyyy');
      
      // Base values with some randomness and seasonal patterns
      const baseSales = 150 + (Math.sin(i/2) * 30) + Math.floor(Math.random() * 30);
      const avgOrderValue = 65 + Math.floor(Math.random() * 15);
      
      result.push({
        date: monthKey,
        sales: Math.floor(baseSales),
        revenue: Math.floor(baseSales * avgOrderValue)
      });
    }
  } else if (resolution === 'weekly') {
    // Generate weekly data (last 12 weeks)
    for (let i = 11; i >= 0; i--) {
      const weekEndDate = subDays(endDate, i * 7);
      const weekStartDate = subDays(weekEndDate, 6);
      const weekLabel = `${format(weekStartDate, 'MMM d')}-${format(weekEndDate, 'd')}`;
      
      // Base values with some randomness
      const baseSales = 40 + Math.floor(Math.random() * 20);
      const avgOrderValue = 65 + Math.floor(Math.random() * 15);
      
      result.push({
        date: weekLabel,
        sales: baseSales,
        revenue: Math.floor(baseSales * avgOrderValue)
      });
    }
  } else {
    // Generate daily data
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      const dayKey = format(date, 'yyyy-MM-dd');
      
      // More sales on weekends, with some randomness
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseSales = isWeekend ? 15 : 10;
      const actualSales = baseSales + Math.floor(Math.random() * 10);
      const avgOrderValue = 65 + Math.floor(Math.random() * 15);
      
      result.push({
        date: dayKey,
        sales: actualSales,
        revenue: Math.floor(actualSales * avgOrderValue)
      });
    }
  }
  
  return result;
}

// Mock price recommendations data
export const mockPriceRecommendations = {
  recommendations: [
    {
      productId: 'prod_1',
      productName: 'Premium T-Shirt',
      currentPrice: 24.99,
      recommendedPrice: 29.99,
      confidence: 'high',
      potentialRevenue: 5998,
      currentRevenue: 4998,
      revenueDifference: 1000,
      percentageChange: 20
    },
    {
      productId: 'prod_2',
      productName: 'Canvas Tote Bag',
      currentPrice: 19.99,
      recommendedPrice: 14.99,
      confidence: 'medium',
      potentialRevenue: 3747.5,
      currentRevenue: 2998.5,
      revenueDifference: 749,
      percentageChange: 25
    },
    {
      productId: 'prod_3',
      productName: 'Vintage Hoodie',
      currentPrice: 49.99,
      recommendedPrice: 44.99,
      confidence: 'medium',
      potentialRevenue: 6748.5,
      currentRevenue: 6248.75,
      revenueDifference: 499.75,
      percentageChange: 8
    },
    {
      productId: 'prod_4',
      productName: 'Embroidered Cap',
      currentPrice: 17.99,
      recommendedPrice: 21.99,
      confidence: 'high',
      potentialRevenue: 4398,
      currentRevenue: 3598,
      revenueDifference: 800,
      percentageChange: 22.2
    }
  ],
  revenueProjections: [
    {
      date: 'May 2023',
      currentRevenue: 17844.25,
      optimizedRevenue: 20892.00
    },
    {
      date: 'Jun 2023',
      currentRevenue: 18201.14,
      optimizedRevenue: 21309.84
    },
    {
      date: 'Jul 2023',
      currentRevenue: 18565.16,
      optimizedRevenue: 21736.04
    },
    {
      date: 'Aug 2023',
      currentRevenue: 18936.46,
      optimizedRevenue: 22170.76
    },
    {
      date: 'Sep 2023',
      currentRevenue: 19315.19,
      optimizedRevenue: 22614.17
    },
    {
      date: 'Oct 2023',
      currentRevenue: 19701.49,
      optimizedRevenue: 23066.46
    }
  ]
};

// Function to get mock price recommendations
export function getMockPriceRecommendations() {
  return JSON.parse(JSON.stringify(mockPriceRecommendations));
}

// Mock sales recommendations data
export const mockSalesRecommendations = {
  dayOfWeekTrends: [
    {
      productId: "prod_1",
      productName: "Premium T-Shirt",
      bestDay: "Saturday",
      averageSales: 12,
      dayIndex: 6,
      salesByDay: [
        { day: "Sunday", sales: 10, percentOfAverage: 83 },
        { day: "Monday", sales: 7, percentOfAverage: 58 },
        { day: "Tuesday", sales: 8, percentOfAverage: 67 },
        { day: "Wednesday", sales: 9, percentOfAverage: 75 },
        { day: "Thursday", sales: 11, percentOfAverage: 92 },
        { day: "Friday", sales: 14, percentOfAverage: 117 },
        { day: "Saturday", sales: 25, percentOfAverage: 208 }
      ]
    },
    {
      productId: "prod_2",
      productName: "Canvas Tote Bag",
      bestDay: "Friday",
      averageSales: 8,
      dayIndex: 5,
      salesByDay: [
        { day: "Sunday", sales: 6, percentOfAverage: 75 },
        { day: "Monday", sales: 5, percentOfAverage: 63 },
        { day: "Tuesday", sales: 7, percentOfAverage: 88 },
        { day: "Wednesday", sales: 8, percentOfAverage: 100 },
        { day: "Thursday", sales: 9, percentOfAverage: 113 },
        { day: "Friday", sales: 16, percentOfAverage: 200 },
        { day: "Saturday", sales: 5, percentOfAverage: 63 }
      ]
    },
    {
      productId: "prod_3",
      productName: "Vintage Hoodie",
      bestDay: "Monday",
      averageSales: 5,
      dayIndex: 1,
      salesByDay: [
        { day: "Sunday", sales: 3, percentOfAverage: 60 },
        { day: "Monday", sales: 12, percentOfAverage: 240 },
        { day: "Tuesday", sales: 6, percentOfAverage: 120 },
        { day: "Wednesday", sales: 4, percentOfAverage: 80 },
        { day: "Thursday", sales: 3, percentOfAverage: 60 },
        { day: "Friday", sales: 2, percentOfAverage: 40 },
        { day: "Saturday", sales: 5, percentOfAverage: 100 }
      ]
    }
  ],
  productBundles: [
    {
      id: "bundle_1",
      name: "Weekend Casual Bundle",
      products: [
        { id: "prod_1", name: "Premium T-Shirt", price: 24.99, imageUrl: "/images/products/tshirt.jpg" },
        { id: "prod_4", name: "Embroidered Cap", price: 17.99, imageUrl: "/images/products/cap.jpg" }
      ],
      bundlePrice: 38.99,
      individualPrice: 42.98,
      discount: 3.99,
      discountPercentage: 9.3,
      confidence: "high",
      supportMetric: 0.42, // 42% of transactions contain these items together
      liftMetric: 2.7 // 2.7x more likely to be bought together than by chance
    },
    {
      id: "bundle_2",
      name: "Perfect Outfit Bundle",
      products: [
        { id: "prod_3", name: "Vintage Hoodie", price: 49.99, imageUrl: "/images/products/hoodie.jpg" },
        { id: "prod_5", name: "Designer Jeans", price: 59.99, imageUrl: "/images/products/jeans.jpg" }
      ],
      bundlePrice: 99.99,
      individualPrice: 109.98,
      discount: 9.99,
      discountPercentage: 9.1,
      confidence: "medium",
      supportMetric: 0.28, // 28% of transactions contain these items together
      liftMetric: 1.9 // 1.9x more likely to be bought together than by chance
    },
    {
      id: "bundle_3",
      name: "Essential Accessories",
      products: [
        { id: "prod_2", name: "Canvas Tote Bag", price: 19.99, imageUrl: "/images/products/tote.jpg" },
        { id: "prod_4", name: "Embroidered Cap", price: 17.99, imageUrl: "/images/products/cap.jpg" },
        { id: "prod_6", name: "Sunglasses", price: 24.99, imageUrl: "/images/products/sunglasses.jpg" }
      ],
      bundlePrice: 55.99,
      individualPrice: 62.97,
      discount: 6.98,
      discountPercentage: 11.1,
      confidence: "low",
      supportMetric: 0.15, // 15% of transactions contain these items together
      liftMetric: 1.5 // 1.5x more likely to be bought together than by chance
    }
  ]
};

// Function to get mock sales recommendations
export function getMockSalesRecommendations() {
  return JSON.parse(JSON.stringify(mockSalesRecommendations));
} 