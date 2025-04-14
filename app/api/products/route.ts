import { NextResponse } from 'next/server';

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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  // If ID is provided, return specific product
  if (id) {
    const product = products.find(p => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  // Otherwise return all products
  return NextResponse.json(products);
}

// POST /api/products - Create a new product
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });
    }
    
    // Create new product
    const newProduct = {
      id: generateId(),
      name: data.name,
      description: data.description || '',
      unitCost: parseFloat(data.unitCost) || 0,
      sellingPrice: parseFloat(data.sellingPrice) || 0,
      stockQuantity: parseInt(data.stockQuantity) || 0,
      sku: data.sku,
      category: data.category || '',
      size: data.size || '',
      color: data.color || ''
    };
    
    // Check if SKU already exists
    if (products.some(p => p.sku === data.sku)) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    
    // Add to products array
    products.push(newProduct);
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
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