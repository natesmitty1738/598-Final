'use client';

import React, { useState } from 'react';
import { ProjectedEarningsGraph } from '@/components/features/ProjectedEarningsGraph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from "react-day-picker";

// interface for API data format
interface ApiDataPoint {
  date: string;
  value: number;
}

export default function TestProjectedEarningsPage() {
  const [selectedYear, setSelectedYear] = useState('2020');
  const [timeframe, setTimeframe] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined, 
    to: undefined
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  
  // generate mock data for testing
  const generateMockData = (year: string): {actual: ApiDataPoint[], projected: ApiDataPoint[]} => {
    const actualData: ApiDataPoint[] = [];
    const projectedData: ApiDataPoint[] = [];
    
    // convert year to number
    const yearNum = parseInt(year);
    
    // generate actual data for the specified year (monthly data points)
    for (let month = 0; month < 12; month++) {
      const date = new Date(yearNum, month, 15);
      // random value between 5000 and 20000
      const value = Math.floor(Math.random() * 15000) + 5000;
      
      actualData.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }
    
    // generate projected data for the next year
    for (let month = 0; month < 12; month++) {
      const date = new Date(yearNum + 1, month, 15);
      // projected values tend to grow
      const baseValue = actualData[month % 12].value;
      const growthFactor = 1 + (Math.random() * 0.2 + 0.05); // 5-25% growth
      const value = Math.floor(baseValue * growthFactor);
      
      projectedData.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }
    
    return { actual: actualData, projected: projectedData };
  };
  
  // generate data based on selected year
  const { actual: fullActual, projected: fullProjected } = generateMockData(selectedYear);
  
  // filter data based on custom date range if active
  const filterDataByDateRange = (data: ApiDataPoint[]): ApiDataPoint[] => {
    if (!isCustomRange || !dateRange.from || !dateRange.to) return data;
    
    return data.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= dateRange.from && pointDate <= dateRange.to;
    });
  };
  
  // apply filters if custom range is active
  const actual = isCustomRange ? filterDataByDateRange(fullActual) : fullActual;
  const projected = isCustomRange ? filterDataByDateRange(fullProjected) : fullProjected;
  
  // today's index would typically come from the API
  // for this test, set it to the last month of actual data
  const todayIndex = actual.length - 1;

  // handle range selection
  const onRangeSelect = (range: DateRange | undefined) => {
    if (!range) return;
    
    setDateRange(range);
    if (range.from && range.to) {
      setIsCustomRange(true);
      setTimeframe('custom');
    }
  };

  // reset custom range
  const resetCustomRange = () => {
    setIsCustomRange(false);
    setDateRange({ from: undefined, to: undefined });
    setTimeframe('all');
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Projected Earnings Testing</h1>
      
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="mr-2">Select Year:</label>
          <Select
            value={selectedYear}
            onValueChange={(value) => {
              setSelectedYear(value);
              // Reset custom range when changing year
              resetCustomRange();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2018">2018</SelectItem>
              <SelectItem value="2019">2019</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="mr-2">Timeframe:</label>
          <Select
            value={timeframe}
            onValueChange={(value) => {
              setTimeframe(value);
              if (value !== 'custom') {
                setIsCustomRange(false);
                setDateRange({ from: undefined, to: undefined });
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="365">Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Range Picker */}
        {timeframe === 'custom' && (
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={onRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetCustomRange}
            >
              Reset Range
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Data Testing Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div>Selected Year: <strong>{selectedYear}</strong></div>
              <div>Timeframe: <strong>{timeframe}</strong></div>
              {isCustomRange && dateRange.from && dateRange.to && (
                <div>Custom Range: <strong>{format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}</strong></div>
              )}
              <div>Actual Data Points: <strong>{actual.length}</strong></div>
              <div>Projected Data Points: <strong>{projected.length}</strong></div>
              <div>Today Index: <strong>{todayIndex}</strong></div>
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1">
          <ProjectedEarningsGraph
            actualData={actual}
            projectedData={projected}
            todayIndex={todayIndex}
            timeframe={timeframe}
            height={500}
          />
        </div>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Raw Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Actual Data ({actual.length} points)</h3>
                <pre className="bg-slate-100 p-4 rounded text-xs max-h-60 overflow-auto">
                  {JSON.stringify(actual, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Projected Data ({projected.length} points)</h3>
                <pre className="bg-slate-100 p-4 rounded text-xs max-h-60 overflow-auto">
                  {JSON.stringify(projected, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 