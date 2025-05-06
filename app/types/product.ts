export interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  cost?: number;
  unitCost?: number;
  stockQuantity?: number;
  category?: string;
  description?: string;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilter {
  category?: string;
  status?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  search?: string;
} 