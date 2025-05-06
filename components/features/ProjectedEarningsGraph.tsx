'use client';

import React from 'react';
import LineChart from '@/components/features/LineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeSeriesPoint } from '@/lib/analytics/projected-earnings';

// interface for API data format
interface ApiDataPoint {
  date: string;
  value: number;
}

// this component displays the projected earnings data from our ProjectedEarningsCalculator
interface ProjectedEarningsGraphProps {
  actualData: ApiDataPoint[];
  projectedData: ApiDataPoint[];
  todayIndex: number;
  timeframe: string;
  height?: number;
}

export function ProjectedEarningsGraph({
  actualData,
  projectedData,
  todayIndex,
  timeframe,
  height = 400
}: ProjectedEarningsGraphProps) {
  // Add debugging for raw data inspection
  const inspectRawData = (data: ApiDataPoint[], label: string) => {
    if (data.length === 0) {
      console.log(`[DEBUG] No ${label} data to inspect`);
      return;
    }
    
    console.log(`[DEBUG] ${label} data format inspection (first 3 items):`);
    data.slice(0, 3).forEach((point, index) => {
      console.log(`Item ${index}: date="${point.date}" (type: ${typeof point.date}), value=${point.value}`);
      try {
        const date = new Date(point.date);
        console.log(`  Parsed as: ${isNaN(date.getTime()) ? 'Invalid Date' : date.toISOString()}`);
      } catch (e) {
        console.log(`  Failed to parse: ${e}`);
      }
    });
  };
  
  // Helper function to sanitize and fix potential date format issues
  const sanitizeData = (dataPoints: ApiDataPoint[]): ApiDataPoint[] => {
    return dataPoints.map(point => {
      if (!point.date) {
        console.log(`[DEBUG] Missing date in data point: ${JSON.stringify(point)}`);
        // Return as is if no date to fix
        return point;
      }
      
      try {
        // Try to parse the date
        const date = new Date(point.date);
        
        // If date is valid, return the original point
        if (!isNaN(date.getTime())) {
          return point;
        }
        
        console.log(`[DEBUG] Found invalid date: "${point.date}", attempting to fix`);
        
        // Try to fix common date format issues
        let fixedDate = point.date;
        
        // Fix dates that have been incorrectly formatted or serialized
        if (typeof point.date === 'string') {
          // Fix missing dashes in ISO dates (e.g., "20240115" -> "2024-01-15")
          if (/^\d{8}$/.test(point.date)) {
            fixedDate = `${point.date.slice(0,4)}-${point.date.slice(4,6)}-${point.date.slice(6,8)}`;
            console.log(`[DEBUG] Fixed ISO date without separators: ${point.date} -> ${fixedDate}`);
          }
          // Try other common patterns here if needed
        }
        
        // Check if our fix worked
        const fixedDateObj = new Date(fixedDate);
        if (!isNaN(fixedDateObj.getTime())) {
          console.log(`[DEBUG] Successfully fixed date: ${fixedDate}`);
          return { ...point, date: fixedDate };
        }
        
        // If we couldn't fix it, log and return as is
        console.log(`[DEBUG] Unable to fix invalid date: ${point.date}`);
        return point;
      } catch (e) {
        console.log(`[DEBUG] Error sanitizing date: ${e}`);
        return point;
      }
    });
  };
  
  // Sanitize the data
  const sanitizedActual = sanitizeData(actualData);
  const sanitizedProjected = sanitizeData(projectedData);
  
  // Update inspectRawData to check sanitized data
  console.log('[DEBUG] After sanitization:');
  inspectRawData(sanitizedActual, 'Sanitized Actual');
  inspectRawData(sanitizedProjected, 'Sanitized Projected');

  // Filter data for all-time view to only include relevant years
  const filterDataForAllTime = (actualData: ApiDataPoint[], projectedData: ApiDataPoint[]) => {
    if (timeframe !== 'all') return { filteredActual: actualData, filteredProjected: projectedData };
    
    // Log original data range
    console.log('[DEBUG] Original data ranges before filtering:');
    
    // Print out month by month data points for debugging
    try {
      const monthGroups: Record<string, number> = {};
      actualData.forEach(point => {
        try {
          const date = new Date(point.date);
          if (!isNaN(date.getTime())) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthGroups[monthKey]) {
              monthGroups[monthKey] = 0;
            }
            monthGroups[monthKey]++;
          }
        } catch (e) {}
      });
      
      // Log the monthly distribution
      console.log('[DEBUG] Monthly data distribution:', monthGroups);
    } catch (e) {
      console.log('[DEBUG] Error analyzing monthly distribution:', e);
    }
    
    // Calculate the full date range from the data
    try {
      const allDates = [
        ...actualData.map(d => new Date(d.date)),
        ...projectedData.map(d => new Date(d.date))
      ].filter(d => !isNaN(d.getTime()));
      
      if (allDates.length > 0) {
        const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const latestDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        
        // Start one year before the earliest date we have
        const startDate = new Date(earliestDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        
        // End one year after the latest date we have
        const endDate = new Date(latestDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        
        console.log('[DEBUG] Full date range calculated:', {
          earliestDate: earliestDate.toISOString(),
          latestDate: latestDate.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }
    } catch (e) {
      console.log('[DEBUG] Error calculating full date range:', e);
    }
    
    if (actualData.length > 0) {
      try {
        const actualDates = actualData.map(d => new Date(d.date)).filter(d => !isNaN(d.getTime()));
        if (actualDates.length > 0) {
          const actualMinDate = new Date(Math.min(...actualDates.map(d => d.getTime())));
          const actualMaxDate = new Date(Math.max(...actualDates.map(d => d.getTime())));
          console.log(`[DEBUG] Actual data: ${actualData.length} points from ${
            isNaN(actualMinDate.getTime()) ? 'Invalid Date' : actualMinDate.toISOString()
          } to ${
            isNaN(actualMaxDate.getTime()) ? 'Invalid Date' : actualMaxDate.toISOString()
          }`);
        } else {
          console.log(`[DEBUG] Actual data: ${actualData.length} points, but no valid dates found`);
        }
      } catch (e) {
        console.log(`[DEBUG] Error processing actual data dates: ${e}`);
      }
    } else {
      console.log('[DEBUG] No actual data points');
    }
    
    if (projectedData.length > 0) {
      try {
        const projectedDates = projectedData.map(d => new Date(d.date)).filter(d => !isNaN(d.getTime()));
        if (projectedDates.length > 0) {
          const projectedMinDate = new Date(Math.min(...projectedDates.map(d => d.getTime())));
          const projectedMaxDate = new Date(Math.max(...projectedDates.map(d => d.getTime())));
          console.log(`[DEBUG] Projected data: ${projectedData.length} points from ${
            isNaN(projectedMinDate.getTime()) ? 'Invalid Date' : projectedMinDate.toISOString()
          } to ${
            isNaN(projectedMaxDate.getTime()) ? 'Invalid Date' : projectedMaxDate.toISOString()
          }`);
        } else {
          console.log(`[DEBUG] Projected data: ${projectedData.length} points, but no valid dates found`);
        }
      } catch (e) {
        console.log(`[DEBUG] Error processing projected data dates: ${e}`);
      }
    } else {
      console.log('[DEBUG] No projected data points');
    }
    
    // For all-time view, we now just want to return all the data without filtering
    // Since the backend is already calculating the correct 1-year before/after range
    return { 
      filteredActual: actualData, 
      filteredProjected: projectedData,
      minYear: undefined,
      maxYear: undefined
    };
  };
  
  // Filter data for all-time view
  const { filteredActual, filteredProjected, minYear, maxYear } = filterDataForAllTime(sanitizedActual, sanitizedProjected);

  // convert API data to TimeSeriesPoint format if needed
  const convertedActual: TimeSeriesPoint[] = filteredActual.map(point => ({
    date: point.date,
    value: point.value,
    isProjected: false
  }));
  
  const convertedProjected: TimeSeriesPoint[] = filteredProjected.map(point => ({
    date: point.date,
    value: point.value,
    isProjected: true
  }));

  // combine the data for the chart
  const chartData = [
    ...filteredActual.map(point => ({
      date: point.date,
      actual: point.value,
      projected: null
    })),
    ...filteredProjected.map(point => ({
      date: point.date,
      actual: null,
      projected: point.value
    }))
  ];

  // sort data by date (important for line chart)
  chartData.sort((a, b) => {
    // Handle various date formats - try parsing first
    let dateA = new Date(a.date);
    let dateB = new Date(b.date);
    
    // If parsing fails, try to compare strings (for formatted dates like "Jan 2023")
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return a.date.localeCompare(b.date);
    }
    
    return dateA.getTime() - dateB.getTime();
  });

  // determine appropriate x-axis format based on timeframe
  const getXAxisFormatter = () => {
    // For all-time view, use a special formatter that ensures only years from actual data are shown
    if (timeframe === 'all') {
      return (value: string) => {
        try {
          // If the value is already in "MMM yyyy" format, just return it
          if (value && typeof value === 'string' && value.includes(' ') && value.length < 10) {
            return value;
          }
          
          // Validate the input
          if (!value) {
            console.log(`[DEBUG] Empty value passed to x-axis formatter`);
            return '';
          }
          
          // Parse the date and format to show only month and year
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // Since we're now letting the backend determine the date range,
            // let's just format all dates without filtering by year
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          } else {
            console.log(`[DEBUG] Invalid date in x-axis formatter: ${value}`);
            return '';
          }
        } catch (e) {
          // If parsing fails, log the error and return empty
          console.log(`[DEBUG] Error in x-axis formatter: ${e}, value: ${value}`);
          return '';
        }
        return value;
      };
    } else if (timeframe === 'custom') {
      // For custom date range, use a detailed formatter that shows day, month, and year
      return (value: string) => {
        try {
          // Validate the input
          if (!value) {
            console.log(`[DEBUG] Empty value passed to custom range formatter`);
            return '';
          }
          
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // For periods less than 90 days, show detailed date
            if (filteredActual.length + filteredProjected.length < 90) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            // For longer periods, show month and year
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          } else {
            console.log(`[DEBUG] Invalid date in custom range formatter: ${value}`);
            return '';
          }
        } catch (e) {
          // If parsing fails, log the error and return empty
          console.log(`[DEBUG] Error in custom range formatter: ${e}, value: ${value}`);
          return '';
        }
        return value;
      };
    } else if (timeframe === '7day' || timeframe === '14day') {
      return (value: string) => {
        try {
          // Validate the input
          if (!value) {
            console.log(`[DEBUG] Empty value passed to short range formatter`);
            return '';
          }
          
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            console.log(`[DEBUG] Invalid date in short range formatter: ${value}`);
            return '';
          }
        } catch (e) {
          // If parsing fails, log the error and return empty
          console.log(`[DEBUG] Error in short range formatter: ${e}, value: ${value}`);
          return '';
        }
        return value;
      };
    } else if (timeframe === '1month' || timeframe === '90day') {
      return (value: string) => {
        try {
          // Validate the input
          if (!value) {
            console.log(`[DEBUG] Empty value passed to medium range formatter`);
            return '';
          }
          
          // For weekly format, just return the value which may already be formatted
          if (value.includes(' to ')) {
            return value;
          }
          
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            console.log(`[DEBUG] Invalid date in medium range formatter: ${value}`);
            return '';
          }
        } catch (e) {
          // If parsing fails, log the error and return empty
          console.log(`[DEBUG] Error in medium range formatter: ${e}, value: ${value}`);
          return '';
        }
        return value;
      };
    } else {
      return (value: string) => {
        try {
          // Validate the input
          if (!value) {
            console.log(`[DEBUG] Empty value passed to default formatter`);
            return '';
          }
          
          // For monthly data, show only month and year
          if (value.includes(' ') && value.length < 10) {
            return value;
          }
          
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          } else {
            console.log(`[DEBUG] Invalid date in default formatter: ${value}`);
            return '';
          }
        } catch (e) {
          // If parsing fails, log the error and return empty
          console.log(`[DEBUG] Error in default formatter: ${e}, value: ${value}`);
          return '';
        }
        return value;
      };
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Projected Earnings</CardTitle>
        <CardDescription>
          Historical and projected revenue based on your sales data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LineChart
            data={chartData}
            xAxisKey="date"
            dataKeys={["actual", "projected"]}
            dataLabels={["Actual Revenue", "Projected Revenue"]}
            yAxisFormatters={[
              (value) => `$${value.toLocaleString()}`,
              (value) => `$${value.toLocaleString()}`
            ]}
            height={height}
            xAxisFormatter={getXAxisFormatter()}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <p>No projected earnings data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// helper component to show growth rate based on projected earnings
interface GrowthRateChartProps {
  actualData: ApiDataPoint[];
  height?: number;
}

export function GrowthRateChart({ 
  actualData,
  height = 250 
}: GrowthRateChartProps) {
  // calculate growth rates between periods
  const growthData = actualData.map((point, index, arr) => {
    let growth = 0;
    if (index > 0 && arr[index-1].value > 0) {
      growth = ((point.value - arr[index-1].value) / arr[index-1].value) * 100;
    }
    
    return {
      date: point.date,
      growth: growth || 0
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Rate</CardTitle>
        <CardDescription>Period-over-period revenue growth percentage</CardDescription>
      </CardHeader>
      <CardContent>
        {growthData.length > 1 ? (
          <LineChart
            data={growthData}
            xAxisKey="date"
            dataKeys={["growth"]}
            dataLabels={["Growth %"]}
            yAxisFormatters={[
              (value) => `${value.toFixed(1)}%`
            ]}
            height={height}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <p>Insufficient data to calculate growth rates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 