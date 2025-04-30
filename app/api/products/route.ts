import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Since we don't have a database yet, we'll store products in memory for now
let products: any[] = [
  {
    id: '1',
    name: 'Men\'s T-Shirt',
    description: 'Comfortable cotton t-shirt',
    unitCost: 10.50,
    sellingPrice: 19.99,
    stockQuantity: 15,
    sku: 'TS-001',
    category: 'Clothing',
    size: 'L',
    color: 'Blue'
  },
  {
    id: '2',
    name: 'Women\'s Jeans',
    description: 'Stylish denim jeans',
    unitCost: 25.00,
    sellingPrice: 49.99,
    stockQuantity: 8,
    sku: 'WJ-002',
    category: 'Clothing',
    size: 'M',
    color: 'Black'
  },
  {
    id: '3',
    name: 'Baseball Cap',
    description: 'Adjustable cotton cap',
    unitCost: 8.00,
    sellingPrice: 14.99,
    stockQuantity: 25,
    sku: 'BC-003',
    category: 'Hats',
    size: 'One Size',
    color: 'Red'
  },
  {
    id: '4',
    name: 'Leather Wallet',
    description: 'Genuine leather wallet',
    unitCost: 15.00,
    sellingPrice: 29.99,
    stockQuantity: 5,
    sku: 'LW-004',
    category: 'Accessories',
    size: '',
    color: 'Brown'
  },
  {
    id: '5',
    name: 'Sneakers',
    description: 'Comfortable athletic shoes',
    unitCost: 35.00,
    sellingPrice: 79.99,
    stockQuantity: 0,
    sku: 'SN-005',
    category: 'Footwear',
    size: '10',
    color: 'White'
  }
];

// Helper function to generate IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// GET /api/products - Get all products
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

// POST /api/products - Create a new product
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await ensureUploadDirectories();

    const formData = await req.formData();
    
    // Get basic product data
    const sku = formData.get('sku') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const unitCost = formData.get('unitCost') ? parseFloat(formData.get('unitCost') as string) : null;
    const sellingPrice = formData.get('sellingPrice') ? parseFloat(formData.get('sellingPrice') as string) : null;
    const stockQuantity = formData.get('stockQuantity') ? parseInt(formData.get('stockQuantity') as string) : null;
    const location = formData.get('location') as string;
    const category = formData.get('category') as string;
    const size = formData.get('size') as string;
    const color = formData.get('color') as string;

    // Validate required fields
    if (!sku || !name) {
      return new NextResponse("SKU and name are required", { status: 400 });
    }

    // Check if SKU is unique
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return new NextResponse("SKU already exists", { status: 400 });
    }

    // Create product first
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description: description || undefined,
        unitCost: unitCost !== null ? unitCost : undefined,
        sellingPrice: sellingPrice !== null ? sellingPrice : undefined,
        stockQuantity: stockQuantity !== null ? stockQuantity : undefined,
        location: location || undefined,
        category: category || undefined,
        size: size || undefined,
        color: color || undefined,
        userId: session.user.id,
      } as any, // Temporary type assertion to handle optional numeric fields
    });

    // Handle image uploads
    const images = formData.getAll('images') as File[];
    for (const image of images) {
      if (image) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const path = join(process.cwd(), 'public/uploads/images', `${product.id}-${image.name}`);
        await writeFile(path, buffer);
        
        await prisma.image.create({
          data: {
            url: `/uploads/images/${product.id}-${image.name}`,
            alt: image.name,
            productId: product.id,
          },
        });
      }
    }

    // Handle document uploads
    const documents = formData.getAll('documents') as File[];
    for (const doc of documents) {
      if (doc) {
        const bytes = await doc.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const path = join(process.cwd(), 'public/uploads/documents', `${product.id}-${doc.name}`);
        await writeFile(path, buffer);
        
        await prisma.document.create({
          data: {
            name: doc.name,
            url: `/uploads/documents/${product.id}-${doc.name}`,
            type: doc.type,
            productId: product.id,
          },
        });
      }
    }

    // Fetch the complete product with images and documents
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        documents: true,
      },
    });

    return NextResponse.json(completeProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT /api/products?id=123 - Update a product
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    const data = await req.json();
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Check if SKU is being changed and already exists
    if (data.sku !== products[productIndex].sku && products.some(p => p.sku === data.sku)) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    
    // Update product
    const updatedProduct = {
      ...products[productIndex],
      name: data.name || products[productIndex].name,
      description: data.description || products[productIndex].description,
      unitCost: parseFloat(data.unitCost) || products[productIndex].unitCost,
      sellingPrice: parseFloat(data.sellingPrice) || products[productIndex].sellingPrice,
      stockQuantity: parseInt(data.stockQuantity) || products[productIndex].stockQuantity,
      sku: data.sku || products[productIndex].sku,
      category: data.category || products[productIndex].category,
      size: data.size || products[productIndex].size,
      color: data.color || products[productIndex].color
    };
    
    products[productIndex] = updatedProduct;
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products?id=123 - Delete a product
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Remove from array
    products.splice(productIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 