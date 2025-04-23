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

    // Create test products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Test Product 1',
          sku: 'TP001',
          description: 'Test product description',
          unitCost: 10.00,
          sellingPrice: 19.99,
          stockQuantity: 100,
          userId: session.user.id,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Test Product 2',
          sku: 'TP002',
          description: 'Another test product',
          unitCost: 15.00,
          sellingPrice: 29.99,
          stockQuantity: 50,
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("[SEED_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 