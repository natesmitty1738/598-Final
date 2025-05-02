import React, { useState, useEffect } from 'react';
import { Package, Plus, X, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductForm, { Product } from '@/components/forms/ProductForm';

interface InventorySetupStepProps {
  formData: any;
  userId: string;
  onComplete: (data: any) => void;
  updateFormData: (data: any) => void;
}

// Sample product templates
const PRODUCT_TEMPLATES: { [key: string]: Partial<Product>[] } = {
  'Food & Beverage': [
    {
      name: 'Coffee - House Blend',
      category: 'Coffee',
      unitCost: 5.50,
      sellingPrice: 12.99,
    },
    {
      name: 'Tea - Earl Grey',
      category: 'Tea',
      unitCost: 3.25,
      sellingPrice: 8.99,
    },
    {
      name: 'Chocolate Croissant',
      category: 'Pastries',
      unitCost: 1.75,
      sellingPrice: 4.50,
    }
  ],
  'Retail': [
    {
      name: 'T-Shirt - Basic',
      category: 'Apparel',
      unitCost: 8.50,
      sellingPrice: 24.99,
    },
    {
      name: 'Jeans - Classic',
      category: 'Apparel',
      unitCost: 22.00,
      sellingPrice: 59.99,
    },
    {
      name: 'Water Bottle',
      category: 'Accessories',
      unitCost: 5.00,
      sellingPrice: 15.99,
    }
  ]
};

export default function InventorySetupStep({ formData, onComplete, updateFormData, userId }: InventorySetupStepProps) {
  // Get products from the correct property (products array)
  const initialProducts = formData?.products || [];
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [businessType, setBusinessType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize form when mounted
  useEffect(() => {
    if (formData?.products && Array.isArray(formData.products)) {
      setProducts(formData.products);
    }
  }, [formData?.products]);
  
  // Fetch business profile to determine business type
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        const response = await fetch('/api/business-profile');
        if (response.ok) {
          const data = await response.json();
          if (data.industry) {
            setBusinessType(data.industry);
          }
        }
      } catch (err) {
        console.error('Error fetching business profile:', err);
      }
    };
    
    if (products.length === 0) {
      fetchBusinessProfile();
    }
  }, [products.length]);
  
  const handleUseTemplate = () => {
    if (businessType && PRODUCT_TEMPLATES[businessType]) {
      // Generate SKUs and add stock quantities to the template products
      const templatedProducts = PRODUCT_TEMPLATES[businessType].map((template, index) => ({
        ...template,
        sku: `SKU${String(index + 1).padStart(4, '0')}`,
        stockQuantity: 10,
        images: [],
        documents: [],
      })) as Product[];
      
      setProducts(templatedProducts);
      
      // Update form data to persist changes - use products array consistently
      updateFormData({ products: templatedProducts });
    }
  };
  
  const handleAddProduct = () => {
    setIsAddingProduct(true);
    setIsEditingProduct(false);
    setEditingProductIndex(null);
  };
  
  const handleEditProduct = (index: number) => {
    setIsEditingProduct(true);
    setIsAddingProduct(false);
    setEditingProductIndex(index);
  };
  
  const handleCancelAdd = () => {
    setIsAddingProduct(false);
    setIsEditingProduct(false);
    setEditingProductIndex(null);
  };
  
  const handleSaveProduct = (product: Product) => {
    let updatedProducts;
    
    if (isEditingProduct && editingProductIndex !== null) {
      // Update existing product
      updatedProducts = [...products];
      updatedProducts[editingProductIndex] = product;
      setProducts(updatedProducts);
      setIsEditingProduct(false);
      setEditingProductIndex(null);
    } else {
      // Add the new product to the list
      updatedProducts = [...products, product];
      setProducts(updatedProducts);
      setIsAddingProduct(false);
    }
    
    // Update form data to persist changes - use products array consistently
    updateFormData({ products: updatedProducts });
    
    setError(null);
  };
  
  const handleRemoveProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    
    // Update form data to persist changes - use products array consistently
    updateFormData({ products: updatedProducts });
  };
  
  const handleSubmit = async () => {
    setError(null);
    setIsSaving(true);
    
    // Make sure there's at least one product
    if (products.length === 0) {
      setError('Please add at least one product to continue');
      setIsSaving(false);
      return;
    }
    
    try {
      // Save products to the API
      const results = [];
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Generate a unique SKU with timestamp to avoid conflicts
        const uniqueSku = `SKU${Date.now().toString().slice(-6)}${i}`;
        
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...product,
            // Use the unique SKU to avoid constraint violations
            sku: uniqueSku,
            unitCost: typeof product.unitCost === 'string' ? parseFloat(product.unitCost) : product.unitCost,
            sellingPrice: typeof product.sellingPrice === 'string' ? parseFloat(product.sellingPrice) : product.sellingPrice,
            stockQuantity: typeof product.stockQuantity === 'string' ? parseInt(product.stockQuantity.toString()) : product.stockQuantity,
          }),
        });
        
        if (response.ok) {
          const savedProduct = await response.json();
          results.push(savedProduct);
        } else {
          // If there's an error, try to parse the response
          let errorMessage = 'Failed to save product';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
        }
      }
      
      // Pass back the products array - consistent naming is important
      const finalData = { products: results };
      
      // Save the list to formData
      updateFormData(finalData);
      
      // Call onComplete with the saved products
      onComplete(finalData);
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      setError(error?.message || 'An error occurred. Please try again.');
      setIsSaving(false);
    }
  };
  
  return (
    <div className="py-6">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900">
          <Package className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-center">Initial Inventory Setup</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
        Let's add your first few products to start tracking your inventory.
      </p>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}
      
      {products.length === 0 && !isAddingProduct && businessType && PRODUCT_TEMPLATES[businessType] && (
        <div className="mb-6 text-center">
          <p className="mb-2">
            We have a template for {businessType} businesses. Would you like to use it?
          </p>
          <Button
            onClick={handleUseTemplate}
            variant="secondary"
            className="mx-auto"
          >
            Use Template
          </Button>
        </div>
      )}
      
      {/* Product list */}
      {products.length > 0 && (
        <div className="mb-6 space-y-4 bg-card border rounded-lg p-4">
          <h3 className="text-lg font-medium">Your Products</h3>
          <div className="space-y-2">
            {products.map((product, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-md bg-background"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Price: ${typeof product.sellingPrice === 'string' 
                        ? parseFloat(product.sellingPrice).toFixed(2) 
                        : product.sellingPrice.toFixed(2)
                      } · Stock: {product.stockQuantity}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditProduct(index)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProduct(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add product form */}
      {isAddingProduct && (
        <div className="mb-6 bg-background border rounded-lg shadow-sm p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Add Product</h3>
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleCancelAdd}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ProductForm
            onSave={handleSaveProduct}
            onCancel={handleCancelAdd}
            isInline={true}
            buttonText="Add Product"
          />
        </div>
      )}
      
      {/* Edit product form */}
      {isEditingProduct && editingProductIndex !== null && (
        <div className="mb-6 bg-background border rounded-lg shadow-sm p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Edit Product</h3>
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleCancelAdd}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ProductForm
            initialData={products[editingProductIndex]}
            onSave={handleSaveProduct}
            onCancel={handleCancelAdd}
            isInline={true}
            buttonText="Update Product"
          />
        </div>
      )}
      
      {/* Add product button */}
      {!isAddingProduct && !isEditingProduct && (
        <div className="mb-6 text-center">
          <Button
            onClick={handleAddProduct}
            variant="outline"
            className="mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </div>
      )}
      
      {/* Continue button */}
      <div className="flex justify-center gap-4">
        <Button 
          disabled={products.length === 0 || isSaving} 
          onClick={handleSubmit}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              Continue
              <Save className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
        {products.length > 0 && (
          <Button 
            variant="secondary"
            onClick={() => onComplete({ products })}
          >
            Skip for Now
          </Button>
        )}
      </div>
    </div>
  );
} 