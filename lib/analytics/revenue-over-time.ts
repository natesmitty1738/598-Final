import { PrismaClient } from '@prisma/client';
import { 
  TimeResolution, 
  determineResolution, 
  testDatabaseConnection, 
  safeNumberConversion,
  calculateMedian,
  safeQuery,
  clamp,
  formatDateForDisplay,
  DatabaseError
} from './utils';

// types for revenue data points
export interface RevenueDataPoint {
  date: string;
  value: number;
  count?: number;
}

export interface RevenueAnalysis {
  data: RevenueDataPoint[];
  total: number;
  average: number;
  median: number;
  min: { date: string; value: number };
  max: { date: string; value: number };
  growth: {
    overall: number;  // overall growth rate (percentage)
    periodic: number[]; // period-to-period growth rates
    averagePeriodic: number; // average of period-to-period growth
  };
  resolution: TimeResolution;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface RevenueTrendAnalysis extends RevenueAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  seasonality: {
    detected: boolean;
    pattern?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    strongestDay?: number; // 0-6 for day of week
    strongestMonth?: number; // 0-11 for month
    weakestDay?: number;
    weakestMonth?: number;
    indexes: number[]; // seasonal indices
  };
  forecastData?: RevenueDataPoint[]; // simple forecast if requested
}

// Error class for insufficient data
export class InsufficientDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientDataError';
  }
}

export class RevenueOverTime {
  private prisma: PrismaClient;
  
  constructor(prismaClient?: PrismaClient) {
    // Allow dependency injection for testing
    this.prisma = prismaClient || new PrismaClient();
  }
  
