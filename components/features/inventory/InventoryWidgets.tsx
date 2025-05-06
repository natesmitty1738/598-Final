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
import { DollarSign, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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

// Best Selling Items Widget
export const BestSellingItemsWidget = ({ data = [] }: { data: any[] }) => {
  return (
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
          {data.length > 0 ? (
            data.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{product.unitsSold}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
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

// Low Stock Items Widget
export const LowStockItemsWidget = ({ data = [] }: { data: any[] }) => {
  return (
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
          {data.length > 0 ? (
            data.map((product) => (
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
  );
};

// Possible Net Income Widget
export const PossibleNetIncomeWidget = ({ value = 0 }: { value: number }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <DollarSign className="h-12 w-12 text-green-500 mb-4" />
      <h3 className="text-3xl font-bold text-green-500 mb-2">{formatCurrency(value)}</h3>
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
  );
};

// Highest Margin Items Widget
export const HighestMarginItemsWidget = ({ data = [] }: { data: any[] }) => {
  return (
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
          {data.length > 0 ? (
            data.map((product) => (
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
  );
};

// Price Suggestions Widget
export const PriceSuggestionsWidget = ({ data = [] }: { data: any[] }) => {
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
export const MostOptimalItemsWidget = ({ data = [] }: { data: any[] }) => {
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

// Stats Summary Card (e.g. for showing top-level metrics)
export const StatsSummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend = 0,
  trendLabel = '',
  variant = 'default'
}: { 
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const getTrendBadge = () => {
    if (trend === 0) return null;
    
    const isPositive = trend > 0;
    const badgeClass = isPositive 
      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    
    return (
      <Badge variant="outline" className={badgeClass}>
        {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% {trendLabel}
      </Badge>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {getTrendBadge()}
        </div>
      </CardContent>
    </Card>
  );
}; 