'use client'

import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Clock, BarChart3, FileUp, Calendar, TrendingUp, DollarSign } from 'lucide-react'
import LineChart from '@/components/features/LineChart'
import BarChart from '@/components/features/BarChart'
import CategoryChart from '@/components/features/CategoryChart'
import ClientOnly from '@/components/shared/ClientOnly'
import { format } from 'date-fns'
import { ProjectedEarningsGraph, GrowthRateChart } from '@/components/features/ProjectedEarningsGraph'
import { TimeSeriesPoint } from '@/lib/analytics/projected-earnings'

// Define types for the analytics data
interface ProjectedEarning {
  actual: {
    date: string;
    value: number;
  }[];
  projected: {
    date: string;
    value: number;
  }[];
  todayIndex: number;
}

interface PriceSuggestion {
  id: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  potential: number;
  confidence: string;
}

// Define analytics data interface for proper typing
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
  projectedEarnings: ProjectedEarning;
  priceSuggestions: PriceSuggestion[];
  dateRange: {
    start: string;
    end: string;
  };
}

// Helper function for currency formatting
const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Helper components for empty states
const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
    <p>No data available</p>
    <Button 
      variant="outline" 
      size="sm"
      className="mt-4"
      onClick={() => window.location.href = '/inventory?productTab=import&salesTab=import'}
    >
      Import Sales Data
    </Button>
  </div>
);

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const timeParam = searchParams.get('timeframe')
  
  const [timeframe, setTimeframe] = useState(timeParam || '7day')
  const [activeTab, setActiveTab] = useState(tabParam && ['projected', 'price'].includes(tabParam) ? tabParam : 'projected')
  const [isFilterSticky, setIsFilterSticky] = useState(false)
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [customRangeOpen, setCustomRangeOpen] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)
  const [itemsSold, setItemsSold] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low' | 'all'>('all')
  const [timeRange, setTimeRange] = useState('30')

  // Get x-axis formatter based on timeframe
  const getXAxisFormatter = () => {
    // Determine resolution based on timeframe
    let resolution = 'daily'
    if (timeframe === '7day') {
      resolution = 'daily'
    } else if (timeframe === '1month') {
      resolution = 'weekly'
    } else if (timeframe === '1year' || timeframe === 'all') {
      resolution = 'monthly'
    }

    // For all-time view, use special formatter that intelligently handles all resolutions
    if (timeframe === 'all') {
      return (value: string) => {
        try {
          // Handle pre-formatted strings
          if (value && typeof value === 'string') {
            // Handle quarterly format "YYYY-Q#"
            if (value.includes('-Q')) {
              return value;
            }
            
            // Handle yearly format that's just the year
            if (/^\d{4}$/.test(value)) {
              return value;
            }
            
            // Handle already formatted as "MMM yyyy"
            if (value.length <= 8 && value.includes(' ')) {
              return value;
            }
            
            // Handle ISO-like date formats YYYY-MM or YYYY-MM-DD
            if (value.includes('-')) {
              const parts = value.split('-');
              if (parts.length >= 2) {
                // If it's YYYY-MM format (monthly)
                if (parts.length === 2) {
                  try {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    // Validate year and month to avoid invalid dates
                    if (!isNaN(year) && !isNaN(month) && month >= 0 && month < 12) {
                      return new Date(year, month, 1).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      });
                    }
                    // If invalid numbers, return original
                    return value;
                  } catch (e) {
                    return value;
                  }
                }
                
                // If it's YYYY-MM-DD format (daily or weekly)
                if (parts.length === 3) {
                  try {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const day = parseInt(parts[2]);
                    // Validate date parts
                    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && 
                        month >= 0 && month < 12 && day > 0 && day <= 31) {
                      return new Date(year, month, day).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                    }
                    // If invalid numbers, return original
                    return value;
                  } catch (e) {
                    return value;
                  }
                }
              }
            }
          }
          
          // Fall back to parsing as regular date only if it's a valid date
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            });
          }
        } catch (e) {
          // If parsing fails, return the original value
          console.error('Error formatting date:', e);
        }
        
        // Return original if all else fails
        return value || '';
      };
    }

    switch(resolution) {
      case 'hourly':
        return (value: string) => {
          // Format hour strings like "10-12 PM" directly
          if (value.includes('AM') || value.includes('PM')) return value;
          // Otherwise format as hour
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return format(date, 'h a');
            }
          } catch (e) {}
          return value;
        };
      case 'daily':
        return (value: string) => {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return format(date, 'MMM d');
            }
          } catch (e) {}
          return value;
        };
      case 'weekly':
        // For weekly data, display might be something like "Jan 1-7"
        return (value: string) => value;
      case 'monthly':
        return (value: string) => {
          // Check if already formatted as "MMM yyyy"
          if (value.length <= 8 && value.includes(' ')) return value;
          
          // Handle YYYY-MM format directly to avoid Date constructor issues
          if (value.includes('-')) {
            const parts = value.split('-');
            if (parts.length === 2) {
              try {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                // Validate year and month
                if (!isNaN(year) && !isNaN(month) && month >= 0 && month < 12) {
                  return new Date(year, month, 1).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  });
                }
              } catch (e) {
                return value;
              }
            }
          }
          
          // Only use format if we have a valid date
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return format(date, 'MMM yyyy');
            }
          } catch (e) {}
          
          // Return original if parsing fails
          return value;
        };
      default:
        return (value: string) => {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return format(date, 'MMM d');
            }
          } catch (e) {}
          return value;
        };
    }
  };

  // Define time range options
  const timeRangeOptions = [
    { value: '7day', label: 'Last 7 Days', days: 7 },
    { value: '1month', label: '1 Month', days: 30 },
    { value: '1year', label: '1 Year', days: 365 },
    { value: 'all', label: 'All Time', days: 0 },
    { value: 'custom', label: 'Custom Range' }
  ]

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
      setLoading(true);
        setError(null);
        
        // Explicitly force reload when switching to all time view for debugging
        const forceReload = timeframe === 'all' ? '&forceReload=true' : '';
        
        // Log the timeframe for debugging
        console.log('[DEBUG] Fetching analytics for timeframe:', timeframe, 'confidenceLevel:', confidenceLevel);
        
        // Include confidenceLevel in the API request
        const response = await fetch(`/api/analytics?timeRange=${timeframe}&confidence=${confidenceLevel}${forceReload}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        // Parse and use the data
        const data = await response.json();
        
        // Log confidence level for debugging
        console.log('[DEBUG] Confidence level used:', confidenceLevel);
        
        // Log the projected earnings data for debugging
        if (data.projectedEarnings) {
          console.log('[DEBUG] Received projected earnings:', {
            actualCount: data.projectedEarnings.actual.length,
            projectedCount: data.projectedEarnings.projected.length,
            actualSample: data.projectedEarnings.actual.slice(0, 3),
            projectedSample: data.projectedEarnings.projected.slice(0, 3)
          });
        }
        
        console.log('Analytics data loaded:', data);
        // Add detailed logging of projectedEarnings
        console.log('ProjectedEarnings structure:', {
          hasData: !!data.projectedEarnings,
          actual: data.projectedEarnings?.actual ? {
            length: data.projectedEarnings.actual.length,
            firstItem: data.projectedEarnings.actual[0],
            lastItem: data.projectedEarnings.actual[data.projectedEarnings.actual.length - 1]
          } : null,
          projected: data.projectedEarnings?.projected ? {
            length: data.projectedEarnings.projected.length,
            firstItem: data.projectedEarnings.projected[0],
            lastItem: data.projectedEarnings.projected[data.projectedEarnings.projected.length - 1]
          } : null,
          todayIndex: data.projectedEarnings?.todayIndex
        });
        
        // Validate and sanitize data to prevent 500 errors
        // Create a safe version of the data with all required properties
        const safeData: AnalyticsData = {
          totalSales: data.totalSales || 0,
          totalRevenue: data.totalRevenue || 0,
          averageOrderValue: data.averageOrderValue || 0,
          topSellingProducts: data.topSellingProducts || [],
          salesByCategory: data.salesByCategory || [],
          dailySales: data.dailySales || [],
          projectedEarnings: data.projectedEarnings || { actual: [], projected: [], todayIndex: 0 },
          priceSuggestions: data.priceSuggestions || [],
          dateRange: data.dateRange || { start: new Date().toISOString(), end: new Date().toISOString() }
        };
        
        // Determine default resolution based on timeframe
        let defaultResolution = 'daily';
        if (timeframe === '7day') {
          defaultResolution = 'daily';
        } else if (timeframe === '1month') {
          defaultResolution = 'weekly';
        } else if (timeframe === '1year' || timeframe === 'all') {
          defaultResolution = 'monthly';
        }
        
        // Format data based on timeframe-determined resolution
        if (data.dailySales) {
          // Format dates based on resolution for better display
          if (defaultResolution === 'weekly') {
            // For weekly data, format might need to be adjusted
            // Weekly data is already formatted in the API
          } else if (defaultResolution === 'monthly') {
            // For monthly data, format correctly
            data.dailySales = data.dailySales.map((day: { date: string; sales: number; revenue: number }) => ({
              ...day,
              date: typeof day.date === 'string' && day.date.includes(' ') 
                ? day.date // Already formatted as "MMM yyyy"
                : format(new Date(day.date), 'MMM yyyy')
            }));
          }
        }
        
        setAnalyticsData(safeData);
        
        // Update summary cards with real data
        if (data.totalSales !== undefined) {
          setTotalSales(data.totalSales);
        }
        
        if (data.totalRevenue !== undefined) {
          setTotalRevenue(data.totalRevenue);
        }
        
        if (data.averageOrderValue !== undefined) {
          setAvgOrderValue(data.averageOrderValue);
        }
        
        // Calculate total items sold
        if (data.topSellingProducts) {
          const totalItemsSold = data.topSellingProducts.reduce((sum: number, product: { quantity: number }) => sum + product.quantity, 0);
          setItemsSold(totalItemsSold);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error instanceof Error ? error.message : String(error));
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, confidenceLevel]);

  // Add detailed debug logging to help trace data flow
  useEffect(() => {
    if (analyticsData) {
      // Log information about all calculator outputs
      console.log('Analytics data loaded summary:', {
        projectedEarnings: analyticsData.projectedEarnings ? {
          actualLength: analyticsData.projectedEarnings.actual?.length || 0,
          projectedLength: analyticsData.projectedEarnings.projected?.length || 0,
          todayIndex: analyticsData.projectedEarnings.todayIndex
        } : null,
        priceSuggestions: analyticsData.priceSuggestions ? {
          count: analyticsData.priceSuggestions.length,
          sample: analyticsData.priceSuggestions.slice(0, 2)
        } : null
      });
    }
  }, [analyticsData]);

  // Update active tab when URL parameters change
  useEffect(() => {
    if (tabParam && ['projected', 'price'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
    
    if (timeParam) {
      setTimeframe(timeParam)
    }
  }, [tabParam, timeParam])

  // Handle scroll for sticky filters
  useEffect(() => {
    const handleScroll = () => {
      if (filterContainerRef.current) {
        const { top } = filterContainerRef.current.getBoundingClientRect()
        setIsFilterSticky(top <= 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe)
    if (newTimeframe === 'custom') {
      setCustomRangeOpen(true)
    }
  }

  // Get display text for current timeframe
  const getTimeframeDisplay = () => {
    const option = timeRangeOptions.find(opt => opt.value === timeframe);
    return option ? option.label : 'Last 30 Days';
  };

  // Handle confidence level change
  const handleConfidenceLevelChange = (level: 'high' | 'medium' | 'low' | 'all') => {
    setConfidenceLevel(level);
    // Log for debugging purposes
    console.log(`Confidence level changed to: ${level}`);
    
    // Trigger data refresh to ensure state updates properly
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  }

  // Render the content for the active tab
  const renderTabContent = () => {
    // Display error message if there was an error loading data
    if (error) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      );
    }
    
    // Selected time period and resolution indicator
    const periodIndicator = (
      <div className="mb-6 p-3 bg-muted/30 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Viewing data for: <span className="font-medium">{getTimeframeDisplay()}</span></span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
          }}
        >
          Refresh
        </Button>
      </div>
    );

    // Summary KPI Cards that appear at the top of all tabs
    const summaryCards = (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Cards have been removed as requested */}
          </div>
    );

    if (activeTab === 'projected') {
      return (
        <>
          {periodIndicator}
          {/* summaryCards removed */}
          
          {/* Main chart: Projected Earnings - Now using our new component */}
          <ClientOnly>
            {analyticsData?.projectedEarnings && analyticsData.projectedEarnings.actual?.length > 0 ? (
              <ProjectedEarningsGraph 
                actualData={analyticsData.projectedEarnings.actual}
                projectedData={analyticsData.projectedEarnings.projected}
                todayIndex={analyticsData.projectedEarnings.todayIndex}
                timeframe={timeframe === 'all' ? 'all' : timeframe}
                height={400}
              />
            ) : (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Projected Earnings</CardTitle>
                  <CardDescription>Revenue forecast based on {getTimeframeDisplay()} data</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState message="No data available" />
                </CardContent>
              </Card>
            )}
          </ClientOnly>
          
          {/* Secondary charts in 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Growth Rate Chart - Now using our new component */}
            <ClientOnly>
              {analyticsData?.projectedEarnings?.actual && analyticsData.projectedEarnings.actual.length > 0 ? (
                <GrowthRateChart 
                  actualData={analyticsData.projectedEarnings.actual}
                  height={250}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Rate</CardTitle>
                    <CardDescription>Monthly growth percentage over {getTimeframeDisplay()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <p>No data available</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-4"
                        onClick={() => window.location.href = '/inventory?productTab=import&salesTab=import'}
                      >
                        Import Sales Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </ClientOnly>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>{getTimeframeDisplay()} revenue trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientOnly>
                  {analyticsData?.dailySales && analyticsData.dailySales.length > 0 ? (
                    <>
                  <LineChart
                        data={analyticsData.dailySales}
                    xAxisKey="date"
                    dataKeys={["revenue"]}
                    dataLabels={["Revenue"]}
                        xAxisFormatter={getXAxisFormatter()}
                    yAxisFormatters={[
                      (value) => `$${value.toLocaleString()}`
                    ]}
                        height={220}
                      />
                      
                      {/* Add trend and growth information from RevenueOverTime analysis */}
                      {/*<div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-md p-3">
                          <h4 className="text-sm font-medium mb-1">Trend</h4>
                          <div className="flex items-center">
                            {(() => {
                              // Determine trend icon based on growth
                              const trends = analyticsData.dailySales.map((day, i, arr) => 
                                i > 0 ? day.revenue - arr[i-1].revenue : 0
                              );
                              const overallTrend = trends.reduce((sum, val) => sum + val, 0);
                              
                              if (overallTrend > 0) {
                                return (
                                  <>
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                                    <span className="text-sm font-semibold text-green-500">
                                      Increasing
                                    </span>
                                  </>
                                );
                              } else if (overallTrend < 0) {
                                return (
                                  <>
                                    <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180 mr-2" />
                                    <span className="text-sm font-semibold text-red-500">
                                      Decreasing
                                    </span>
                                  </>
                                );
                              } else {
                                return (
                                  <>
                                    <div className="h-4 w-4 border-t-2 mr-2" />
                                    <span className="text-sm font-semibold">
                                      Stable
                                    </span>
                                  </>
                                );
                              }
                            })()}
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-md p-3">
                          <h4 className="text-sm font-medium mb-1">Average Revenue</h4>
                          <p className="text-sm font-semibold">
                            ${analyticsData.dailySales.reduce((sum, day) => sum + day.revenue, 0) / analyticsData.dailySales.length || 0 > 0 ? 
                              formatCurrency(analyticsData.dailySales.reduce((sum, day) => sum + day.revenue, 0) / analyticsData.dailySales.length) : 
                              "0.00"}
                            <span className="text-xs font-normal text-muted-foreground ml-1">per {timeframe === '7day' ? 'day' : timeframe === '1month' ? 'week' : 'month'}</span>
                          </p>
                        </div>
                      </div>*/}
                    </>
                  ) : (
                    <EmptyState message="No data available" />
                  )}
                </ClientOnly>
              </CardContent>
            </Card>
          </div>
        </>
      )
    } else if (activeTab === 'price') {
      // Custom period indicator for price recommendations that shows actual date range used
      const priceRecommendationsPeriodIndicator = (
        <div className="mb-6 p-3 bg-muted/30 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Viewing data for: <span className="font-medium">All available historical data</span>
              {analyticsData?.dateRange && (
                <span className="ml-1 text-muted-foreground">
                  ({format(new Date(analyticsData.dateRange.start), 'MMM d, yyyy')} - {format(new Date(analyticsData.dateRange.end), 'MMM d, yyyy')})
                </span>
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
          >
            Refresh
          </Button>
        </div>
      );
      
      return (
        <>
          {priceRecommendationsPeriodIndicator}
          {/* summaryCards removed */}
          
          {/* Main chart: Current vs Suggested Price (swapped position) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current vs Suggested Price</CardTitle>
              <CardDescription>Optimal price comparison based on historical data</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientOnly>
                {analyticsData?.priceSuggestions && analyticsData.priceSuggestions.length > 0 ? (
                  // Check if this is mock/sample data
                  analyticsData.priceSuggestions.some(item => item.id.startsWith('mock-')) ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <p>No data available</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-4"
                        onClick={() => window.location.href = '/inventory?productTab=import&salesTab=import'}
                      >
                        Import Sales Data
                      </Button>
                    </div>
                  ) : (
                    <BarChart
                      data={(analyticsData?.priceSuggestions || [])
                        // Filter suggestions based on confidence level
                        .filter((item: PriceSuggestion) => {
                          if (confidenceLevel === 'high') return item.confidence === 'high';
                          if (confidenceLevel === 'medium') return item.confidence === 'medium';
                          if (confidenceLevel === 'low') return item.confidence === 'low';
                          return true; // 'all' shows all confidence levels
                        })
                        .map((item: PriceSuggestion) => ({
                          product: item.name.substring(0, 20), // Truncate long product names
                          current: item.currentPrice,
                          suggested: item.suggestedPrice
                        }))}
                      indexBy="product"
                      keys={["current", "suggested"]}
                      legends={[
                        { id: "current", label: "Current Price" },
                        { id: "suggested", label: "Suggested Price" }
                      ]}
                      valueFormatter={(value) => `$${value.toFixed(2)}`}
                      valueLabel="Price"
                      height={400}
                      xAxisFormatter={(v) => v}
                    />
                  )
                ) : (
                  <EmptyState message="No data available" />
                )}
              </ClientOnly>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Suggestions (moved to grid) */}
            <Card>
              <CardHeader>
                <CardTitle>Price Suggestions</CardTitle>
                <CardDescription>Revenue potential analysis based on historical data</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientOnly>
                  {analyticsData?.priceSuggestions && analyticsData.priceSuggestions.length > 0 ? (
                    // Check if this is mock/sample data
                    analyticsData.priceSuggestions.some(item => item.id.startsWith('mock-')) ? (
                      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                        <p>No data available</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mt-4"
                          onClick={() => window.location.href = '/inventory?productTab=import&salesTab=import'}
                        >
                          Import Sales Data
                        </Button>
                      </div>
                    ) : (
                      <div className="h-[250px]">
                        <BarChart
                          data={analyticsData.priceSuggestions
                            // Filter suggestions based on confidence level
                            .filter((item: PriceSuggestion) => {
                              if (confidenceLevel === 'high') return item.confidence === 'high';
                              if (confidenceLevel === 'medium') return item.confidence === 'medium';
                              if (confidenceLevel === 'low') return item.confidence === 'low';
                              return true; // 'all' shows all confidence levels
                            })
                            .map(item => ({
                              name: item.name.substring(0, 25), // Truncate very long names
                              potential: item.potential,
                              currentPrice: item.currentPrice,
                              suggestedPrice: item.suggestedPrice,
                              confidence: item.confidence,
                              // Calculate percentage change
                              percentChange: ((item.suggestedPrice - item.currentPrice) / item.currentPrice * 100).toFixed(1),
                              // Format label with percentage change included
                              priceLabel: `${item.name.substring(0, 15)}: ${((item.suggestedPrice - item.currentPrice) / item.currentPrice * 100).toFixed(1)}%`
                            }))}
                          categoryKey="priceLabel" // Use the formatted label
                          valueKey="potential"
                          valueLabel="Revenue Potential %"
                          valueFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
                          height={250}
                          xAxisFormatter={(v) => v}
                          horizontal={true}
                          colors={["#4ADE80", "#EF4444"]} // Use green for positive, red for negative
                        />
                      </div>
                    )
                  ) : (
                    <EmptyState message="No data available" />
                  )}
                </ClientOnly>
              </CardContent>
            </Card>
            
            {/* New module: Recommendations List View */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Price Recommendation Details</CardTitle>
                    <CardDescription>Detailed view of suggested price changes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ClientOnly>
                  {analyticsData?.priceSuggestions && analyticsData.priceSuggestions.length > 0 ? (
                    // Check if this is mock/sample data
                    analyticsData.priceSuggestions.some(item => item.id.startsWith('mock-')) ? (
                      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                        <p>No data available</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mt-4"
                          onClick={() => window.location.href = '/inventory?productTab=import&salesTab=import'}
                        >
                          Import Sales Data
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 h-[250px] overflow-auto pr-1">
                        {analyticsData.priceSuggestions
                          // Filter suggestions based on confidence level
                          .filter((item: PriceSuggestion) => {
                            if (confidenceLevel === 'high') return item.confidence === 'high';
                            if (confidenceLevel === 'medium') return item.confidence === 'medium';
                            if (confidenceLevel === 'low') return item.confidence === 'low';
                            return true; // 'all' shows all confidence levels
                          })
                          // Log filtered count
                          .map((item, i, arr) => {
                            if (i === 0) console.log(`Filtered items count: ${arr.length}`);
                            return item;
                          })
                          // Sort by potential revenue impact (highest first)
                          .sort((a, b) => Math.abs(b.potential) - Math.abs(a.potential))
                          .map((item, index) => {
                            const percentChange = ((item.suggestedPrice - item.currentPrice) / item.currentPrice * 100).toFixed(1);
                            const isPositive = item.potential > 0;
                            
                            // Get confidence color
                            const confidenceColor = item.confidence === 'high' 
                              ? 'bg-green-100 text-green-800'
                              : item.confidence === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800';
                              
                            return (
                              <div key={index} className="border rounded-md p-2 hover:bg-muted/30 transition-colors">
                                {/* Product name and confidence on top row */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium text-sm" title={item.name}>
                                    {item.name}
                                  </div>
                                  <div className={`text-xs px-1.5 py-0.5 rounded-full ${confidenceColor}`}
                                    title="Recommendation Confidence Level">
                                    {item.confidence}
                                  </div>
                                </div>
                                
                                {/* Price details in second row */}
                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                  <div>
                                    <span className="text-muted-foreground">Current Price:</span>
                                    <div className="font-medium">${item.currentPrice.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Suggested Price:</span>
                                    <div className="font-medium">${item.suggestedPrice.toFixed(2)}</div>
                                  </div>
                                </div>
                                
                                {/* Impact details in third row */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className={`px-2 py-0.5 rounded ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`} 
                                    title="Price Change Percentage">
                                    <span>Price Change: {isPositive ? '+' : ''}{percentChange}%</span>
                                  </div>
                                  <div className={`px-2 py-0.5 rounded ${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                    title="Projected Revenue Impact">
                                    <span>Revenue Impact: {isPositive ? '+' : ''}{item.potential.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    )
                  ) : (
                    <EmptyState message="No data available" />
                  )}
                </ClientOnly>
              </CardContent>
            </Card>
          </div>
          
          {/* Projected Revenue Impact (full width) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Projected Revenue Impact</CardTitle>
              <CardDescription>Current vs optimized pricing projection over next 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientOnly>
                {analyticsData?.priceSuggestions && analyticsData.priceSuggestions.length > 0 ? (
                  // Check if this is mock/sample data
                  analyticsData.priceSuggestions.some(item => item.id.startsWith('mock-')) ? (
                    <div className="flex flex-col items-center justify-center h-[450px] text-muted-foreground">
                      <p>No data available</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-4"
                        onClick={() => window.location.href = '/inventory?productTab=import&salesTab=import'}
                      >
                        Import Sales Data
                      </Button>
                    </div>
                  ) : (
                    <>
                      <LineChart
                        data={(() => {
                          // Calculate projected revenue over time for each product and total
                          const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
                          
                          // Get only filtered suggestions based on confidence level
                          const filteredSuggestions = analyticsData.priceSuggestions.filter(
                            item => confidenceLevel === 'all' || item.confidence === confidenceLevel
                          );
                          
                          // Calculate total current revenue across all products with recommendations
                          const totalMonthlyRevenue = filteredSuggestions.reduce((sum, item) => sum + item.currentPrice * 10, 0);
                          
                          // Get average revenue improvement percentage
                          const avgImprovementPercent = filteredSuggestions.length > 0 
                            ? filteredSuggestions.reduce((sum, item) => sum + item.potential, 0) / filteredSuggestions.length
                            : 0;
                          
                          return months.map((month, i) => {
                            // Start with the month as base data point
                            const dataPoint: Record<string, string | number> = { month };
                            
                            // Calculate month-over-month growth factor (light increase each month to simulate natural business growth)
                            const monthGrowthFactor = 1.01; // 1% natural growth without price changes
                            
                            // Add overall aggregate lines using actual revenue numbers
                            const overallCurrentRevenue = Math.round(totalMonthlyRevenue * Math.pow(monthGrowthFactor, i));
                            
                            // Apply average improvement percentage directly to current revenue to get optimized revenue
                            const overallOptimizedRevenue = Math.round(overallCurrentRevenue * (1 + avgImprovementPercent / 100));
                            
                            dataPoint['Overall Current'] = overallCurrentRevenue;
                            dataPoint['Overall Optimized'] = overallOptimizedRevenue;
                            
                            // Add individual product lines for filtered suggestions only
                            // (limited to top 3 by potential impact to avoid overcrowding)
                            filteredSuggestions
                              .sort((a, b) => Math.abs(b.potential) - Math.abs(a.potential))
                              .slice(0, 3)
                              .forEach(item => {
                                // Base monthly revenue is a function of current price and estimated volume
                                const baseMonthlyRevenue = item.currentPrice * 10; // Estimate monthly sales volume
                                
                                // Calculate current revenue with natural growth
                                const currentRev = Math.round(baseMonthlyRevenue * Math.pow(monthGrowthFactor, i));
                                
                                // Calculate optimized revenue by applying potential percentage directly to current revenue
                                const optimizedRev = Math.round(currentRev * (1 + item.potential / 100));
                                
                                // Add to data point with product name prefix
                                const shortName = item.name.substring(0, 10);
                                dataPoint[`${shortName} Current`] = currentRev;
                                dataPoint[`${shortName} Optimized`] = optimizedRev;
                              });
                            
                            return dataPoint;
                          });
                        })()}
                        xAxisKey="month"
                        dataKeys={(() => {
                          // Get filtered suggestions
                          const filteredSuggestions = analyticsData.priceSuggestions.filter(
                            item => confidenceLevel === 'all' || item.confidence === confidenceLevel
                          ).sort((a, b) => Math.abs(b.potential) - Math.abs(a.potential))
                           .slice(0, 3);
                          
                          // Always include the overall lines
                          const keys = ['Overall Current', 'Overall Optimized'];
                          
                          // Add keys for each product
                          filteredSuggestions.forEach(item => {
                            const shortName = item.name.substring(0, 10);
                            keys.push(`${shortName} Current`);
                            keys.push(`${shortName} Optimized`);
                          });
                          
                          return keys;
                        })()}
                        height={450}
                        xAxisFormatter={(value) => value}
                        yAxisFormatters={[
                          (value) => `$${value.toLocaleString()}`
                        ]}
                        customDatasetOptions={(key) => {
                          // Apply dashed line style to all optimized lines
                          if (key.includes('Optimized')) {
                            return {
                              borderDash: [5, 5],
                              borderWidth: 2
                            };
                          }
                          return {};
                        }}
                      />
                    </>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-[450px] text-muted-foreground">
                    <p>No data available</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-4"
                      onClick={() => window.location.href = '/inventory?productTab=import&salesTab=import'}
                    >
                      Import Sales Data
                    </Button>
                  </div>
                )}
              </ClientOnly>
            </CardContent>
          </Card>
        </>
      )
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Simple non-sticky header */}
      <div className="border-b bg-background p-4.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Analytics</h1>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1.5"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Sidebar - sticky */}
        <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 bg-background md:sticky md:top-[4.5rem] md:self-start md:max-h-[calc(100vh-4.5rem)] md:overflow-y-auto">
          <div className="p-4.5">
            {/* Analytics tabs as sidebar nav */}
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Analytics</h2>
              <button 
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'projected' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50'
                }`}
                onClick={() => handleTabChange('projected')}
              >
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span>Projected Earnings</span>
                </div>
              </button>
              <button 
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'price' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50'
                }`}
                onClick={() => handleTabChange('price')}
              >
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Price Suggestions</span>
                </div>
              </button>
            </div>
            
            {/* Time range filters */}
            <div className="mt-6 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Filters</h2>
              
              {activeTab === 'price' ? (
                /* Confidence Level Filter for Price Suggestions */
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Confidence Level</label>
                  <Select 
                    value={confidenceLevel} 
                    onValueChange={(value) => handleConfidenceLevelChange(value as 'high' | 'medium' | 'low' | 'all')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select confidence level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          High Confidence Only
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                          Medium Confidence Only
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                          Low Confidence Only
                        </div>
                      </SelectItem>
                      <SelectItem value="all">
                        <div className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                          All Confidence Levels
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                </div>
              ) : (
                /* Standard Time Period Filter for other tabs */
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Period</label>
                <Select 
                  value={timeframe} 
                  onValueChange={handleTimeframeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 500);
                }}
              >
                Refresh Data
              </Button>

              {/* Quick access time range buttons - only show for non-price and non-projected tabs */}
              {activeTab !== 'price' && activeTab !== 'projected' && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button 
                  variant={timeframe === '7day' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => handleTimeframeChange('7day')}
                >
                  <span>7d</span>
                </Button>
                <Button 
                  variant={timeframe === '1m' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => handleTimeframeChange('30day')}
                >
                  <span>30d</span>
                </Button>
                <Button 
                  variant={timeframe === '1year' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => handleTimeframeChange('1year')}
                >
                  <span>1y</span>
                </Button>
              </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Border element that spans full height */}
        <div className="hidden md:block absolute top-0 bottom-0 left-64 w-[1px] bg-border"></div>

        {/* Main content */}
        <div className="flex-1 p-4.5 md:p-6">
          {/* Show loader or error if needed */}
          {loading ? (
            <div className="w-full h-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  )
} 