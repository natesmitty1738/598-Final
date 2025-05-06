import { PriceRecommendationCalculator } from '../price-recommendations';

// Mock PrismaClient with more complete implementation
const mockPrismaClient = {
  $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
  product: {
    findMany: jest.fn(),
    count: jest.fn().mockResolvedValue(3) // Mock product count
  },
  sale: {
    count: jest.fn().mockResolvedValue(15) // Mock sale count
  },
  saleItem: {
    count: jest.fn().mockResolvedValue(25) // Mock saleItem count
  }
};

// Mock date for consistent tests
const mockDate = new Date('2023-05-15T12:00:00Z');

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

describe('Price Recommendation Confidence Levels', () => {
  let calculator: PriceRecommendationCalculator;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(mockDate);
    
    // Create a new calculator instance with the mock Prisma client
    calculator = new PriceRecommendationCalculator(mockPrismaClient as any);
  });
  
  it('should correctly assign confidence levels based on quantity sold', async () => {
    // Create products with different sales volume to test confidence levels
    const mockProducts = [
      // Product with high confidence (10+ data points)
      {
        id: 'high-confidence',
        name: 'High Confidence Product',
        price: 50,
        saleItems: Array(15).fill(null).map(() => ({ 
          quantity: 1, // Total of 15 items sold
          price: 50, 
          sale: { date: new Date('2023-05-10') }
        }))
      },
      // Product with medium confidence (5-9 data points)
      {
        id: 'medium-confidence',
        name: 'Medium Confidence Product',
        price: 75,
        saleItems: Array(7).fill(null).map(() => ({ 
          quantity: 1, // Total of 7 items sold
          price: 75, 
          sale: { date: new Date('2023-05-10') }
        }))
      },
      // Product with low confidence (1-4 data points)
      {
        id: 'low-confidence',
        name: 'Low Confidence Product',
        price: 100,
        saleItems: Array(3).fill(null).map(() => ({ 
          quantity: 1, // Total of 3 items sold
          price: 100, 
          sale: { date: new Date('2023-05-10') }
        }))
      }
    ];
    
    // Setup mock to return our products
    mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
    
    // Get recommendations with low confidence threshold to get all products
    const result = await calculator.calculatePriceRecommendations(30, undefined, 'low');
    
    // Make sure we get all three products
    expect(result.recommendations.length).toBe(3);
    
    // Check confidence levels
    const highConfidenceProduct = result.recommendations.find(r => r.productId === 'high-confidence');
    const mediumConfidenceProduct = result.recommendations.find(r => r.productId === 'medium-confidence');
    const lowConfidenceProduct = result.recommendations.find(r => r.productId === 'low-confidence');
    
    expect(highConfidenceProduct?.confidence).toBe('high');
    expect(mediumConfidenceProduct?.confidence).toBe('medium');
    expect(lowConfidenceProduct?.confidence).toBe('low');
  });
  
  it('should filter recommendations properly when using different confidence thresholds', async () => {
    // Same mock products as previous test
    const mockProducts = [
      // High confidence (10+ data points)
      {
        id: 'high-confidence',
        name: 'High Confidence Product',
        price: 50,
        saleItems: Array(15).fill(null).map(() => ({ 
          quantity: 1,
          price: 50, 
          sale: { date: new Date('2023-05-10') }
        }))
      },
      // Medium confidence (5-9 data points)
      {
        id: 'medium-confidence',
        name: 'Medium Confidence Product',
        price: 75,
        saleItems: Array(7).fill(null).map(() => ({ 
          quantity: 1,
          price: 75, 
          sale: { date: new Date('2023-05-10') }
        }))
      },
      // Low confidence (1-4 data points)
      {
        id: 'low-confidence',
        name: 'Low Confidence Product',
        price: 100,
        saleItems: Array(3).fill(null).map(() => ({ 
          quantity: 1,
          price: 100, 
          sale: { date: new Date('2023-05-10') }
        }))
      }
    ];
    
    // Test high confidence threshold
    mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
    const highResult = await calculator.calculatePriceRecommendations(30, undefined, 'high');
    expect(highResult.recommendations.length).toBe(1);
    expect(highResult.recommendations[0].productId).toBe('high-confidence');
    
    // Test medium confidence threshold
    mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
    const mediumResult = await calculator.calculatePriceRecommendations(30, undefined, 'medium');
    expect(mediumResult.recommendations.length).toBe(2);
    const mediumResultIds = mediumResult.recommendations.map(r => r.productId);
    expect(mediumResultIds).toContain('high-confidence');
    expect(mediumResultIds).toContain('medium-confidence');
    expect(mediumResultIds).not.toContain('low-confidence');
    
    // Test low confidence threshold
    mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts);
    const lowResult = await calculator.calculatePriceRecommendations(30, undefined, 'low');
    expect(lowResult.recommendations.length).toBe(3);
  });
});

describe('Confidence Level Filtering Tests', () => {
  it('should filter products with high confidence only', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'high');
    expect(filtered.length).toBe(2);
    expect(filtered.every(item => item.confidence === 'high')).toBe(true);
    expect(filtered.map(item => item.id)).toEqual(['1', '2']);
  });

  it('should filter products with medium confidence only', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'medium');
    expect(filtered.length).toBe(2);
    expect(filtered.every(item => item.confidence === 'medium')).toBe(true);
    expect(filtered.map(item => item.id)).toEqual(['3', '4']);
  });

  it('should filter products with low confidence only', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'low');
    expect(filtered.length).toBe(2);
    expect(filtered.every(item => item.confidence === 'low')).toBe(true);
    expect(filtered.map(item => item.id)).toEqual(['5', '6']);
  });

  it('should include all products when confidence is set to all', () => {
    const filtered = filterByConfidence(mockPriceSuggestions, 'all');
    expect(filtered.length).toBe(mockPriceSuggestions.length);
    expect(filtered.map(item => item.id)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  // Testing for edge cases
  it('should return empty array when no products match confidence level', () => {
    const emptyMock = [
      { id: '1', name: 'Product A', confidence: 'medium' },
      { id: '2', name: 'Product B', confidence: 'medium' },
    ];
    const filtered = filterByConfidence(emptyMock, 'high');
    expect(filtered.length).toBe(0);
  });

  it('should handle empty arrays gracefully', () => {
    const filtered = filterByConfidence([], 'high');
    expect(filtered.length).toBe(0);
  });
  
  // Test the sorting by potential impact
  it('should correctly sort by absolute potential impact', () => {
    const allItems = filterByConfidence(mockPriceSuggestions, 'all');
    // Sort by absolute potential impact (highest first)
    const sorted = [...allItems].sort((a, b) => Math.abs(b.potential) - Math.abs(a.potential));
    
    // Verify the order: Product D (12.8), Product C (10.2), Product A (8.5), Product F (6.9), Product B (5.2), Product E (2.1)
    expect(sorted.map(item => item.id)).toEqual(['4', '3', '1', '6', '2', '5']);
  });
}); 