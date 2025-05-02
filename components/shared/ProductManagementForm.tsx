'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ProductData {
  id?: string;
  sku: string;
  name: string;
  description?: string;
  unitCost?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  location?: string;
  category?: string;
  size?: string;
  color?: string;
  images?: {id: string; url: string; alt?: string}[];
}

export interface ProductManagementFormProps {
  initialProducts?: ProductData[];
  onSubmit: (products: ProductData[]) => Promise<void>;
  onCancel?: () => void;
  isWizardMode?: boolean;
  maxProducts?: number;
}

export default function ProductManagementForm({
  initialProducts,
  onSubmit,
  onCancel,
  isWizardMode = false,
  maxProducts = 5
}: ProductManagementFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductData[]>(initialProducts || []);
  const [currentProduct, setCurrentProduct] = useState<ProductData>({
    sku: '',
    name: '',
    description: '',
    unitCost: undefined,
    sellingPrice: undefined,
    stockQuantity: undefined,
    location: '',
    category: '',
    size: '',
    color: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  // Update products when initialProducts changes
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number | undefined = value;
    
    // Convert numeric values
    if (['unitCost', 'sellingPrice', 'stockQuantity'].includes(name)) {
      // Allow empty string to clear the field
      processedValue = value === '' ? undefined : Number(value);
      
      // Check if it's a valid number
      if (processedValue !== undefined && isNaN(processedValue)) {
        return; // Don't update if not a valid number
      }
    }
    
    setCurrentProduct(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };
  
  const generateSku = () => {
    // Create a simple SKU based on product name and timestamp
    if (!currentProduct.name) {
      toast.error('Product name is required to generate SKU');
      return;
    }
    
    const prefix = currentProduct.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${prefix}-${timestamp}`;
    
    setCurrentProduct(prev => ({
      ...prev,
      sku
    }));
  };
  
  const addProduct = () => {
    // Validate required fields
    if (!currentProduct.sku.trim()) {
      setError('SKU is required');
      return;
    }
    
    if (!currentProduct.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    // Check if max product limit is reached
    if (products.length >= maxProducts) {
      setError(`You can only add up to ${maxProducts} products in this view`);
      return;
    }
    
    // Check if SKU is unique
    if (products.some(p => p.sku === currentProduct.sku && (editIndex === null || p !== products[editIndex]))) {
      setError('SKU must be unique');
      return;
    }
    
    setError(null);
    
    if (editMode && editIndex !== null) {
      // Update existing product
      const updatedProducts = [...products];
      updatedProducts[editIndex] = { ...currentProduct };
      setProducts(updatedProducts);
      setEditMode(false);
      setEditIndex(null);
    } else {
      // Add new product
      setProducts(prev => [...prev, { ...currentProduct }]);
    }
    
    // Reset current product form
    setCurrentProduct({
      sku: '',
      name: '',
      description: '',
      unitCost: undefined,
      sellingPrice: undefined,
      stockQuantity: undefined,
      location: '',
      category: '',
      size: '',
      color: ''
    });
  };
  
  const editProduct = (index: number) => {
    setCurrentProduct({ ...products[index] });
    setEditMode(true);
    setEditIndex(index);
  };
  
  const deleteProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
    
    // If deleting the product currently being edited, reset the form
    if (editMode && editIndex === index) {
      setCurrentProduct({
        sku: '',
        name: '',
        description: '',
        unitCost: undefined,
        sellingPrice: undefined,
        stockQuantity: undefined,
        location: '',
        category: '',
        size: '',
        color: ''
      });
      setEditMode(false);
      setEditIndex(null);
    }
  };
  
  const cancelEdit = () => {
    setCurrentProduct({
      sku: '',
      name: '',
      description: '',
      unitCost: undefined,
      sellingPrice: undefined,
      stockQuantity: undefined,
      location: '',
      category: '',
      size: '',
      color: ''
    });
    setEditMode(false);
    setEditIndex(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    // Validate that we have at least one product
    if (products.length === 0) {
      setError('Please add at least one product');
      setSaving(false);
      return;
    }
    
    try {
      await onSubmit(products);
      
      if (!isWizardMode) {
        toast.success('Products saved successfully');
      }
    } catch (err) {
      console.error('Error saving products:', err);
      setError(err instanceof Error ? err.message : 'Failed to save products');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="w-full">
      {isWizardMode && (
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900">
              <Package className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-center">Product Setup</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
            Add your initial products to get started with inventory management.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Form */}
        <div className="bg-muted/20 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {editMode ? 'Edit Product' : 'Add New Product'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU*
              </Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  name="sku"
                  value={currentProduct.sku}
                  onChange={handleInputChange}
                  placeholder="Product SKU"
                  className="flex-grow"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSku}
                  className="whitespace-nowrap"
                >
                  Generate
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name*
              </Label>
              <Input
                id="name"
                name="name"
                value={currentProduct.name}
                onChange={handleInputChange}
                placeholder="Product Name"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={currentProduct.description || ''}
                onChange={handleInputChange}
                placeholder="Product Description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitCost">
                Unit Cost
              </Label>
              <Input
                id="unitCost"
                name="unitCost"
                type="number"
                step="0.01"
                value={currentProduct.unitCost === undefined ? '' : currentProduct.unitCost}
                onChange={handleInputChange}
                placeholder="Cost per Unit"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">
                Selling Price
              </Label>
              <Input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                step="0.01"
                value={currentProduct.sellingPrice === undefined ? '' : currentProduct.sellingPrice}
                onChange={handleInputChange}
                placeholder="Selling Price"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">
                Stock Quantity
              </Label>
              <Input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                value={currentProduct.stockQuantity === undefined ? '' : currentProduct.stockQuantity}
                onChange={handleInputChange}
                placeholder="Initial Stock"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">
                Category
              </Label>
              <Input
                id="category"
                name="category"
                value={currentProduct.category || ''}
                onChange={handleInputChange}
                placeholder="Product Category"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            {editMode && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="button"
              onClick={addProduct}
            >
              {editMode ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </div>
        
        {/* Products Table */}
        <div>
          <h3 className="text-lg font-medium mb-4">Products ({products.length}/{maxProducts})</h3>
          
          {products.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Price</TableHead>
                    <TableHead className="hidden md:table-cell">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={product.sku}>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.sellingPrice !== undefined ? 
                          `$${product.sellingPrice.toFixed(2)}` : 
                          '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.stockQuantity !== undefined ? 
                          product.stockQuantity : 
                          '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editProduct(index)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProduct(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/30">
              <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No products added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some products to get started with inventory management
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={saving || products.length === 0}
          >
            {saving ? 'Saving...' : isWizardMode ? 'Save & Continue' : 'Save Products'}
          </Button>
        </div>
      </form>
    </div>
  );
} 