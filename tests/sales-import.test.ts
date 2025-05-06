import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sales-history/import/route';

// Mock the dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/app/api/auth/[...nextauth]/auth-options', () => ({
  authOptions: {}
}));

jest.mock('@/lib/prisma', () => {
  return {
    __esModule: true,
    default: {
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
        findUnique: jest.fn(),
        findMany: jest.fn()
      },
      saleItem: {
        create: jest.fn(),
        findMany: jest.fn()
      },
      inventoryChange: {
        create: jest.fn()
      },
      $transaction: jest.fn(async (callback) => await callback({
        sale: {
          create: jest.fn().mockImplementation((data) => ({
            id: 'mock-sale-id',
            ...data.data
          })),
          findUnique: jest.fn().mockResolvedValue({
            id: 'mock-sale-id',
            items: []
          })
        },
        saleItem: {
          create: jest.fn().mockResolvedValue({
            id: 'mock-sale-item-id',
            productId: 'test-product-id',
            saleId: 'mock-sale-id'
          })
        },
        inventoryChange: {
          create: jest.fn().mockResolvedValue({
            id: 'mock-inventory-change-id'
          })
        }
      }))
    }
  };
});

// Mock getServerSession
import { getServerSession } from 'next-auth';
// Mock NextResponse
import { NextResponse } from 'next/server';

// Import prisma client
import prisma from '@/lib/prisma';

describe('Sales History Import API', () => {
  // Sample test data
  const testUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com'
  };

  const testSalesData = [
    {
      date: '2023-05-01',
      productName: 'Existing Product',
      quantity: 2,
      unitPrice: 10.99,
      totalAmount: 21.98
    },
    {
      date: '2023-05-01',
      productName: 'New Product',
      quantity: 1,
      unitPrice: 15.99,
      totalAmount: 15.99
    },
    {
      date: '2023-05-02',
      productName: 'existing product', // Test case insensitivity
      quantity: 3,
      unitPrice: 11.99, // Different price
      totalAmount: 35.97
    },
    {
      date: '2023-05-02',
      productId: 'specific-product-id', // Test with productId provided
      productName: 'Product With ID',
      quantity: 2,
      unitPrice: 25.99,
      totalAmount: 51.98
    }
  ];

  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: testUser.email }
    });
    
    // Mock user find
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);
    
    // Setup product finding behavior
    (prisma.product.findFirst as jest.Mock).mockImplementation(({ where }) => {
      // Return a mock product only for "Existing Product"
      if (where.name.equals === 'Existing Product' || where.name.equals === 'existing product') {
        return Promise.resolve({
          id: 'existing-product-id',
          name: 'Existing Product',
          sellingPrice: 10.99,
          userId: testUser.id
        });
      }
      return Promise.resolve(null);
    });
    
    // Setup product finding by ID
    (prisma.product.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === 'specific-product-id') {
        return Promise.resolve({
          id: 'specific-product-id',
          name: 'Old Product Name',
          sellingPrice: 19.99,
          userId: testUser.id
        });
      }
      return Promise.resolve(null);
    });
    
    // Setup product update behavior
    (prisma.product.update as jest.Mock).mockImplementation(({ where, data }) => {
      return Promise.resolve({
        id: where.id,
        ...data,
        userId: testUser.id
      });
    });
    
    // Setup product create behavior
    (prisma.product.create as jest.Mock).mockImplementation(({ data }) => {
      return Promise.resolve({
        id: `new-product-${data.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...data
      });
    });
    
    // Setup sale find behavior for verification
    (prisma.saleItem.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'mock-sale-item-id-1',
        productId: 'existing-product-id',
        product: { name: 'Existing Product' }
      },
      {
        id: 'mock-sale-item-id-2',
        productId: 'new-product-new-product',
        product: { name: 'New Product' }
      }
    ]);
  });

  it('should handle authentication failure', async () => {
    // Mock unauthenticated session
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const request = new NextRequest('http://localhost/api/sales-history/import', {
      method: 'POST',
      body: JSON.stringify({ salesHistory: testSalesData })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(401);
    
    const responseData = await response.json();
    expect(responseData.error).toBe('Unauthorized');
  });

  it('should handle user not found', async () => {
    // Mock authenticated but user not found
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    const request = new NextRequest('http://localhost/api/sales-history/import', {
      method: 'POST',
      body: JSON.stringify({ salesHistory: testSalesData })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(404);
    
    const responseData = await response.json();
    expect(responseData.error).toBe('User not found');
  });

  it('should handle empty sales data', async () => {
    const request = new NextRequest('http://localhost/api/sales-history/import', {
      method: 'POST',
      body: JSON.stringify({ salesHistory: [] })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData.error).toBe('No sales history data provided');
  });

  it('should successfully process sales with new and existing products', async () => {
    const request = new NextRequest('http://localhost/api/sales-history/import', {
      method: 'POST',
      body: JSON.stringify({ salesHistory: testSalesData })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    
    // Check product creation
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'New Product',
          sellingPrice: 15.99,
          userId: testUser.id
        })
      })
    );
    
    // Check product update for price change
    expect(prisma.product.update).toHaveBeenCalledTimes(2);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-product-id' },
        data: expect.objectContaining({
          sellingPrice: 11.99
        })
      })
    );
    
    // Check product update for product with ID (both name and price)
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'specific-product-id' },
        data: expect.objectContaining({
          name: 'Product With ID',
          sellingPrice: 25.99
        })
      })
    );
    
    // Check that sales were created
    expect(prisma.$transaction).toHaveBeenCalledTimes(2); // One for each date
  });

  it('should handle failure in product creation', async () => {
    // Mock product creation to fail
    (prisma.product.create as jest.Mock).mockRejectedValue(
      new Error('Database error during product creation')
    );
    
    const request = new NextRequest('http://localhost/api/sales-history/import', {
      method: 'POST',
      body: JSON.stringify({ salesHistory: [testSalesData[1]] }) // Only the new product
    });
    
    const response = await POST(request);
    expect(response.status).toBe(500);
    
    const responseData = await response.json();
    expect(responseData.error).toBe('Failed to import sales history');
    expect(responseData.message).toContain('Database error during product creation');
  });

  it('should handle missing product name', async () => {
    const invalidData = [
      {
        date: '2023-05-01',
        // Missing productName
        quantity: 2,
        unitPrice: 10.99,
        totalAmount: 21.98
      }
    ];
    
    const request = new NextRequest('http://localhost/api/sales-history/import', {
      method: 'POST',
      body: JSON.stringify({ salesHistory: invalidData })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it('should handle duplicates in sales history', async () => {
    const duplicateData = [
      ...testSalesData,
      testSalesData[0] // Duplicate the first item
    ];
    
    const request = new NextRequest('http://localhost/api/sales-history/import', {
      method: 'POST',
      body: JSON.stringify({ salesHistory: duplicateData })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
    
    // Should still process successfully but only create/update each unique product once
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });
}); 