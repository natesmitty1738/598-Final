import { 
  PriceRecommendationCalculator, 
  DatabaseConnectionError, 
  InsufficientDataError,
  PriceRecommendation,
  RevenueProjection
} from '../price-recommendations';

// Mock product data with realistic sales patterns
const mockProducts = [
  {
    id: 'product1',
    name: 'Premium T-Shirt',
    price: 25.99,
    saleItems: [
      // Different price points to test elasticity
      { price: 24.99, quantity: 10, sale: { date: '2023-05-01' } },
      { price: 24.99, quantity: 8, sale: { date: '2023-05-03' } },
      { price: 27.99, quantity: 5, sale: { date: '2023-05-10' } },
      { price: 27.99, quantity: 4, sale: { date: '2023-05-15' } },
      { price: 21.99, quantity: 15, sale: { date: '2023-05-20' } }, // Low price, high volume
      { price: 21.99, quantity: 12, sale: { date: '2023-05-25' } }
    ]
  },
  {
    id: 'product2',
    name: 'Basic Hoodie',
    price: 39.99,
    saleItems: [
      { price: 39.99, quantity: 3, sale: { date: '2023-05-02' } },
      { price: 39.99, quantity: 2, sale: { date: '2023-05-12' } }
    ]
  },
  {
    id: 'product3',
    name: 'Designer Jeans',
    price: 59.99,
    saleItems: [
      { price: 59.99, quantity: 12, sale: { date: '2023-05-01' } },
      { price: 59.99, quantity: 10, sale: { date: '2023-05-05' } },
      { price: 49.99, quantity: 8, sale: { date: '2023-05-15' } }, // Same product at discount
      { price: 69.99, quantity: 6, sale: { date: '2023-05-20' } }  // Premium pricing
    ]
  },
  {
    id: 'product4',
    name: 'No Sales Product',
    price: 19.99,
    saleItems: []
  }
];

// Mock PrismaClient
const mockPrismaClient = {
  $queryRaw: jest.fn().mockResolvedValue([{ count: 10 }]),
  product: {
    findMany: jest.fn().mockResolvedValue(mockProducts),
    count: jest.fn().mockResolvedValue(mockProducts.length)
  },
  sale: {
    count: jest.fn().mockResolvedValue(10)
  },
  saleItem: {
    count: jest.fn().mockResolvedValue(50)
  }
};

// Mock date for consistent tests
const mockDate = new Date('2023-05-15T12:00:00Z');
jest.useFakeTimers().setSystemTime(mockDate);

