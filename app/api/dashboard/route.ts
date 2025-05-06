import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RevenueOverTime } from '@/lib/analytics/revenue-over-time';
import { ProjectedEarningsCalculator } from '@/lib/analytics/projected-earnings';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get total products count
    const totalProducts = await prisma.product.count({
      where: { userId: userId as string }
    });
    
    // Get low stock items count (items with quantity less than 10)
    const lowStockCount = await prisma.product.count({
      where: { 
        userId: userId as string,
        stockQuantity: { lt: 10 }
      }
    });
    
    // Calculate inventory value (price * quantity for each product)
    const inventoryValue = await prisma.product.findMany({
      where: { userId: userId as string },
      select: {
        sellingPrice: true,
        stockQuantity: true
      }
    });
    
    const totalInventoryValue = inventoryValue.reduce((total, product) => {
      return total + ((product.sellingPrice || 0) * (product.stockQuantity || 0));
    }, 0);
    
    // Get total sales count
    const totalSales = await prisma.sale.count({
      where: { userId: userId as string }
    });
    
    // Get total revenue - using the correct field name 'totalAmount'
    const revenueResult = await prisma.sale.aggregate({
      where: { userId: userId as string },
      _sum: {
        totalAmount: true
      }
    });
    
    const totalRevenue = revenueResult._sum?.totalAmount || 0;
    
    // Use RevenueOverTime class to get weekly trend
    let weeklyTrend = 0;
    try {
      const revenueAnalyzer = new RevenueOverTime(prisma);
      const revenueTrends = await revenueAnalyzer.analyzeRevenue(
        30, // analyze last 30 days
        userId as string
      );
      
      // Calculate weekly trend - handle string vs number type
      if (revenueTrends && revenueTrends.trend) {
        // If the trend is a string (like 'increasing'), convert to a numeric value
        if (typeof revenueTrends.trend === 'string') {
          switch(revenueTrends.trend) {
            case 'increasing':
              weeklyTrend = revenueTrends.growth?.overall || 0;
              break;
            case 'decreasing':
              weeklyTrend = revenueTrends.growth?.overall || 0;
              break;
            default:
              weeklyTrend = 0;
          }
        } else if (typeof revenueTrends.growth?.overall === 'number') {
          // Use overall growth percentage from the analysis
          weeklyTrend = revenueTrends.growth.overall;
        }
      }
    } catch (error) {
      console.log('Error analyzing revenue trends:', error);
      // Continue with default value for weeklyTrend
    }
    
    // Get recent sales (last 5)
    const recentSales = await prisma.sale.findMany({
      where: { userId: userId as string },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      take: 5
    });
    
    // Format recent sales for the frontend
    const formattedRecentSales = recentSales.map(sale => ({
      id: sale.id,
      date: sale.createdAt,
      total: sale.totalAmount,
      items: sale.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price
      }))
    }));
    
    // Get recent products (last 5 added)
    const recentProducts = await prisma.product.findMany({
      where: { userId: userId as string },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        stockQuantity: true,
        createdAt: true
      },
      take: 5
    });
    
    // Get low stock products (for displaying in the UI)
    const lowStockProducts = await prisma.product.findMany({
      where: { 
        userId: userId as string,
        stockQuantity: { 
          lt: 10, 
          gt: 0 
        }
      },
      orderBy: {
        stockQuantity: 'asc'
      },
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        stockQuantity: true
      },
      take: 5
    });
    
    return NextResponse.json({
      totalProducts,
      lowStockCount,
      totalSales,
      totalRevenue,
      recentSales: formattedRecentSales,
      recentProducts,
      lowStockProducts,
      inventoryValue: totalInventoryValue,
      weeklyTrend: parseFloat(weeklyTrend.toFixed(1))
    });
  
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
} 