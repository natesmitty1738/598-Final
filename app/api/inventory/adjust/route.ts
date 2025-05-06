import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/inventory/adjust - Adjust inventory and record the change
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const { productId, quantity, type } = await req.json();

    // Validate inputs
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }
    
    if (!type || !['INCREASE', 'DECREASE', 'ADJUSTMENT'].includes(type)) {
      return NextResponse.json({ error: 'Valid type (INCREASE, DECREASE, or ADJUSTMENT) is required' }, { status: 400 });
    }

    // Get the product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: user.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate new stock quantity
    let newStockQuantity = product.stockQuantity || 0;
    
    if (type === 'INCREASE') {
      newStockQuantity += quantity;
    } else if (type === 'DECREASE') {
      // Prevent negative inventory unless allowed
      if (newStockQuantity < quantity) {
        return NextResponse.json({ 
          error: 'Insufficient stock available' 
        }, { status: 400 });
      }
      newStockQuantity -= quantity;
    } else if (type === 'ADJUSTMENT') {
      // Direct adjustment to a specific value
      newStockQuantity = quantity;
    }

    // Update product and create inventory change record within a transaction
    const result = await prisma.$transaction([
      // Update product stock
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStockQuantity }
      }),
      
      // Create inventory change record
      prisma.inventoryChange.create({
        data: {
          type,
          quantity,
          productId,
          userId: user.id
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      product: result[0],
      change: result[1]
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json(
      { error: 'Failed to adjust inventory' },
      { status: 500 }
    );
  }
} 