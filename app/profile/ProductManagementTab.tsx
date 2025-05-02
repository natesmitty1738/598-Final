'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Package, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  status: 'active' | 'draft' | 'archived';
};

export default function ProductManagementTab() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          // Ensure products is always an array
          const productArray = Array.isArray(data) ? data : (data?.products || []);
          setProducts(productArray);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addProduct = () => {
    // in a real app this would navigate to product creation page
    toast.info('This would navigate to the product creation page');
  };

  const editProduct = (id: string) => {
    // in a real app this would navigate to product edit page
    toast.info(`This would navigate to edit product ${id}`);
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setProducts(products => products.filter(product => product.id !== id));
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('An error occurred');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">Draft</span>;
      case 'archived':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Archived</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Ensure we're safely handling the products array
  const productArray = Array.isArray(products) ? products : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Products</h3>
        <Button onClick={addProduct} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {productArray.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-3 text-muted-foreground/60" />
              <p>No products created yet.</p>
              <Button onClick={addProduct} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Product
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {productArray.map((product) => (
            <Card key={product.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      {getStatusBadge(product.status)}
                    </div>
                    <CardDescription className="mt-1">
                      {product.description?.length > 100 
                        ? `${product.description.substring(0, 100)}...` 
                        : product.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => editProduct(product.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <div>Price: ${product.price?.toFixed(2) || '0.00'}</div>
                  <div>Inventory: {product.inventory || 0}</div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 