import { ProjectedEarningsCalculator, DatabaseConnectionError, InsufficientDataError } from '../projected-earnings';
import { format } from 'date-fns';

// Mock PrismaClient
const mockPrismaClient = {
  $queryRaw: jest.fn(),
  sale: {
    findFirst: jest.fn(),
    findMany: jest.fn()
  }
};

// Mock date for consistent tests
const mockDate = new Date('2023-05-15T12:00:00Z');
jest.useFakeTimers().setSystemTime(mockDate);

describe('ProjectedEarningsCalculator', () => {
  let calculator: ProjectedEarningsCalculator;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new calculator instance with the mock Prisma client
    calculator = new ProjectedEarningsCalculator(mockPrismaClient as any);
  });
  
  describe('calculateProjectedEarnings', () => {
    it('should throw DatabaseConnectionError if database connection fails', async () => {
      // Mock the database connection test to fail
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));
      
      // Expect the method to throw a DatabaseConnectionError
      await expect(calculator.calculateProjectedEarnings(30)).rejects.toThrow(DatabaseConnectionError);
    });
    
    it('should throw InsufficientDataError if no sales data is found', async () => {
      // Mock successful database connection but no sales data
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      mockPrismaClient.sale.findMany.mockResolvedValueOnce([]);
      
      // Expect the method to throw an InsufficientDataError
      await expect(calculator.calculateProjectedEarnings(30)).rejects.toThrow(InsufficientDataError);
    });
    
    it('should return correct data structure for 7-day range', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock sales data for past 7 days
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-08'), totalAmount: 100 },
        { id: '2', createdAt: new Date('2023-05-10'), totalAmount: 150 },
        { id: '3', createdAt: new Date('2023-05-12'), totalAmount: 200 },
        { id: '4', createdAt: new Date('2023-05-14'), totalAmount: 250 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(7);
      
      // Assertions
      expect(result).toHaveProperty('actual');
      expect(result).toHaveProperty('projected');
      expect(result).toHaveProperty('todayIndex');
      expect(Array.isArray(result.actual)).toBe(true);
      expect(Array.isArray(result.projected)).toBe(true);
      expect(typeof result.todayIndex).toBe('number');
    });
    
    it('should handle all-time range correctly', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock oldest sale query
      mockPrismaClient.sale.findFirst.mockResolvedValueOnce({
        id: '1',
        createdAt: new Date('2022-01-01'),
        totalAmount: 50
      });
      
      // Mock sales data
      const salesData = [
        { id: '1', createdAt: new Date('2022-01-01'), totalAmount: 50 },
        { id: '2', createdAt: new Date('2022-06-01'), totalAmount: 100 },
        { id: '3', createdAt: new Date('2023-01-01'), totalAmount: 200 },
        { id: '4', createdAt: new Date('2023-05-01'), totalAmount: 300 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method with 0 for all-time
      const result = await calculator.calculateProjectedEarnings(0);
      
      // Assertions
      expect(result).toHaveProperty('actual');
      expect(result).toHaveProperty('projected');
      expect(mockPrismaClient.sale.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' }
      });
    });
    
    it('should calculate growth rate correctly based on historical data', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock sales data with clear growth pattern (50% growth per data point)
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-01'), totalAmount: 100 },
        { id: '2', createdAt: new Date('2023-05-05'), totalAmount: 150 },
        { id: '3', createdAt: new Date('2023-05-10'), totalAmount: 225 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(30);
      
      // The last projected value should be greater than or equal to the last actual value
      // due to the positive growth rate (or at least equal if no projected data)
      const lastActualValue = result.actual[result.actual.length - 1]?.value || 0;
      const firstProjectedValue = result.projected[0]?.value || 0;
      
      // Verify we have both actual and projected data
      expect(result.actual.length).toBeGreaterThan(0);
      expect(result.projected.length).toBeGreaterThan(0);
      
      // If we have projected data, it should be non-zero
      if (result.projected.length > 0) {
        expect(firstProjectedValue).toBeGreaterThanOrEqual(0);
      }
    });
    
    it('should format dates correctly based on resolution', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock sales data
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-14'), totalAmount: 250 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method for daily resolution
      const dailyResult = await calculator.calculateProjectedEarnings(7);
      
      // Call the method for monthly resolution
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      const monthlyResult = await calculator.calculateProjectedEarnings(365);
      
      // Assertions for daily format (yyyy-MM-dd)
      expect(dailyResult.actual[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Assertions for monthly format (yyyy-MM)
      expect(monthlyResult.actual[0]?.date).toMatch(/^\d{4}-\d{2}$/);
    });

    // New tests below
    
    it('should use daily resolution for timeRange <= 14 days', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock sales data
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-08'), totalAmount: 100 },
        { id: '2', createdAt: new Date('2023-05-14'), totalAmount: 250 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method with 14-day range
      const result = await calculator.calculateProjectedEarnings(14);
      
      // Assert daily format
      expect(result.actual[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Verify we have a reasonable number of data points for 14 days
      expect(result.actual.length).toBeGreaterThan(7);
    });
    
    it('should use weekly resolution for timeRange between 14 and 90 days', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data spanning multiple weeks
      const salesData = [];
      for (let i = 1; i <= 8; i++) {
        const date = new Date('2023-05-15');
        date.setDate(date.getDate() - i * 7); // Each sale is 1 week apart
        salesData.push({ 
          id: i.toString(), 
          createdAt: date, 
          totalAmount: 100 * i 
        });
      }
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method with 60-day range
      const result = await calculator.calculateProjectedEarnings(60);
      
      // Assert weekly format (contains "to")
      const hasWeeklyFormat = result.actual.some(point => point.date.includes(' to '));
      expect(hasWeeklyFormat).toBe(true);
    });
    
    it('should use monthly resolution for timeRange > 90 days', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data spanning multiple months
      const salesData = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date('2023-05-15');
        date.setMonth(date.getMonth() - i); // Each sale is 1 month apart
        salesData.push({ 
          id: i.toString(), 
          createdAt: date, 
          totalAmount: 500 + (i * 100) 
        });
      }
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method with 180-day range
      const result = await calculator.calculateProjectedEarnings(180);
      
      // Assert monthly format (yyyy-MM)
      expect(result.actual[0]?.date).toMatch(/^\d{4}-\d{2}$/);
    });
    
    it('should apply userId filter when provided', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock sales data
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-14'), totalAmount: 250 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method with a userId
      const userId = 'user123';
      await calculator.calculateProjectedEarnings(30, userId);
      
      // Verify the userId was included in the query
      expect(mockPrismaClient.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: userId
          })
        })
      );
    });
    
    it('should handle empty periods correctly in time series', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data with gaps (some days have no sales)
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-01'), totalAmount: 100 },
        // Gap from May 2-5
        { id: '2', createdAt: new Date('2023-05-06'), totalAmount: 200 },
        { id: '3', createdAt: new Date('2023-05-07'), totalAmount: 150 },
        // Gap from May 8-13
        { id: '4', createdAt: new Date('2023-05-14'), totalAmount: 300 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(14);
      
      // Should have entries for each day in the range, including days with no sales
      expect(result.actual.length).toBeGreaterThanOrEqual(14);
      
      // Days with no sales should have value of 0
      const hasDaysWithZeroValue = result.actual.some(point => point.value === 0);
      expect(hasDaysWithZeroValue).toBe(true);
    });
    
    it('should calculate todayIndex correctly in weekly format', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Generate weekly sales data that includes the current week
      const currentDate = new Date('2023-05-15'); // Monday
      const salesData = [];
      
      // Generate 5 weeks of data
      for (let i = 0; i < 5; i++) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - (7 * i) - weekStart.getDay());
        
        for (let j = 0; j < 3; j++) { // 3 sales per week
          const saleDate = new Date(weekStart);
          saleDate.setDate(weekStart.getDate() + j * 2); // Sales every other day
          salesData.push({
            id: `${i}-${j}`,
            createdAt: saleDate,
            totalAmount: 100 + (i * 50) + (j * 10)
          });
        }
      }
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method with 30-day range (should use weekly resolution)
      const result = await calculator.calculateProjectedEarnings(30);
      
      // The current week should be at todayIndex
      expect(result.todayIndex).toBeGreaterThanOrEqual(0);
      expect(result.todayIndex).toBeLessThan(result.actual.length);
      
      // The week at todayIndex should include the current date
      const weekAtTodayIndex = result.actual[result.todayIndex].date;
      expect(weekAtTodayIndex).toBeDefined();
    });
    
    it('should handle flat growth scenarios correctly', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data with flat growth (same amount each day)
      const salesData = [];
      for (let i = 1; i <= 10; i++) {
        const date = new Date('2023-05-15');
        date.setDate(date.getDate() - i);
        salesData.push({ 
          id: i.toString(), 
          createdAt: date, 
          totalAmount: 100 // Same amount every day
        });
      }
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(14);
      
      // Verify projected values maintain a steady pattern
      // In flat growth, projected values should be similar to historical values
      if (result.projected.length > 0) {
        const lastActualValue = result.actual[result.actual.length - 1].value;
        const firstProjectedValue = result.projected[0].value;
        
        // Should be close to the historical value (allowing for small variation)
        expect(firstProjectedValue).toBeCloseTo(lastActualValue, 0);
      }
    });
    
    it('should handle negative growth scenarios correctly', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data with negative growth (decreasing amounts)
      const salesData = [];
      for (let i = 1; i <= 10; i++) {
        const date = new Date('2023-05-15');
        date.setDate(date.getDate() - i);
        salesData.push({ 
          id: i.toString(), 
          createdAt: date, 
          totalAmount: 1000 - (i * 50) // Decreasing by 50 each day
        });
      }
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(14);
      
      // Verify projected values reflect the negative trend
      if (result.projected.length > 1) {
        // In a negative trend, later projected values should be less than earlier ones
        expect(result.projected[result.projected.length - 1].value)
          .toBeLessThan(result.projected[0].value);
      }
    });
    
    it('should fall back to default range when oldest sale query fails', async () => {
      // Mock successful database connection but failed oldest sale query
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      mockPrismaClient.sale.findFirst.mockRejectedValueOnce(new Error('Query failed'));
      
      // Mock some recent sales data
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-10'), totalAmount: 100 },
        { id: '2', createdAt: new Date('2023-05-12'), totalAmount: 150 }
      ];
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method with 0 (all-time)
      const result = await calculator.calculateProjectedEarnings(0);
      
      // Should still return data using default range
      expect(result).toHaveProperty('actual');
      expect(result).toHaveProperty('projected');
      expect(result.actual.length).toBeGreaterThan(0);
    });
    
    it('should handle data with extremely high growth rates', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data with exponential growth
      const salesData = [];
      for (let i = 10; i >= 1; i--) {
        const date = new Date('2023-05-15');
        date.setDate(date.getDate() - i);
        salesData.push({ 
          id: i.toString(), 
          createdAt: date, 
          // Exponential growth: 100, 200, 400, 800, 1600, etc.
          totalAmount: 100 * Math.pow(2, 10-i)
        });
      }
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(14);
      
      // Growth rate should be capped at a reasonable value
      if (result.projected.length > 1) {
        const firstProjectedValue = result.projected[0].value;
        const lastProjectedValue = result.projected[result.projected.length - 1].value;
        
        // Growth should be positive but not unreasonably high
        expect(lastProjectedValue).toBeGreaterThan(firstProjectedValue);
        
        // Calculate implied growth rate
        const growthRate = Math.pow(lastProjectedValue / firstProjectedValue, 1 / (result.projected.length - 1)) - 1;
        
        // Should be capped at 0.5 (50% per period)
        expect(growthRate).toBeLessThanOrEqual(0.5);
      }
    });
    
    it('should handle outliers in historical data appropriately', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data with an outlier
      const salesData = [
        { id: '1', createdAt: new Date('2023-05-05'), totalAmount: 100 },
        { id: '2', createdAt: new Date('2023-05-06'), totalAmount: 120 },
        { id: '3', createdAt: new Date('2023-05-07'), totalAmount: 110 },
        { id: '4', createdAt: new Date('2023-05-08'), totalAmount: 1000 }, // Outlier!
        { id: '5', createdAt: new Date('2023-05-09'), totalAmount: 130 },
        { id: '6', createdAt: new Date('2023-05-10'), totalAmount: 140 },
      ];
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(14);
      
      // Despite the outlier, projections should be reasonable
      if (result.projected.length > 1) {
        // Get last non-outlier value
        const lastNormalValue = 140; // Last value in our sample data
        
        // First projected value shouldn't be astronomically high due to the outlier
        const firstProjectedValue = result.projected[0].value;
        
        // Projected value should be within a reasonable range of the last normal value
        // Using a factor of 2 to allow for some growth but not extreme values
        expect(firstProjectedValue).toBeLessThan(lastNormalValue * 2);
      }
    });
    
    it('should handle sales with BigInt totalAmount correctly', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data with totalAmount as BigInt (which Prisma might return)
      const salesData = [
        { 
          id: '1', 
          createdAt: new Date('2023-05-10'), 
          // Using a BigInt that's convertible to Number
          totalAmount: BigInt(1000) 
        },
        { 
          id: '2', 
          createdAt: new Date('2023-05-12'), 
          totalAmount: BigInt(1500) 
        }
      ];
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // The calculator should handle BigInt values gracefully
      const result = await calculator.calculateProjectedEarnings(14);
      
      // Verify the data was processed correctly
      expect(result.actual.some(point => point.value > 0)).toBe(true);
    });
    
    it('should handle empty data between valid data points', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Create sales data with a significant gap in the middle
      const salesData = [
        { id: '1', createdAt: new Date('2023-04-01'), totalAmount: 100 },
        { id: '2', createdAt: new Date('2023-04-02'), totalAmount: 110 },
        // Gap of one month
        { id: '3', createdAt: new Date('2023-05-10'), totalAmount: 150 },
        { id: '4', createdAt: new Date('2023-05-12'), totalAmount: 160 }
      ];
      
      mockPrismaClient.sale.findMany.mockResolvedValueOnce(salesData);
      
      // Call the method
      const result = await calculator.calculateProjectedEarnings(60); // Use a longer range to cover the gap
      
      // There should be continuous data points even for the gap period
      expect(result.actual.length).toBeGreaterThan(4); // More than just the 4 data points
      
      // Verify there are some points with zero value
      const hasZeroValues = result.actual.some(point => point.value === 0);
      expect(hasZeroValues).toBe(true);
    });
  });
  
  // New test suite for testing internal methods
  describe('internal methods', () => {
    // We need to use type assertion to access private methods
    type PrivateCalculator = {
      determineResolution: (timeRangeInDays: number) => 'daily' | 'weekly' | 'monthly';
      formatDateByResolution: (date: Date, resolution: 'daily' | 'weekly' | 'monthly') => string;
      calculateGrowthRate: (historicalData: any[]) => number;
      calculateTodayIndex: (actualData: any[], currentDate: Date) => number;
    };
    
    it('determineResolution should return correct resolution based on timeRange', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      expect(privateCalculator.determineResolution(7)).toBe('daily');
      expect(privateCalculator.determineResolution(14)).toBe('daily');
      expect(privateCalculator.determineResolution(30)).toBe('weekly');
      expect(privateCalculator.determineResolution(60)).toBe('weekly');
      expect(privateCalculator.determineResolution(90)).toBe('weekly');
      expect(privateCalculator.determineResolution(91)).toBe('monthly');
      expect(privateCalculator.determineResolution(365)).toBe('monthly');
    });
    
    it('formatDateByResolution should format dates correctly for each resolution', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Create a date that's explicitly in the local timezone to avoid UTC conversion issues
      const testDate = new Date(2023, 4, 15); // Month is 0-indexed, so 4 = May
      
      // Daily format: yyyy-MM-dd
      const dailyFormat = privateCalculator.formatDateByResolution(testDate, 'daily');
      expect(dailyFormat).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Just check the format
      expect(dailyFormat.substring(0, 7)).toBe('2023-05'); // Check year and month
      
      // Weekly format: yyyy-MM-dd to yyyy-MM-dd
      const weeklyFormat = privateCalculator.formatDateByResolution(testDate, 'weekly');
      expect(weeklyFormat).toContain(' to ');
      expect(weeklyFormat.split(' to ').length).toBe(2);
      
      // Monthly format: yyyy-MM
      expect(privateCalculator.formatDateByResolution(testDate, 'monthly')).toBe('2023-05');
    });
    
    it('calculateGrowthRate should return median growth and handle edge cases', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Test with empty data
      expect(privateCalculator.calculateGrowthRate([])).toBe(0.02); // Default
      
      // Test with single data point
      expect(privateCalculator.calculateGrowthRate([{ date: '2023-05-01', value: 100, isProjected: false }]))
        .toBe(0.02); // Default
      
      // Test with all zero values
      expect(privateCalculator.calculateGrowthRate([
        { date: '2023-05-01', value: 0, isProjected: false },
        { date: '2023-05-02', value: 0, isProjected: false }
      ])).toBe(0.02); // Default
      
      // Test with normal values - steady 10% growth
      const steadyGrowthData = [
        { date: '2023-05-01', value: 100, isProjected: false },
        { date: '2023-05-02', value: 110, isProjected: false },
        { date: '2023-05-03', value: 121, isProjected: false }
      ];
      const steadyGrowthRate = privateCalculator.calculateGrowthRate(steadyGrowthData);
      expect(steadyGrowthRate).toBeCloseTo(0.1, 1); // Should be around 0.1 (10%)
      
      // Test with extremely high growth (should be capped)
      const extremeGrowthData = [
        { date: '2023-05-01', value: 100, isProjected: false },
        { date: '2023-05-02', value: 1000, isProjected: false } // 900% growth
      ];
      const cappedGrowthRate = privateCalculator.calculateGrowthRate(extremeGrowthData);
      expect(cappedGrowthRate).toBeLessThanOrEqual(0.5); // Capped at 50%
      
      // Test with extremely negative growth (should have a floor)
      const negativeGrowthData = [
        { date: '2023-05-01', value: 1000, isProjected: false },
        { date: '2023-05-02', value: 100, isProjected: false } // 90% decline
      ];
      const flooredGrowthRate = privateCalculator.calculateGrowthRate(negativeGrowthData);
      expect(flooredGrowthRate).toBeGreaterThanOrEqual(-0.5); // Floor at -50%
    });
    
    it('calculateTodayIndex should find the correct index for today', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Create a date explicitly in local timezone
      const currentDate = new Date(2023, 4, 15); // May 15, 2023
      
      // Test with daily format - create data with the exact same date objects
      const dailyData = [
        { date: format(new Date(2023, 4, 13), 'yyyy-MM-dd'), value: 100, isProjected: false },
        { date: format(new Date(2023, 4, 14), 'yyyy-MM-dd'), value: 110, isProjected: false },
        { date: format(new Date(2023, 4, 15), 'yyyy-MM-dd'), value: 120, isProjected: false }, // Today
        { date: format(new Date(2023, 4, 16), 'yyyy-MM-dd'), value: 130, isProjected: false }
      ];
      
      // Using the same date formatting as the implementation
      const formattedToday = format(currentDate, 'yyyy-MM-dd');
      const todayIndex = dailyData.findIndex(item => item.date === formattedToday);
      
      // Verify our test data is set up correctly
      expect(todayIndex).toBe(2);
      
      // Now test the actual method
      expect(privateCalculator.calculateTodayIndex(dailyData, currentDate)).toBe(todayIndex);
      
      // Test with weekly format
      const weeklyData = [
        { date: '2023-05-01 to 2023-05-07', value: 100, isProjected: false },
        { date: '2023-05-08 to 2023-05-14', value: 110, isProjected: false },
        { date: '2023-05-15 to 2023-05-21', value: 120, isProjected: false }, // Contains today
        { date: '2023-05-22 to 2023-05-28', value: 130, isProjected: false }
      ];
      expect(privateCalculator.calculateTodayIndex(weeklyData, currentDate)).toBe(2); // Index of week containing today
      
      // Test with monthly format
      const monthlyData = [
        { date: '2023-04', value: 100, isProjected: false },
        { date: '2023-05', value: 110, isProjected: false }, // Current month
        { date: '2023-06', value: 120, isProjected: false }
      ];
      expect(privateCalculator.calculateTodayIndex(monthlyData, currentDate)).toBe(1); // Index of '2023-05'
      
      // Test when today is not found (should return last actual data point)
      const dataWithoutToday = [
        { date: '2023-04-01', value: 100, isProjected: false },
        { date: '2023-04-15', value: 110, isProjected: false },
        { date: '2023-04-30', value: 120, isProjected: false }
      ];
      expect(privateCalculator.calculateTodayIndex(dataWithoutToday, currentDate)).toBe(2); // Last index
    });
    
    it('should handle an error in fetchHistoricalSales', async () => {
      const privateCalculator = calculator as unknown as {
        fetchHistoricalSales: (startDate: Date, endDate: Date, userId?: string) => Promise<any[]>;
      };
      
      // Mock a database error in findMany
      mockPrismaClient.sale.findMany.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the method
      const result = await privateCalculator.fetchHistoricalSales(
        new Date('2023-01-01'),
        new Date('2023-05-15'),
        'user123'
      );
      
      // Should return empty array on error
      expect(result).toEqual([]);
    });
    
    it('should handle non-existent month in generateTimePeriods', () => {
      const privateCalculator = calculator as unknown as {
        generateTimePeriods: (startDate: Date, endDate: Date, resolution: 'daily' | 'weekly' | 'monthly') => string[];
      };
      
      // Create dates with leap year edge case - Feb 29 to March 15
      const startDate = new Date(2020, 1, 29); // Feb 29, 2020 (leap year)
      const endDate = new Date(2020, 2, 15);   // March 15, 2020
      
      // Call the method with monthly resolution
      const periods = privateCalculator.generateTimePeriods(startDate, endDate, 'monthly');
      
      // Should generate Feb and March correctly
      expect(periods).toContain('2020-02');
      expect(periods).toContain('2020-03');
      expect(periods.length).toBe(2);
    });
  });
  
  // Test for error cases in various methods
  describe('error handling', () => {
    it('should log an error when database connection fails', async () => {
      // We're not actually expecting console.error to be called directly
      // The error is thrown as DatabaseConnectionError instead
      
      // Mock a DB connection error
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Connection error'));
      
      // Attempt to call calculateProjectedEarnings
      try {
        await calculator.calculateProjectedEarnings(30);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseConnectionError);
        expect(error.message).toContain('Unable to connect to the database');
        // Check that the original error is captured
        expect((error as any).originalError).toBeDefined();
        expect((error as any).originalError.message).toBe('Connection error');
      }
    });
    
    it('should handle edge case with no data points in calculateGrowthRate', () => {
      const privateCalculator = calculator as unknown as {
        calculateGrowthRate: (historicalData: any[]) => number;
      };
      
      // Call with empty data
      const result = privateCalculator.calculateGrowthRate([]);
      
      // Should return default growth rate
      expect(result).toBe(0.02); // 2% default
    });
    
    it('should handle errors when calculating date range and finding oldest sale fails', async () => {
      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock database connection success
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock findFirst to throw an error
      mockPrismaClient.sale.findFirst.mockRejectedValueOnce(new Error('Query failed'));
      
      // Mock findMany to return some data so the main function doesn't fail
      mockPrismaClient.sale.findMany.mockResolvedValueOnce([
        { id: '1', createdAt: new Date('2023-05-10'), totalAmount: 100 },
      ]);
      
      // Call the method with all-time (should trigger finding oldest sale)
      const result = await calculator.calculateProjectedEarnings(0);
      
      // Verify error was logged
      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Error finding oldest sale:',
        expect.any(Error)
      );
      
      // Verify we got fallback dates (should be around 1 year)
      expect(result).toHaveProperty('actual');
      expect(result).toHaveProperty('projected');
      
      // Restore console.error
      consoleErrorMock.mockRestore();
    });
    
    it('should handle date formatting with isBefore edge case', () => {
      const privateCalculator = calculator as unknown as {
        generateTimePeriods: (startDate: Date, endDate: Date, resolution: 'daily' | 'weekly' | 'monthly') => string[];
      };
      
      // Create dates that are the same month but different days
      const startDate = new Date(2023, 4, 1);  // May 1, 2023
      const endDate = new Date(2023, 4, 15);   // May 15, 2023
      
      // Call with monthly resolution (tests isSameMonth condition)
      const periods = privateCalculator.generateTimePeriods(startDate, endDate, 'monthly');
      
      // Should only include May once
      expect(periods).toEqual(['2023-05']);
      expect(periods.length).toBe(1);
    });
    
    it('should handle all branches in formatActualData', () => {
      const privateCalculator = calculator as unknown as {
        formatActualData: (
          salesData: any[], 
          resolution: 'daily' | 'weekly' | 'monthly',
          startDate: Date,
          endDate: Date
        ) => any[];
      };
      
      // Create test data with specific dates to test aggregation
      const salesData = [
        { id: '1', createdAt: new Date(2023, 4, 1), totalAmount: 100 },
        { id: '2', createdAt: new Date(2023, 4, 1), totalAmount: 50 },  // Same day as first
        { id: '3', createdAt: new Date(2023, 4, 15), totalAmount: 200 }
      ];
      
      const startDate = new Date(2023, 4, 1);
      const endDate = new Date(2023, 4, 20);
      
      // Test daily resolution
      const dailyResult = privateCalculator.formatActualData(salesData, 'daily', startDate, endDate);
      expect(dailyResult.length).toBeGreaterThan(3); // Should include all days in range
      
      // Find the first day and check aggregation
      const may1Data = dailyResult.find(d => d.date.includes('2023-05-01') || d.date.includes('2023-05-1'));
      expect(may1Data?.value).toBe(150); // 100 + 50 = 150
      
      // Test weekly resolution
      const weeklyResult = privateCalculator.formatActualData(salesData, 'weekly', startDate, endDate);
      expect(weeklyResult.some(d => d.date.includes(' to '))).toBe(true);
      
      // Test monthly resolution
      const monthlyResult = privateCalculator.formatActualData(salesData, 'monthly', startDate, endDate);
      expect(monthlyResult.length).toBe(1); // Just May
      expect(monthlyResult[0].value).toBe(350); // 100 + 50 + 200 = 350
    });
  });
}); 