import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/inventory - Get all products
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { userId: user.id },
      include: {
        images: true,
        documents: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create a new product
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
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
      images,
      documents,
    } = data;

    console.log("Creating product:", { sku, name, unitCost, sellingPrice, stockQuantity });

    // Validate required fields
    if (!sku || !name) {
      return NextResponse.json({ error: 'SKU and name are required' }, { status: 400 });
    }

    // Ensure numeric values are properly parsed
    const parsedUnitCost = typeof unitCost === 'string' ? parseFloat(unitCost) : (unitCost || 0);
    const parsedSellingPrice = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : (sellingPrice || 0);
    const parsedStockQuantity = typeof stockQuantity === 'string' ? parseInt(stockQuantity.toString()) : (stockQuantity || 0);

    // Create the product
    try {
      const product = await prisma.product.create({
        data: {
          sku,
          name,
          description: description || "",
          unitCost: parsedUnitCost,
          sellingPrice: parsedSellingPrice,
          stockQuantity: parsedStockQuantity,
          location: location || "",
          category: category || "",
          size: size || "",
          color: color || "",
          userId: user.id,
          images: {
            create: Array.isArray(images) && images.length > 0
              ? images.map((url: string) => ({
                  url,
                  alt: name,
                }))
              : [],
          },
          documents: {
            create: Array.isArray(documents) && documents.length > 0
              ? documents.map((url: string) => ({
                  url,
                  name: url.split('/').pop() || 'Document',
                  type: url.split('.').pop() || 'unknown',
                }))
              : [],
          },
        },
        include: {
          images: true,
          documents: true,
        },
      });

      console.log("Product created successfully:", product.id);
      return NextResponse.json(product);
    } catch (dbError) {
      console.error("Database error creating product:", dbError);
      return NextResponse.json(
        { error: 'Failed to create product in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory - Update a product
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const {
      id,
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
      images,
      documents,
    } = data;

    // Verify the product belongs to the user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete existing images and documents
    await prisma.image.deleteMany({
      where: { productId: id },
    });

    await prisma.document.deleteMany({
      where: { productId: id },
    });

    // Update the product with new data
    const product = await prisma.product.update({
      where: { id },
      data: {
        sku,
        name,
        description,
        unitCost: parseFloat(unitCost),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity),
        location,
        category,
        size,
        color,
        images: {
          create: images?.map((url: string) => ({
            url,
            alt: name,
          })) || [],
        },
        documents: {
          create: documents?.map((url: string) => ({
            url,
            name: url.split('/').pop() || 'Document',
            type: url.split('.').pop() || 'unknown',
          })) || [],
        },
      },
      include: {
        images: true,
        documents: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
} 