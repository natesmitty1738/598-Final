import React, { useState } from 'react';
import { Package, Plus, X, Save, Image as ImageIcon } from 'lucide-react';
import FileUpload from '../FileUpload';

interface InventorySetupStepProps {
  initialData: any[];
  onComplete: (data: any[]) => void;
}

interface Product {
  sku: string;
  name: string;
  description?: string;
  unitCost: number | string;
  sellingPrice: number | string;
  stockQuantity: number | string;
  location?: string;
  category?: string;
  size?: string;
  color?: string;
  images?: string[];
  documents?: string[];
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

export default function InventorySetupStep({ initialData, onComplete }: InventorySetupStepProps) {
  const [products, setProducts] = useState<Product[]>(initialData || []);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    sku: '',
    name: '',
    description: '',
    unitCost: '',
    sellingPrice: '',
    stockQuantity: '',
    location: '',
    category: '',
    size: '',
    color: '',
    images: [],
    documents: [],
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [businessType, setBusinessType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch business profile to determine business type
  React.useEffect(() => {
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
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleAddProduct = () => {
    setIsAddingProduct(true);
    setCurrentProduct({
      sku: `SKU${String(products.length + 1).padStart(4, '0')}`,
      name: '',
      description: '',
      unitCost: '',
      sellingPrice: '',
      stockQuantity: '',
      location: '',
      category: '',
      size: '',
      color: '',
      images: [],
      documents: [],
    });
  };
  
  const handleCancelAdd = () => {
    setIsAddingProduct(false);
  };
  
  const handleSaveProduct = () => {
    // Validate product
    if (!currentProduct.name || !currentProduct.sku) {
      setError('Product name and SKU are required');
      return;
    }
    
    // Add the new product to the list
    setProducts(prev => [...prev, currentProduct]);
    setIsAddingProduct(false);
    setError(null);
  };
  
  const handleRemoveProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleImageUpload = (url: string) => {
    setCurrentProduct(prev => ({
      ...prev,
      images: [...(prev.images || []), url],
    }));
  };
  
  const handleImageRemove = (url: string) => {
    setCurrentProduct(prev => ({
      ...prev,
      images: prev.images?.filter(img => img !== url) || [],
    }));
  };
  
  const handleDocumentUpload = (url: string) => {
    setCurrentProduct(prev => ({
      ...prev,
      documents: [...(prev.documents || []), url],
    }));
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
      
      for (const product of products) {
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...product,
            unitCost: typeof product.unitCost === 'string' ? parseFloat(product.unitCost) : product.unitCost,
            sellingPrice: typeof product.sellingPrice === 'string' ? parseFloat(product.sellingPrice) : product.sellingPrice,
            stockQuantity: typeof product.stockQuantity === 'string' ? parseInt(product.stockQuantity.toString()) : product.stockQuantity,
          }),
        });
        
        if (response.ok) {
          const savedProduct = await response.json();
          results.push(savedProduct);
        } else {
          throw new Error('Failed to save products');
        }
      }
      
      // Complete this step
      onComplete(results);
    } catch (err) {
      setError('An error occurred while saving your inventory');
      console.error('Error saving inventory:', err);
    } finally {
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
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {products.length === 0 && !isAddingProduct && businessType && PRODUCT_TEMPLATES[businessType] && (
        <div className="mb-6 text-center">
          <p className="mb-2">
            We have a template for {businessType} businesses. Would you like to use it?
          </p>
          <button
            type="button"
            onClick={handleUseTemplate}
            className="px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Use Template
          </button>
        </div>
      )}
      
      {/* Product list */}
      {products.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Your Products</h3>
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={index} className="card p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {product.images && product.images.length > 0 ? (
                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-secondary/20 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      SKU: {product.sku} | Stock: {product.stockQuantity} | Price: ${
                        typeof product.sellingPrice === 'string' 
                        ? parseFloat(product.sellingPrice).toFixed(2) 
                        : product.sellingPrice.toFixed(2)
                      }
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add product form */}
      {isAddingProduct ? (
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Add New Product</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU*</label>
              <input
                type="text"
                name="sku"
                value={currentProduct.sku}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="SKU0001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name*</label>
              <input
                type="text"
                name="name"
                value={currentProduct.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="Product Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Unit Cost*</label>
              <input
                type="number"
                name="unitCost"
                value={currentProduct.unitCost}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price*</label>
              <input
                type="number"
                name="sellingPrice"
                value={currentProduct.sellingPrice}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity*</label>
              <input
                type="number"
                name="stockQuantity"
                value={currentProduct.stockQuantity}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="0"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={currentProduct.category}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="Category"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Product Images</label>
            <FileUpload
              onChange={handleImageUpload}
              onRemove={handleImageRemove}
              value={currentProduct.images || []}
              type="image"
            />
          </div>
          
          <div className="flex justify-end space-x-4 mt-4">
            <button
              type="button"
              onClick={handleCancelAdd}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Product
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={handleAddProduct}
            className="px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-gray-400 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </button>
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || products.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
} 