describe('PriceRecommendationCalculator', () => {
  let calculator: PriceRecommendationCalculator;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new calculator instance with the mock Prisma client
    calculator = new PriceRecommendationCalculator(mockPrismaClient as any);
  });
  
  describe('calculatePriceRecommendations', () => {
    it('should throw DatabaseConnectionError if database connection fails', async () => {
      // Mock the database connection test to fail
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));
      
      // Expect the method to throw a DatabaseConnectionError
      await expect(calculator.calculatePriceRecommendations(30)).rejects.toThrow(DatabaseConnectionError);
    });
    
    it('should return empty recommendations when no products with sales are found', async () => {
      // Mock successful database connection but no products data
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      mockPrismaClient.product.findMany.mockResolvedValueOnce([]);
      
      // Call the method
      const result = await calculator.calculatePriceRecommendations(30);
      
      // Expect empty results rather than an error
      expect(result.recommendations).toEqual([]);
      expect(result.revenueProjections).toEqual([]);
    });
    
    it('should return correct data structure for recommendations', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock product sales data with correct property names
      const mockProducts = [
        {
          id: 'p1',
          name: 'Product 1',
          price: 100,
          saleItems: [
            { quantity: 15, price: 100, sale: { createdAt: new Date('2023-05-10') } },
            { quantity: 13, price: 110, sale: { createdAt: new Date('2023-05-12') } }
          ]
        },
        {
          id: 'p2',
          name: 'Product 2',
          price: 50,
          saleItems: [
            { quantity: 20, price: 50, sale: { createdAt: new Date('2023-05-08') } },
            { quantity: 25, price: 45, sale: { createdAt: new Date('2023-05-09') } }
          ]
        }
      ];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Call the method
      const result = await calculator.calculatePriceRecommendations(30);
      
      // Assertions
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('revenueProjections');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.revenueProjections)).toBe(true);
    });
    
    it('should filter recommendations based on confidence threshold', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock product sales data - one with high sales volume, one with low
      const mockProducts = [
        {
          id: 'p1',
          name: 'High Volume Product',
          price: 100,
          saleItems: Array(50).fill(null).map(() => ({ 
            quantity: 1, 
            price: 110, 
            sale: { createdAt: new Date('2023-05-10') } 
          }))
        },
        {
          id: 'p2',
          name: 'Low Volume Product',
          price: 50,
          saleItems: Array(6).fill(null).map(() => ({ 
            quantity: 1, 
            price: 45, 
            sale: { createdAt: new Date('2023-05-09') } 
          }))
        }
      ];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Call with high confidence threshold
      const highConfidenceResult = await calculator.calculatePriceRecommendations(
        30, undefined, 'high'
      );
      
      // Should only include the high volume product
      const highConfidenceProductIds = highConfidenceResult.recommendations.map(r => r.productId);
      expect(highConfidenceProductIds).toContain('p1');
      expect(highConfidenceProductIds).not.toContain('p2');
      
      // Reset mock for next call
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Call with low confidence threshold
      const lowConfidenceResult = await calculator.calculatePriceRecommendations(
        30, undefined, 'low'
      );
      
      // Should include both products
      const lowConfidenceProductIds = lowConfidenceResult.recommendations.map(r => r.productId);
      expect(lowConfidenceProductIds).toContain('p1');
      // p2 should be included with low confidence threshold
      expect(lowConfidenceProductIds).toContain('p2');
    });
    
    it('should generate recommendations based on best-selling price points', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock product with different price points
      const mockProducts = [{
        id: 'p1',
        name: 'Product with varied prices',
        price: 100, // Current price
        saleItems: [
          // Most sales at price 90
          { quantity: 5, price: 100, sale: { createdAt: new Date('2023-05-10') } },
          { quantity: 25, price: 90, sale: { createdAt: new Date('2023-05-11') } },
          { quantity: 3, price: 110, sale: { createdAt: new Date('2023-05-12') } }
        ]
      }];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Call the method
      const result = await calculator.calculatePriceRecommendations(30);
      
      // Should recommend the price point with highest sales (90)
      const recommendation = result.recommendations.find(r => r.productId === 'p1');
      expect(recommendation).toBeDefined();
      
      if (recommendation) {
        expect(recommendation.currentPrice).toBe(100);
        expect(recommendation.recommendedPrice).toBe(90);
      }
    });
    
    it('should generate recommendations based on profit margin heuristics', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Product consistently selling above current price
      const mockProducts = [{
        id: 'p1',
        name: 'Premium product',
        price: 100, // Current price
        saleItems: Array(30).fill(null).map(() => ({ 
          quantity: 1, 
          price: 120, // Consistently selling above price
          sale: { createdAt: new Date('2023-05-10') } 
        }))
      }];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Call the method
      const result = await calculator.calculatePriceRecommendations(30);
      
      // Should recommend to increase price
      const recommendation = result.recommendations.find(r => r.productId === 'p1');
      expect(recommendation).toBeDefined();
      
      if (recommendation) {
        expect(recommendation.currentPrice).toBe(100);
        expect(recommendation.recommendedPrice).toBeGreaterThan(100);
      }
    });
    
    it('should calculate revenue projections correctly', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock product data with sufficient sales and clear price difference
      const mockProducts = [{
        id: 'p1',
        name: 'Test product',
        price: 100,
        saleItems: Array(30).fill(null).map((_, index) => ({ 
          quantity: 1, 
          price: index < 20 ? 120 : 100, // Most sales at higher price point
          sale: { createdAt: new Date('2023-05-10') } 
        }))
      }];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Call the method
      const result = await calculator.calculatePriceRecommendations(30);
      
      // Assertions on revenue projections
      expect(result.revenueProjections.length).toBeGreaterThan(0);
      
      // First month projection should be based on current date
      expect(result.revenueProjections[0].date).toBeDefined();
      
      // Should have both current and optimized revenue values
      expect(result.revenueProjections[0].currentRevenue).toBeGreaterThan(0);
      expect(result.revenueProjections[0].optimizedRevenue).toBeGreaterThan(0);
      
      // Should have at least one recommendation
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
    
    it('should handle empty products after filtering', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock products with sales data below threshold
      const mockProducts = [{
        id: 'p1',
        name: 'Low volume product',
        price: 100,
        saleItems: [
          { quantity: 1, price: 100, sale: { createdAt: new Date('2023-05-10') } }
        ] // Only 1 sale, below low threshold
      }];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Expect InsufficientDataError as no products meet threshold
      await expect(calculator.calculatePriceRecommendations(30)).rejects.toThrow(InsufficientDataError);
    });
    
    it('should apply userId filter when provided', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock products with sufficient sales and clear price difference
      const mockProducts = [{
        id: 'p1',
        name: 'Test product',
        price: 100,
        saleItems: Array(20).fill(null).map(() => ({ 
          quantity: 1, 
          price: 120, // Consistently higher price
          sale: { createdAt: new Date('2023-05-10') } 
        }))
      }];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Call the method with a userId
      const userId = 'user123';
      await calculator.calculatePriceRecommendations(30, userId);
      
      // Verify the userId was included in the query
      expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: userId
          })
        })
      );
    });
    
    it('should handle database error when fetching products', async () => {
      // Mock successful database connection but error when fetching products
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      mockPrismaClient.product.findMany.mockRejectedValueOnce(new Error('Database error'));
      
      // Expect InsufficientDataError since no products will be returned
      await expect(calculator.calculatePriceRecommendations(30)).rejects.toThrow(InsufficientDataError);
    });
  });
  
  describe('internal methods', () => {
    it('fetchProductsWithSales should filter products with no sales', async () => {
      // Access private method using type casting
      const privateCalculator = calculator as unknown as {
        fetchProductsWithSales: (timeRangeInDays: number, userId?: string) => Promise<any[]>;
      };
      
      // Setup test data
      mockPrismaClient.product.findMany.mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'Product with sales',
          price: 100,
          saleItems: [
            { quantity: 5, price: 100, sale: { createdAt: new Date('2023-05-10') } }
          ]
        },
        {
          id: 'p2',
          name: 'Product with no sales',
          price: 50,
          saleItems: [] // No sales
        }
      ]);
      
      // Call the method
      const result = await privateCalculator.fetchProductsWithSales(30);
      
      // Should only include the product with sales
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('p1');
    });
    
    it('calculateDateRange should return correct date range', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Default 90 days for non-positive timeRange
      const defaultRange = privateCalculator.calculateDateRange(0);
      
      // Create a date 90 days before the mock date
      const ninetyDaysAgo = new Date(mockDate);
      ninetyDaysAgo.setDate(mockDate.getDate() - 90);
      
      expect(defaultRange.endDate.toDateString()).toBe(mockDate.toDateString());
      
      // Compare the dates by their day difference rather than exact string match
      const dayDiff = Math.round((defaultRange.endDate.getTime() - defaultRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(dayDiff).toBe(90);
      
      // Specific timeRange
      const thirtyDayRange = privateCalculator.calculateDateRange(30);
      
      // Create a date 30 days before the mock date
      const thirtyDaysAgo = new Date(mockDate);
      thirtyDaysAgo.setDate(mockDate.getDate() - 30);
      
      expect(thirtyDayRange.endDate.toDateString()).toBe(mockDate.toDateString());
      
      // Compare by day difference
      const thirtyDayDiff = Math.round((thirtyDayRange.endDate.getTime() - thirtyDayRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(thirtyDayDiff).toBe(30);
    });
    
    it('generatePriceRecommendations should handle empty products array', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Call with empty array
      const result = privateCalculator.generatePriceRecommendations([], 'medium');
      
      // Should return empty array
      expect(result).toEqual([]);
    });
    
    it('generatePriceRecommendations should skip products with insufficient data', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Mock products - one with enough sales, one without
      const mockProducts = [
        {
          id: 'p1',
          name: 'Product with sufficient sales',
          price: 100,
          saleItems: Array(10).fill(null).map(() => ({ 
            quantity: 1, 
            price: 100, 
            sale: { createdAt: new Date('2023-05-10') } 
          }))
        },
        {
          id: 'p2',
          name: 'Product with insufficient sales',
          price: 50,
          saleItems: [
            { quantity: 1, price: 50, sale: { createdAt: new Date('2023-05-08') } }
          ] // Only 1 sale, below thresholds
        }
      ];
      
      // Call with medium confidence threshold
      const result = privateCalculator.generatePriceRecommendations(mockProducts, 'medium');
      
      // Should only include recommendations for p1
      const productIds = result.map(r => r.productId);
      expect(productIds).not.toContain('p2');
    });
    
    it('projectProductRevenue should calculate revenue based on price elasticity', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Mock product with consistent price
      const mockProduct = {
        id: 'p1',
        name: 'Test product',
        price: 100,
        saleItems: Array(10).fill(null).map(() => ({ 
          quantity: 1, 
          price: 100, 
          sale: { createdAt: new Date('2023-05-10') } 
        }))
      };
      
      // Calculate revenue at current price
      const currentRevenue = privateCalculator.projectProductRevenue(mockProduct, 100);
      
      // Calculate revenue at higher price
      const higherPriceRevenue = privateCalculator.projectProductRevenue(mockProduct, 110);
      
      // Calculate revenue at lower price
      const lowerPriceRevenue = privateCalculator.projectProductRevenue(mockProduct, 90);
      
      // Higher price should result in lower quantity but may have higher revenue
      // Lower price should result in higher quantity but may have lower revenue
      // The exact relationships depend on the elasticity model
      
      // Given our model (10% price change = 5% quantity change in opposite direction)
      // We'd expect the following:
      
      // At 110 (10% increase), quantity decreases by 5%, so revenue should increase by ~4.5%
      expect(higherPriceRevenue).toBeGreaterThan(currentRevenue);
      
      // At 90 (10% decrease), quantity increases by 5%, so revenue should decrease by ~5.5%
      expect(lowerPriceRevenue).toBeLessThan(currentRevenue);
    });
    
    it('calculateRevenueProjections should generate projections for 6 months', () => {
      const privateCalculator = calculator as unknown as PrivateCalculator;
      
      // Mock product
      const mockProduct = {
        id: 'p1',
        name: 'Test product',
        price: 100,
        saleItems: Array(10).fill(null).map(() => ({ 
          quantity: 1, 
          price: 100, 
          sale: { createdAt: new Date('2023-05-10') } 
        }))
      };
      
      // Mock recommendations
      const mockRecommendations: PriceRecommendation[] = [{
        productId: 'p1',
        productName: 'Test product',
        currentPrice: 100,
        recommendedPrice: 110,
        confidence: 'medium',
        potentialRevenue: 1100,
        currentRevenue: 1000,
        revenueDifference: 100,
        percentageChange: 10
      }];
      
      // Call the method
      const result = privateCalculator.calculateRevenueProjections([mockProduct], mockRecommendations);
      
      // Should generate 6 months of projections
      expect(result.length).toBe(6);
      
      // Months should be in sequence
      expect(result[0].date).toContain('May 2023');
      expect(result[1].date).toContain('Jun 2023');
      
      // Later months should have higher revenue due to growth factor
      expect(result[5].currentRevenue).toBeGreaterThan(result[0].currentRevenue);
      expect(result[5].optimizedRevenue).toBeGreaterThan(result[0].optimizedRevenue);
      
      // Optimized revenue should be higher than current revenue
      for (const projection of result) {
        expect(projection.optimizedRevenue).toBeGreaterThan(projection.currentRevenue);
      }
    });
  });
  
  describe('error handling', () => {
    it('should wrap unknown errors in a generic error', async () => {
      // Mock successful database connection
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
      
      // Mock some products but throw an error in the middle of processing
      const mockProducts = [{
        id: 'p1',
        name: 'Test product',
        price: 100,
        saleItems: Array(10).fill(null).map(() => ({ 
          quantity: 1, 
          price: 100,
          sale: { createdAt: new Date('2023-05-10') } 
        }))
      }];
      
      mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Sabotage one of the methods to throw an error
      jest.spyOn(calculator as any, 'generatePriceRecommendations').mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the method and expect a generic error
      try {
        await calculator.calculatePriceRecommendations(30);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to calculate price recommendations');
        expect((error as Error).message).toContain('Unexpected error');
      }
    });
    
    it('should handle database error in fetchProductsWithSales', async () => {
      const privateCalculator = calculator as unknown as {
        fetchProductsWithSales: (startDate: Date, endDate: Date, userId?: string) => Promise<any[]>;
      };
      
      // Mock a database error
      mockPrismaClient.product.findMany.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the method
      const result = await privateCalculator.fetchProductsWithSales(
        new Date('2023-01-01'),
        new Date('2023-05-15'),
        'user123'
      );
      
      // Should return empty array on error
      expect(result).toEqual([]);
    });
    
    it('should handle database connection errors gracefully', async () => {
      // Mock a database error
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Database error'));
      
      try {
        await calculator.calculatePriceRecommendations(30);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseConnectionError);
        expect((error as DatabaseConnectionError).message).toContain('Unable to connect to the database');
      }
    });
  });
});

