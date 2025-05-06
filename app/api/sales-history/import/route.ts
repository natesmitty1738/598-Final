import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

interface SalesHistoryItem {
  date: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

// Helper to generate a readable product ID if none provided
function generateProductId(productName: string, userId: string): string {
  // Create a slug from the product name
  const slug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
  
  // Add a user-specific prefix and timestamp for uniqueness
  const userPrefix = userId.substring(0, 6);
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  
  return `${userPrefix}-${slug}-${timestamp}${randomSuffix}`;
}

export async function POST(request: Request) {
  try {
    console.log('[SALES IMPORT] Starting sales data import');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`[SALES IMPORT] User found: ${user.id}`);

    // Parse the request body
    const body = await request.json();
    const { salesHistory } = body as { salesHistory: SalesHistoryItem[] };

    if (!salesHistory || !Array.isArray(salesHistory) || salesHistory.length === 0) {
      return NextResponse.json({ error: 'No sales history data provided' }, { status: 400 });
    }

    // Validate sales history data
    const invalidRecords = salesHistory.filter(item => 
      !item.date || 
      !item.productName || 
      typeof item.quantity !== 'number' || 
      typeof item.unitPrice !== 'number' ||
      typeof item.totalAmount !== 'number'
    );
    
    if (invalidRecords.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid sales history data', 
        details: `${invalidRecords.length} records are missing required fields`
      }, { status: 400 });
    }

    console.log(`[SALES IMPORT] Found ${salesHistory.length} valid sales history records`);

    // Create any missing products first to ensure they exist
    const productMap = new Map();
    const productsCreated = [];
    const productsUpdated = [];
    
    // Process unique products to ensure they exist
    // First, group by product name to avoid duplicates
    const uniqueProducts = new Map<string, SalesHistoryItem>();
    
    for (const item of salesHistory) {
      // Use lowercase product name as key for case-insensitive matching
      const key = item.productName.toLowerCase();
      
      // Only add to unique products if we haven't seen this product yet
      // Or if this record has a higher price (for price updates)
      if (!uniqueProducts.has(key) || (uniqueProducts.get(key)?.unitPrice || 0) < item.unitPrice) {
        uniqueProducts.set(key, item);
      }
    }
    
    console.log(`[SALES IMPORT] Processing ${uniqueProducts.size} unique products`);
    
    // Now process each unique product
    for (const [key, item] of uniqueProducts.entries()) {
      try {
        // Check if product already exists by ID or name
        let product;
        
        if (item.productId) {
          console.log(`[SALES IMPORT] Checking for product by ID: ${item.productId}`);
          product = await prisma.product.findFirst({
            where: { 
              id: item.productId,
              userId: user.id // Only find products belonging to this user
            }
          });
          
          if (product) {
            console.log(`[SALES IMPORT] Found product by ID: ${product.id}`);
            
            // Update product if price or name has changed
            if (product.sellingPrice !== item.unitPrice || product.name !== item.productName) {
              console.log(`[SALES IMPORT] Updating product ${product.id}`);
              product = await prisma.product.update({
                where: { id: product.id },
                data: {
                  name: item.productName,
                  sellingPrice: item.unitPrice,
                  updatedAt: new Date()
                }
              });
              productsUpdated.push(product.id);
            }
            
            productMap.set(key, product.id);
            continue;
          } else {
            console.log(`[SALES IMPORT] No product found with ID ${item.productId} for this user, will create new`);
          }
        }
        
        // If not found by ID, check by name (case insensitive)
        if (!product) {
          console.log(`[SALES IMPORT] Checking for product by name: ${item.productName}`);
          product = await prisma.product.findFirst({
            where: { 
              name: { equals: item.productName, mode: 'insensitive' },
              userId: user.id
            }
          });
          
          if (product) {
            console.log(`[SALES IMPORT] Found product by name: ${product.id}`);
            
            // Update product if price has changed
            if (product.sellingPrice !== item.unitPrice) {
              console.log(`[SALES IMPORT] Updating product ${product.id} price from ${product.sellingPrice} to ${item.unitPrice}`);
              product = await prisma.product.update({
                where: { id: product.id },
                data: {
                  sellingPrice: item.unitPrice,
                  updatedAt: new Date()
                }
              });
              productsUpdated.push(product.id);
            }
            
            productMap.set(key, product.id);
            continue;
          }
        }
        
        // Create the product if it doesn't exist
        // Always generate a new ID for this user to avoid conflicts
        const productId = generateProductId(item.productName, user.id);
        
        console.log(`[SALES IMPORT] Creating new product: ${item.productName} with ID: ${productId}`);
        const newProduct = await prisma.product.create({
          data: {
            id: productId,
            name: item.productName,
            description: `Imported product: ${item.productName}`,
            sellingPrice: item.unitPrice || 0, // Default to 0 if no price
            stockQuantity: Math.max(100, item.quantity * 5), // Set initial stock higher than quantity ordered
            userId: user.id,
            category: 'Imported', // Default category for imported products
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`[SALES IMPORT] Created product with ID: ${newProduct.id}`);
        productMap.set(key, newProduct.id);
        productsCreated.push(newProduct.id);
      } catch (error) {
        console.error(`[SALES IMPORT] Error processing product ${item.productName}:`, error);
        // Continue with next product rather than aborting the entire process
      }
    }

    console.log(`[SALES IMPORT] Product map contains ${productMap.size} products`);
    console.log(`[SALES IMPORT] Created ${productsCreated.length} products, updated ${productsUpdated.length} products`);

    // Group sales by date to create one Sale record per day
    const salesByDate = salesHistory.reduce((acc, item) => {
      // Ensure date is properly parsed
      let date;
      try {
        date = new Date(item.date);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${item.date}`);
        }
        date = date.toISOString().split('T')[0];
      } catch (error) {
        console.error(`[SALES IMPORT] Invalid date format: ${item.date}, using current date`);
        date = new Date().toISOString().split('T')[0];
      }
      
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, SalesHistoryItem[]>);

    console.log(`[SALES IMPORT] Grouped into ${Object.keys(salesByDate).length} sale dates`);

    const salesCreated = [];
    const salesItemsCreated = [];
    const errors = [];

    // Create Sale records with SaleItems
    for (const [dateStr, items] of Object.entries(salesByDate)) {
      try {
        // Calculate total amount for this date
        const dailyTotal = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        
        // Format date for the record
        const date = new Date(dateStr);
        
        console.log(`[SALES IMPORT] Creating sale for date ${dateStr} with ${items.length} items, total: ${dailyTotal}`);
        
        // Create the Sale record with connected SaleItems
        const sale = await prisma.$transaction(async (tx) => {
          // Create the sale
          const newSale = await tx.sale.create({
            data: {
              date: date,
              totalAmount: dailyTotal,
              paymentMethod: "CASH", // Default payment method
              paymentStatus: "COMPLETED", // Default status
              userId: user.id,
              createdAt: date,
              updatedAt: date
            }
          });
          
          console.log(`[SALES IMPORT] Created sale with ID: ${newSale.id}`);
          
          // Create all the sale items with the new sale ID
          const saleItems = [];
          for (const item of items) {
            // Skip items with zero quantity
            if (item.quantity <= 0) {
              console.log(`[SALES IMPORT] Skipping item with zero quantity: ${item.productName}`);
              continue;
            }
            
            const productKey = item.productName.toLowerCase();
            const productId = productMap.get(productKey);
            
            if (!productId) {
              console.error(`[SALES IMPORT] WARNING: Product not found in map: ${item.productName}`);
              // Don't throw - just skip this item and continue with the rest
              continue;
            }
            
            console.log(`[SALES IMPORT] Creating sale item for product ${productId}, quantity: ${item.quantity}, price: ${item.unitPrice}`);
            
            const saleItem = await tx.saleItem.create({
              data: {
                quantity: item.quantity,
                price: item.unitPrice || 0,
                productId: productId,
                productName: item.productName, // Store the product name for historical reference
                saleId: newSale.id,
                createdAt: date,
                updatedAt: date
              }
            });
            
            saleItems.push(saleItem);
            salesItemsCreated.push(saleItem.id);
            
            // Create inventory change records for each sale item
            console.log(`[SALES IMPORT] Creating inventory change record for product ${productId}`);
            await tx.inventoryChange.create({
              data: {
                productId: productId,
                userId: user.id,
                type: "remove",
                quantity: item.quantity,
                reason: "Historical Import",
                reference: `Sale #${newSale.id}`,
                createdAt: date,
                updatedAt: date
              }
            });
          }
          
          // Return the complete sale
          return await tx.sale.findUnique({
            where: { id: newSale.id },
            include: { items: true }
          });
        });
        
        // Only add to salesCreated if the sale has items
        if (sale && sale.items.length > 0) {
          salesCreated.push(sale.id);
        } else {
          console.log(`[SALES IMPORT] Sale ${dateStr} has no items, may be deleted`);
          // Delete empty sales to keep database clean
          if (sale) {
            await prisma.sale.delete({ where: { id: sale.id } });
          }
        }
      } catch (error) {
        console.error(`[SALES IMPORT] Error creating sale for date ${dateStr}:`, error);
        errors.push({ date: dateStr, error: (error as Error).message });
        // Continue with next day instead of aborting the entire import
      }
    }

    console.log(`[SALES IMPORT] Created ${salesCreated.length} sales with ${salesItemsCreated.length} sale items`);
    
    // Verify the relationship between products and sales
    if (salesCreated.length > 0) {
      try {
        const verifySaleItems = await prisma.saleItem.findMany({
          where: {
            saleId: { in: salesCreated }
          },
          include: {
            product: true
          }
        });
        
        console.log(`[SALES IMPORT] Verification: Found ${verifySaleItems.length} sale items with product relationships`);
        
        // Log a few examples for debugging
        if (verifySaleItems.length > 0) {
          for (let i = 0; i < Math.min(3, verifySaleItems.length); i++) {
            const item = verifySaleItems[i];
            console.log(`[SALES IMPORT] Sample sale item ${i+1}: ProductID: ${item.productId}, Product name: ${item.product?.name || 'NULL'}`);
          }
        }
        
        // Check for items without products
        const itemsWithoutProduct = verifySaleItems.filter(item => !item.product);
        if (itemsWithoutProduct.length > 0) {
          console.error(`[SALES IMPORT] Found ${itemsWithoutProduct.length} sale items without connected products`);
        }
      } catch (error) {
        console.error('[SALES IMPORT] Error during verification:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${salesCreated.length} sales with a total of ${salesItemsCreated.length} line items`,
      saleCount: salesCreated.length,
      itemCount: salesItemsCreated.length,
      productsCreated: productsCreated.length,
      productsUpdated: productsUpdated.length,
      errors: errors // Always include the errors array, even if empty
    });
  } catch (error) {
    console.error('Error importing sales history:', error);
    return NextResponse.json(
      { error: 'Failed to import sales history', message: (error as Error).message },
      { status: 500 }
    );
  }
} 