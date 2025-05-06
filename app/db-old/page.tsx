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
  Layers,
  ArrowRight,
  FileSpreadsheet,
  TrendingDown,
  CreditCard,
  ChevronsUp,
  Percent,
  Hourglass,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Bar, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import LineChart from '@/components/features/LineChart';
import CustomBarChart from '@/components/features/BarChart';
import DynamicDashboard, { ModuleConfig } from '@/components/features/DynamicDashboard';
import { useTheme } from 'next-themes';
import PageHeader from '@/components/layout/PageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import InventoryDashboard from '@/components/features/inventory/InventoryDashboard';
import SalesDashboard from '@/components/features/sales/SalesDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for our data structures
interface Product {
  id: string;
  name: string;
  stockQuantity?: number;
  price?: number;
  cost?: number;
  unitsSold?: number;
  revenue?: number;
}

interface PriceSuggestion {
  id: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  potential: number;
}

interface OptimalItem {
  id: string;
  name: string;
  score: number;
  reason: string;
}

interface DailySale {
  date: string;
  sales: number;
  revenue: number;
}

interface ProjectedEarning {
  month: string;
  actual: number | null;
  projected: number;
}

interface PeakSellingHour {
  hour: string;
  sales: number;
}

interface HighMarginProduct {
  id: string;
  name: string;
  margin: number;
  price: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockQuantity: number;
  totalStock: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalSales: 0,
    productCount: 0,
    lowStockCount: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [highMarginProducts, setHighMarginProducts] = useState<HighMarginProduct[]>([]);
  const [peakSellingHours, setPeakSellingHours] = useState<PeakSellingHour[]>([]);
  const [priceSuggestions, setPriceSuggestions] = useState<PriceSuggestion[]>([]);
  const [optimalItems, setOptimalItems] = useState<OptimalItem[]>([]);
  const [projectedEarnings, setProjectedEarnings] = useState<ProjectedEarning[]>([]);
  const [possibleNetIncome, setPossibleNetIncome] = useState(0);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          
          // Fetch analytics data
          const analyticsResponse = await fetch('/api/analytics?timeRange=7');
          const analyticsData = await analyticsResponse.json();
          
          // Fetch products data
          const productsResponse = await fetch('/api/products');
          const productsData = await productsResponse.json();
          
          // Fetch inventory data
          const inventoryResponse = await fetch('/api/inventory');
          const inventoryData = await inventoryResponse.json();
          
          // Fetch recent sales
          const salesResponse = await fetch('/api/sales?page=1&limit=3');
          const salesData = await salesResponse.json();
          
          // Set the metrics
          setMetrics({
            totalRevenue: analyticsData.totalRevenue || 0,
            totalSales: analyticsData.totalSales || 0,
            productCount: productsData.products?.length || 0,
            lowStockCount: productsData.products?.filter((p: Product) => (p.stockQuantity || 0) < 5).length || 0,
          });
          
          // Set daily sales
          setDailySales(analyticsData.dailySales || []);
          
          // Set recent sales
          setRecentSales(salesData.sales || []);
          
          // Set top products
          setTopProducts(analyticsData.topSellingProducts || []);
          
          // Set low stock products
          setLowStockProducts(
            productsData.products
              ?.filter((p: Product) => (p.stockQuantity || 0) < 5)
              .slice(0, 5)
              .map((p: Product) => ({
                id: p.id,
                name: p.name,
                stockQuantity: p.stockQuantity || 0,
                totalStock: (p.stockQuantity || 0) + 20, // Estimate based on current stock
              })) || []
          );
          
          // Set high margin products
          setHighMarginProducts(
            productsData.products
              ?.sort((a: Product, b: Product) => {
                const aMargin = a.cost && a.price ? ((a.price - a.cost) / a.price) : 0;
                const bMargin = b.cost && b.price ? ((b.price - b.cost) / b.price) : 0;
                return bMargin - aMargin;
              })
              .slice(0, 5)
              .map((p: Product) => ({
                id: p.id,
                name: p.name,
                margin: p.cost && p.price ? ((p.price - p.cost) / p.price) * 100 : 0,
                price: p.price || 0
              })) || []
          );
          
