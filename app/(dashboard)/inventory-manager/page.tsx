'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileSpreadsheet, Package, Layers, History, Eye, Edit, Search, Filter, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import DynamicDashboard, { ModuleConfig } from '@/components/features/DynamicDashboard';
import {
  BestSellingItemsWidget,
  LowStockItemsWidget,
  PossibleNetIncomeWidget,
  HighestMarginItemsWidget,
  StatsSummaryCard
} from '@/components/features/inventory/InventoryWidgets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types for our data structures
interface InventoryMetrics {
  totalProducts: number;
  lowStockCount: number;
  inventoryValue: number;
  averageUnitCost: number;
}

interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  cost?: number;
  unitCost?: number;
  stockQuantity?: number;
}

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockQuantity: number;
}

interface HighMarginProduct {
  id: string;
  name: string;
  margin: number;
  price: number;
}

// Sample data for demonstration
const sampleProducts = [
  { id: 'PROD-001', name: 'Canvas Tote Bag', sku: 'BAG-001', price: 24.99, stockQuantity: 45 },
  { id: 'PROD-002', name: 'Leather Wallet', sku: 'WAL-002', price: 39.99, stockQuantity: 28 },
  { id: 'PROD-003', name: 'Smart Watch', sku: 'WATCH-003', price: 199.99, stockQuantity: 12 },
  { id: 'PROD-004', name: 'Wireless Earbuds', sku: 'AUDIO-004', price: 89.99, stockQuantity: 32 },
  { id: 'PROD-005', name: 'Bamboo Water Bottle', sku: 'BOT-005', price: 19.99, stockQuantity: 3 },
  { id: 'PROD-006', name: 'Fitness Tracker', sku: 'FIT-006', price: 49.99, stockQuantity: 18 },
  { id: 'PROD-007', name: 'Portable Charger', sku: 'CHAR-007', price: 29.99, stockQuantity: 51 },
  { id: 'PROD-008', name: 'Bluetooth Speaker', sku: 'AUDIO-008', price: 69.99, stockQuantity: 9 },
  { id: 'PROD-009', name: 'Ceramic Mug', sku: 'MUG-009', price: 12.99, stockQuantity: 76 },
  { id: 'PROD-010', name: 'Stainless Steel Straws', sku: 'STRAW-010', price: 9.99, stockQuantity: 4 },
];

const sampleHistory = [
  { id: 'LOG-001', date: '2023-11-25', action: 'Add Product', product: 'Canvas Tote Bag', user: 'admin@example.com' },
  { id: 'LOG-002', date: '2023-11-26', action: 'Update Stock', product: 'Leather Wallet', user: 'admin@example.com' },
  { id: 'LOG-003', date: '2023-11-26', action: 'Add Product', product: 'Smart Watch', user: 'admin@example.com' },
  { id: 'LOG-004', date: '2023-11-27', action: 'Update Price', product: 'Wireless Earbuds', user: 'admin@example.com' },
  { id: 'LOG-005', date: '2023-11-28', action: 'Low Stock Alert', product: 'Bamboo Water Bottle', user: 'system' },
  { id: 'LOG-006', date: '2023-11-28', action: 'Add Product', product: 'Fitness Tracker', user: 'admin@example.com' },
  { id: 'LOG-007', date: '2023-11-29', action: 'Update Stock', product: 'Portable Charger', user: 'admin@example.com' },
  { id: 'LOG-008', date: '2023-11-30', action: 'Low Stock Alert', product: 'Bluetooth Speaker', user: 'system' },
];

