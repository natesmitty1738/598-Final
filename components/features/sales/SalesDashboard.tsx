'use client';

import React from 'react';
import {
  TrendingUp,
  Clock,
  DollarSign,
  ArrowRight,
  ChevronsUp,
  Percent,
  Lightbulb
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import CustomBarChart from '@/components/features/BarChart';
import DynamicDashboard, { ModuleConfig } from '@/components/features/DynamicDashboard';

// Define types for our data structures
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

interface SalesDashboardProps {
  projectedEarnings: ProjectedEarning[];
  peakSellingHours: PeakSellingHour[];
  priceSuggestions: PriceSuggestion[];
  optimalItems: OptimalItem[];
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Format percentage
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export default function SalesDashboard({
  projectedEarnings,
  peakSellingHours,
  priceSuggestions,
  optimalItems,
  totalSales,
  totalRevenue,
  averageOrderValue,
  conversionRate
}: SalesDashboardProps) {
  
  // Define dashboard modules
  const dashboardModules: ModuleConfig[] = [
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
      id: 'total-revenue',
      title: 'Total Revenue',
      description: 'Overall revenue from all sales',
      component: (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <DollarSign className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-3xl font-bold mb-2">{formatCurrency(totalRevenue)}</h3>
          <p className="text-muted-foreground text-center">
            From {totalSales} total sales
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reports/sales">
                View Sales Report <ArrowRight className="ml-2 h-4 w-4" />
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
      id: 'conversion-rate',
      title: 'Conversion Rate',
      description: 'Percentage of visitors who made a purchase',
      component: (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <Percent className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-3xl font-bold mb-2">{formatPercent(conversionRate)}</h3>
          <p className="text-muted-foreground text-center">
            Conversion rate for the current period
          </p>
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Target: 5.0%</span>
            </div>
            <Progress value={(conversionRate / 5) * 100} className="h-2" />
          </div>
        </div>
      ),
      defaultSize: 'small',
      defaultHeight: 'compact',
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
    <DynamicDashboard
      modules={dashboardModules}
      storageKey="sales-dashboard"
      columns={4}
      autoFill={false}
    />
  );
} 