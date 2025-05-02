'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Loader2, 
  Package, 
  TrendingUp, 
  BarChart4, 
  AlertCircle, 
  DollarSign, 
  ArrowUp, 
  ArrowDown, 
  PlusCircle,
  ShoppingBag,
  Clock,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { useTheme } from 'next-themes';
import PageHeader from '@/components/layout/PageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Mock data - replace with actual API calls
const mockDailySales = [
  { date: '2023-05-01', sales: 5, revenue: 220 },
  { date: '2023-05-02', sales: 7, revenue: 380 },
  { date: '2023-05-03', sales: 3, revenue: 190 },
  { date: '2023-05-04', sales: 8, revenue: 420 },
  { date: '2023-05-05', sales: 12, revenue: 680 },
  { date: '2023-05-06', sales: 10, revenue: 590 },
  { date: '2023-05-07', sales: 15, revenue: 820 },
];

const mockLowStockProducts = [
  { id: '1', name: 'Black T-Shirt', stockQuantity: 3, totalStock: 20 },
  { id: '2', name: 'Logo Hoodie', stockQuantity: 2, totalStock: 25 },
  { id: '3', name: 'Baseball Cap', stockQuantity: 4, totalStock: 30 },
];

const mockRecentSales = [
  { id: '1', date: '2023-05-07', customer: 'John Smith', amount: 75.99, status: 'completed' },
  { id: '2', date: '2023-05-06', customer: 'Emily Johnson', amount: 129.50, status: 'completed' },
  { id: '3', date: '2023-05-05', customer: 'Michael Brown', amount: 45.00, status: 'completed' },
];

const mockTopProducts = [
  { id: '1', name: 'Logo Hoodie', sales: 45, revenue: 2250 },
  { id: '2', name: 'Black T-Shirt', sales: 32, revenue: 960 },
  { id: '3', name: 'Snapback Cap', sales: 28, revenue: 840 },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalSales: 0,
    productCount: 0,
    lowStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated') {
        try {
          // This would be replaced with actual API calls
          // For now using mock data
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setMetrics({
            totalRevenue: 3298.50,
            totalSales: 58,
            productCount: 24,
            lowStockCount: 3,
          });
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setIsLoading(false);
        }
      }
    };
    
    if (status !== 'loading') {
      fetchDashboardData();
    }
  }, [status]);
  
  if (status === 'loading' || isLoading) {
    return <LoadingSpinner fullscreen message="Loading dashboard..." />;
  }

  if (status !== 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-background">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-semibold">You need to be logged in to view the dashboard</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* Custom welcome header with full-width border but padded content */}
      <div className="w-screen relative left-[calc(-50vw+50%)] mb-6">
        <div className="px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {session?.user?.name || 'there'}!</h1>
            </div>
            
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              <Link href="/inventory">
                <Button className="flex items-center gap-2" variant="outline">
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </Button>
              </Link>
              <Link href="/sales/new">
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>New Sale</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-b w-full" />
      </div>
      
      {/* Dashboard Content */}
      <div className="px-6">
        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-emerald-500">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>12.5% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sales</CardDescription>
              <CardTitle className="text-2xl font-bold">{metrics.totalSales}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-emerald-500">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>8.2% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Products</CardDescription>
              <CardTitle className="text-2xl font-bold">{metrics.productCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Layers className="h-4 w-4 mr-1" />
                <span>{metrics.lowStockCount} low stock items</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Order Value</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {formatCurrency(metrics.totalRevenue / metrics.totalSales)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-destructive">
                <ArrowDown className="h-4 w-4 mr-1" />
                <span>3.1% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales over time */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Daily sales and revenue for the past week</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockDailySales} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={resolvedTheme === 'dark' ? '#333' : '#eee'} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: resolvedTheme === 'dark' ? '#ccc' : '#333' }}
                    tickFormatter={formatDate}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fill: resolvedTheme === 'dark' ? '#ccc' : '#333' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fill: resolvedTheme === 'dark' ? '#ccc' : '#333' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`$${value}`, 'Revenue'];
                      return [value, 'Sales'];
                    }}
                    labelFormatter={formatDate}
                    contentStyle={{
                      backgroundColor: resolvedTheme === 'dark' ? '#333' : '#fff',
                      borderColor: resolvedTheme === 'dark' ? '#555' : '#ddd',
                      color: resolvedTheme === 'dark' ? '#eee' : '#333'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    yAxisId="left"
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    yAxisId="right"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Low stock products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Low Stock Products</CardTitle>
                <CardDescription>Products that need to be restocked soon</CardDescription>
              </div>
              <Link href="/inventory">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockLowStockProducts.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-muted-foreground">{product.stockQuantity} / {product.totalStock}</span>
                    </div>
                    <Progress 
                      value={(product.stockQuantity / product.totalStock) * 100} 
                      className="h-2" 
                      indicatorClassName={product.stockQuantity < 5 ? "bg-destructive" : "bg-amber-500"}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/inventory/new">
                <Button className="w-full" variant="outline">Add Inventory</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Recent sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </div>
              <Link href="/sales">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockRecentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full w-9 h-9 flex items-center justify-center bg-primary/10">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{sale.customer}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="mr-1 h-3 w-3" /> {formatDate(sale.date)}
                        </p>
                      </div>
                    </div>
                    <div className="font-medium">{formatCurrency(sale.amount)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/sales/new">
                <Button className="w-full" variant="outline">Create Sale</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Top selling products */}
        <div className="mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Your best performing products</CardDescription>
              </div>
              <Link href="/analytics">
                <Button variant="ghost" size="sm">View Analytics</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={mockTopProducts} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tick={{ fill: resolvedTheme === 'dark' ? '#ccc' : '#333' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fill: resolvedTheme === 'dark' ? '#ccc' : '#333' }}
                      width={110}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} units`, 'Sales']}
                      contentStyle={{
                        backgroundColor: resolvedTheme === 'dark' ? '#333' : '#fff',
                        borderColor: resolvedTheme === 'dark' ? '#555' : '#ddd',
                        color: resolvedTheme === 'dark' ? '#eee' : '#333'
                      }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 