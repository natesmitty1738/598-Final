import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Get all products with pagination
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const products = await prisma.product.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        images: true,
        documents: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.product.count({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      products,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function ensureUploadDirectories() {
  const uploadDirs = [
    join(process.cwd(), 'public/uploads/images'),
    join(process.cwd(), 'public/uploads/documents'),
  ];

  for (const dir of uploadDirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Create a new product
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    if (!sku || !name) {
      return new NextResponse("SKU and name are required", { status: 400 });
    }

    // Check unique SKU for this user
    const existingProduct = await prisma.product.findFirst({
      where: { 
        sku,
        userId: session.user.id
      },
    });

    if (existingProduct) {
      return NextResponse.json({ error: "This SKU is already in use in your inventory. Please use a different SKU." }, { status: 400 });
    }

    try {
      const product = await prisma.product.create({
        data: {
          sku,
          name,
          description: description || null,
          unitCost: unitCost !== undefined ? parseFloat(String(unitCost)) : null,
          sellingPrice: sellingPrice !== undefined ? parseFloat(String(sellingPrice)) : null,
          stockQuantity: stockQuantity !== undefined ? parseInt(String(stockQuantity)) : null,
          location: location || null,
          category: category || null,
          size: size || null,
          color: color || null,
          userId: session.user.id,
          images: {
            create: images.map((url: string) => ({
              url,
              alt: name
            }))
          },
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

      return NextResponse.json(product);
    } catch (error: any) {
      // Handle SKU unique constraint errors
      if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        return NextResponse.json({ error: "This SKU is already in use in your inventory. Please use a different SKU." }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Update a product
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    const data = await req.json();
    
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Check if SKU is being changed and already exists
    if (data.sku && data.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findFirst({
        where: {
          sku: data.sku,
          userId: session.user.id,
          id: { not: id }
        },
      });
      
      if (duplicateSku) {
        return NextResponse.json({ error: "This SKU is already in use in your inventory. Please use a different SKU." }, { status: 400 });
      }
    }
    
    try {
      const updatedProduct = await prisma.product.update({
        where: {
          id,
        },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          description: data.description !== undefined ? data.description : undefined,
          unitCost: data.unitCost !== undefined ? parseFloat(String(data.unitCost)) : undefined,
          sellingPrice: data.sellingPrice !== undefined ? parseFloat(String(data.sellingPrice)) : undefined,
          stockQuantity: data.stockQuantity !== undefined ? parseInt(String(data.stockQuantity)) : undefined,
          sku: data.sku !== undefined ? data.sku : undefined,
          category: data.category !== undefined ? data.category : undefined,
          size: data.size !== undefined ? data.size : undefined,
          color: data.color !== undefined ? data.color : undefined,
          location: data.location !== undefined ? data.location : undefined,
        },
        include: {
          images: true,
          documents: true
        }
      });
      
      return NextResponse.json(updatedProduct);
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        return NextResponse.json({ error: "This SKU is already in use in your inventory. Please use a different SKU." }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// Delete a product
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Find the product to delete
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Delete any associated images and documents
    await prisma.$transaction([
      prisma.image.deleteMany({
        where: { productId: id }
      }),
      prisma.document.deleteMany({
        where: { productId: id }
      }),
      prisma.product.delete({
        where: { id }
      })
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 