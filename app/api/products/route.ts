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
    const sortKey = searchParams.get("sortKey") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Build the orderBy object dynamically based on the sortKey
    const orderBy: any = {};
    
    // Only set orderBy if sortKey is not empty
    if (sortKey && sortKey.trim() !== "") {
      // Handle special cases for fields not directly in the database schema
      if (sortKey === "price") {
        // Map 'price' to 'sellingPrice' which exists in the database
        orderBy["sellingPrice"] = sortDir;
        console.log("Products API - Special case: Mapping price sorting to sellingPrice:", orderBy);
      } else {
        // Standard field sorting
        orderBy[sortKey] = sortDir;
        console.log("Products API - Standard sorting by:", orderBy);
      }
    } else {
      // Default sort
      orderBy["createdAt"] = "desc"; 
      console.log("Products API - Default sorting by createdAt desc");
    }

    console.log("Products API - Final orderBy:", orderBy);

    const products = await prisma.product.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy,
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
      // Prepare images as JSON
      const imagesData = images.map((url: string) => ({
        url,
        alt: name
      }));

      // Prepare documents as JSON
      const documentsData = documents.map((url: string) => ({
        url,
        name: `Document for ${name}`,
        type: 'document'
      }));

      const product = await prisma.product.create({
        data: {
          sku,
          name,
          description: description || null,
          unitCost: unitCost !== undefined ? parseFloat(String(unitCost)) : undefined,
          sellingPrice: sellingPrice !== undefined ? parseFloat(String(sellingPrice)) : undefined,
          stockQuantity: stockQuantity !== undefined ? parseInt(String(stockQuantity)) : undefined,
          location: location || undefined,
          category: category || undefined,
          size: size || undefined,
          color: color || null,
          userId: session.user.id,
          imagesJson: images.length > 0 ? imagesData : null,
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
    
    // Prepare images as JSON if provided
    let imagesJson = undefined;
    if (data.images && Array.isArray(data.images)) {
      const imagesData = data.images.map((url: string) => ({
        url,
        alt: data.name || existingProduct.name
      }));
      imagesJson = imagesData.length > 0 ? imagesData : null;
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
          imagesJson: imagesJson
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
      return NextResponse.json({ error: 'Product not found or you do not have permission to delete it' }, { status: 404 });
    }
    
    // Delete the product
    await prisma.product.delete({
      where: {
        id
      },
    });
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 