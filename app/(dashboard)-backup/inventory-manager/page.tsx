'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileSpreadsheet, Package, Layers } from 'lucide-react';
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

export default function InventoryManagerPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // State for inventory data
  const [inventoryMetrics, setInventoryMetrics] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    inventoryValue: 0,
    averageUnitCost: 0,
  });
  
  // State for widgets data
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [highMarginProducts, setHighMarginProducts] = useState([]);
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
          const totalInventoryValue = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.cost || p.unitCost || 0)), 0);
          const totalProductCount = products.length;
          
          // Set inventory metrics
          setInventoryMetrics({
            totalProducts: totalProductCount,
            lowStockCount: products.filter(p => (p.stockQuantity || 0) < 5).length,
            inventoryValue: totalInventoryValue,
            averageUnitCost: totalProductCount ? totalInventoryValue / totalProductCount : 0,
          });
          
          // Set top products
          setTopProducts(analyticsData.topSellingProducts || []);
          
          // Set low stock products
          setLowStockProducts(
            products
              .filter(p => (p.stockQuantity || 0) < 5)
              .slice(0, 5)
              .map(p => ({
                id: p.id,
                name: p.name,
                stockQuantity: p.stockQuantity || 0,
              })) || []
          );
          
          // Set high margin products (sample data - replace with actual API data)
          setHighMarginProducts(
            products
              .filter(p => p.cost || p.unitCost)
              .sort((a, b) => {
                const aPrice = a.price || a.sellingPrice || 0;
                const bPrice = b.price || b.sellingPrice || 0;
                const aCost = a.cost || a.unitCost || 0;
                const bCost = b.cost || b.unitCost || 0;
                
                const aMargin = aCost && aPrice ? ((aPrice - aCost) / aPrice) : 0;
                const bMargin = bCost && bPrice ? ((bPrice - bCost) / bPrice) : 0;
                
                return bMargin - aMargin;
              })
              .slice(0, 5)
              .map(p => ({
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
  const formatCurrency = (value) => {
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
  
  return (
    <div>
      {/* Custom welcome header with full-width border but padded content */}
      <div className="w-screen relative left-[calc(-50vw+50%)] mb-6">
        <div className="px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Inventory Manager</h1>
              <p className="text-muted-foreground">Monitor and optimize your inventory</p>
            </div>
            
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              <Link href="/inventory">
                <Button className="flex items-center gap-2" variant="outline">
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </Button>
              </Link>
              <Link href="/products/new">
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-b w-full" />
      </div>
      
      {/* Inventory Summary Stats */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsSummaryCard
            title="Total Products"
            value={inventoryMetrics.totalProducts}
            icon={Package}
            description="Items in inventory"
          />
          
          <StatsSummaryCard
            title="Low Stock Items"
            value={inventoryMetrics.lowStockCount}
            icon={Layers}
            description="Need restocking"
            trend={10}
            variant="warning"
          />
          
          <StatsSummaryCard
            title="Inventory Value"
            value={formatCurrency(inventoryMetrics.inventoryValue)}
            icon={Package}
            description="Total value on hand"
          />
          
          <StatsSummaryCard
            title="Avg. Unit Cost"
            value={formatCurrency(inventoryMetrics.averageUnitCost)}
            icon={Package}
            description="Per product"
          />
        </div>
      </div>
      
      {/* Widgets Dashboard */}
      <div className="px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Inventory Analytics</h2>
          <p className="text-muted-foreground">Customize your dashboard by dragging and resizing modules</p>
        </div>
        
        <DynamicDashboard
          modules={dashboardModules}
          storageKey="inventory-manager-dashboard"
          columns={4}
        />
      </div>
      
      {/* No data state */}
      {inventoryMetrics.totalProducts === 0 && (
        <div className="px-6 mt-8">
          <Card className="bg-gradient-to-r from-indigo-600/10 to-blue-600/10 overflow-hidden">
            <CardHeader>
              <CardTitle>Import Your Inventory Data</CardTitle>
              <CardDescription>Add products to your inventory to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <p className="mb-4">Import your product data from CSV files to:</p>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li>Track your inventory in real-time</li>
                    <li>Get low stock alerts automatically</li>
                    <li>Identify your most profitable products</li>
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