export default function InventoryManagerPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  
  // State for inventory data
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics>({
    totalProducts: 0,
    lowStockCount: 0,
    inventoryValue: 0,
    averageUnitCost: 0,
  });
  
  // State for widgets data
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [highMarginProducts, setHighMarginProducts] = useState<HighMarginProduct[]>([]);
  const [possibleNetIncome, setPossibleNetIncome] = useState(0);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          
          // Fetch analytics data
          const analyticsResponse = await fetch('/api/analytics?timeRange=30');
          const analyticsData = await analyticsResponse.json();
          
          // Fetch products data
          const productsResponse = await fetch('/api/products');
          const productsData = await productsResponse.json();
          
          // Fetch inventory data
          const inventoryResponse = await fetch('/api/inventory');
          const inventoryData = await inventoryResponse.json();
          
          // Calculate inventory metrics
          const products = productsData.products || [];
          const totalInventoryValue = products.reduce((sum: number, p: Product) => 
            sum + ((p.stockQuantity || 0) * (p.cost || p.unitCost || 0)), 0);
          const totalProductCount = products.length;
          
          // Set inventory metrics
          setInventoryMetrics({
            totalProducts: totalProductCount,
            lowStockCount: products.filter((p: Product) => (p.stockQuantity || 0) < 5).length,
            inventoryValue: totalInventoryValue,
            averageUnitCost: totalProductCount ? totalInventoryValue / totalProductCount : 0,
          });
          
          // Set top products
          setTopProducts(analyticsData.topSellingProducts || []);
          
          // Set low stock products
          setLowStockProducts(
            products
              .filter((p: Product) => (p.stockQuantity || 0) < 5)
              .slice(0, 5)
              .map((p: Product) => ({
                id: p.id,
                name: p.name,
                stockQuantity: p.stockQuantity || 0,
              })) || []
          );
          
          // Set high margin products
          setHighMarginProducts(
            products
              .filter((p: Product) => p.cost || p.unitCost)
              .sort((a: Product, b: Product) => {
                const aPrice = a.price || a.sellingPrice || 0;
                const bPrice = b.price || b.sellingPrice || 0;
                const aCost = a.cost || a.unitCost || 0;
                const bCost = b.cost || b.unitCost || 0;
                
                const aMargin = aCost && aPrice ? ((aPrice - aCost) / aPrice) : 0;
                const bMargin = bCost && bPrice ? ((bPrice - bCost) / bPrice) : 0;
                
                return bMargin - aMargin;
              })
              .slice(0, 5)
              .map((p: Product) => ({
                id: p.id,
                name: p.name,
                margin: ((p.price || p.sellingPrice || 0) - (p.cost || p.unitCost || 0)) / (p.price || p.sellingPrice || 1) * 100,
                price: p.price || p.sellingPrice || 0
              })) || []
          );
          
          // Set possible net income (sample calculation)
          setPossibleNetIncome(
            analyticsData.totalRevenue * 0.15 || // 15% additional revenue possible
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
    return <LoadingSpinner fullscreen message="Loading inventory dashboard..." />;
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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Define dashboard modules
  const dashboardModules: ModuleConfig[] = [
    {
      id: 'best-selling-items',
      title: 'Best Selling Items',
      description: 'Your top selling products by volume',
      component: <BestSellingItemsWidget data={topProducts} />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true,
    },
    {
      id: 'low-stock-items',
      title: 'Low Stock Items',
      description: 'Products that need to be restocked soon',
      component: <LowStockItemsWidget data={lowStockProducts} />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true,
    },
    {
      id: 'possible-net-income',
      title: 'Possible Net Income',
      description: 'Potential additional revenue with optimized pricing',
      component: <PossibleNetIncomeWidget value={possibleNetIncome} />,
      defaultSize: 'small',
      minimizable: true,
      removable: true,
    },
    {
      id: 'highest-margin-items',
      title: 'Highest Margin Items',
      description: 'Products with the best profit margins',
      component: <HighestMarginItemsWidget data={highMarginProducts} />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true,
    }
  ];
  
  // Filter products based on search term
  const filteredProducts = sampleProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory Manager</h1>
          <p className="text-muted-foreground">Add, edit, and monitor your inventory</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Link href="/products/new">
            <Button className="flex items-center gap-2" variant="outline">
              <PlusCircle className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </Link>
          <Link href="/data-import?type=inventory">
            <Button className="flex items-center gap-2" variant="outline">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import Data</span>
            </Button>
          </Link>
          <Link href="/inventory-manager/history">
            <Button className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>View History</span>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-[400px] mb-6">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/3 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>Manage your products and stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${product.stockQuantity < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {product.stockQuantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory History</CardTitle>
              <CardDescription>Recent changes to your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleHistory.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.product}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 