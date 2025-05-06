import { NextRequest, NextResponse } from 'next/server';
import { PriceRecommendationCalculator, DatabaseConnectionError, InsufficientDataError } from '@/lib/analytics/price-recommendations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMockPriceRecommendations } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange');
    const confidenceLevel = searchParams.get('confidence') as 'high' | 'medium' | 'low' | 'all' | null;
    const useMockData = searchParams.get('mock') === 'true'; // Allow forcing mock data
    
    // Convert time range to days
    const timeRangeInDays = timeRange ? parseInt(timeRange, 10) : 90;
    
    // Check authentication only in production mode
    let userId = undefined;
    if (process.env.NODE_ENV === 'production' && !useMockData) {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized. Please log in to view price recommendations.' }, { status: 401 });
      }
      
      userId = session.user.id;
    }
    
    // In development or when forcing mock data, use mock data
    if (process.env.NODE_ENV === 'development' || useMockData) {
      const mockData = getMockPriceRecommendations();
      return NextResponse.json(mockData);
    }
    
    // Real data calculation
    try {
      const calculator = new PriceRecommendationCalculator();
      const results = await calculator.calculatePriceRecommendations(
        timeRangeInDays,
        userId,
        confidenceLevel || 'all'
      );
      
      return NextResponse.json(results);
    } catch (error) {
      if (error instanceof DatabaseConnectionError) {
        return NextResponse.json({ 
          error: 'Database connection error. Please try again later.' 
        }, { status: 503 });
      } else if (error instanceof InsufficientDataError) {
        // If real data is insufficient, fall back to mock data
        const mockData = getMockPriceRecommendations();
        return NextResponse.json({
          ...mockData,
          note: 'Using sample data due to insufficient historical data.'
        });
      } else {
        console.error('Error calculating price recommendations:', error);
        return NextResponse.json({ 
          error: 'Failed to calculate price recommendations.' 
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Unexpected error in price recommendations API:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred.' 
    }, { status: 500 });
  }
} 