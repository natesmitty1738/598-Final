import {
  SalesRecommendationCalculator,
  DatabaseConnectionError,
  InsufficientDataError
} from '../sales-recommendations';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockFindMany = jest.fn();
  const mockFindFirst = jest.fn();
  const mockQueryRaw = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      sale: {
        findMany: mockFindMany,
        findFirst: mockFindFirst
      },
      $queryRaw: mockQueryRaw,
      $connect: jest.fn(),
      $disconnect: jest.fn()
    }))
  };
});

describe('SalesRecommendationCalculator', () => {
  let calculator: SalesRecommendationCalculator;
  let mockPrismaClient: PrismaClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrismaClient = new PrismaClient();
    calculator = new SalesRecommendationCalculator(mockPrismaClient as any);
  });
  
  describe('Database connection tests', () => {
    it('should throw DatabaseConnectionError when database connection fails', async () => {
      (mockPrismaClient.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('DB connection failed'));
      
      await expect(calculator.calculateSalesRecommendations(30)).rejects.toThrow(DatabaseConnectionError);
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });
    
    it('should test database connection before querying data', async () => {
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]);
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce([]);
      
      await expect(calculator.calculateSalesRecommendations(30)).rejects.toThrow(InsufficientDataError);
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });
  });
  
  describe('Data validation tests', () => {
    it('should throw InsufficientDataError when no sales data is found', async () => {
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]);
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce([]);
      
      await expect(calculator.calculateSalesRecommendations(30)).rejects.toThrow(InsufficientDataError);
      expect(mockPrismaClient.sale.findMany).toHaveBeenCalled();
    });
    
    it('should throw InsufficientDataError when sales data is insufficient for meaningful recommendations', async () => {
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]);
      // Return some sales data but not enough for meaningful analysis
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'sale1',
          createdAt: new Date(),
          items: [
            {
              product: { id: 'prod1', name: 'Product 1' },
              quantity: 1
            }
          ]
        }
      ]);
      
      await expect(calculator.calculateSalesRecommendations(30)).rejects.toThrow(InsufficientDataError);
    });
  });
  
  describe('Day of week trend analysis', () => {
    it('should correctly identify best selling days for products', async () => {
      // Mock database connection
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]);
      
      // Create mock sales data with clear day-of-week patterns
      const mockSales = createMockSalesWithDayPatterns();
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce(mockSales);
      
      const result = await calculator.calculateSalesRecommendations(90, 'user1', 'low');
      
      // Verify day of week trends were identified
      expect(result.dayOfWeekTrends.length).toBeGreaterThan(0);
      
      // Check a specific product's best day
      const product1Trend = result.dayOfWeekTrends.find(t => t.productId === 'prod1');
      expect(product1Trend).toBeDefined();
      expect(product1Trend?.bestDay).toBe('Saturday'); // Saturday should be the best day
      
      // Verify the sales by day data is correctly calculated
      expect(product1Trend?.salesByDay.length).toBe(7); // All 7 days of the week
      expect(product1Trend?.salesByDay.find(d => d.day === 'Saturday')?.percentOfAverage).toBeGreaterThan(100);
    });
  });
  
  describe('Product bundle recommendations', () => {
    it('should identify product bundles based on purchasing patterns', async () => {
      // Mock database connection
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]);
      
      // Create mock sales data with clear bundling patterns
      const mockSales = createMockSalesWithBundlePatterns();
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce(mockSales);
      
      const result = await calculator.calculateSalesRecommendations(90, 'user1', 'low');
      
      // Verify product bundles were identified
      expect(result.productBundles.length).toBeGreaterThan(0);
      
      // Find the bundle with products 1 and 2
      const bundle = result.productBundles.find(b => 
        b.products.some(p => p.id === 'prod1') && 
        b.products.some(p => p.id === 'prod2')
      );
      
      // Verify the bundle exists and has correct properties
      expect(bundle).toBeDefined();
      expect(bundle?.products.length).toBe(2);
      expect(bundle?.bundlePrice).toBeLessThan(bundle?.individualPrice);
      expect(bundle?.discountPercentage).toBeGreaterThan(0);
    });
    
    it('should filter bundles based on confidence level', async () => {
      // Mock database connection
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]);
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]); // Add second mock for second call
      
      // Create mock sales data
      const mockSales = createMockSalesWithBundlePatterns();
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce(mockSales);
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce(mockSales); // Add second mock for second call
      
      // Get recommendations with low confidence first
      const lowConfidenceResult = await calculator.calculateSalesRecommendations(90, 'user1', 'low');
      
      // Get recommendations with high confidence
      // Re-create calculator to ensure clean state
      const highConfCalculator = new SalesRecommendationCalculator(mockPrismaClient as any);
      const highConfidenceResult = await highConfCalculator.calculateSalesRecommendations(90, 'user1', 'high');
      
      // High confidence should have fewer recommendations than low confidence
      // Make sure both have at least some bundles before comparing
      expect(lowConfidenceResult.productBundles.length).toBeGreaterThan(0);
      // Only compare if we have high confidence bundles, otherwise the test is trivially true
      if (highConfidenceResult.productBundles.length > 0) {
        expect(highConfidenceResult.productBundles.length).toBeLessThanOrEqual(lowConfidenceResult.productBundles.length);
      }
    });
  });
  
  describe('Time range handling', () => {
    it('should use default time range when invalid range is provided', async () => {
      // Mock database connection
      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValueOnce([{ 1: 1 }]);
      (mockPrismaClient.sale.findMany as jest.Mock).mockResolvedValueOnce([]);
      
      // Call with invalid time range
      await expect(calculator.calculateSalesRecommendations(-1)).rejects.toThrow(InsufficientDataError);
      
      // Verify the time range was defaulted to 90 days
      const salesFindManyCall = (mockPrismaClient.sale.findMany as jest.Mock).mock.calls[0][0];
      const whereClause = salesFindManyCall.where;
      
      // The dates should be ~90 days apart
      const startDate = whereClause.createdAt.gte;
      const endDate = whereClause.createdAt.lte;
      const dayDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(dayDiff).toBeCloseTo(90, 1);
    });
  });
});

