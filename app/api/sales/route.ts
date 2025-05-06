import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Define payment status types to replace the missing import
const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED'
} as const;

// Valid payment methods as string literals for validation
const VALID_PAYMENT_METHODS = [
  'CASH',
  'CREDIT_CARD', 
  'DEBIT_CARD',
  'PAYPAL',
  'STRIPE',
  'INVOICE'
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { items, paymentMethod, totalAmount } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("No items provided", { status: 400 });
    }

    if (!paymentMethod) {
      return new NextResponse("Payment method is required", { status: 400 });
    }

    // Validate payment method
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return new NextResponse(`Invalid payment method. Valid options are: ${VALID_PAYMENT_METHODS.join(", ")}`, 
        { status: 400 });
    }

    if (!totalAmount || totalAmount <= 0) {
      return new NextResponse("Invalid total amount", { status: 400 });
    }

    // Verify all products exist and have sufficient stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return new NextResponse(`Product ${item.productId} not found`, { status: 404 });
      }

      if (product.stockQuantity !== null && product.stockQuantity < item.quantity) {
        return new NextResponse(`Insufficient stock for product ${product.name}`, { status: 400 });
      }
    }

    // Create the sale
    const sale = await prisma.sale.create({
      data: {
        totalAmount,
        paymentMethod,
        paymentStatus: "COMPLETED", // Use string literal for now
        userId: session.user.id,
        items: {
          create: items.map((item: any) => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update product stock quantities
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product?.stockQuantity !== null) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        // Record the inventory change
        await prisma.inventoryChange.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            type: "remove",
            quantity: item.quantity,
            reason: "Sale",
            reference: `Sale #${sale.id}`,
          },
        });
      }
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("[SALES_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortKey = searchParams.get("sortKey") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Build where clause
    const whereClause = {
      userId: session.user.id,
    };

    // Build the orderBy object dynamically based on the sortKey
    let orderBy: any = {};
    
    // Handle special cases for sorting
    if (sortKey === "itemsCount") {
      // Prisma doesn't support direct sorting by relation count in findMany
      // We need to use a different approach - using _count in include query
      
      // First, get all sales without pagination, so we can sort them by item count
      const allSales = await prisma.sale.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { items: true }
          },
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
      
      // Sort by item count manually
      const sortedSales = allSales.sort((a, b) => {
        const countA = a._count.items;
        const countB = b._count.items;
        return sortDir === 'asc' ? countA - countB : countB - countA;
      });
      
      // Apply pagination manually after sorting
      const paginatedSales = sortedSales.slice(
        (page - 1) * limit, 
        page * limit
      );
      
      console.log("Sales API - Manual sorting by items count:", 
        `Found ${allSales.length} sales, displaying ${paginatedSales.length}`);
      
      return NextResponse.json({
        sales: paginatedSales,
        total: allSales.length,
        totalPages: Math.ceil(allSales.length / limit),
      });
    }
    
    // Standard field sorting with normal Prisma query
    if (sortKey && sortKey.trim() !== "") {
      orderBy[sortKey] = sortDir;
      console.log("Sales API - Sorting by:", orderBy);
    } else {
      // Default sort
      orderBy["createdAt"] = "desc";
      console.log("Sales API - Using default sort:", orderBy);
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.sale.count({
      where: whereClause,
    });

    return NextResponse.json({
      sales,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[SALES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 