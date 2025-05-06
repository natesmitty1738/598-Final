import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

interface InventoryItem {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitCost?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  location?: string;
  size?: string;
  color?: string;
}

export async function POST(request: Request) {
  try {
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

    // Parse the request body
    const body = await request.json();
    const { inventoryItems } = body as { inventoryItems: InventoryItem[] };

    if (!inventoryItems || !Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      return NextResponse.json({ error: 'No inventory items provided' }, { status: 400 });
    }

    // Process each inventory item
    const createdItems = [];
    for (const item of inventoryItems) {
      // validate required fields
      if (!item.name) {
        continue; // skip invalid entries
      }

      // check if the item with the same SKU already exists
      // if so, update it instead of creating a new one
      if (item.sku) {
        const existingItem = await prisma.product.findFirst({
          where: {
            sku: item.sku,
            userId: user.id,
          },
        });

        if (existingItem) {
          // update the existing item
          const updatedItem = await prisma.product.update({
            where: {
              id: existingItem.id,
            },
            data: {
              name: item.name,
              description: item.description || existingItem.description,
              category: item.category || existingItem.category,
              unitCost: item.unitCost !== undefined ? item.unitCost : existingItem.unitCost,
              sellingPrice: item.sellingPrice !== undefined ? item.sellingPrice : existingItem.sellingPrice,
              stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : existingItem.stockQuantity,
              location: item.location || existingItem.location,
              size: item.size || existingItem.size,
              color: item.color || existingItem.color,
            },
          });

          createdItems.push(updatedItem);
          continue;
        }
      }

      // create a new product
      try {
        const newProduct = await prisma.product.create({
          data: {
            sku: item.sku || `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            name: item.name,
            description: item.description || null,
            category: item.category || null,
            unitCost: item.unitCost || null,
            sellingPrice: item.sellingPrice || null,
            stockQuantity: item.stockQuantity || 0,
            location: item.location || null,
            size: item.size || null,
            color: item.color || null,
            userId: user.id,
          },
        });

        createdItems.push(newProduct);
      } catch (err) {
        console.error('Error creating product:', err);
        // Continue with the next item even if this one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${createdItems.length} inventory items`,
      count: createdItems.length,
    });
  } catch (error) {
    console.error('Error importing inventory items:', error);
    return NextResponse.json(
      { error: 'Failed to import inventory items' },
      { status: 500 }
    );
  }
} 