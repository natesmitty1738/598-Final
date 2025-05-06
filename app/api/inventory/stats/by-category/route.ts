import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID
    const userId = session.user.id;

    // Get all products for this user
    const products = await prisma.product.findMany({
      where: {
        userId: userId,
      },
      select: {
        category: true,
        stockQuantity: true,
      },
    });

    // Group by category and sum quantities
    const categoriesMap = new Map<string, number>();
    
    products.forEach((product) => {
      const category = product.category || 'Uncategorized';
      const currentTotal = categoriesMap.get(category) || 0;
      categoriesMap.set(category, currentTotal + (product.stockQuantity || 0));
    });

    // Convert to array format for the chart
    const categories = Array.from(categoriesMap.entries())
      .map(([category, totalItems]) => ({ category, totalItems }))
      .sort((a, b) => b.totalItems - a.totalItems); // Sort by total items descending

    return NextResponse.json({
      categories,
      totalCategories: categories.length,
    });
  } catch (error) {
    console.error('Error fetching inventory categories stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory statistics' },
      { status: 500 }
    );
  }
} 