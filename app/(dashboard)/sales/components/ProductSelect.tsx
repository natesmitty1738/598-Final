"use client";

import { useEffect, useState } from "react";
import { Product } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductSelectProps {
  value: string;
  onValueChange: (value: string, product: Product | undefined) => void;
}

export function ProductSelect({ value, onValueChange }: ProductSelectProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleValueChange = (newValue: string) => {
    const selectedProduct = products.find(p => p.id === newValue);
    onValueChange(newValue, selectedProduct);
  };

  if (loading) {
    return (
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Loading products..." />
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
            disabled={product.stockQuantity <= 0}
          >
            {product.name} - ${product.sellingPrice} 
            {product.stockQuantity <= 0 ? " (Out of stock)" : ` (${product.stockQuantity} in stock)`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 