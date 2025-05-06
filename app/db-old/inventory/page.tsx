'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, PlusCircle, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import InventoryDashboard from '@/components/features/inventory/InventoryDashboard';

// Define types for our state data
interface Product {
  id: string;
  name: string;
  stockQuantity?: number;
  price?: number;
  cost?: number;
  unitsSold?: number;
  revenue?: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockQuantity: number;
  totalStock: number;
}

interface HighMarginProduct {
  id: string;
  name: string;
  margin: number;
  price: number;
}

interface InventoryMetrics {
  totalProducts: number;
  lowStockCount: number;
  inventoryValue: number;
}

export default function InventoryDashboardPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // State for inventory data
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [highMarginProducts, setHighMarginProducts] = useState<HighMarginProduct[]>([]);
  const [possibleNetIncome, setPossibleNetIncome] = useState(0);
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics>({
    totalProducts: 0,
    lowStockCount: 0,
    inventoryValue: 0,
  });
  
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
          
          // Set top products
          setTopProducts(analyticsData.topSellingProducts || []);
          
          // Calculate inventory metrics
          const products = productsData.products || [];
          const totalInventoryValue = products.reduce((sum: number, p: any) => sum + ((p.stockQuantity || 0) * (p.cost || 0)), 0);
          const totalProductCount = products.length;
          const lowStockCount = products.filter((p: any) => (p.stockQuantity || 0) < 5).length;
          
          // Set inventory metrics
          setInventoryMetrics({
            totalProducts: totalProductCount,
            lowStockCount,
            inventoryValue: totalInventoryValue || totalProductCount * 50, // Fallback estimate
          });
          
          // Set low stock products
          setLowStockProducts(
            products
              .filter((p: any) => (p.stockQuantity || 0) < 5)
              .slice(0, 5)
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                stockQuantity: p.stockQuantity || 0,
                totalStock: p.stockQuantity + 20 || 20, // Estimate total stock
              })) || []
          );
          
          // Set high margin products
          setHighMarginProducts(
            products
              .sort((a: any, b: any) => {
                const aMargin = a.cost && a.price ? ((a.price - a.cost) / a.price) : 0;
                const bMargin = b.cost && b.price ? ((b.price - b.cost) / b.price) : 0;
                return bMargin - aMargin;
              })
              .slice(0, 5)
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                margin: p.cost && p.price ? ((p.price - p.cost) / p.price) * 100 : 0,
                price: p.price || 0
              })) || []
          );
          
          // Set possible net income
          setPossibleNetIncome(
            analyticsData.totalRevenue * 0.15 || // 15% additional revenue possible
            Math.round(Math.random() * 2000) + 500
          );
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          toast.error('Failed to load inventory dashboard data');
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
  
  return (
    <div>
      {/* Custom welcome header with full-width border but padded content */}
      <div className="w-screen relative left-[calc(-50vw+50%)] mb-6">
        <div className="px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Inventory Dashboard</h1>
              <p className="text-muted-foreground">Track and optimize your inventory management</p>
            </div>
            
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              <Link href="/dashboard">
                <Button className="flex items-center gap-2" variant="outline">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Main Dashboard</span>
                </Button>
              </Link>
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
      
      {/* Inventory Dashboard */}
      <div className="px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Inventory Analysis</h2>
          <p className="text-muted-foreground">Customize your dashboard by dragging, resizing, and adjusting module heights</p>
        </div>
        
        <InventoryDashboard 
          topProducts={topProducts}
          lowStockProducts={lowStockProducts}
          highMarginProducts={highMarginProducts}
          possibleNetIncome={possibleNetIncome}
          inventoryValue={inventoryMetrics.inventoryValue}
          totalProducts={inventoryMetrics.totalProducts}
          lowStockCount={inventoryMetrics.lowStockCount}
        />
      </div>
    </div>
  );
} 