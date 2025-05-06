"use client";

import { Product } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductSelectProps {
  value: string;
  products: Product[];
  onSelect: (value: string, product: Product | undefined) => void;
}

export function ProductSelect({ value, products, onSelect }: ProductSelectProps) {
  const handleValueChange = (newValue: string) => {
    const selectedProduct = products.find(p => p.id === newValue);
    onSelect(newValue, selectedProduct);
  };

  if (!products || products.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="No products available" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a product" />
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem 
            key={product.id} 
            value={product.id}
            disabled={product.stockQuantity <= 0 || !product.sellingPrice || product.sellingPrice <= 0}
          >
            {product.name} - ${product.sellingPrice || 0} 
            {product.stockQuantity <= 0 ? " (Out of stock)" : 
             (!product.sellingPrice || product.sellingPrice <= 0) ? " (No price set)" :
             ` (${product.stockQuantity} in stock)`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 