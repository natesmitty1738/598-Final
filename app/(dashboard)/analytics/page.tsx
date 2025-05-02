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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import CategoryChart from '@/components/features/CategoryChart';
import ChartCard from '@/components/features/ChartCard';
import { useTheme } from "next-themes";
import PageHeader from "@/components/layout/PageHeader";

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
  salesByCategory: Array<{
    category: string;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function DailySalesChart({ data }: { data: any[] }) {
  const { resolvedTheme } = useTheme();
  const [salesLineColor, setSalesLineColor] = useState('#4f46e5');
  const [revenueLineColor, setRevenueLineColor] = useState('#10b981');
  const [textColor, setTextColor] = useState('rgba(0, 0, 0, 0.87)');
  
  // Update colors when theme changes
  useEffect(() => {
    setSalesLineColor(resolvedTheme === 'dark' ? '#818cf8' : '#4f46e5');
    setRevenueLineColor(resolvedTheme === 'dark' ? '#34d399' : '#10b981');
    setTextColor(resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)');
  }, [resolvedTheme]);

  // Format large numbers with K, M, B suffixes
  const formatLargeNumber = (value: number) => {
    // For integers or amounts over 1000, don't show decimals
    if (value >= 1000 || Number.isInteger(value)) {
      if (value >= 1000000000) {
        return Math.round(value / 1000000000) + 'B';
      } else if (value >= 1000000) {
        return Math.round(value / 1000000) + 'M';
      } else if (value >= 1000) {
        return Math.round(value / 1000) + 'K';
      }
      return Math.round(value).toString();
    }
    // For smaller values, keep decimals
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const formatTooltipValue = (value: any, name: string) => {
    const numValue = Number(value);
    if (name === 'Revenue ($)') {
      return [`$${numValue.toLocaleString(undefined, {maximumFractionDigits: numValue >= 1000 ? 0 : 2})}`, name];
    }
    // Always show sales as integers
    return [Math.round(numValue).toLocaleString(), name];
  };

  const formatCurrency = (value: number) => {
    return `$${formatLargeNumber(value)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border)" 
            opacity={0.3}
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            stroke={textColor}
            opacity={0.7}
            tick={{ fill: textColor, fontSize: 11 }}
            tickLine={{ stroke: textColor }}
            axisLine={{ stroke: textColor }}
            height={40}
            angle={-30}
            textAnchor="end"
            interval={0}
            tickFormatter={formatDate}
          />
          <YAxis 
            stroke={textColor}
            opacity={0.7}
            tick={{ fill: textColor }}
            tickLine={{ stroke: textColor }}
            axisLine={{ stroke: textColor }}
            yAxisId="left"
            // Always show sales as integers
            tickFormatter={(value) => Math.round(value).toString()}
            width={30}
            padding={{ top: 10 }}
            domain={[0, 'auto']}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke={textColor}
            opacity={0.7}
            tick={{ fill: textColor }}
            tickLine={{ stroke: textColor }}
            axisLine={{ stroke: textColor }}
            tickFormatter={formatCurrency}
            width={40}
            padding={{ top: 10 }}
            domain={[0, 'auto']}
          />
          <Tooltip 
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              color: 'var(--foreground)'
            }}
            labelStyle={{
              color: 'var(--foreground)'
            }}
            labelFormatter={formatDate}
          />
          <Legend 
            formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
            wrapperStyle={{
              paddingTop: '10px'
            }}
            verticalAlign="top"
            height={36}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke={salesLineColor}
            name="Number of Sales"
            strokeWidth={2}
            dot={{ stroke: salesLineColor, strokeWidth: 2, r: 3 }}
            activeDot={{ stroke: salesLineColor, strokeWidth: 2, r: 5 }}
            yAxisId="left"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={revenueLineColor}
            name="Revenue ($)"
            strokeWidth={2}
            dot={{ stroke: revenueLineColor, strokeWidth: 2, r: 3 }}
            activeDot={{ stroke: revenueLineColor, strokeWidth: 2, r: 5 }}
            yAxisId="right"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
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
    <div className="w-full max-w-screen-xl mx-auto px-6 mb-6">
      <PageHeader title="Analytics">
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
      </PageHeader>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Daily Sales">
          <DailySalesChart data={analyticsData.dailySales} />
        </ChartCard>

        <ChartCard title="Sales by Category">
          <CategoryChart
            data={analyticsData.salesByCategory}
            categoryKey="category"
            valueKey="revenue"
            valueLabel="Revenue ($)"
          />
        </ChartCard>
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

        <ChartCard 
          title="Revenue Distribution by Category" 
          description="Percentage of total revenue by product category">
          <CategoryChart
            data={analyticsData.salesByCategory}
            categoryKey="category"
            valueKey="revenue"
            valueLabel="Revenue ($)"
            displayAsPie={true}
          />
        </ChartCard>
      </div>
    </div>
  );
} 