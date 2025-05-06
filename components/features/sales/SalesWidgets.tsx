import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, TrendingUp, Clock, Lightbulb, DollarSign, ChevronsUp } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer } from 'recharts';
import CustomBarChart from '@/components/features/BarChart';

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Format percentage
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Define interfaces for the data
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

interface Sale {
  id: string;
  amount: number;
  customer?: {
    name?: string;
    email?: string;
  };
}

// Projected Earnings Widget
export const ProjectedEarningsWidget = ({ data = [] }: { data: ProjectedEarning[] }) => {
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height={300}>
        <CustomBarChart
          data={data}
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
  );
};

// Peak Selling Hours Widget
export const PeakSellingHoursWidget = ({ data = [] }: { data: PeakSellingHour[] }) => {
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height={300}>
        <CustomBarChart
          data={data}
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
  );
};

// Price Suggestions Widget
export const PriceSuggestionsWidget = ({ data = [] }: { data: PriceSuggestion[] }) => {
  return (
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
          {data.length > 0 ? (
            data.map((product) => (
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
  );
};

// Most Optimal Items Widget
export const MostOptimalItemsWidget = ({ data = [] }: { data: OptimalItem[] }) => {
  return (
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
          {data.length > 0 ? (
            data.map((product) => (
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
  );
};

// Sales Summary Stats
export const SalesSummaryStats = ({ 
  totalSales = 0, 
  totalRevenue = 0, 
  averageOrderValue = 0, 
  conversionRate = 0 
}: { 
  totalSales: number; 
  totalRevenue: number; 
  averageOrderValue: number; 
  conversionRate: number;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Sales</CardDescription>
          <CardTitle className="text-2xl font-bold">{totalSales}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>This period</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-bold">{formatCurrency(totalRevenue)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>From all sales</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Avg. Order Value</CardDescription>
          <CardTitle className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <ChevronsUp className="h-4 w-4 mr-1" />
            <span>Per transaction</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Conversion Rate</CardDescription>
          <CardTitle className="text-2xl font-bold">{formatPercent(conversionRate)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <Lightbulb className="h-4 w-4 mr-1" />
            <span>Visitors to buyers</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Recent Sales Widget
export const RecentSalesWidget = ({ data = [] }: { data: Sale[] }) => {
  return (
    <div className="space-y-8">
      {data.length > 0 ? (
        data.map((sale) => (
          <div key={sale.id} className="flex items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{sale.customer?.name || 'Anonymous'}</p>
              <p className="text-sm text-muted-foreground">{sale.customer?.email || 'No email'}</p>
            </div>
            <div className="ml-auto font-medium">{formatCurrency(sale.amount)}</div>
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-4">No recent sales</p>
      )}
    </div>
  );
}; 