import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        paymentStatus: "COMPLETED",
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

    const sales = await prisma.sale.findMany({
      where: {
        userId: session.user.id,
      },
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
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.sale.count({
      where: {
        userId: session.user.id,
      },
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