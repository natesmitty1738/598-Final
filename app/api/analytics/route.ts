import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import {
  ProjectedEarningsCalculator,
  DatabaseConnectionError,
  InsufficientDataError,
} from '@/lib/analytics/projected-earnings';
import {
  PriceRecommendationCalculator,
  type PriceRecommendation
} from '@/lib/analytics/price-recommendations';
import {
  RevenueOverTime,
  type RevenueDataPoint
} from '@/lib/analytics/revenue-over-time';

// Function to generate mock price recommendations as fallback
function getMockPriceRecommendations(): PriceRecommendation[] {
  return [
    {
      productId: '',
      productName: '',
      currentPrice: 0,
      recommendedPrice: 0,
      confidence: 'medium',
      potentialRevenue: 0,
      currentRevenue: 0,
      revenueDifference: 0,
      percentageChange: 0
    },
    {
      productId: '',
      productName: '',
      currentPrice: 0,
      recommendedPrice: 0,
      confidence: 'high',
      potentialRevenue: 0,
      currentRevenue: 0,
      revenueDifference: 0,
      percentageChange: 0
    },
    {
      productId: '',
      productName: '',
      currentPrice: 0,
      recommendedPrice: 0,
      confidence: 'low',
      potentialRevenue: 0,
      currentRevenue: 0,
      revenueDifference: 0,
      percentageChange: 0
    }
  ];
}

// Define API response for projected earnings
interface ProjectedEarning {
  actual: {
    date: string;
    value: number;
  }[];
  projected: {
    date: string;
    value: number;
  }[];
  todayIndex: number;
}

// Define types for other data structures
interface DailySale {
  date: string;
  sales: number;
  revenue: number;
}

interface TopSellingProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface SalesByCategoryItem {
  category: string;
  revenue: number;
}

interface DailySalesItem {
  date: string;
  sales: number;
  revenue: number;
}

