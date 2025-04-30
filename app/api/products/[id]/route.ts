import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      sku,
      name,
      description,
      unitCost,
      sellingPrice,
      stockQuantity,
      location,
      category,
      size,
      color,
    } = body;

    // Validate required fields
    if (!sku || !name || unitCost === undefined || sellingPrice === undefined || stockQuantity === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if SKU is unique (excluding current product)
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku,
        id: { not: params.id },
      },
    });

    if (existingProduct) {
      return new NextResponse("SKU already exists", { status: 400 });
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        sku,
        name,
        description,
        unitCost,
        sellingPrice,
        stockQuantity,
        location,
        category,
        size,
        color,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First, delete all associated sale items
    await prisma.saleItem.deleteMany({
      where: {
        productId: params.id,
      },
    });

    // Then delete the product
    await prisma.product.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 