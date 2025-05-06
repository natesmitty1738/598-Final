'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from 'next-themes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Default colors that work in both light and dark themes - updated for more subtle appearance
const DARK_LINE_COLORS = [
  'rgba(129, 140, 248, 0.8)', // indigo-400 with opacity
  'rgba(52, 211, 153, 0.8)',  // emerald-400 with opacity
  'rgba(167, 139, 250, 0.8)', // violet-400 with opacity
  'rgba(96, 165, 250, 0.8)',  // blue-400 with opacity
  'rgba(251, 146, 60, 0.8)'   // orange-400 with opacity
];

const LIGHT_LINE_COLORS = [
  'rgba(79, 70, 229, 0.7)',   // indigo-600 with opacity
  'rgba(16, 185, 129, 0.7)',  // emerald-600 with opacity
  'rgba(124, 58, 237, 0.7)',  // violet-600 with opacity
  'rgba(37, 99, 235, 0.7)',   // blue-600 with opacity
  'rgba(234, 88, 12, 0.7)'    // orange-600 with opacity
];

// New: Special projected line styles
const PROJECTED_LINE_STYLES = {
  dark: {
    borderDash: [5, 5],
    borderWidth: 1.5
  },
  light: {
    borderDash: [5, 5],
    borderWidth: 1.5
  }
};

type DataPoint = {
  [key: string]: any;
};

type LineChartProps = {
  data: DataPoint[];
  // The property containing the X-axis label/category
  xAxisKey: string;
  // The properties to display as lines (can show multiple lines)
  dataKeys: string[];
  // Labels for each data key
  dataLabels?: string[];
  // Format function for X-axis labels
  xAxisFormatter?: (value: any) => string;
  // Format function for tooltip labels
  tooltipLabelFormatter?: (value: any) => string;
  // Format functions for Y-axis values
  yAxisFormatters?: ((value: number) => string)[];
  // Y-axis IDs for each line
  yAxisIds?: string[];
  // Title of the chart
  title?: string;
  // Height of the chart container
  height?: number | string;
  // Show as a card
  asCard?: boolean;
  // Card description
  description?: string;
  // Custom styling options for specific datasets
  customDatasetOptions?: (key: string) => Record<string, any>;
};