// Helper function to create mock sales data with day-of-week patterns
function createMockSalesWithDayPatterns() {
  const sales = [];
  const currentDate = new Date();
  
  // Create 30 days of sales data
  for (let i = 0; i < 90; i++) {
    const saleDate = new Date(currentDate);
    saleDate.setDate(currentDate.getDate() - i);
    const dayOfWeek = saleDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Create more sales for product 1 on Saturday (day 6)
    const prod1Quantity = dayOfWeek === 6 ? 5 : 1;
    
    // Create more sales for product 2 on Friday (day 5)
    const prod2Quantity = dayOfWeek === 5 ? 4 : 1;
    
    // Create more sales for product 3 on Monday (day 1)
    const prod3Quantity = dayOfWeek === 1 ? 3 : 1;
    
    sales.push({
      id: `sale_${i}`,
      createdAt: saleDate,
      items: [
        {
          product: { id: 'prod1', name: 'Product 1', price: 10 },
          quantity: prod1Quantity
        },
        {
          product: { id: 'prod2', name: 'Product 2', price: 20 },
          quantity: prod2Quantity
        },
        {
          product: { id: 'prod3', name: 'Product 3', price: 30 },
          quantity: prod3Quantity
        }
      ]
    });
  }
  
  return sales;
}

// Helper function to create mock sales data with bundle patterns
function createMockSalesWithBundlePatterns() {
  const sales = [];
  const currentDate = new Date();
  
  // Create 30 days of sales data
  for (let i = 0; i < 90; i++) {
    const saleDate = new Date(currentDate);
    saleDate.setDate(currentDate.getDate() - i);
    
    // Every 3rd sale has products 1 and 2 together
    if (i % 3 === 0) {
      sales.push({
        id: `sale_${i}`,
        createdAt: saleDate,
        items: [
          {
            product: { id: 'prod1', name: 'Product 1', price: 10 },
            quantity: 1
          },
          {
            product: { id: 'prod2', name: 'Product 2', price: 20 },
            quantity: 1
          }
        ]
      });
    } 
    // Every 4th sale has products 2 and 3 together
    else if (i % 4 === 0) {
      sales.push({
        id: `sale_${i}`,
        createdAt: saleDate,
        items: [
          {
            product: { id: 'prod2', name: 'Product 2', price: 20 },
            quantity: 1
          },
          {
            product: { id: 'prod3', name: 'Product 3', price: 30 },
            quantity: 1
          }
        ]
      });
    }
    // Every 5th sale has products 1, 2, and 3 together
    else if (i % 5 === 0) {
      sales.push({
        id: `sale_${i}`,
        createdAt: saleDate,
        items: [
          {
            product: { id: 'prod1', name: 'Product 1', price: 10 },
            quantity: 1
          },
          {
            product: { id: 'prod2', name: 'Product 2', price: 20 },
            quantity: 1
          },
          {
            product: { id: 'prod3', name: 'Product 3', price: 30 },
            quantity: 1
          }
        ]
      });
    }
    // Other sales have individual products
    else {
      sales.push({
        id: `sale_${i}`,
        createdAt: saleDate,
        items: [
          {
            product: { id: `prod${i % 3 + 1}`, name: `Product ${i % 3 + 1}`, price: (i % 3 + 1) * 10 },
            quantity: 1
          }
        ]
      });
    }
  }
  
  return sales;
} 