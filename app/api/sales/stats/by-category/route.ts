import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Extract category from product name (format: "Product Name (Category)")
const extractCategory = (productName: string): string => {
  const match = productName.match(/\(([^)]+)\)/);
  return match ? match[1] : 'Uncategorized';
};

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID
    const userId = session.user.id;

    // Get all sale items for this user from the consolidated model
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          userId: userId
        }
      },
      include: {
        product: true,
        sale: true
      }
    });

    // Group by category and sum amounts
    const categoriesMap = new Map<string, number>();
    
    saleItems.forEach((item) => {
      // Use productName from SaleItem, or product.name as a fallback
      const productName = item.productName || item.product.name;
      const category = item.product.category || extractCategory(productName);
      const totalAmount = item.price * item.quantity;
      
      const currentTotal = categoriesMap.get(category) || 0;
      categoriesMap.set(category, currentTotal + totalAmount);
    });

    // Convert to array format for the chart
    const categories = Array.from(categoriesMap.entries())
      .map(([category, totalSales]) => ({ category, totalSales }))
      .sort((a, b) => b.totalSales - a.totalSales); // Sort by total sales descending

    return NextResponse.json({
      categories,
      totalCategories: categories.length,
    });
  } catch (error) {
    console.error('Error fetching sales categories stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales statistics' },
      { status: 500 }
    );
  }
} 