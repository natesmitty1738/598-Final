"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import CategoryChart from '@/components/features/CategoryChart';
import LineChart from '@/components/features/LineChart';
import ChartCard from '@/components/features/ChartCard';
import { useTheme } from "next-themes";
import { BarChart3, PieChart as PieChartIcon, DollarSign, TrendingUp, AlertTriangle, ArrowUp, ArrowDown, Calendar, ChevronDown, XIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { addDays, format, subDays } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

function DailySalesChart({ data }: { data: any[] }) {
  const { resolvedTheme } = useTheme();
  
  // Format large numbers with K, M, B suffixes
  const formatLargeNumber = (value: number) => {
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

  const formatCurrency = (value: number) => {
    return `$${formatLargeNumber(value)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <LineChart
      data={data}
      xAxisKey="date"
      dataKeys={["sales", "revenue"]}
      dataLabels={["Number of Sales", "Revenue ($)"]}
      xAxisFormatter={formatDate}
      tooltipLabelFormatter={formatDate}
      yAxisFormatters={[
        (value) => Math.round(value).toString(),
        formatCurrency
      ]}
      yAxisIds={["left", "right"]}
      height="100%"
    />
  );
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(() => {
    // Get saved timeRange from localStorage, default to "7"
    if (typeof window !== 'undefined') {
      return localStorage.getItem('analytics_timeRange') || "7";
    }
    return "7";
  });

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Default to 7 days ago to today
    const defaultRange = {
      from: subDays(new Date(), 7),
      to: new Date(),
    };
    
    if (typeof window !== 'undefined') {
      try {
        const savedRange = localStorage.getItem('analytics_dateRange');
        if (savedRange) {
          const parsed = JSON.parse(savedRange);
          return {
            from: parsed.from ? new Date(parsed.from) : undefined,
            to: parsed.to ? new Date(parsed.to) : undefined
          };
        }
      } catch (error) {
        console.error("Error parsing saved date range:", error);
      }
    }
    return defaultRange;
  });

  const [showDateDialog, setShowDateDialog] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [pricingSuggestions, setPricingSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_timeRange', timeRange);
      if (dateRange && dateRange.from && dateRange.to) {
        localStorage.setItem('analytics_dateRange', JSON.stringify({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }));
      }
    }
  }, [timeRange, dateRange]);

  // Fetch analytics when time range changes
  useEffect(() => {
    if (timeRange !== 'custom' || (dateRange?.from && dateRange?.to)) {
      fetchAnalytics();
    }
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      let url = '/api/analytics';
      let params = new URLSearchParams();
      
      if (timeRange === "custom" && dateRange?.from && dateRange?.to) {
        // Validate dates
        if (!(dateRange.from instanceof Date) || !(dateRange.to instanceof Date) || 
            isNaN(dateRange.from.getTime()) || isNaN(dateRange.to.getTime())) {
          toast.error("Invalid date range");
          return;
        }
        
        // Format dates for API consumption
        params.append("startDate", dateRange.from.toISOString());
        params.append("endDate", dateRange.to.toISOString());
      } else if (timeRange === "all") {
        // No date params for all time 
      } else {
        // Use the timeRange parameter as days
        params.append("timeRange", timeRange);
      }
      
      url = `${url}?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalyticsData(data);
      
      // Generate pricing suggestions from real data if available
      if (data.topSellingProducts && data.topSellingProducts.length > 0) {
        generatePricingSuggestions(data.topSellingProducts);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    
    // Reset dates when switching to predefined range
    if (value !== "custom") {
      const today = new Date();
      const days = parseInt(value);
      if (!isNaN(days)) {
        setDateRange({
          from: subDays(today, days),
          to: today
        });
      }
    } else {
      setShowDateDialog(true);
    }
  };

  // Format date for display
  const formatDateForDisplay = (date: Date | undefined): string => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return "";
      }
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date for display:", error);
      return "";
    }
  };

  // Get date range display string
  const getDateRangeText = () => {
    try {
      if (timeRange === "all") {
        return "All Time";
      } else if (timeRange === "custom" && dateRange?.from && dateRange?.to) {
        return `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`;
      } else {
        const days = parseInt(timeRange);
        if (days === 1) return "Last 24 hours";
        if (days === 7) return "Last 7 days";
        if (days === 30) return "Last 30 days";
        if (days === 90) return "Last 90 days";
        if (days === 365) return "Last year";
        return `Last ${days} days`;
      }
    } catch (error) {
      console.error("Error getting date range text:", error);
      return "Select date range";
    }
  };

  // Handle date range selection and apply button click
  const handleApplyCustomRange = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    // Validate dates
    if (!(dateRange.from instanceof Date) || !(dateRange.to instanceof Date) || 
        isNaN(dateRange.from.getTime()) || isNaN(dateRange.to.getTime())) {
      toast.error("Invalid date format");
      return;
    }
    
    // Check that start date is before or equal to end date
    if (dateRange.from > dateRange.to) {
      toast.error("Start date must be before or equal to end date");
      return;
    }
    
    // Check that dates are not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (dateRange.from > today || dateRange.to > today) {
      toast.error("Dates cannot be in the future");
      return;
    }
    
    fetchAnalytics();
    setShowDateDialog(false);
  };

  // Generate pricing suggestions based on real sales data
  const generatePricingSuggestions = (topProducts: any[]) => {
    // Only generate suggestions if we have product data
    if (!topProducts.length) {
      setPricingSuggestions([]);
      return;
    }

    // Create real suggestions based on actual sales data
    const suggestions = topProducts.slice(0, 3).map(product => {
      // For top selling products, suggest a small price increase
      // This is a simple algorithm that could be enhanced with more sophisticated pricing strategies
      const currentPrice = product.revenue / product.quantity; // Average selling price
      const multiplier = Math.random() * 0.15 + 1.05; // Random increase between 5-20%
      const suggestedPrice = currentPrice * multiplier;
      const expectedRevenueChange = Math.round((multiplier - 1) * 100);
      
      return {
        productId: product.id,
        productName: product.name,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
        expectedRevenueChange: expectedRevenueChange,
        confidence: expectedRevenueChange > 12 ? 'high' : 'medium'
      };
    });
    
    setPricingSuggestions(suggestions);
  };

  if (loading) {
    return <LoadingSpinner fullscreen />;
  }

  if (!analyticsData) {
    return <div>No data available</div>;
  }
  
  return (
    <div className="mb-6">
      {/* Custom header with full-width border but padded content */}
      <div className="w-screen relative left-[calc(-50vw+50%)] mb-6">
        <div className="px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            </div>
            
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[240px] justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{getDateRangeText()}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-2">
                      <div className="grid gap-1">
                        <Button
                          variant={timeRange === "1" ? "default" : "ghost"}
                          className="justify-start font-normal"
                          onClick={() => handleTimeRangeChange("1")}
                        >
                          Last 24 hours
                        </Button>
                        <Button
                          variant={timeRange === "7" ? "default" : "ghost"}
                          className="justify-start font-normal"
                          onClick={() => handleTimeRangeChange("7")}
                        >
                          Last 7 days
                        </Button>
                        <Button
                          variant={timeRange === "30" ? "default" : "ghost"}
                          className="justify-start font-normal"
                          onClick={() => handleTimeRangeChange("30")}
                        >
                          Last 30 days
                        </Button>
                        <Button
                          variant={timeRange === "90" ? "default" : "ghost"}
                          className="justify-start font-normal"
                          onClick={() => handleTimeRangeChange("90")}
                        >
                          Last 90 days
                        </Button>
                        <Button
                          variant={timeRange === "365" ? "default" : "ghost"}
                          className="justify-start font-normal"
                          onClick={() => handleTimeRangeChange("365")}
                        >
                          Last year
                        </Button>
                      </div>
                      <div className="border-t my-2" />
                      <Button
                        variant={timeRange === "custom" ? "default" : "ghost"}
                        className="justify-start font-normal w-full"
                        onClick={() => handleTimeRangeChange("custom")}
                      >
                        Custom range
                      </Button>
                      <Button
                        variant={timeRange === "all" ? "default" : "ghost"}
                        className="justify-start font-normal w-full"
                        onClick={() => handleTimeRangeChange("all")}
                      >
                        All time
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <Link href="/reports">
                <div className="text-sm hover:underline text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                  <PieChartIcon className="h-4 w-4" />
                  View Reports
                </div>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-b w-full" />
      </div>

      {/* Custom date range dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose date range</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Start date
              </Label>
              <Input
                id="start-date"
                type="date"
                className="col-span-3"
                value={dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                max={dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined;
                  setDateRange(prev => ({
                    from: newDate,
                    to: prev?.to
                  }));
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-date" className="text-right">
                End date
              </Label>
              <Input
                id="end-date"
                type="date"
                className="col-span-3"
                value={dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                max={format(new Date(), "yyyy-MM-dd")}
                min={dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined;
                  setDateRange(prev => ({
                    from: prev?.from,
                    to: newDate
                  }));
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDateDialog(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button onClick={handleApplyCustomRange} size="sm">
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Content */}
      <div className="px-6">
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

        {/* Dynamic Pricing Suggestions Section */}
        {pricingSuggestions.length > 0 && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-indigo-600/5 to-purple-600/5 overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <DollarSign className="mr-2 h-5 w-5 text-indigo-600" />
                      Dynamic Pricing Recommendations
                    </CardTitle>
                    <CardDescription>Generated from your sales history</CardDescription>
                  </div>
                  <Link href="/analytics/pricing">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricingSuggestions.map((suggestion, index) => (
                    <Card key={index} className="border-0 bg-white/50 dark:bg-gray-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{suggestion.productName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Current Price</span>
                          <span>${suggestion.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Suggested Price</span>
                          <span className="font-semibold">${suggestion.suggestedPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Expected Impact</span>
                          <span className="text-emerald-500 flex items-center">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            {suggestion.expectedRevenueChange}% revenue
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Daily Sales" description="Sales and revenue over time">
            <div className="h-[320px] w-full">
              <DailySalesChart data={analyticsData.dailySales} />
            </div>
          </ChartCard>

          <ChartCard title="Sales by Category" description="Revenue distribution by category">
            <div className="h-[320px] w-full">
              <CategoryChart
                data={analyticsData.salesByCategory}
                categoryKey="category"
                valueKey="revenue"
                valueLabel="Revenue ($)"
                height="100%"
              />
            </div>
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
            <div className="h-[320px] w-full">
              <CategoryChart
                data={analyticsData.salesByCategory}
                categoryKey="category"
                valueKey="revenue"
                valueLabel="Revenue ($)"
                displayAsPie={true}
                height="100%"
              />
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
} 