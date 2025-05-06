'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import AppleWatchGrid from '@/components/ui/apple-watch-grid';
import InventoryGrid from '@/components/ui/inventory-grid';
import ElectricityCard from '@/components/ui/electricity-card';
import HeroSectionMinimal from '@/components/ui/hero-section-minimal';
import DashboardPage from '@/app/(dashboard)/page';
import { 
  Package, 
  BarChart, 
  ShoppingBag, 
  FileSpreadsheet, 
  Settings, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'pink';
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
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
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
  
  // Only access theme after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { resolvedTheme } = useTheme();
  const isDarkMode = mounted && (resolvedTheme === 'dark');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          
          // Fetch dashboard data
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
          
          // Reset to zero values instead of mock data
          setDashboardData({
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
        }
      }
    };
    
    if (status !== 'loading') {
      fetchDashboardData();
    }
  }, [status]);

  // If user is authenticated, render the dashboard directly
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-background">
        {/* Dashboard Content */}
        <main className="p-4.5">
          <div className="flex flex-col gap-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground">Here's what's happening with your business today.</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <Link href="/inventory?tab=products&productTab=add">
                  <Button variant="outline" className="gap-2">
                    <Package className="h-4 w-4" />
                    Inventory Manager
                  </Button>
                </Link>
                <Link href="/inventory?tab=sales&salesTab=add">
                  <Button className="gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Sales Manager
                  </Button>
                </Link>
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
                      View sales history
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
                      View revenue details
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
              <Link href="/inventory?tab=products" className="block">
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
              
              <Link href="/data-import" className="block">
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
                      {/* Map through recent sales here */}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 border rounded-md">
                      <div className="text-center">
                        <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No recent activity to display</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href="/analytics">
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
                  {dashboardData.lowStockCount > 0 ? (
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
                      {/* List of low stock items would go here */}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 border rounded-md">
                      <p className="text-muted-foreground">All items are well-stocked</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href="/inventory?tab=products&status=low-stock">
                    <Button variant="outline">View Low Stock Items</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Features for electricity section
  const features: Feature[] = [
    {
      title: "Real-time Inventory",
      description: "Track stock levels across all locations with automatic updates",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
      color: "blue"
    },
    {
      title: "Smart Analytics",
      description: "Data-driven insights to optimize your inventory and reduce waste",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M3 3v18h18" />
          <path d="m7 17 4-4 4 4 6-6" />
        </svg>
      ),
      color: "purple"
    },
    {
      title: "Multi-channel Sales",
      description: "Seamlessly integrate with your existing online and offline sales channels",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M9 7 6 4 3 7" />
          <path d="M9 17 6 20 3 17" />
          <path d="M14 4h4v4h-4z" />
          <path d="M14 16h4v4h-4z" />
          <path d="M6 4v16" />
          <path d="M14 8v8" />
        </svg>
      ),
      color: "pink"
    }
  ];

  // Theme-dependent styles for electricity section
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const descriptionColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const dotColor = isDarkMode ? '#333' : '#ddd';
  const lineColor = isDarkMode ? '#888' : '#ccc';
  
  return (
    <div className="relative overflow-hidden min-h-[200vh]">
      {/* Unified Background Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] opacity-60"></div>
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-[80px] opacity-40"></div>
      </div>

      {/* InventoryGrid with squares - positioned for better rebound effect visibility */}
      <div className="fixed inset-x-0 top-0 bottom-0 z-[1] pointer-events-none">
        <InventoryGrid numBoxes={100} boxSize={12} />
      </div>
      
      {/* AppleWatchGrid with lines - also positioned more conservatively */}
      <div className="absolute inset-x-0 top-[10vh] bottom-0 z-[2] pointer-events-none">
        <AppleWatchGrid numLines={10} lineThickness={1} />
      </div>

      {/* Content layers with higher z-index */}
      <div className="relative z-10">
        {/* Render only the minimal hero section */}
        <HeroSectionMinimal />

        {/* Electricity Section (now merged into the page) */}
        <div className="pt-8 pb-24 relative">
          <div className="container mx-auto px-6 relative">
            <div className="text-center mb-16">
              <h2 className={`text-4xl font-bold mb-4 ${textColor}`}>
                Built on a foundation of <span className="gradient-text">fast, production-grade</span> tooling
              </h2>
            </div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-6">
            {/* Background grid pattern - reduce opacity since we now have multiple layers */}
            <div className="absolute inset-0 w-full h-full opacity-5">
              <div className="absolute top-0 left-0 right-0 bottom-0" 
                  style={{
                    backgroundImage: `radial-gradient(circle at 25px 25px, ${dotColor} 2px, transparent 0), radial-gradient(circle at 75px 75px, ${dotColor} 2px, transparent 0)`,
                    backgroundSize: '100px 100px'
                  }}>
              </div>
              <svg className="absolute w-full h-full" viewBox="0 0 1200 800" fill="none">
                <g opacity="0.2">
                  <path d={`M0 400H1200`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
                  <path d={`M600 0V800`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
                  <path d={`M300 300L900 500`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
                  <path d={`M300 500L900 300`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
                </g>
              </svg>
            </div>
            
            <div className="relative w-full">
              {/* Top row with feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {features.map((feature, index) => (
                  <div key={index}>
                    <ElectricityCard 
                      color={feature.color}
                      animationDelay={0.2 * index}
                    >
                      <div className="flex flex-col items-start h-full">
                        <div className={`mb-4 ${
                          feature.color === 'blue' 
                            ? 'text-blue-600 dark:text-blue-500' 
                            : feature.color === 'purple' 
                              ? 'text-purple-600 dark:text-purple-500' 
                              : 'text-pink-600 dark:text-pink-500'
                        }`}>
                          {feature.icon}
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${textColor} flex items-center`}>
                          {feature.title}
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                          </svg>
                        </h3>
                        <p className={descriptionColor}>{feature.description}</p>
                      </div>
                    </ElectricityCard>
                  </div>
                ))}
              </div>
              
              {/* MerchX Engine Card - Center */}
              <div className="max-w-2xl mx-auto">
                <ElectricityCard 
                  color="blue"
                  animationDelay={0.6}
                  className="p-4"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-gradient-start via-brand-gradient-mid to-brand-gradient-end rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-6">
                      MX
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 ${textColor}`}>MerchX Engine</h3>
                    <p className={descriptionColor}>
                      Our powerful inventory management engine combines real-time tracking, predictive analytics, and seamless integrations
                    </p>
                  </div>
                </ElectricityCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 