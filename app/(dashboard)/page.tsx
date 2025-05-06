'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  BarChart, 
  ShoppingBag, 
  FileSpreadsheet, 
  Settings, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import PageLayout from '@/components/shared/PageLayout';
import { toast } from 'sonner';

// interface definitions for the dashboard data
interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: string;
  date: string;
  total: number;
  items: SaleItem[];
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  createdAt?: string;
}

interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  totalSales: number;
  totalRevenue: number;
  recentSales: Sale[];
  recentProducts: Product[];
  lowStockProducts: Product[];
  inventoryValue: number;
  weeklyTrend: number;
}

// helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    lowStockCount: 0,
    totalSales: 0,
    totalRevenue: 0,
    recentSales: [],
    recentProducts: [],
    lowStockProducts: [],
    inventoryValue: 0,
    weeklyTrend: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          setError(null);
          
          // Fetch dashboard data from our API
          const response = await fetch('/api/dashboard');
          
          if (!response.ok) {
            throw new Error(`Error fetching dashboard data: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Use data from API without fallbacks to mock data
          setDashboardData({
            totalProducts: data.totalProducts || 0,
            lowStockCount: data.lowStockCount || 0,
            totalSales: data.totalSales || 0,
            totalRevenue: data.totalRevenue || 0,
            recentSales: data.recentSales || [],
            recentProducts: data.recentProducts || [],
            lowStockProducts: data.lowStockProducts || [],
            inventoryValue: data.inventoryValue || 0,
            weeklyTrend: data.weeklyTrend || 0
          });
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setIsLoading(false);
          setError('Failed to load dashboard data');
          toast.error('Failed to load dashboard data');
        }
      }
    };
    
    if (status !== 'loading') {
      fetchDashboardData();
    }
  }, [status]);

  // Dashboard header buttons
  const headerContent = (
    <>
      <Button variant="outline" className="gap-2" size="sm" onClick={() => router.push('/inventory')}>
        <Package className="h-4 w-4" />
        <span>Inventory</span>
      </Button>
      <Button className="gap-2" size="sm" onClick={() => router.push('/analytics')}>
        <BarChart className="h-4 w-4" />
        <span>Analytics</span>
      </Button>
    </>
  );

  // Navigation items
  const navItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: 'Activity' }
  ];

  if (status === 'loading' || isLoading) {
    return <LoadingSpinner fullscreen message="Loading dashboard..." />;
  }

  // If there's an error, show a simplified dashboard with the error message
  if (error) {
    return (
      <PageLayout
        title="Dashboard"
        headerContent={headerContent}
        navItems={navItems}
        activeNavItem="overview"
        onNavChange={() => {}}
        onRefreshClick={() => window.location.reload()}
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="flex items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-10 w-10 text-red-500 mr-4" />
            <div>
              <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const renderDashboardContent = () => (
    <div className="flex flex-col gap-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Here's what's happening with your business today.</p>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.lowStockCount > 0 ? (
                `${dashboardData.lowStockCount} items low in stock`
              ) : (
                'All items well-stocked'
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.inventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.weeklyTrend > 0 ? (
                `+${dashboardData.weeklyTrend}% from last week`
              ) : dashboardData.weeklyTrend < 0 ? (
                `${dashboardData.weeklyTrend}% from last week`
              ) : (
                'No change from last week'
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalSales}
            </div>
            {dashboardData.totalSales > 0 ? (
              <p className="text-xs text-muted-foreground">
                View detailed sales history
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No sales recorded yet
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.totalRevenue)}
            </div>
            {dashboardData.totalRevenue > 0 ? (
              <p className="text-xs text-muted-foreground">
                View revenue analytics
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No revenue recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/inventory" className="block">
          <Card className="h-full hover:bg-accent/5 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> 
                <span>Inventory</span>
              </CardTitle>
              <CardDescription>Manage your product inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <p>View stock levels, add products, and monitor inventory metrics.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="gap-2 text-primary">
                Go to Inventory <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>
        
        <Link href="/inventory?productTab=import&salesTab=import" className="block">
          <Card className="h-full hover:bg-accent/5 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" /> 
                <span>Data Import</span>
              </CardTitle>
              <CardDescription>Import data from CSV files</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Bulk import products, sales history, and more from spreadsheets.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="gap-2 text-primary">
                Import Data <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>
        
        <Link href="/analytics" className="block">
          <Card className="h-full hover:bg-accent/5 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" /> 
                <span>Analytics</span>
              </CardTitle>
              <CardDescription>Analyze performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>View reports, track performance, and identify opportunities.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="gap-2 text-primary">
                View Analytics <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>
      </div>
      
      {/* Recent Activity and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest inventory and sales activity</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.recentSales && dashboardData.recentSales.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentSales.map((sale, index) => (
                  <div key={sale.id || index} className="flex items-start border-b pb-3 last:border-0 last:pb-0">
                    <div className="bg-primary/10 p-2 rounded-md mr-3">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">Sale #{sale.id?.substring(0, 8)}</p>
                        <p className="text-muted-foreground text-sm">
                          {new Date(sale.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sale.items?.length || 0} items, total {formatCurrency(sale.total)}
                      </p>
                      {sale.items && sale.items.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {sale.items.slice(0, 2).map((item, i) => (
                            <span key={i}>
                              {i > 0 && ', '}{item.quantity}x {item.productName}
                            </span>
                          ))}
                          {sale.items.length > 2 && <span>, + {sale.items.length - 2} more</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 border rounded-md">
                <div className="text-center">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent activity to display</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add sales to see your activity here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/inventory">
              <Button variant="outline">View All Activity</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.lowStockCount > 0 && dashboardData.lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center p-3 border rounded-md bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-3" />
                  <div>
                    <p className="font-medium">Low stock alert</p>
                    <p className="text-sm text-muted-foreground">
                      {dashboardData.lowStockCount} items need to be restocked
                    </p>
                  </div>
                </div>
                
                {/* Display products with low stock */}
                {dashboardData.lowStockProducts.slice(0, 3).map((product, index) => (
                  <div key={product.id || index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(product.sellingPrice || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        {product.stockQuantity || 0} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 border rounded-md">
                <div className="text-center">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No low stock items</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All items are well-stocked
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/inventory?filter=low-stock">
              <Button variant="outline">View Low Stock Items</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Dashboard"
      headerContent={headerContent}
      navItems={navItems}
      activeNavItem="overview"
      onNavChange={() => {}}
      onRefreshClick={() => window.location.reload()}
    >
      {renderDashboardContent()}
    </PageLayout>
  );
} 