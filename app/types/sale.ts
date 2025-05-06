export interface SaleItem {
  id?: string;
  productId: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    sellingPrice?: number;
  };
}

export interface SaleRecord {
  id: string;
  createdAt: string;
  updatedAt?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  items: SaleItem[];
}

export interface SalesFilter {
  period?: 'week' | 'month' | 'quarter' | 'year';
  customerType?: string;
  search?: string;
} 