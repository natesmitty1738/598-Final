"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AnalyticsData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!analyticsData) {
    return <div>No data available</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analyticsData.totalSales}
            </div>
            <p className="text-sm text-muted-foreground">
              Number of completed sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${analyticsData.totalRevenue.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Total revenue from sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${analyticsData.averageOrderValue.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Average value per sale
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topSellingProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} units sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${product.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revenue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.stockQuantity} units in stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.salesByCategory.map((category) => (
                <div
                  key={category.category}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {category.category || "Uncategorized"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${category.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revenue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 