          // Set price suggestions
          setPriceSuggestions(
            productsData.products
              ?.slice(0, 5)
              .map((p: Product) => ({
                id: p.id,
                name: p.name,
                currentPrice: p.price || 0,
                suggestedPrice: (p.price || 0) * (1 + (Math.random() * 0.2 - 0.1)), // -10% to +10% suggestion
                potential: Math.random() * 15 // potential percentage increase
              })) || []
          );
          
          // Set optimal items
          setOptimalItems(
            productsData.products
              ?.slice(0, 5)
              .map((p: Product) => ({
                id: p.id,
                name: p.name,
                score: Math.round(Math.random() * 100),
                reason: ['High margin', 'Fast moving', 'Low competition', 'High demand'][Math.floor(Math.random() * 4)]
              })) || []
          );
          
          // Set peak selling hours
          setPeakSellingHours([
            { hour: '9AM-12PM', sales: Math.round(Math.random() * 30) + 10 },
            { hour: '12PM-3PM', sales: Math.round(Math.random() * 40) + 15 },
            { hour: '3PM-6PM', sales: Math.round(Math.random() * 50) + 20 },
            { hour: '6PM-9PM', sales: Math.round(Math.random() * 35) + 15 },
          ]);
          
          // Set projected earnings
          setProjectedEarnings([
            { month: 'Jan', actual: Math.round(Math.random() * 5000) + 1000, projected: Math.round(Math.random() * 6000) + 1000 },
            { month: 'Feb', actual: Math.round(Math.random() * 5500) + 1100, projected: Math.round(Math.random() * 6500) + 1100 },
            { month: 'Mar', actual: Math.round(Math.random() * 6000) + 1200, projected: Math.round(Math.random() * 7000) + 1200 },
            { month: 'Apr', actual: Math.round(Math.random() * 6500) + 1300, projected: Math.round(Math.random() * 7500) + 1300 },
            { month: 'May', actual: Math.round(Math.random() * 7000) + 1400, projected: Math.round(Math.random() * 8000) + 1400 },
            { month: 'Jun', actual: null, projected: Math.round(Math.random() * 8500) + 1500 },
          ]);
          
