import { PrismaClient } from '@prisma/client';

// Type for resolution
export type TimeResolution = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Determines the appropriate time resolution based on the time range
 * @param timeRangeInDays Number of days to analyze
 * @returns The appropriate time resolution
 */
export function determineResolution(timeRangeInDays: number): TimeResolution {
  // Special case for all-time view
  if (timeRangeInDays === 0) {
    return 'yearly';  // Default to yearly for all-time view
  }
  
  if (timeRangeInDays <= 3) {
    return 'hourly';
  } else if (timeRangeInDays <= 14) {
    return 'daily';
  } else if (timeRangeInDays <= 90) {
    return 'weekly';
  } else if (timeRangeInDays <= 365) {
    return 'monthly';
  } else if (timeRangeInDays <= 730) {
    return 'quarterly';
  } else {
    return 'yearly';
  }
}

/**
 * Tests the database connection
 * @param prisma PrismaClient instance
 * @throws DatabaseError if connection fails
 */
export async function testDatabaseConnection(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    throw new DatabaseError(
      'Unable to connect to the database. Please check your database configuration.',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Safely converts database values to Numbers, handling BigInt conversion
 * @param value Value to convert
 * @returns Number representation of the value
 */
export function safeNumberConversion(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'bigint') {
    return Number(value);
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  const converted = Number(value);
  return isNaN(converted) ? 0 : converted;
}

/**
 * Calculates the median value from an array of numbers
 * @param values Array of numbers
 * @returns Median value or 0 if array is empty
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) {
    return 0;
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Safely executes a database query with proper error handling
 * @param queryFn Function executing the query
 * @param fallbackValue Fallback value if query fails
 * @returns Query result or fallback value
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Database query error:', error);
    return fallbackValue;
  }
}

/**
 * Clamps a value between min and max
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Formats a date for display according to the given resolution
 * @param date Date to format
 * @param resolution Time resolution
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date, resolution: TimeResolution): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric',
    timeZone: 'UTC'
  };
  
  switch (resolution) {
    case 'hourly':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'daily':
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric'
      });
    case 'weekly':
      // For weekly, create a range
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${
        weekEnd.toLocaleDateString([], { month: 'short', day: 'numeric' })
      }`;
    case 'monthly':
      return date.toLocaleDateString([], { 
        month: 'short', 
        year: 'numeric' 
      });
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString();
  }
} 