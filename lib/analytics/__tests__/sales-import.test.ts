import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (callback) => await callback(mockPrismaClient)),
    user: {
      findUnique: jest.fn()
    },
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    sale: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    saleItem: {
      create: jest.fn()
    },
    inventoryChange: {
      create: jest.fn()
    }
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

// Create mock for fetch API
global.fetch = jest.fn();

describe('Sales Import Functionality', () => {
  let prismaClient: any;
  let mockCsvFilePath: string;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    prismaClient = new PrismaClient();
    
    // Create a temporary CSV file for testing
    const tmpDir = os.tmpdir();
    mockCsvFilePath = path.join(tmpDir, 'test_sales.csv');
    
    // Create test CSV content
    const csvContent = `date,productName,productId,quantity,unitPrice,totalAmount
2023-01-01,Product A,,2,10.00,20.00
2023-01-01,Product B,,3,15.00,45.00
2023-01-02,Product A,,1,10.00,10.00`;
    
    fs.writeFileSync(mockCsvFilePath, csvContent);
    
    // Set up mocks for a successful user lookup
    prismaClient.user.findUnique.mockResolvedValue({
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com'
    });
  });
  
  afterEach(() => {
    // Clean up temporary file
    if (fs.existsSync(mockCsvFilePath)) {
      fs.unlinkSync(mockCsvFilePath);
    }
  });
  
  describe('Product Creation During Sales Import', () => {
    it('should create products that don\'t exist when importing sales', async () => {
      // Setup: Mock product lookup to return null (not found)
      prismaClient.product.findUnique.mockResolvedValue(null);
      prismaClient.product.findFirst.mockResolvedValue(null);
      
      // Mock product creation to return a product with ID
      prismaClient.product.create.mockImplementation((args) => {
        return Promise.resolve({
          id: `product-${args.data.name}`,
          ...args.data
        });
      });
      
      // Mock sale creation
      prismaClient.sale.create.mockResolvedValue({
        id: 'sale123',
        date: new Date('2023-01-01'),
        totalAmount: 65.00,
        userId: 'user123'
      });
      
      // Mock saleItem creation
      prismaClient.saleItem.create.mockResolvedValue({
        id: 'saleItem123',
        quantity: 2,
        price: 10.00,
        saleId: 'sale123',
        productId: 'product-Product A',
        productName: 'Product A'
      });
      
      // Mock sale lookup
      prismaClient.sale.findUnique.mockResolvedValue({
        id: 'sale123',
        items: [
          { id: 'saleItem123', productId: 'product-Product A', quantity: 2 },
          { id: 'saleItem124', productId: 'product-Product B', quantity: 3 }
        ]
      });
      
      // Read the test CSV file
      const csvData = fs.readFileSync(mockCsvFilePath, 'utf8');
      
      // Simulate an API call to the import endpoint
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, saleCount: 2, itemCount: 3 })
      });
      
      // Call the API endpoint
      const response = await fetch('/api/sales-history/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          salesHistory: [
            { date: '2023-01-01', productName: 'Product A', quantity: 2, unitPrice: 10.00, totalAmount: 20.00 },
            { date: '2023-01-01', productName: 'Product B', quantity: 3, unitPrice: 15.00, totalAmount: 45.00 },
            { date: '2023-01-02', productName: 'Product A', quantity: 1, unitPrice: 10.00, totalAmount: 10.00 }
          ]
        })
      });
      
      const result = await response.json();
      
      // Assertions
      expect(result.success).toBe(true);
      expect(prismaClient.product.create).toHaveBeenCalledTimes(2); // Should create Product A and Product B
      expect(prismaClient.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Product A',
            sellingPrice: 10.00
          })
        })
      );
      expect(prismaClient.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Product B',
            sellingPrice: 15.00
          })
        })
      );
      
      // Verify sales were created
      expect(prismaClient.sale.create).toHaveBeenCalledTimes(2); // One for each date
      
      // Verify sale items were created with the correct product IDs
      const saleItemCalls = prismaClient.saleItem.create.mock.calls;
      expect(saleItemCalls.length).toBe(3); // Three sale items total
      
      // Verify inventory changes were created
      expect(prismaClient.inventoryChange.create).toHaveBeenCalledTimes(3);
    });
    
    it('should update existing products if they already exist', async () => {
      // Setup: Mock product lookup to return a product for Product A but not Product B
      prismaClient.product.findFirst.mockImplementation((args) => {
        if (args.where.name.equals === 'Product A') {
          return Promise.resolve({
            id: 'existing-product-A',
            name: 'Product A',
            sellingPrice: 9.50, // Different price from CSV
            userId: 'user123'
          });
        }
        return Promise.resolve(null);
      });
      
      // Mock product creation for Product B
      prismaClient.product.create.mockImplementation((args) => {
        return Promise.resolve({
          id: `product-${args.data.name}`,
          ...args.data
        });
      });
      
      // Mock product update for Product A
      prismaClient.product.update.mockResolvedValue({
        id: 'existing-product-A',
        name: 'Product A',
        sellingPrice: 10.00, // Updated price
        userId: 'user123'
      });
      
      // Simulate an API call to the import endpoint
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, saleCount: 2, itemCount: 3 })
      });
      
      // Call the API endpoint
      const response = await fetch('/api/sales-history/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          salesHistory: [
            { date: '2023-01-01', productName: 'Product A', quantity: 2, unitPrice: 10.00, totalAmount: 20.00 },
            { date: '2023-01-01', productName: 'Product B', quantity: 3, unitPrice: 15.00, totalAmount: 45.00 }
          ]
        })
      });
      
      const result = await response.json();
      
      // Assertions
      expect(result.success).toBe(true);
      
      // Should create Product B only
      expect(prismaClient.product.create).toHaveBeenCalledTimes(1);
      expect(prismaClient.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Product B',
            sellingPrice: 15.00
          })
        })
      );
      
      // Should update Product A with the new price
      expect(prismaClient.product.update).toHaveBeenCalledTimes(1);
      expect(prismaClient.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-product-A' },
          data: expect.objectContaining({
            sellingPrice: 10.00
          })
        })
      );
    });
    
    it('should handle productId if provided in the CSV data', async () => {
      // Setup: Mock product lookup by ID to return a product
      prismaClient.product.findUnique.mockResolvedValueOnce({
        id: 'product-with-id',
        name: 'Legacy Product',
        sellingPrice: 20.00,
        userId: 'user123'
      });
      
      // Mock product lookup by name to return null for the second product
      prismaClient.product.findFirst.mockResolvedValue(null);
      
      // Mock product creation
      prismaClient.product.create.mockImplementation((args) => {
        return Promise.resolve({
          id: `product-${args.data.name}`,
          ...args.data
        });
      });
      
      // Simulate an API call to the import endpoint
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, saleCount: 1, itemCount: 2 })
      });
      
      // Call the API endpoint
      const response = await fetch('/api/sales-history/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          salesHistory: [
            { date: '2023-01-01', productId: 'product-with-id', productName: 'Product Name Override', quantity: 2, unitPrice: 25.00, totalAmount: 50.00 },
            { date: '2023-01-01', productName: 'New Product', quantity: 1, unitPrice: 30.00, totalAmount: 30.00 }
          ]
        })
      });
      
      const result = await response.json();
      
      // Assertions
      expect(result.success).toBe(true);
      
      // Should find product by ID
      expect(prismaClient.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-with-id' }
      });
      
      // Should update existing product if the price is different
      expect(prismaClient.product.update).toHaveBeenCalledTimes(1);
      expect(prismaClient.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-with-id' },
          data: expect.objectContaining({
            sellingPrice: 25.00,
            name: 'Product Name Override'
          })
        })
      );
      
      // Should create the new product 
      expect(prismaClient.product.create).toHaveBeenCalledTimes(1);
      expect(prismaClient.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Product',
            sellingPrice: 30.00
          })
        })
      );
    });
  });
}); 