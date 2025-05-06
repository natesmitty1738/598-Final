import { NextResponse } from 'next/server';
import { ProjectedEarningsCalculator, DatabaseConnectionError, InsufficientDataError } from '@/lib/analytics/projected-earnings';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '30');
    // Add support for testing with a specific user ID
    const userId = searchParams.get('userId');
    
    // Create a new calculator instance
    const calculator = new ProjectedEarningsCalculator(prisma);
    
    // Calculate projected earnings with optional userId
    const result = await calculator.calculateProjectedEarnings(timeRange, userId);
    
    // Return the result with more details for debugging
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timeRange,
        userId: userId || 'none',
        actualDataPoints: result.actual.length,
        projectedDataPoints: result.projected.length,
        todayIndex: result.todayIndex
      }
    });
  } catch (error) {
    console.error('Error testing calculator:', error);
    
    let status = 500;
    let message = 'Internal server error';
    
    if (error instanceof DatabaseConnectionError) {
      status = 503;
      message = 'Database connection error';
    } else if (error instanceof InsufficientDataError) {
      status = 400;
      message = 'Insufficient data for calculations';
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    return NextResponse.json({
      success: false,
      error: message
    }, { status });
  }
} 