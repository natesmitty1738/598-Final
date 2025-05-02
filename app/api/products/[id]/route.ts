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
      include: {
        images: true,
        documents: true,
      }
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Transform the product to include image and document URLs as arrays
    const transformedProduct = {
      ...product,
      images: product.images.map(img => img.url),
      documents: product.documents.map(doc => doc.url)
    };

    return NextResponse.json(transformedProduct);
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

    // Parse the request body as JSON
    const data = await req.json();
    
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
      images = [],
      documents = []
    } = data;

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

    // Update the product with a transaction to handle images and documents
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // First, delete existing images and documents
      await tx.image.deleteMany({
        where: { productId: params.id }
      });
      
      await tx.document.deleteMany({
        where: { productId: params.id }
      });
      
      // Then update the product with new data
      const product = await tx.product.update({
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
          // Create new images
          images: {
            create: images.map((url: string) => ({
              url,
              alt: name
            }))
          },
          // Create new documents
          documents: {
            create: documents.map((url: string) => ({
              url,
              name: `Document for ${name}`,
              type: 'document'
            }))
          }
        },
        include: {
          images: true,
          documents: true
        }
      });
      
      return product;
    });

    // Transform the updated product to include image and document URLs as arrays
    const transformedProduct = {
      ...updatedProduct,
      images: updatedProduct.images.map(img => img.url),
      documents: updatedProduct.documents.map(doc => doc.url)
    };

    return NextResponse.json(transformedProduct);
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

    // Delete with a transaction to clean up related records
    await prisma.$transaction(async (tx) => {
      // Delete associated images
      await tx.image.deleteMany({
        where: { productId: params.id }
      });
      
      // Delete associated documents
      await tx.document.deleteMany({
        where: { productId: params.id }
      });
      
      // Delete associated sale items
      await tx.saleItem.deleteMany({
        where: { productId: params.id }
      });
      
      // Delete the product
      await tx.product.delete({
        where: {
          id: params.id,
          userId: session.user.id,
        }
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 