// GET /api/analytics - Get analytics data
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Extract timeRange and confidence parameters from query string
    const { searchParams } = new URL(req.url);
    const timeRangeParam = searchParams.get("timeRange") || "30";
    const confidenceParam = searchParams.get("confidence") || "all";
    
    // Validate confidence parameter
    const confidenceLevel = ['high', 'medium', 'low', 'all'].includes(confidenceParam as string) 
      ? confidenceParam as 'high' | 'medium' | 'low' | 'all'
      : 'all';
    
    console.log(`[DEBUG API] Received parameters: timeRange=${timeRangeParam}, confidence=${confidenceLevel}`);
    
    // Map timeframe strings to days correctly
    let timeRange: number;
    
    // Check if the time range is "all" for all time view
    const isAllTime = timeRangeParam === "all" || timeRangeParam === "0";
    
    if (isAllTime) {
      timeRange = 0;
    } else {
      // Handle specific time ranges properly
      switch(timeRangeParam) {
        case '7day':
          timeRange = 7;
          break;
        case '1month':
          timeRange = 30;
          break;
        case '1year':
          timeRange = 365;
          break;
        default:
          // For numeric values, parse directly
          timeRange = parseInt(timeRangeParam);
          // Provide a sensible default if parsing fails
          if (isNaN(timeRange)) {
            timeRange = 30;
            console.log(`[DEBUG API] Invalid timeRange parameter: ${timeRangeParam}, defaulting to 30 days`);
          }
      }
    }
    
    // Get current date for reference
    const currentDate = new Date();
    
    // Log the requested timeRange for debugging
    console.log(`[DEBUG API] Received timeRange request: ${timeRangeParam}, isAllTime: ${isAllTime}, days: ${timeRange}`);
    
    // We'll get date ranges from our analytics classes rather than calculating here directly
    // This ensures consistency across all analytics components
    let startDate = new Date(currentDate);
    let endDate = new Date(currentDate);
    
    if (!isAllTime) {
      // For regular time ranges, we can calculate directly
    startDate.setDate(currentDate.getDate() - timeRange);
      // Don't project forward for regular time ranges either
      // This will be handled by the RevenueOverTime class
    }
    // For all-time, we'll let the analytics classes determine the proper range
    
    console.log(`[DEBUG API] Initial date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Initialize with empty data structures (properly typed)
    const dailySales: DailySale[] = [];
    let totalSales = 0;
    let totalRevenue = 0;
    let averageOrderValue = 0;
    const topSellingProducts: TopSellingProduct[] = [];
    const salesByCategory: SalesByCategoryItem[] = [];
    
    // Use our new RevenueOverTime class to get revenue trends
    let revenueTrend = '';
    let seasonalityInfo = null;
    try {
      const revenueAnalyzer = new RevenueOverTime(prisma);
      const revenueTrends = await revenueAnalyzer.analyzeRevenue(
        timeRange,
        session?.user?.id
      );
      
      console.log(`[DEBUG API] Revenue trends analysis complete with ${revenueTrends.data.length} data points`);
      
      // Save trend information for the response
      revenueTrend = revenueTrends.trend;
      seasonalityInfo = revenueTrends.seasonality;
      
      // Update date range with the one used by the revenue analyzer
      // This ensures consistency across all components
      startDate = new Date(revenueTrends.dateRange.start);
      endDate = new Date(revenueTrends.dateRange.end);
      
      // Convert revenue data to dailySales format for compatibility with existing UI
      if (revenueTrends.data.length > 0) {
        // Map RevenueDataPoint[] to DailySale[]
        for (const point of revenueTrends.data) {
          dailySales.push({
            date: point.date,
            sales: point.count || 0,
            revenue: point.value
          });
        }
        
        // Update the totals
        totalRevenue = revenueTrends.total;
        totalSales = revenueTrends.data.reduce((sum, point) => sum + (point.count || 0), 0);
        averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        console.log(`[DEBUG API] Revenue data converted to dailySales format with ${dailySales.length} points`);
        console.log(`[DEBUG API] Total revenue: ${totalRevenue}, Total sales: ${totalSales}`);
      }
    } catch (error) {
      console.error(`[ERROR API] Failed to get revenue trends:`, error);
      // Don't return error to avoid breaking the UI if this part fails
    }

    // Projected Earnings - use real calculator
    let projectedEarnings: ProjectedEarning = {
      actual: [],
      projected: [],
      todayIndex: 0
    };
    
    try {
      // Real data: Use the calculator for projected earnings
      const projectedEarningsCalculator = new ProjectedEarningsCalculator(prisma);
      
      // Log the timeRange being used for the calculation
      console.log(`[DEBUG API] Calling projectedEarningsCalculator with timeRange: ${timeRange}`);
      
      // Add debugging to track data
      const start = Date.now();
      const projectedEarningsData = await projectedEarningsCalculator.calculateProjectedEarnings(
        timeRange, 
        session?.user?.id
      );
      const end = Date.now();
      
      console.log(`[DEBUG API] ProjectedEarnings calculation took ${end - start}ms`);
      console.log(`[DEBUG API] ProjectedEarnings returned ${projectedEarningsData.actual.length} actual points and ${projectedEarningsData.projected.length} projected points`);
      
      if (projectedEarningsData.actual.length > 0) {
        console.log(`[DEBUG API] First actual data point: ${JSON.stringify(projectedEarningsData.actual[0])}`);
        console.log(`[DEBUG API] Last actual data point: ${JSON.stringify(projectedEarningsData.actual[projectedEarningsData.actual.length - 1])}`);
      }
      
      if (projectedEarningsData.projected.length > 0) {
        console.log(`[DEBUG API] First projected data point: ${JSON.stringify(projectedEarningsData.projected[0])}`);
        console.log(`[DEBUG API] Last projected data point: ${JSON.stringify(projectedEarningsData.projected[projectedEarningsData.projected.length - 1])}`);
      }
      
      // Format the data for the front-end
      projectedEarnings = {
        actual: projectedEarningsData.actual.map(point => ({
          date: point.date,
          value: point.value
        })),
        projected: projectedEarningsData.projected.map(point => ({
          date: point.date,
          value: point.value
        })),
        todayIndex: projectedEarningsData.todayIndex
      };
      
      // For all-time view, log the full range of dates in the actual data array
      if (isAllTime && projectedEarningsData.actual.length > 0) {
        // Extract just the years for easier analysis
        const years = projectedEarningsData.actual.map(point => {
          if (point.date.includes(' ')) {
            // Handle "MMM yyyy" format
            return point.date.split(' ')[1];
          } else if (point.date.includes('-')) {
            // Handle "yyyy-MM" or "yyyy-MM-dd" format
            return point.date.substring(0, 4);
          }
          return 'unknown';
        });
        
        const uniqueYears = [...new Set(years)].sort();
        console.log(`[DEBUG API] All-time view includes years: ${uniqueYears.join(', ')}`);
        console.log(`[DEBUG API] Full date range of actual data points: ${projectedEarningsData.actual[0].date} to ${projectedEarningsData.actual[projectedEarningsData.actual.length - 1].date}`);
      }
      
    } catch (error) {
      console.error('Error getting projected earnings:', error);
      // Already initialized with a valid empty structure above
    }
    
    // Price recommendations using real calculator
    let priceSuggestions: any[] = [];
    
    try {
      // Real price recommendations using our calculator
      const priceCalculator = new PriceRecommendationCalculator(prisma);
      let recommendationsData;
      
      try {
        // Get price recommendations with the confidence level filter
        recommendationsData = await priceCalculator.getPriceRecommendations(
          90, // We use 90 days of data for price analysis by default
          confidenceLevel as 'high' | 'medium' | 'low' | 'all',
          session?.user?.id
        );
        
        // Log recommendations for debugging
        console.log(`[DEBUG API] Using confidence level '${confidenceLevel}' for price recommendations`);
        console.log(`[DEBUG API] Received ${recommendationsData.length} price recommendations`);
        
        // Log top 3 recommendations for debugging
        if (recommendationsData.length > 0) {
          console.log(`[DEBUG API] Top 3 price suggestions:`);
          recommendationsData.slice(0, 3).forEach((rec: PriceRecommendation, idx: number) => {
            console.log(`  ${idx+1}. ${rec.productName}: $${rec.currentPrice.toFixed(2)} → $${rec.recommendedPrice.toFixed(2)} (${rec.percentageChange > 0 ? '+' : ''}${rec.percentageChange.toFixed(0)}%)`);
          });
        }
        
        // Convert to the expected format for the UI
        // Return all recommendations instead of just top 3
        priceSuggestions = recommendationsData.map((rec: PriceRecommendation) => ({
          id: rec.productId,
          name: rec.productName,
          currentPrice: rec.currentPrice,
          suggestedPrice: rec.recommendedPrice,
          potential: rec.percentageChange,
          confidence: rec.confidence
        }));
      } catch (error) {
        // InsufficientDataError is now handled inside getPriceRecommendations, which returns empty array
        // Only log the error but don't use mock data
        console.error('Error generating price recommendations:', error);
        priceSuggestions = [];
      }
    } catch (error) {
      console.error('Error getting price recommendations:', error);
      // Leave as empty array
    }

    return NextResponse.json({
      totalSales,
      totalRevenue,
      averageOrderValue,
      topSellingProducts,
      salesByCategory,
      dailySales,
      projectedEarnings,
      priceSuggestions,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      // Add new revenue analysis fields
      revenueAnalysis: {
        trend: revenueTrend,
        seasonality: seasonalityInfo,
        total: totalRevenue,
        average: averageOrderValue
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 