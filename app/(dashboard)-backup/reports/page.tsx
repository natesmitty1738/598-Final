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
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import CategoryChart from '@/components/features/CategoryChart';
import ChartCard from '@/components/features/ChartCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';

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
    <div className="mb-6">
      {/* Custom header with full-width border but padded content */}
      <div className="w-screen relative left-[calc(-50vw+50%)] mb-6">
        <div className="px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Inventory Reports</h1>
            </div>
            
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              <Link href="/analytics">
                <div className="text-sm hover:underline text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </div>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-b w-full" />
      </div>
      
      {/* Dashboard Content */}
      <div className="px-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Current Stock</th>
                  <th className="py-3 px-4 text-left">Reorder Point</th>
                  <th className="py-3 px-4 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                {productArray
                  .filter(product => {
                    // @ts-ignore
                    const reorderPoint = product.reorderPoint || 0;
                    const stockQuantity = product.stockQuantity || 0;
                    return stockQuantity <= reorderPoint && reorderPoint > 0;
                  })
                  .map(product => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{product.name}</td>
                      <td className="py-3 px-4">{product.stockQuantity || 0}</td>
                      <td className="py-3 px-4">
                        {/* @ts-ignore */}
                        {product.reorderPoint || 0}
                      </td>
                      <td className="py-3 px-4">{product.category || 'Uncategorized'}</td>
                    </tr>
                  ))}
                {productArray.filter(product => {
                  // @ts-ignore
                  const reorderPoint = product.reorderPoint || 0;
                  const stockQuantity = product.stockQuantity || 0;
                  return stockQuantity <= reorderPoint && reorderPoint > 0;
                }).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No low stock items to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 