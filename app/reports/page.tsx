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

interface Product {
  id: string;
  name: string;
  description: string;
  unitCost: number;
  sellingPrice: number;
  stockQuantity: number;
  sku: string;
  category?: string;
  unitSize?: string;
  expirationDate?: string;
  supplier?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  lastOrderDate?: string;
}

interface PieChartData {
  name: string;
  value: number;
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
        const data = await response.json();
        setProducts(data);
        generateReportData(data);
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
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate total value and low stock items
    const totalValue = products.reduce((sum, product) => {
      return sum + product.stockQuantity * product.unitCost;
    }, 0);

    const lowStockItems = products.filter(product => 
      product.reorderPoint && product.stockQuantity <= product.reorderPoint
    ).length;

    const expiringItems = products.filter(product => {
      if (!product.expirationDate) return false;
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
        (product.stockQuantity * product.unitCost);
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Inventory Reports</h1>

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
        <div className="chart-container">
          <h3 className="text-lg font-medium text-foreground mb-4">Products by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) => 
                    `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Value by Category */}
        <div className="chart-container">
          <h3 className="text-lg font-medium text-foreground mb-4">Stock Value by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.stockValueByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="name" stroke="currentColor" opacity={0.7} />
                <YAxis stroke="currentColor" opacity={0.7} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="var(--primary)" name="Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
              {products
                .filter(product => product.reorderPoint && product.stockQuantity <= product.reorderPoint)
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
                    <td className="text-foreground">{product.stockQuantity}</td>
                    <td className="text-foreground">{product.reorderPoint}</td>
                    <td className="text-foreground">{product.category || 'N/A'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 