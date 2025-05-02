import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { saleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const saleId = params.saleId;
    const body = await req.json();
    const { paymentMethod, paymentStatus, totalAmount } = body;

    // Check if sale exists and belongs to user
    const existingSale = await prisma.sale.findUnique({
      where: {
        id: saleId,
        userId: session.user.id,
      },
    });

    if (!existingSale) {
      return new NextResponse("Sale not found", { status: 404 });
    }

    // Update the sale
    const updateData: any = {};
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    if (totalAmount !== undefined) {
      updateData.totalAmount = totalAmount;
    }

    const updatedSale = await prisma.sale.update({
      where: {
        id: saleId,
      },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error("[SALE_PUT]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { saleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const saleId = params.saleId;

    // Check if sale exists and belongs to user
    const existingSale = await prisma.sale.findUnique({
      where: {
        id: saleId,
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!existingSale) {
      return new NextResponse("Sale not found", { status: 404 });
    }

    // Begin transaction to restore stock and delete sale
    await prisma.$transaction(async (tx) => {
      // Restore product stock quantities if payment was completed
      if (existingSale.paymentStatus === "COMPLETED") {
        for (const item of existingSale.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product?.stockQuantity !== null) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // Delete all sale items first
      await tx.saleItem.deleteMany({
        where: {
          saleId,
        },
      });

      // Delete the sale
      await tx.sale.delete({
        where: {
          id: saleId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SALE_DELETE]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 