  /**
   * Analyze revenue over time for a specific time range
   * @param timeRangeInDays Number of days to analyze (7, 30, 365, etc.)
   * @param userId Optional user ID to filter data
   * @returns Revenue analysis with trend data
   */
  async analyzeRevenue(
    timeRangeInDays: number,
    userId?: string,
    includeForecast: boolean = false
  ): Promise<RevenueTrendAnalysis> {
    try {
      // Check database connection first
      await testDatabaseConnection(this.prisma);
      
      // Determine the data resolution based on time range
      const resolution = determineResolution(timeRangeInDays);
      
      // Log the resolution for debugging
      console.log(`[DEBUG Revenue] Analyzing revenue with resolution: ${resolution}, timeRange: ${timeRangeInDays}`);
      
      // Calculate date range
      const { startDate, endDate } = await this.calculateDateRange(timeRangeInDays);
      
      console.log(`[DEBUG Revenue] Date range for analysis: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Fetch historical sales data
      const salesData = await this.fetchRevenueSales(startDate, endDate, userId);
      
      console.log(`[DEBUG Revenue] Fetched ${salesData.length} sales records`);
      
      if (salesData.length === 0) {
        throw new InsufficientDataError('Insufficient sales data for revenue analysis');
      }
      
      // Aggregate data according to resolution
      const aggregatedData = this.aggregateRevenueData(salesData, resolution, startDate, endDate);
      
      console.log(`[DEBUG Revenue] Generated ${aggregatedData.length} aggregated data points with resolution: ${resolution}`);
      
      // Check if we have at least some data points after aggregation
      if (aggregatedData.length === 0) {
        console.warn(`[WARN Revenue] No data points after aggregation, using fallback resolution`);
        // Try fallback to a coarser resolution if we're dealing with all-time or sparse data
        const fallbackResolution = timeRangeInDays === 0 ? 'yearly' : 
          resolution === 'yearly' ? 'yearly' :
          resolution === 'quarterly' ? 'yearly' :
          resolution === 'monthly' ? 'quarterly' :
          resolution === 'weekly' ? 'monthly' :
          resolution === 'daily' ? 'weekly' : 'monthly';
          
        console.log(`[DEBUG Revenue] Using fallback resolution: ${fallbackResolution}`);
        
        // Re-aggregate with fallback resolution
        const fallbackData = this.aggregateRevenueData(salesData, fallbackResolution, startDate, endDate);
        
        // If we still have no data, throw error
        if (fallbackData.length === 0) {
          throw new InsufficientDataError('Unable to aggregate revenue data, even with fallback resolution');
        }
        
        // Use the fallback data
        return this.finalizeAnalysis(fallbackData, fallbackResolution, startDate, endDate, includeForecast);
      }
      
      // Process the aggregated data
      return this.finalizeAnalysis(aggregatedData, resolution, startDate, endDate, includeForecast);
    } catch (error) {
      // Rethrow database connection errors
      if (error instanceof DatabaseError || error instanceof InsufficientDataError) {
        throw error;
      }
      
      // Otherwise wrap in a generic error
      console.error('Error analyzing revenue:', error);
      throw new Error(
        'Failed to analyze revenue. ' + 
        (error instanceof Error ? error.message : String(error))
      );
    }
  }
  
  /**
   * Calculate date range based on time range in days
   */
  private async calculateDateRange(timeRangeInDays: number): Promise<{ 
    startDate: Date, 
    endDate: Date 
  }> {
    const endDate = new Date();
    
    // Special case for all-time view (timeRangeInDays = 0)
    if (timeRangeInDays === 0) {
      // Find oldest sale date to determine proper start date
      try {
        const oldestSale = await this.prisma.sale.findFirst({
          orderBy: { createdAt: 'asc' }
        });
        
        if (oldestSale) {
          const startDate = new Date(oldestSale.createdAt);
          // Get the most recent sale for the end date
          const newestSale = await this.prisma.sale.findFirst({
            orderBy: { createdAt: 'desc' }
          });
          
          if (newestSale) {
            // Set endDate to the most recent sale plus a small buffer (7 days)
            // This ensures we include all data without projecting far into the future
            endDate.setTime(newestSale.createdAt.getTime());
            endDate.setDate(endDate.getDate() + 7); // Add just a week buffer
          }
          
          return { startDate, endDate };
        }
      } catch (error) {
        console.error('Error finding oldest sale for all-time range:', error);
        // Fall through to default case below
      }
      
      // Default to 1 year if no sales found or on error
      const startDate = new Date(endDate);
      startDate.setFullYear(endDate.getFullYear() - 1);
      return { startDate, endDate };
    }
    
    // Regular time ranges
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - timeRangeInDays);
    
    return { startDate, endDate };
  }
  
  /**
   * Fetch revenue sales data from database
   */
  private async fetchRevenueSales(
    startDate: Date, 
    endDate: Date, 
    userId?: string
  ): Promise<any[]> {
    try {
      // Build where clause
      const whereClause: any = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
      
      // Add user filter if provided
      if (userId) {
        whereClause.userId = userId;
      }
      
      // Fetch sales data
      const sales = await this.prisma.sale.findMany({
        where: whereClause,
        select: {
          id: true,
          createdAt: true,
          totalAmount: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      return sales;
    } catch (error) {
      console.error('Error fetching revenue sales:', error);
      return [];
    }
  }
  
  /**
   * Aggregate revenue data according to resolution
   */
  private aggregateRevenueData(
    salesData: any[], 
    resolution: TimeResolution,
    startDate: Date,
    endDate: Date
  ): RevenueDataPoint[] {
    // Create a Map to aggregate data by time periods
    const aggregatedData = new Map<string, { total: number, count: number }>();
    
    // Process each sale and aggregate by time period
    salesData.forEach(sale => {
      const date = new Date(sale.createdAt);
      const key = this.formatDateByResolution(date, resolution);
      
      if (!aggregatedData.has(key)) {
        aggregatedData.set(key, { total: 0, count: 0 });
      }
      
      const current = aggregatedData.get(key)!;
      current.total += safeNumberConversion(sale.totalAmount);
      current.count += 1;
    });
    
    // Generate all time periods to ensure continuity
    const allTimePeriods = this.generateTimePeriods(startDate, endDate, resolution);
    
    // Create the final data array with all time periods
    return allTimePeriods.map(period => ({
      date: period,
      value: aggregatedData.has(period) ? aggregatedData.get(period)!.total : 0,
      count: aggregatedData.has(period) ? aggregatedData.get(period)!.count : 0
    }));
  }
  
  /**
   * Format date according to resolution
   */
  private formatDateByResolution(date: Date, resolution: TimeResolution): string {
    switch (resolution) {
      case 'hourly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      case 'daily':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'weekly': {
        // Get the week start date (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      }
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'quarterly': {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      }
      case 'yearly':
        return `${date.getFullYear()}`;
      default:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
  
  /**
   * Generate all time periods in a date range by resolution
   */
  private generateTimePeriods(
    startDate: Date, 
    endDate: Date, 
    resolution: TimeResolution
  ): string[] {
    const periods: string[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      periods.push(this.formatDateByResolution(currentDate, resolution));
      
      // Advance to next period
      switch (resolution) {
        case 'hourly':
          currentDate.setHours(currentDate.getHours() + 1);
          break;
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
    
    return periods;
  }
  
  /**
   * Find minimum value data point
   */
  private findMinValue(data: RevenueDataPoint[]): { date: string; value: number } {
    if (data.length === 0) {
      return { date: '', value: 0 };
    }
    
    return data.reduce(
      (min, point) => (point.value < min.value ? { date: point.date, value: point.value } : min),
      { date: data[0].date, value: data[0].value }
    );
  }
  
  /**
   * Find maximum value data point
   */
  private findMaxValue(data: RevenueDataPoint[]): { date: string; value: number } {
    if (data.length === 0) {
      return { date: '', value: 0 };
    }
    
    return data.reduce(
      (max, point) => (point.value > max.value ? { date: point.date, value: point.value } : max),
      { date: data[0].date, value: data[0].value }
    );
  }
  
  /**
   * Calculate period-to-period growth rates
   */
  private calculateGrowthRates(data: RevenueDataPoint[]): { periodic: number[]; average: number } {
    if (data.length < 2) {
      return { periodic: [], average: 0 };
    }
    
    const rates: number[] = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1].value === 0) {
        rates.push(data[i].value > 0 ? 100 : 0); // special case for zero to non-zero
      } else {
        const growthRate = ((data[i].value - data[i - 1].value) / data[i - 1].value) * 100;
        rates.push(growthRate);
      }
    }
    
    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    return { periodic: rates, average };
  }
  
  /**
   * Calculate overall growth rate from first to last period
   */
  private calculateOverallGrowth(data: RevenueDataPoint[]): number {
    if (data.length < 2) {
      return 0;
    }
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    
    if (first === 0) {
      return last > 0 ? 100 : 0;
    }
    
    return ((last - first) / first) * 100;
  }
  
  /**
   * Analyze seasonal patterns in the data
   */
  private analyzeSeasonal(
    data: RevenueDataPoint[],
    resolution: TimeResolution
  ): RevenueTrendAnalysis['seasonality'] {
    // Default return value
    const result: RevenueTrendAnalysis['seasonality'] = {
      detected: false,
      indexes: []
    };
    
    // Need enough data to detect patterns
    if (data.length < 7) {
      return result;
    }
    
    // Different analysis based on resolution
    switch (resolution) {
      case 'daily':
      case 'hourly': {
        // Look for day-of-week patterns
        const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        
        data.forEach(point => {
          try {
            // For daily resolution, parse the date
            const date = new Date(point.date);
            if (!isNaN(date.getTime())) {
              const dayOfWeek = date.getDay(); // 0-6
              dayTotals[dayOfWeek] += point.value;
              dayCounts[dayOfWeek]++;
            }
          } catch (e) {
            // Skip invalid dates
          }
        });
        
        // Calculate average per day
        const dayAverages = dayTotals.map((total, index) => 
          dayCounts[index] > 0 ? total / dayCounts[index] : 0
        );
        
        // Calculate the overall average
        const overallAverage = dayAverages.reduce((sum, avg) => sum + avg, 0) / 7;
        
        // Calculate seasonal indices
        const indices = dayAverages.map(avg => 
          overallAverage > 0 ? (avg / overallAverage) * 100 : 100
        );
        
        // Find strongest and weakest days
        let strongestDay = 0;
        let weakestDay = 0;
        for (let i = 1; i < 7; i++) {
          if (indices[i] > indices[strongestDay]) strongestDay = i;
          if (indices[i] < indices[weakestDay]) weakestDay = i;
        }
        
        // Detect if there's a clear pattern (some days are significantly different)
        const hasPattern = indices.some(idx => idx > 120 || idx < 80);
        
        if (hasPattern) {
          result.detected = true;
          result.pattern = 'weekly';
          result.strongestDay = strongestDay;
          result.weakestDay = weakestDay;
          result.indexes = indices;
        }
        
        break;
      }
      
      case 'monthly': {
        // Look for monthly patterns
        const monthTotals = Array(12).fill(0);
        const monthCounts = Array(12).fill(0);
        
        data.forEach(point => {
          try {
            if (point.date.includes('-')) {
              const month = parseInt(point.date.split('-')[1]) - 1; // 0-11
              if (month >= 0 && month < 12) {
                monthTotals[month] += point.value;
                monthCounts[month]++;
              }
            }
          } catch (e) {
            // Skip invalid formats
          }
        });
        
        // Calculate average per month
        const monthAverages = monthTotals.map((total, index) => 
          monthCounts[index] > 0 ? total / monthCounts[index] : 0
        );
        
        // Calculate the overall average
        const overallAverage = monthAverages.reduce((sum, avg) => sum + avg, 0) / 12;
        
        // Calculate seasonal indices
        const indices = monthAverages.map(avg => 
          overallAverage > 0 ? (avg / overallAverage) * 100 : 100
        );
        
        // Find strongest and weakest months
        let strongestMonth = 0;
        let weakestMonth = 0;
        for (let i = 1; i < 12; i++) {
          if (indices[i] > indices[strongestMonth]) strongestMonth = i;
          if (indices[i] < indices[weakestMonth]) weakestMonth = i;
        }
        
        // Detect if there's a clear pattern (some months are significantly different)
        const hasPattern = indices.some(idx => idx > 120 || idx < 80);
        
        if (hasPattern) {
          result.detected = true;
          result.pattern = 'monthly';
          result.strongestMonth = strongestMonth;
          result.weakestMonth = weakestMonth;
          result.indexes = indices;
        }
        
        break;
      }
      
      // Other resolutions (weekly, quarterly, yearly)
      default:
        // Not enough data or not looking for patterns at this resolution
        break;
    }
    
    return result;
  }
  
  /**
   * Determine overall trend based on growth rates
   */
  private determineTrend(
    growthRates: number[],
    hasSeasonality: boolean
  ): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (growthRates.length === 0) {
      return 'stable';
    }
    
    // Calculate what percentage of rates are positive
    const positiveRates = growthRates.filter(rate => rate > 0).length;
    const positivePercentage = (positiveRates / growthRates.length) * 100;
    
    // Calculate the standard deviation of rates
    const average = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const squaredDiffs = growthRates.map(rate => Math.pow(rate - average, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / growthRates.length;
    const stdDev = Math.sqrt(variance);
    
    // Check volatility first (high standard deviation)
    if (stdDev > 30) {
      return 'volatile';
    }
    
    // Then check direction based on percentage of positive growth rates
    if (positivePercentage >= (hasSeasonality ? 60 : 70)) {
      return 'increasing';
    } else if (positivePercentage <= (hasSeasonality ? 40 : 30)) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }
  
  /**
   * Generate a simple forecast for future periods
   */
  private generateSimpleForecast(
    data: RevenueDataPoint[],
    resolution: TimeResolution,
    periods: number
  ): RevenueDataPoint[] {
    if (data.length < 2) {
      return [];
    }
    
    // Calculate average growth rate
    const growthRates = this.calculateGrowthRates(data);
    const growthRate = growthRates.average / 100; // Convert percentage to decimal
    
    // Get the last date and value
    const lastPoint = data[data.length - 1];
    let lastDate = this.parseDate(lastPoint.date, resolution);
    let lastValue = lastPoint.value;
    
    const forecast: RevenueDataPoint[] = [];
    
    for (let i = 0; i < periods; i++) {
      // Move to next period
      const nextDate = this.advanceDate(lastDate, resolution);
      
      // Calculate forecast value with slight randomization for realism
      const randomFactor = 0.95 + (Math.random() * 0.1); // 0.95 to 1.05
      const projectedValue = lastValue * (1 + growthRate) * randomFactor;
      
      // Format the date for the data point
      const dateStr = this.formatDateByResolution(nextDate, resolution);
      
      // Add to forecast
      forecast.push({
        date: dateStr,
        value: projectedValue
      });
      
      // Update for next iteration
      lastDate = nextDate;
      lastValue = projectedValue;
    }
    
    return forecast;
  }
  
  /**
   * Parse a date string based on resolution
   */
  private parseDate(dateStr: string, resolution: TimeResolution): Date {
    const date = new Date();
    
    try {
      switch (resolution) {
        case 'hourly': {
          // Format: YYYY-MM-DD HH:00
          const [datePart, timePart] = dateStr.split(' ');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hour] = timePart.split(':').map(Number);
          
          date.setFullYear(year, month - 1, day);
          date.setHours(hour, 0, 0, 0);
          break;
        }
        case 'daily': {
          // Format: YYYY-MM-DD
          const [year, month, day] = dateStr.split('-').map(Number);
          date.setFullYear(year, month - 1, day);
          date.setHours(0, 0, 0, 0);
          break;
        }
        case 'weekly': {
          // Format: YYYY-MM-DD (week start)
          const [year, month, day] = dateStr.split('-').map(Number);
          date.setFullYear(year, month - 1, day);
          date.setHours(0, 0, 0, 0);
          break;
        }
        case 'monthly': {
          // Format: YYYY-MM
          const [year, month] = dateStr.split('-').map(Number);
          date.setFullYear(year, month - 1, 1);
          date.setHours(0, 0, 0, 0);
          break;
        }
        case 'quarterly': {
          // Format: YYYY-Q#
          const [year, quarter] = dateStr.split('-');
          const month = (parseInt(quarter.substring(1)) - 1) * 3;
          date.setFullYear(parseInt(year), month, 1);
          date.setHours(0, 0, 0, 0);
          break;
        }
        case 'yearly': {
          // Format: YYYY
          date.setFullYear(parseInt(dateStr), 0, 1);
          date.setHours(0, 0, 0, 0);
          break;
        }
      }
    } catch (e) {
      console.error('Error parsing date:', e);
      // Return current date as fallback
    }
    
    return date;
  }
  
  /**
   * Advance a date to the next period based on resolution
   */
  private advanceDate(date: Date, resolution: TimeResolution): Date {
    const result = new Date(date);
    
    switch (resolution) {
      case 'hourly':
        result.setHours(result.getHours() + 1);
        break;
      case 'daily':
        result.setDate(result.getDate() + 1);
        break;
      case 'weekly':
        result.setDate(result.getDate() + 7);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + 1);
        break;
      case 'quarterly':
        result.setMonth(result.getMonth() + 3);
        break;
      case 'yearly':
        result.setFullYear(result.getFullYear() + 1);
        break;
    }
    
    return result;
  }
  
  /**
   * Process aggregated data and generate final analysis
   */
  private finalizeAnalysis(
    aggregatedData: RevenueDataPoint[],
    resolution: TimeResolution,
    startDate: Date,
    endDate: Date,
    includeForecast: boolean
  ): RevenueTrendAnalysis {
    // Basic statistics
    const totalRevenue = aggregatedData.reduce((sum, point) => sum + point.value, 0);
    const averageRevenue = totalRevenue / aggregatedData.length;
    const medianRevenue = calculateMedian(aggregatedData.map(point => point.value));
    
    // Find min and max points
    const minPoint = this.findMinValue(aggregatedData);
    const maxPoint = this.findMaxValue(aggregatedData);
    
    // Calculate growth rates
    const growthRates = this.calculateGrowthRates(aggregatedData);
    
    // Analyze seasonal patterns
    const seasonality = this.analyzeSeasonal(aggregatedData, resolution);
    
    // Determine overall trend
    const trend = this.determineTrend(growthRates.periodic, seasonality.detected);
    
    // Generate forecast data if requested
    let forecastData = undefined;
    if (includeForecast) {
      forecastData = this.generateSimpleForecast(aggregatedData, resolution, 12); // 12 periods ahead
    }
    
    return {
      data: aggregatedData,
      total: totalRevenue,
      average: averageRevenue,
      median: medianRevenue,
      min: minPoint,
      max: maxPoint,
      growth: {
        overall: this.calculateOverallGrowth(aggregatedData),
        periodic: growthRates.periodic,
        averagePeriodic: growthRates.average
      },
      resolution,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      trend,
      seasonality,
      forecastData
    };
  }
} 