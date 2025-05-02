'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import CategoryChart from '@/components/features/CategoryChart';
import ChartCard from '@/components/features/ChartCard';
import PageHeader from '@/components/layout/PageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// update interface to match the actual Product schema from database
interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  unitCost?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  location?: string;
  category?: string;
  size?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  images?: { id: string; url: string; alt?: string }[];
  documents?: { id: string; url: string; name: string; type: string }[];
}

interface PieChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ReportData {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  expiringItems: number;
  categoryDistribution: PieChartData[];
  stockValueByCategory: PieChartData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    expiringItems: 0,
    categoryDistribution: [],
    stockValueByCategory: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        // handle different response formats
        const data = await response.json();
        // check if data is an array (direct products array) or has a products property
        const productArray = Array.isArray(data) ? data : (data?.products || []);
        
        setProducts(productArray);
        generateReportData(productArray);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProducts();
    }
  }, [session, dateRange]);

  const generateReportData = (products: Product[]) => {
    if (!Array.isArray(products) || products.length === 0) {
      // set default empty state
      setReportData({
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        expiringItems: 0,
        categoryDistribution: [],
        stockValueByCategory: [],
      });
      return;
    }
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate total value and low stock items - handle null/undefined values
    const totalValue = products.reduce((sum, product) => {
      const quantity = product.stockQuantity || 0;
      const cost = product.unitCost || 0;
      return sum + (quantity * cost);
    }, 0);

    // Use coalescing for nullable values
    const lowStockItems = products.filter(product => {
      // @ts-ignore - reorderPoint doesn't exist in our Product type but we'll check for it
      const reorderPoint = product.reorderPoint || 0;
      const stockQuantity = product.stockQuantity || 0;
      return stockQuantity <= reorderPoint && reorderPoint > 0;
    }).length;

    // We don't have expiration dates in our schema, but this handles it if added later
    const expiringItems = products.filter(product => {
      // @ts-ignore - expirationDate doesn't exist in our Product type but we'll check for it
      if (!product.expirationDate) return false;
      // @ts-ignore
      const expDate = new Date(product.expirationDate);
      return expDate <= thirtyDaysFromNow && expDate >= now;
    }).length;

    // Calculate category distribution
    const categoryCount: { [key: string]: number } = {};
    const categoryValue: { [key: string]: number } = {};

    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      categoryValue[category] = (categoryValue[category] || 0) + 
        ((product.stockQuantity || 0) * (product.unitCost || 0));
    });

    const categoryDistribution = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    }));

    const stockValueByCategory = Object.entries(categoryValue).map(([name, value]) => ({
      name,
      value,
    }));

    setReportData({
      totalProducts: products.length,
      totalValue,
      lowStockItems,
      expiringItems,
      categoryDistribution,
      stockValueByCategory,
    });
  };

  if (isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  // ensure productArray is always an array
  const productArray = Array.isArray(products) ? products : [];

  return (
    <div className="w-full max-w-screen-xl mx-auto px-6 mb-6">
      <PageHeader title="Inventory Reports" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Products</h3>
          <p className="text-2xl font-bold text-foreground">{reportData.totalProducts}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Inventory Value</h3>
          <p className="text-2xl font-bold text-foreground">
            ${reportData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground">Low Stock Items</h3>
          <p className="text-2xl font-bold text-foreground">{reportData.lowStockItems}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground">Expiring Items</h3>
          <p className="text-2xl font-bold text-foreground">{reportData.expiringItems}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Category Distribution */}
        <ChartCard 
          title="Products by Category"
          description="Distribution of products across categories">
          <CategoryChart
            data={reportData.categoryDistribution}
            categoryKey="name"
            valueKey="value"
            valueLabel="Products"
            displayAsPie={true}
            height={320}
          />
        </ChartCard>

        {/* Stock Value by Category */}
        <ChartCard 
          title="Stock Value by Category"
          description="Monetary value of inventory by category">
          <CategoryChart
            data={reportData.stockValueByCategory}
            categoryKey="name"
            valueKey="value"
            valueLabel="Stock Value ($)"
            height={320}
          />
        </ChartCard>
      </div>

      {/* Low Stock Items Table */}
      <div className="card">
        <h3 className="text-lg font-medium text-foreground mb-4">Low Stock Items</h3>
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Stock</th>
                <th>Reorder Point</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {productArray
                .filter(product => {
                  // @ts-ignore - reorderPoint doesn't exist in our schema
                  const reorderPoint = product.reorderPoint || 0;
                  const stockQuantity = product.stockQuantity || 0;
                  return stockQuantity <= reorderPoint && reorderPoint > 0;
                })
                .map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="font-medium text-foreground">
                        {product.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                      </div>
                    </td>
                    <td className="text-foreground">{product.stockQuantity || 0}</td>
                    {/* @ts-ignore - reorderPoint doesn't exist in our schema */}
                    <td className="text-foreground">{product.reorderPoint || 0}</td>
                    <td className="text-foreground">{product.category || 'N/A'}</td>
                  </tr>
                ))}
                {productArray.filter(p => {
                  // @ts-ignore
                  const reorderPoint = p.reorderPoint || 0;
                  const stockQuantity = p.stockQuantity || 0;
                  return stockQuantity <= reorderPoint && reorderPoint > 0;
                }).length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted-foreground">
                      No low stock items found
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 