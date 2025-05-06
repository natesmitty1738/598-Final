import React from 'react';
import { ColumnDef } from './DataTable';
import { Product } from '@/app/types/product';
import { SaleRecord } from '@/app/types/sale';

// Helper for formatting currency
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Product column definitions
export const productColumns: ColumnDef<Product>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (item) => <span className="font-medium">{item.name}</span>,
    sortable: true,
  },
  {
    key: 'category',
    header: 'Category',
    cell: (item) => <span>{item.category || 'Uncategorized'}</span>,
    sortable: true,
  },
  {
    key: 'price',
    header: 'Price',
    cell: (item) => formatCurrency(item.price || item.sellingPrice),
    sortable: true,
    align: 'right',
    sortKey: 'price', // Use this for sorting logic that handles both price and sellingPrice
  },
  {
    key: 'stockQuantity',
    header: 'Stock',
    cell: (item) => {
      const stock = item.stockQuantity || 0;
      // Add color indicators for stock levels
      const colorClass = 
        stock === 0 ? 'text-red-600' : 
        stock < 5 ? 'text-amber-600' : 
        'text-green-600';
      
      return <span className={`${colorClass}`}>{stock}</span>;
    },
    sortable: true,
    align: 'right',
  },
];

// Sales column definitions
export const salesColumns: ColumnDef<SaleRecord>[] = [
  {
    key: 'createdAt',
    header: 'Date',
    cell: (item) => <span className="text-xs whitespace-nowrap">
      {new Date(item.createdAt).toLocaleString()}
    </span>,
    sortable: true,
  },
  {
    key: 'itemsCount',
    header: 'Items',
    cell: (item) => <span>{item.items?.length || 0} items</span>,
    sortable: true,
  },
  {
    key: 'paymentMethod',
    header: 'Payment Method',
    cell: (item) => <span>{item.paymentMethod}</span>,
    sortable: true,
  },
  {
    key: 'paymentStatus',
    header: 'Status',
    cell: (item) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        item.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
        item.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
        'bg-red-100 text-red-700'
      }`}>
        {item.paymentStatus}
      </span>
    ),
    sortable: true,
  },
  {
    key: 'totalAmount',
    header: 'Total',
    cell: (item) => formatCurrency(item.totalAmount),
    sortable: true,
    align: 'right',
  },
]; 