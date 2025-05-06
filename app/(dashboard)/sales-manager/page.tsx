'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileSpreadsheet, ShoppingBag } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import DynamicDashboard, { ModuleConfig } from '@/components/features/DynamicDashboard';
import {
  ProjectedEarningsWidget,
  PeakSellingHoursWidget,
  PriceSuggestionsWidget,
  MostOptimalItemsWidget,
  SalesSummaryStats
} from '@/components/features/sales/SalesWidgets';

// Define types for our data structures
interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
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

interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
}

export default function SalesManagerPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // State for sales data
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });
  
  // State for widgets data
  const [projectedEarnings, setProjectedEarnings] = useState<ProjectedEarning[]>([]);
  const [peakSellingHours, setPeakSellingHours] = useState<PeakSellingHour[]>([]);
  const [priceSuggestions, setPriceSuggestions] = useState<PriceSuggestion[]>([]);
  const [optimalItems, setOptimalItems] = useState<OptimalItem[]>([]);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          
          // Fetch analytics data
          const analyticsResponse = await fetch('/api/analytics?timeRange=30');
          const analyticsData = await analyticsResponse.json();
          
          // Fetch products data for suggestions
          const productsResponse = await fetch('/api/products');
          const productsData = await productsResponse.json();
          
          // Set sales metrics
          setSalesMetrics({
            totalSales: analyticsData.totalSales || 0,
            totalRevenue: analyticsData.totalRevenue || 0,
            averageOrderValue: analyticsData.totalSales ? analyticsData.totalRevenue / analyticsData.totalSales : 0,
            conversionRate: analyticsData.conversionRate || 4.5, // Default if not available
          });
          
          // Set projected earnings (sample data - replace with actual API data)
          setProjectedEarnings([
            { month: 'Jan', actual: Math.round(Math.random() * 5000) + 1000, projected: Math.round(Math.random() * 6000) + 1000 },
            { month: 'Feb', actual: Math.round(Math.random() * 5500) + 1100, projected: Math.round(Math.random() * 6500) + 1100 },
            { month: 'Mar', actual: Math.round(Math.random() * 6000) + 1200, projected: Math.round(Math.random() * 7000) + 1200 },
            { month: 'Apr', actual: Math.round(Math.random() * 6500) + 1300, projected: Math.round(Math.random() * 7500) + 1300 },
            { month: 'May', actual: Math.round(Math.random() * 7000) + 1400, projected: Math.round(Math.random() * 8000) + 1400 },
            { month: 'Jun', actual: null, projected: Math.round(Math.random() * 8500) + 1500 },
          ]);
          
          // Set peak selling hours (sample data - replace with actual API data)
          setPeakSellingHours([
            { hour: '9AM-12PM', sales: Math.round(Math.random() * 30) + 10 },
            { hour: '12PM-3PM', sales: Math.round(Math.random() * 40) + 15 },
            { hour: '3PM-6PM', sales: Math.round(Math.random() * 50) + 20 },
            { hour: '6PM-9PM', sales: Math.round(Math.random() * 35) + 15 },
          ]);
          
          // Set price suggestions (sample data - replace with actual API data)
          setPriceSuggestions(
            productsData.products
              ?.slice(0, 5)
              .map((p: Product) => ({
                id: p.id,
                name: p.name,
                currentPrice: p.price || p.sellingPrice || 19.99,
                suggestedPrice: (p.price || p.sellingPrice || 19.99) * (1 + (Math.random() * 0.2 - 0.1)), // -10% to +10% suggestion
                potential: Math.random() * 15 // potential percentage increase
              })) || []
          );
          
          // Set optimal items (sample data - replace with actual API data)
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
    return <LoadingSpinner fullscreen message="Loading sales dashboard..." />;
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
  
  // Define dashboard modules
  const dashboardModules: ModuleConfig[] = [
    {
      id: 'projected-earnings',
      title: 'Projected Earnings',
      description: 'Forecast of future earnings based on historical data',
      component: <ProjectedEarningsWidget data={projectedEarnings} />,
      defaultSize: 'large',
      minimizable: true,
      removable: true,
    },
    {
      id: 'peak-selling-hours',
      title: 'Peak Selling Hours',
      description: 'Hours with the highest sales volume',
      component: <PeakSellingHoursWidget data={peakSellingHours} />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true,
    },
    {
      id: 'price-suggestions',
      title: 'Price Suggestions',
      description: 'Recommended price adjustments to maximize profit',
      component: <PriceSuggestionsWidget data={priceSuggestions} />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true,
    },
    {
      id: 'most-optimal-items',
      title: 'Most Optimal Items',
      description: 'Products with the best overall performance',
      component: <MostOptimalItemsWidget data={optimalItems} />,
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
              <h1 className="text-2xl font-semibold tracking-tight">Sales Manager</h1>
              <p className="text-muted-foreground">Manage your sales strategy and optimize revenue</p>
            </div>
            
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              <Link href="/sales">
                <Button className="flex items-center gap-2" variant="outline">
                  <ShoppingBag className="h-4 w-4" />
                  <span>View Sales</span>
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
      
      {/* Sales Summary Stats */}
      <div className="px-6 mb-8">
        <SalesSummaryStats 
          totalSales={salesMetrics.totalSales}
          totalRevenue={salesMetrics.totalRevenue}
          averageOrderValue={salesMetrics.averageOrderValue}
          conversionRate={salesMetrics.conversionRate}
        />
      </div>
      
      {/* Widgets Dashboard */}
      <div className="px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Sales Analysis</h2>
          <p className="text-muted-foreground">Customize your dashboard by dragging and resizing modules</p>
        </div>
        
        <DynamicDashboard
          modules={dashboardModules}
          storageKey="sales-manager-dashboard"
          columns={4}
        />
      </div>
    </div>
  );
} 