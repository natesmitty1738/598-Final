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
  getPeakSellingHoursMock,
  getPriceSuggestionsMock,
  getOptimalProductsMock,
  getDailySalesMock
} from '@/lib/mock-data';

// GET /api/analytics/simple - Get simplified analytics with only tested functionality
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    const { searchParams } = new URL(req.url);
    const timeRange = parseInt(searchParams.get("timeRange") || "30");
    
    // Get current date for reference
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - timeRange);
    const endDate = new Date(currentDate);
    
    // Use mock data for everything except projected earnings
    const dailySales = getDailySalesMock(timeRange);
    const totalSales = dailySales.reduce((sum, day) => sum + day.sales, 0);
    const totalRevenue = dailySales.reduce((sum, day) => sum + day.revenue, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Use mock data for these sections
    const topSellingProducts = [
      { id: 'p1', name: 'T-Shirt', quantity: 120, revenue: 2400 },
      { id: 'p2', name: 'Hoodie', quantity: 85, revenue: 3400 },
      { id: 'p3', name: 'Cap', quantity: 70, revenue: 1050 },
      { id: 'p4', name: 'Jeans', quantity: 45, revenue: 2250 },
      { id: 'p5', name: 'Sneakers', quantity: 30, revenue: 3000 }
    ];
    
    const salesByCategory = [
      { category: 'Clothing', revenue: 8000 },
      { category: 'Accessories', revenue: 3500 },
      { category: 'Footwear', revenue: 4200 },
      { category: 'Electronics', revenue: 5600 }
    ];

    // Projected Earnings - use our tested calculator
    let projectedEarnings;
    try {
      // Use the new calculator for projected earnings
      const projectedEarningsCalculator = new ProjectedEarningsCalculator(prisma);
      const projectedEarningsData = await projectedEarningsCalculator.calculateProjectedEarnings(timeRange, session?.user?.id);
      
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
      
    } catch (error) {
      console.error('Error getting projected earnings:', error);
      
      // Instead of falling back to mock data, we'll throw an error that will be caught by the front-end
      if (error instanceof DatabaseConnectionError) {
        throw new Error('Database connection error. Please try again later.');
      } else if (error instanceof InsufficientDataError) {
        throw new Error('Insufficient sales data to generate projections. Please add more sales history.');
      } else {
        throw new Error('Failed to calculate projected earnings: ' + 
          (error instanceof Error ? error.message : String(error)));
      }
    }
    
    // Create mock price suggestions - we show 3 products with a mix of confidence levels
    const priceSuggestions = getPriceSuggestionsMock(3);

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
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 