export default function LineChart({
  data,
  xAxisKey,
  dataKeys,
  dataLabels,
  xAxisFormatter,
  tooltipLabelFormatter,
  yAxisFormatters,
  yAxisIds = dataKeys.map(() => 'y'),
  title,
  height = 300,
  asCard = false,
  description,
  customDatasetOptions
}: LineChartProps) {
  const { resolvedTheme } = useTheme();
  const [lineColors, setLineColors] = useState(LIGHT_LINE_COLORS);
  const [textColor, setTextColor] = useState('rgba(0, 0, 0, 0.87)');
  const chartRef = useRef<ChartJS>(null);
  
  // Update colors when theme changes
  useEffect(() => {
    setLineColors(resolvedTheme === 'dark' ? DARK_LINE_COLORS : LIGHT_LINE_COLORS);
    setTextColor(resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)');
    
    // Update chart when theme changes
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [resolvedTheme]);
  
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
  
  // Handle empty data gracefully
  if (!data || data.length === 0) {
    const emptyState = (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
    
    return asCard ? (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {title && <div className="flex flex-col space-y-1.5 p-6 pb-2"><h3 className="text-lg font-semibold">{title}</h3></div>}
        {description && <div className="px-6 pb-0 text-sm text-muted-foreground">{description}</div>}
        <div className="p-6 pt-0">{emptyState}</div>
      </div>
    ) : emptyState;
  }
  
  // Add debug logs to see what's being passed to the chart
  console.log(`[DEBUG] LineChart data points: ${data.length}`);
  if (data.length > 0) {
    console.log(`[DEBUG] LineChart first data point:`, data[0]);
    console.log(`[DEBUG] LineChart last data point:`, data[data.length - 1]);
  }
  
  // Extract labels (X-axis values)
  const labels = data
    .map(item => {
      try {
        const formattedLabel = xAxisFormatter ? xAxisFormatter(item[xAxisKey]) : item[xAxisKey];
        
        // Debug which labels are being formatted
        console.log(`[DEBUG] X-axis formatting: ${item[xAxisKey]} → ${formattedLabel}`);
        
        return {
          original: item[xAxisKey],
          formatted: formattedLabel
        };
      } catch (e) {
        console.log(`[DEBUG] Error formatting X-axis label: ${item[xAxisKey]}, Error: ${e}`);
        // Return a safe value if formatting fails
        return {
          original: item[xAxisKey],
          formatted: String(item[xAxisKey] || '')
        };
      }
    })
    // Filter out any labels that were formatted to empty strings (filtered by the formatter)
    .filter(item => {
      // Debug which labels are being filtered out
      if (item.formatted === '') {
        console.log(`[DEBUG] Filtering out X-axis label: ${item.original}`);
      }
      return item.formatted !== '';
    })
    .map(item => item.formatted);
  
  // Match data to the filtered labels
  const filteredData = data.filter(item => {
    const formattedLabel = xAxisFormatter ? xAxisFormatter(item[xAxisKey]) : item[xAxisKey];
    if (formattedLabel === '') {
      console.log(`[DEBUG] Filtering out data point with date: ${item[xAxisKey]}`);
    }
    return formattedLabel !== '';
  });
  
  // Find current date index in the data (separator between actual and projected)
  // We'll identify this by looking for the first data point where actual is null and projected is not
  const currentDateIndex = filteredData.findIndex(item => item[dataKeys[0]] === null && item[dataKeys[1]] !== null);
  
  // For 7-day window, determine if we should display "Today" marker
  // Check if there are approximately 15 days (7 past + today + 7 future)
  // The data might be slightly different, so we look for data with a certain structure
  const is7DayWindow = filteredData.length >= 14 && filteredData.length <= 16;
  
  // For 7-day window, find today's index (typically around the 7th or 8th day)
  // Look for patterns like "Mon May 5" or other date formats that might indicate today
  let todayIndex = 7; // Default to middle point
  if (is7DayWindow) {
    // Today is typically the last day with actual data
    const lastActualIndex = filteredData.findIndex((item, index, arr) => {
      // Check if this is the last item with actual data before projected-only data
      return item[dataKeys[0]] !== null && 
        (index === arr.length - 1 || arr[index + 1][dataKeys[0]] === null);
    });
    
    if (lastActualIndex !== -1) {
      todayIndex = lastActualIndex;
    }
  }
  
  // Prepare datasets with appropriate styling for actual and projected data
  const datasets = dataKeys.map((key, index) => {
    const color = lineColors[index % lineColors.length];
    const baseDataset = {
      label: dataLabels?.[index] || key,
      data: filteredData.map(item => item[key]),
      borderColor: color,
      backgroundColor: color.replace(/[\d.]+\)$/, '0.1)'), // Reduce background opacity
      yAxisID: yAxisIds[index] || 'y',
      tension: 0.4, // Increase tension for smoother curves
      pointRadius: 2, // Smaller points
      pointHoverRadius: 4, // Smaller hover points
      pointBackgroundColor: color,
      borderWidth: 1.5 // Thinner lines
    };
    
    // Apply custom styling for projected data
    if (key === 'projected') {
      const projectedStyle = resolvedTheme === 'dark' ? PROJECTED_LINE_STYLES.dark : PROJECTED_LINE_STYLES.light;
      return {
        ...baseDataset,
        borderDash: projectedStyle.borderDash,
        borderWidth: projectedStyle.borderWidth,
        pointStyle: 'circle',
        // Span gaps should be false for projected line to show a break between actual and projected
        spanGaps: false
      };
    }
    
    // Apply any custom dataset options if provided
    if (customDatasetOptions) {
      const customOptions = customDatasetOptions(key);
      if (Object.keys(customOptions).length > 0) {
        return {
          ...baseDataset,
          ...customOptions
        };
      }
    }
    
    return baseDataset;
  });
  
  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
          // Highlight the current date with a vertical line if we found it
          color: (context) => {
            // For 7-day window, highlight "today"
            if (is7DayWindow && context.index === todayIndex) {
              return resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
            }
            
            // For other views, highlight the transition between actual and projected
            if (currentDateIndex > 0 && context.index === currentDateIndex - 1) {
              return resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.2)';
            }
            return resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
          },
          lineWidth: (context) => {
            // Thicker line for "today" in 7-day window
            if (is7DayWindow && context.index === todayIndex) {
              return 2; 
            }
            
            // Standard thickness for other transitions
            if (currentDateIndex > 0 && context.index === currentDateIndex - 1) {
              return 1.5; // Make the current date line thicker
            }
            return 0.5; // Default thin grid lines
          }
        },
        ticks: {
          color: textColor,
          maxRotation: 30,
          callback: (value) => {
            const label = labels[value as number];
            // For 7-day window, add "Today" indicator
            if (is7DayWindow && value === todayIndex) {
              return `${xAxisFormatter ? xAxisFormatter(label) : label} 📅`; // Calendar emoji for today
            }
            return xAxisFormatter ? xAxisFormatter(label) : label;
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: resolvedTheme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
        borderWidth: 1,
        titleColor: textColor,
        bodyColor: textColor,
        boxPadding: 6,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const item = items[0];
            const label = labels[item.dataIndex];
            return tooltipLabelFormatter ? tooltipLabelFormatter(label) : String(label);
          },
          label: (tooltipItem) => {
            const datasetLabel = tooltipItem.dataset.label || '';
            const value = tooltipItem.parsed.y;
            const formatter = yAxisFormatters && yAxisFormatters[tooltipItem.datasetIndex];
            const formattedValue = formatter ? formatter(value) : formatLargeNumber(value);
            
            // Add 'Projected' tag to projected data points
            const isProjected = currentDateIndex > 0 && tooltipItem.dataIndex >= currentDateIndex;
            return `${datasetLabel}: ${formattedValue}${isProjected ? ' (Projected)' : ''}`;
          }
        }
      }
    }
  };
  
  // Add Y-axis formatters and configurations
  if (yAxisIds && yAxisIds.length > 0) {
    options.scales = {
      ...options.scales,
      ...yAxisIds.reduce((acc, id, index) => {
        const isFirst = index === 0;
        const formatter = yAxisFormatters && yAxisFormatters[index];
        
        acc[id] = {
          position: isFirst ? 'left' : 'right',
          beginAtZero: true,
          grid: {
            color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            lineWidth: 0.5
          },
          ticks: {
            color: textColor,
            callback: (value: number) => {
              if (formatter) {
                return formatter(value as number);
              }
              return formatLargeNumber(value as number);
            }
          }
        };
        return acc;
      }, {} as Record<string, any>)
    };
  }
  
  // Chart data
  const chartData = {
    labels,
    datasets
  };
  
  // Chart container style
  const chartContainerStyle = {
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height
  };
  
  const chartContent = (
    <div style={chartContainerStyle} className="w-full h-full">
      <Line
        data={chartData}
        options={options}
        ref={chartRef as any}
      />
    </div>
  );
  
  // Return either as a card or just the chart
  if (asCard) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
        {title && <div className="flex flex-col space-y-1.5 p-6 pb-2"><h3 className="text-lg font-semibold">{title}</h3></div>}
        {description && <div className="px-6 pb-0 text-sm text-muted-foreground">{description}</div>}
        <div className="p-6 pt-0 flex-1">
          {chartContent}
        </div>
      </div>
    );
  }
  
  return chartContent;
} 