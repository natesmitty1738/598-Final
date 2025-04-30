import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface Activity {
  type: 'sale' | 'inventory' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get recent sales
    const recentSales = await prisma.sale.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Get recent low stock alerts
    const lowStockProducts = await prisma.product.findMany({
      where: {
        userId: session.user.id,
        stockQuantity: {
          lte: 10,
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
      take: 5,
    });

    // Format activities
    const activities: Activity[] = [
      ...recentSales.map((sale): Activity => ({
        type: 'sale',
        title: 'New Sale',
        description: `Sale of ${sale.items.length} items for $${sale.totalAmount.toFixed(2)}`,
        timestamp: sale.createdAt,
        icon: 'BarChart4',
        color: 'green',
      })),
      ...lowStockProducts.map((product): Activity => ({
        type: 'alert',
        title: 'Low Stock Alert',
        description: `${product.name} is running low (${product.stockQuantity} units remaining)`,
        timestamp: new Date(),
        icon: 'AlertTriangle',
        color: 'red',
      })),
    ];

    // Sort activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 