import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/shared/FileUpload";
import { Plus, Save, X } from 'lucide-react';

export interface Product {
  id?: string;
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

interface ProductFormProps {
  initialData?: Product;
  onSave: (product: Product) => void;
  onCancel?: () => void;
  isInline?: boolean; // For displaying as inline form vs dialog content
  buttonText?: string;
}

export default function ProductForm({
  initialData,
  onSave,
  onCancel,
  isInline = false,
  buttonText = 'Save Product'
}: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    sku: initialData?.sku || `SKU${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    name: initialData?.name || '',
    description: initialData?.description || '',
    unitCost: initialData?.unitCost || '',
    sellingPrice: initialData?.sellingPrice || '',
    stockQuantity: initialData?.stockQuantity || '',
    location: initialData?.location || '',
    category: initialData?.category || '',
    size: initialData?.size || '',
    color: initialData?.color || '',
    images: initialData?.images || [],
    documents: initialData?.documents || [],
  });
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        unitCost: initialData.unitCost?.toString() || '',
        sellingPrice: initialData.sellingPrice?.toString() || '',
        stockQuantity: initialData.stockQuantity?.toString() || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageAdd = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), url]
    }));
  };

  const handleImageRemove = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter(image => image !== url)
    }));
  };

  const handleDocumentAdd = (url: string) => {
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), url]
    }));
  };

  const handleDocumentRemove = (url: string) => {
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(doc => doc !== url)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.sku) {
      setError('Product name and SKU are required');
      return;
    }
    
    // Check for zero or missing prices
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice.toString()) === 0) {
      setError('Warning: Product has no selling price. This may affect sales functionality.');
      // Continue with submission but with warning
    }
    
    // Format data for API
    const productData = {
      ...formData,
      unitCost: formData.unitCost ? parseFloat(formData.unitCost.toString()) : 0,
      sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice.toString()) : 0,
      stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity.toString()) : 0,
    };
    
    onSave(productData);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-4 ${isInline ? 'p-4 border rounded-lg bg-card' : ''}`}
      style={{ 
        position: 'relative',
        zIndex: 10
      }}
    >
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="sku">SKU*</Label>
          <Input
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="name">Name*</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="unitCost">Unit Cost</Label>
          <Input
            id="unitCost"
            name="unitCost"
            type="number"
            step="0.01"
            value={formData.unitCost}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sellingPrice">Selling Price</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            step="0.01"
            value={formData.sellingPrice}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            value={formData.stockQuantity}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="size">Size</Label>
          <Input
            id="size"
            name="size"
            value={formData.size}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="relative z-40 space-y-1">
        <Label htmlFor="product-images" className="block mb-2">Product Images</Label>
        <FileUpload
          onChange={handleImageAdd}
          onRemove={handleImageRemove}
          value={formData.images || []}
          type="image"
        />
      </div>
      
      <div className="relative z-40 space-y-1">
        <Label htmlFor="product-documents" className="block mb-2">Documents</Label>
        <FileUpload
          onChange={handleDocumentAdd}
          onRemove={handleDocumentRemove}
          value={formData.documents || []}
          type="document"
        />
      </div>
      
      <div className="flex justify-end space-x-2 relative z-40 mt-6">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
} 