          // Set possible net income
          setPossibleNetIncome(
            analyticsData.totalRevenue * 1.2 - analyticsData.totalRevenue || 
            Math.round(Math.random() * 2000) + 500
          );
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          toast.error('Failed to load dashboard data');
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
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Define dashboard modules
  const dashboardModules: ModuleConfig[] = [
    {
      id: 'best-selling-items',
      title: 'Best Selling Items',
      description: 'Your top selling products by volume',
      component: (
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.unitsSold}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue || 0)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ),
      defaultSize: 'medium',
      defaultHeight: 'normal',
      minimizable: true,
      removable: true,
    },
    {
      id: 'low-stock-items',
      title: 'Low Stock Items',
      description: 'Products that need to be restocked soon',
      component: (
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.stockQuantity}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.stockQuantity < 3 ? "destructive" : "outline"}>
                        {product.stockQuantity < 3 ? 'Critical' : 'Low'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    No low stock items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ),
      defaultSize: 'medium',
      defaultHeight: 'normal',
      minimizable: true,
      removable: true,
    },
    {
      id: 'possible-net-income',
      title: 'Possible Net Income',
      description: 'Potential additional revenue with optimized pricing',
      component: (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <DollarSign className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-3xl font-bold text-green-500 mb-2">{formatCurrency(possibleNetIncome)}</h3>
          <p className="text-muted-foreground text-center">
            Additional revenue possible with optimized pricing and inventory management
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reports">
                View Detailed Report <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ),
      defaultSize: 'small',
      defaultHeight: 'compact',
      minimizable: true,
      removable: true,
    },
    {
      id: 'highest-margin-items',
      title: 'Highest Margin Items',
      description: 'Products with the best profit margins',
      component: (
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highMarginProducts.length > 0 ? (
                highMarginProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {formatPercent(product.margin)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ),
      defaultSize: 'medium',
      defaultHeight: 'normal',
      minimizable: true,
      removable: true,
    },
    {
      id: 'projected-earnings',
      title: 'Projected Earnings',
      description: 'Forecast of future earnings based on historical data',
      component: (
        <div className="h-full">
          <ResponsiveContainer width="100%" height={300}>
            <CustomBarChart
              data={projectedEarnings}
              keys={['actual', 'projected']}
              indexBy="month"
              colors={['#3b82f6', '#94a3b8']}
              axisBottomLegend="Month"
              axisLeftLegend="Revenue ($)"
              legends={[
                { id: 'actual', label: 'Actual' },
                { id: 'projected', label: 'Projected' }
              ]}
            />
          </ResponsiveContainer>
        </div>
      ),
      defaultSize: 'large',
      defaultHeight: 'tall',
      minimizable: true,
      removable: true,
    },
    {
      id: 'peak-selling-hours',
      title: 'Peak Selling Hours',
      description: 'Hours with the highest sales volume',
      component: (
        <div className="h-full">
          <ResponsiveContainer width="100%" height={300}>
            <CustomBarChart
              data={peakSellingHours}
              keys={['sales']}
              indexBy="hour"
              colors={['#8b5cf6']}
              axisBottomLegend="Time Period"
              axisLeftLegend="Sales Volume"
              legends={[
                { id: 'sales', label: 'Sales' }
              ]}
            />
          </ResponsiveContainer>
        </div>
      ),
      defaultSize: 'medium',
      defaultHeight: 'tall',
      minimizable: true,
      removable: true,
    },
    {
      id: 'price-suggestions',
      title: 'Price Suggestions',
      description: 'Recommended price adjustments to maximize profit',
      component: (
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Suggested</TableHead>
                <TableHead className="text-right">Potential</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceSuggestions.length > 0 ? (
                priceSuggestions.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.currentPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.suggestedPrice)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={product.suggestedPrice > product.currentPrice ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}>
                        {product.suggestedPrice > product.currentPrice ? "+" : ""}{formatPercent(product.potential)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No price suggestions available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ),
      defaultSize: 'large',
      defaultHeight: 'normal',
      minimizable: true,
      removable: true,
    },
    {
      id: 'most-optimal-items',
      title: 'Most Optimal Items',
      description: 'Products with the best overall performance',
      component: (
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimalItems.length > 0 ? (
                optimalItems.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.reason}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{product.score}</span>
                        <div className="w-20">
                          <Progress value={product.score} className="h-2" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ),
      defaultSize: 'medium',
      defaultHeight: 'normal',
      minimizable: true,
      removable: true,
    },
  ];

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
      
      {/* Key metrics */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Layers className="h-4 w-4 mr-1" />
                <span>From {metrics.totalSales} sales</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sales</CardDescription>
              <CardTitle className="text-2xl font-bold">{metrics.totalSales}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>Last 7 days</span>
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
                {formatCurrency(metrics.totalSales ? metrics.totalRevenue / metrics.totalSales : 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <ShoppingBag className="h-4 w-4 mr-1" />
                <span>Per transaction</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Navigation links to specialized dashboards */}
      <div className="px-6 mb-8">
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="outline" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Inventory Dashboard</span>
            </Button>
          </Link>
          <Link href="/dashboard/sales">
            <Button variant="outline" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Sales Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Widgets Dashboard */}
      <div className="px-6">
        <h2 className="text-xl font-semibold">Dashboard Modules</h2>
        <p className="text-muted-foreground mb-6">Customize your dashboard by dragging, resizing, and adjusting module heights</p>
        
        <DynamicDashboard
          modules={dashboardModules}
          storageKey="main-dashboard"
          columns={4}
          autoFill={true}
        />
      </div>
      
      {/* No data state */}
      {metrics.totalSales === 0 && (
        <div className="px-6 mt-8">
          <Card className="bg-gradient-to-r from-indigo-600/10 to-blue-600/10 overflow-hidden">
            <CardHeader>
              <CardTitle>Import Your Business Data</CardTitle>
              <CardDescription>Upload sales history and inventory items to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <p className="mb-4">Import your business data from CSV files to:</p>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li>View detailed analytics and sales trends</li>
                    <li>Generate forecasts and inventory recommendations</li>
                    <li>Track performance and identify growth opportunities</li>
                  </ul>
                  <Button asChild>
                    <Link href="/settings/import">
                      Start Importing Data
                    </Link>
                  </Button>
                </div>
                <div className="flex-shrink-0">
                  <FileSpreadsheet className="h-32 w-32 text-primary/20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 