// Helper type for accessing private methods in tests
type PrivateCalculator = {
  calculateDateRange: (timeRangeInDays: number) => { startDate: Date, endDate: Date };
  fetchProductsWithSales: (timeRangeInDays: number, userId?: string) => Promise<any[]>;
  generatePriceRecommendations: (productsWithSales: any[], confidenceThreshold: 'high' | 'medium' | 'low') => PriceRecommendation[];
  projectProductRevenue: (product: any, price: number) => number;
  calculateRevenueProjections: (productsWithSales: any[], recommendations: PriceRecommendation[]) => RevenueProjection[];
};

// Mock data representing price suggestions with different confidence levels
const mockPriceSuggestions = [
  { id: '1', name: 'Product A', currentPrice: 10, suggestedPrice: 12, potential: 8.5, confidence: 'high' },
  { id: '2', name: 'Product B', currentPrice: 20, suggestedPrice: 18, potential: -5.2, confidence: 'high' },
  { id: '3', name: 'Product C', currentPrice: 15, suggestedPrice: 17, potential: 10.2, confidence: 'medium' },
  { id: '4', name: 'Product D', currentPrice: 30, suggestedPrice: 35, potential: 12.8, confidence: 'medium' },
  { id: '5', name: 'Product E', currentPrice: 25, suggestedPrice: 24, potential: -2.1, confidence: 'low' },
  { id: '6', name: 'Product F', currentPrice: 50, suggestedPrice: 45, potential: -6.9, confidence: 'low' },
];

