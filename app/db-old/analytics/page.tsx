'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicDashboard, { ModuleConfig } from '@/components/features/DynamicDashboard';
import LineChart from '@/components/features/LineChart';
import BarChart from '@/components/features/BarChart';
import CategoryChart from '@/components/features/CategoryChart';
import SalesMetricsCard from '@/components/features/SalesMetricsCard';

// skeleton loader for modules
function ModuleSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <Skeleton className="h-8 w-1/3" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-1/2" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

// best selling items module
function BestSellingItems() {
  // mock data for demonstration - in a real app this would be fetched from API
  const mockData = [
    { product: "Product A", quantity: 124 },
    { product: "Product B", quantity: 98 },
    { product: "Product C", quantity: 82 },
    { product: "Product D", quantity: 67 },
    { product: "Product E", quantity: 56 }
  ];
  
  return (
    <div className="h-full">
      <CategoryChart
        data={mockData}
        categoryKey="product"
        valueKey="quantity"
        valueLabel="Units Sold"
        height={330}
      />
    </div>
  );
}

// low stock items module
function LowStockItems() {
  // mock data for demonstration
  const mockData = [
    { product: "Product X", quantity: 3 },
    { product: "Product Y", quantity: 5 },
    { product: "Product Z", quantity: 7 },
    { product: "Product W", quantity: 9 },
    { product: "Product V", quantity: 10 }
  ];
  
  return (
    <div className="h-full">
      <BarChart
        data={mockData}
        categoryKey="product"
        valueKey="quantity"
        valueLabel="Stock Level"
        horizontal={true}
        height={330}
      />
    </div>
  );
}

// possible net income module
function PossibleNetIncome() {
  // mock data for demonstration
  const mockData = [
    { month: "Jan", income: 42500 },
    { month: "Feb", income: 38700 },
    { month: "Mar", income: 51200 },
    { month: "Apr", income: 48900 },
    { month: "May", income: 53400 },
    { month: "Jun", income: 57800 }
  ];
  
  return (
    <div className="h-full">
        <LineChart
        data={mockData}
        xAxisKey="month"
        dataKeys={["income"]}
        dataLabels={["Projected Income"]}
          yAxisFormatters={[(value) => `$${value.toLocaleString()}`]}
        height={330}
        />
    </div>
  );
}

// highest margin items module
function HighestMarginItems() {
  // mock data for demonstration
  const mockData = [
    { product: "Product K", margin: 78 },
    { product: "Product L", margin: 72 },
    { product: "Product M", margin: 65 },
    { product: "Product N", margin: 62 },
    { product: "Product O", margin: 58 }
  ];
  
  return (
    <div className="h-full">
      <BarChart
        data={mockData}
          categoryKey="product"
        valueKey="margin"
        valueLabel="Margin %"
        height={330}
        />
    </div>
  );
}

// projected earnings module
function ProjectedEarnings() {
  // mock data for demonstration
  const mockData = [
    { quarter: "Q1", actual: 145000, projected: 140000 },
    { quarter: "Q2", actual: 175000, projected: 170000 },
    { quarter: "Q3", actual: 0, projected: 195000 },
    { quarter: "Q4", actual: 0, projected: 220000 }
  ];
  
  return (
    <div className="h-full">
      <LineChart
        data={mockData}
        xAxisKey="quarter"
        dataKeys={["actual", "projected"]}
        dataLabels={["Actual", "Projected"]}
        yAxisFormatters={[(value) => `$${value.toLocaleString()}`]}
        height={330}
      />
    </div>
  );
}

// peak selling hours module
function PeakSellingHours() {
  // mock data for demonstration
  const mockData = [
    { hour: "9am", sales: 24 },
    { hour: "10am", sales: 36 },
    { hour: "11am", sales: 45 },
    { hour: "12pm", sales: 68 },
    { hour: "1pm", sales: 72 },
    { hour: "2pm", sales: 56 },
    { hour: "3pm", sales: 48 },
    { hour: "4pm", sales: 52 },
    { hour: "5pm", sales: 64 },
    { hour: "6pm", sales: 58 },
    { hour: "7pm", sales: 43 },
    { hour: "8pm", sales: 32 }
  ];
  
  return (
    <div className="h-full">
          <BarChart
        data={mockData}
        categoryKey="hour"
        valueKey="sales"
        valueLabel="Sales"
        height={330}
          />
          </div>
  );
}

// most optimal items module
function MostOptimalItems() {
  // mock data for demonstration
  const mockData = [
    { product: "Product P", score: 91 },
    { product: "Product Q", score: 87 },
    { product: "Product R", score: 83 },
    { product: "Product S", score: 79 },
    { product: "Product T", score: 75 }
  ];
  
  return (
    <div className="h-full">
      <CategoryChart
        data={mockData}
        categoryKey="product"
        valueKey="score"
        valueLabel="Optimal Score"
        height={330}
        />
    </div>
  );
}

export default function AnalyticsPage() {
  // define all available modules
  const modules: ModuleConfig[] = [
    {
      id: 'best-selling',
      title: 'Best Selling Items',
      description: 'Top items by sales volume',
      component: <BestSellingItems />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'low-stock',
      title: 'Low Stock Items',
      description: 'Items that need reordering soon',
      component: <LowStockItems />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'net-income',
      title: 'Possible Net Income',
      description: 'Projected revenue over time',
      component: <PossibleNetIncome />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'highest-margin',
      title: 'Highest Margin Items',
      description: 'Products with best profit margins',
      component: <HighestMarginItems />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'projected-earnings',
      title: 'Projected Earnings',
      description: 'Quarterly earnings forecast',
      component: <ProjectedEarnings />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'peak-selling-hours',
      title: 'Peak Selling Hours',
      description: 'Sales volume by time of day',
      component: <PeakSellingHours />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'most-optimal-items',
      title: 'Most Optimal Items',
      description: 'Products with best performance metrics',
      component: <MostOptimalItems />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    }
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="grid grid-cols-2 gap-4"><ModuleSkeleton /><ModuleSkeleton /></div>}>
        <DynamicDashboard
          title="Analytics Dashboard"
          modules={modules}
          storageKey="analytics-dashboard"
          columns={4}
          availableSizes={['small', 'medium', 'large', 'full']}
        />
        </Suspense>
    </div>
  );
} 