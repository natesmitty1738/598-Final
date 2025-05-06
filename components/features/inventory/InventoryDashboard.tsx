'use client';

import React from 'react';
import { 
  Package, 
  TrendingUp, 
  DollarSign,
  ArrowRight,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import DynamicDashboard, { ModuleConfig } from '@/components/features/DynamicDashboard';

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

interface InventoryDashboardProps {
  topProducts: Product[];
  lowStockProducts: LowStockProduct[];
  highMarginProducts: HighMarginProduct[];
  possibleNetIncome: number;
  inventoryValue: number;
  totalProducts: number;
  lowStockCount: number;
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

export default function InventoryDashboard({
  topProducts,
  lowStockProducts,
  highMarginProducts,
  possibleNetIncome,
  inventoryValue,
  totalProducts,
  lowStockCount
}: InventoryDashboardProps) {
  
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
      id: 'inventory-value-widget',
      title: 'Inventory Value',
      description: 'Total value of your current inventory',
      component: (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
          <Package className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-3xl font-bold mb-2">{formatCurrency(inventoryValue)}</h3>
          <p className="text-muted-foreground">
            Total value of {totalProducts} products
          </p>
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Low stock items</span>
              <span className="text-sm font-semibold">{lowStockCount}</span>
            </div>
            <Progress value={(lowStockCount / totalProducts) * 100} className="h-2" />
          </div>
        </div>
      ),
      defaultSize: 'small',
      defaultHeight: 'compact',
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
  ];
  
  return (
    <DynamicDashboard
      modules={dashboardModules}
      storageKey="inventory-dashboard"
      columns={4}
      autoFill={false}
    />
  );
} 