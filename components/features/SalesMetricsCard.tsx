'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricsResult } from '@/lib/analytics';
import { formatter } from '@/lib/utils';

// types for the component props
interface SalesMetricsCardProps {
  metrics: MetricsResult;
  isLoading?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
}

export default function SalesMetricsCard({ 
  metrics, 
  isLoading = false,
  onTimeframeChange
}: SalesMetricsCardProps) {
  // tab state for different views
  const [activeTab, setActiveTab] = useState("overview");
  
  // handle timeframe selection
  const handleTimeframeChange = (value: string) => {
    if (onTimeframeChange) {
      onTimeframeChange(value);
    }
  };
  
  // format values for display
  const formatValue = (value: number) => {
    return formatter.format(value);
  };
  
  // formatter for percent change
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-28" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Revenue Metrics</CardTitle>
          <Select defaultValue="month" onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          Analysis of your sales performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="percentiles">Percentiles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">{formatValue(metrics.sum)}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Orders</p>
                <p className="text-xl">{metrics.count}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col p-4 border rounded-lg bg-card">
                <p className="text-sm font-medium text-muted-foreground">Average Order</p>
                <p className="text-lg font-semibold">{formatValue(metrics.avg)}</p>
              </div>
              <div className="flex flex-col p-4 border rounded-lg bg-card">
                <p className="text-sm font-medium text-muted-foreground">Median Order</p>
                <p className="text-lg font-semibold">{metrics.median ? formatValue(metrics.median) : 'N/A'}</p>
              </div>
              <div className="flex flex-col p-4 border rounded-lg bg-card">
                <p className="text-sm font-medium text-muted-foreground">Smallest Order</p>
                <p className="text-lg font-semibold">{formatValue(metrics.min)}</p>
              </div>
              <div className="flex flex-col p-4 border rounded-lg bg-card">
                <p className="text-sm font-medium text-muted-foreground">Largest Order</p>
                <p className="text-lg font-semibold">{formatValue(metrics.max)}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="percentiles">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col p-4 border rounded-lg bg-card">
                  <p className="text-sm font-medium text-muted-foreground">25th Percentile</p>
                  <p className="text-lg font-semibold">{formatValue(metrics.percentiles.p25)}</p>
                  <p className="text-sm text-muted-foreground">25% of orders are below this value</p>
                </div>
                <div className="flex flex-col p-4 border rounded-lg bg-card">
                  <p className="text-sm font-medium text-muted-foreground">Median (50th)</p>
                  <p className="text-lg font-semibold">{metrics.median ? formatValue(metrics.median) : 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">50% of orders are below this value</p>
                </div>
                <div className="flex flex-col p-4 border rounded-lg bg-card">
                  <p className="text-sm font-medium text-muted-foreground">75th Percentile</p>
                  <p className="text-lg font-semibold">{formatValue(metrics.percentiles.p75)}</p>
                  <p className="text-sm text-muted-foreground">75% of orders are below this value</p>
                </div>
                <div className="flex flex-col p-4 border rounded-lg bg-card">
                  <p className="text-sm font-medium text-muted-foreground">90th Percentile</p>
                  <p className="text-lg font-semibold">{formatValue(metrics.percentiles.p90)}</p>
                  <p className="text-sm text-muted-foreground">90% of orders are below this value</p>
                </div>
                <div className="flex flex-col p-4 border rounded-lg bg-card">
                  <p className="text-sm font-medium text-muted-foreground">95th Percentile</p>
                  <p className="text-lg font-semibold">{formatValue(metrics.percentiles.p95)}</p>
                  <p className="text-sm text-muted-foreground">95% of orders are below this value</p>
                </div>
                <div className="flex flex-col p-4 border rounded-lg bg-card">
                  <p className="text-sm font-medium text-muted-foreground">99th Percentile</p>
                  <p className="text-lg font-semibold">{formatValue(metrics.percentiles.p99)}</p>
                  <p className="text-sm text-muted-foreground">Top 1% of orders</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-card">
                <p className="text-sm font-medium mb-2">Value Distribution</p>
                <div className="h-6 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "25%" }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{formatValue(metrics.min)}</span>
                  <span>{formatValue(metrics.percentiles.p25)}</span>
                  <span>{metrics.median ? formatValue(metrics.median) : 'N/A'}</span>
                  <span>{formatValue(metrics.percentiles.p75)}</span>
                  <span>{formatValue(metrics.max)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 