// Function that mimics our filtering logic in the UI
const filterByConfidence = (items: any[], confidenceLevel: 'high' | 'medium' | 'low' | 'all') => {
  return items.filter(item => {
    if (confidenceLevel === 'high') return item.confidence === 'high';
    if (confidenceLevel === 'medium') return item.confidence === 'medium';
    if (confidenceLevel === 'low') return item.confidence === 'low';
    return true; // 'all' shows all confidence levels
  });
};

describe('Price Recommendations Filtering Tests', () => {
  it('should filter products with high confidence only', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'high');
    expect(filtered.length).toBe(2);
    expect(filtered.every(item => item.confidence === 'high')).toBe(true);
  });

  it('should filter products with medium confidence only', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'medium');
    expect(filtered.length).toBe(2);
    expect(filtered.every(item => item.confidence === 'medium')).toBe(true);
  });

  it('should filter products with low confidence only', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'low');
    expect(filtered.length).toBe(2);
    expect(filtered.every(item => item.confidence === 'low')).toBe(true);
  });

  it('should include all products when confidence is set to all', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'all');
    expect(filtered.length).toBe(mockPriceSuggestions.length);
  });

  it('should correctly identify potential impact percentages', () => {
    // Test calculating the percentage change and impact values
    mockPriceSuggestions.forEach(item => {
      const percentChange = ((item.suggestedPrice - item.currentPrice) / item.currentPrice * 100);
      const roundedPercentChange = parseFloat(percentChange.toFixed(1));
      
      // Verify the potential impact calculation
      expect(Math.abs(roundedPercentChange - item.potential) < 0.2).toBeTruthy();
    });
  });
}); 