'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from 'next-themes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// More subtle colors that work in both light and dark themes
const DARK_BAR_COLOR = 'rgba(129, 140, 248, 0.7)'; // A lighter indigo color with opacity for dark mode
const LIGHT_BAR_COLOR = 'rgba(79, 70, 229, 0.7)'; // Darker indigo with opacity for light mode

// Alternative colors for additional dataset options
const DARK_ACCENT_COLORS = [
  'rgba(52, 211, 153, 0.7)',  // emerald-400 with opacity
  'rgba(167, 139, 250, 0.7)', // violet-400 with opacity
  'rgba(96, 165, 250, 0.7)',  // blue-400 with opacity
  'rgba(251, 146, 60, 0.7)'   // orange-400 with opacity
];

const LIGHT_ACCENT_COLORS = [
  'rgba(16, 185, 129, 0.7)',  // emerald-600 with opacity
  'rgba(124, 58, 237, 0.7)',  // violet-600 with opacity
  'rgba(37, 99, 235, 0.7)',   // blue-600 with opacity
  'rgba(234, 88, 12, 0.7)'    // orange-600 with opacity
];

type DataItem = {
  [key: string]: any;
};

type BarChartProps = {
  data: DataItem[];
  // The property containing the category name/label
  categoryKey?: string;
  // The property containing the value
  valueKey?: string;
  // Multiple keys for stacked/grouped bar charts
  keys?: string[];
  // Index field for multiple keys mode
  indexBy?: string;
  // Colors for multiple datasets
  colors?: string[];
  // Legend items for multiple datasets
  legends?: Array<{ id: string, label: string }>;
  // Bottom axis label
  axisBottomLegend?: string;
  // Left axis label
  axisLeftLegend?: string;
  // Optional label for the value (e.g. "Sales", "Revenue")
  valueLabel?: string;
  // Format function for tooltip values
  valueFormatter?: (value: number) => string;
  // Format function for x-axis labels
  xAxisFormatter?: (value: string) => string;
  // Whether the chart is horizontal (default: false)
  horizontal?: boolean;
  // Title of the chart
  title?: string;
  // Height of the chart container
  height?: number | string;
  // Show as a card
  asCard?: boolean;
  // Card description
  description?: string;
};

export default function BarChart({
  data,
  categoryKey,
  valueKey,
  keys,
  indexBy,
  colors,
  legends,
  axisBottomLegend,
  axisLeftLegend,
  valueLabel,
  valueFormatter,
  xAxisFormatter,
  horizontal = false,
  title,
  height = 300,
  asCard = false,
  description
}: BarChartProps) {
  const { resolvedTheme } = useTheme();
  const [barColor, setBarColor] = useState(LIGHT_BAR_COLOR);
  const [barColors, setBarColors] = useState<string[]>([]);
  const [textColor, setTextColor] = useState('rgba(0, 0, 0, 0.87)');
  const chartRef = useRef<ChartJS>(null);
  
  // Update colors when theme changes
  useEffect(() => {
    setBarColor(resolvedTheme === 'dark' ? DARK_BAR_COLOR : LIGHT_BAR_COLOR);
    setTextColor(resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)');
    
    // Update bar colors based on theme
    if (colors) {
      setBarColors(colors);
    } else {
      setBarColors(resolvedTheme === 'dark' ? DARK_ACCENT_COLORS : LIGHT_ACCENT_COLORS);
    }
    
    // Update chart when theme changes
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [resolvedTheme, colors]);
  
  // Make sure we have a default value label
  const displayValueLabel = valueLabel || 'Value';
  
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
  
  // Prepare chart data - either using keys array or single valueKey
  let chartData;
  
  if (keys && keys.length > 0 && indexBy) {
    // For multi-series data (keys mode)
    const labels = data.map(item => item[indexBy]);
    
    // Create datasets for each key
    const datasets = keys.map((key, index) => {
      const color = colors && colors.length > index ? colors[index] : barColors[index % barColors.length];
      const legendItem = legends && legends.length > index ? legends[index] : { id: key, label: key };
      
      return {
        label: legendItem.label,
        data: data.map(item => item[key] === null ? null : item[key] || 0), // Handle null values
        backgroundColor: color,
        borderRadius: 4,
        borderWidth: 0,
        borderSkipped: false,
        maxBarThickness: horizontal ? 16 : 32
      };
    });
    
    chartData = {
      labels,
      datasets
    };
  } else if (categoryKey && valueKey) {
    // For single series data (original mode)
    const labels = data.map(item => item[categoryKey]);
    const values = data.map(item => item[valueKey]);
    
    chartData = {
      labels,
      datasets: [
        {
          label: displayValueLabel,
          data: values,
          backgroundColor: barColor,
          borderRadius: 4,
          borderWidth: 0,
          borderSkipped: false,
          maxBarThickness: horizontal ? 16 : 32
        }
      ]
    };
  } else {
    // Fallback if neither mode is properly configured
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">Chart configuration error: Need either categoryKey+valueKey or keys+indexBy</p>
      </div>
    );
  }
  
  // Common tooltip configuration
  const tooltipCallback = {
    label: function(context: TooltipItem<'bar'>) {
      const value = context.raw as number;
      if (valueFormatter) {
        return `${context.dataset.label}: ${valueFormatter(value)}`;
      }
      return `${context.dataset.label}: ${value?.toLocaleString() || 'N/A'}`;
    }
  };
  
  // Chart options
  const indexAxis = horizontal ? 'y' : 'x';
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: indexAxis as 'x' | 'y',
    scales: {
      x: {
        grid: {
          display: false
        },
        title: {
          display: !!axisBottomLegend && !horizontal,
          text: horizontal ? '' : axisBottomLegend,
          color: textColor
        },
        ticks: {
          color: textColor,
          // If it's a horizontal chart, x axis is for values
          callback: horizontal ? (value) => formatLargeNumber(value as number) : undefined
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          lineWidth: 0.5
        },
        title: {
          display: !!axisLeftLegend || horizontal && !!axisBottomLegend,
          text: horizontal ? axisBottomLegend : axisLeftLegend,
          color: textColor
        },
        ticks: {
          color: textColor,
          // If it's a vertical chart, y axis is for values
          callback: !horizontal ? (value) => formatLargeNumber(value as number) : undefined
        }
      }
    },
    plugins: {
      legend: {
        display: keys && keys.length > 1,
        position: 'top',
        labels: {
          color: textColor,
          usePointStyle: true,
          boxWidth: 8,
          padding: 16
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
        callbacks: tooltipCallback
      }
    }
  };
  
  // Chart container style
  const chartContainerStyle = {
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height
  };
  
  const chartContent = (
    <div style={chartContainerStyle} className="w-full h-full">
      <Bar
        data={chartData}
        options={options}
        ref={chartRef as any}
      />
    </div>
  );
  
  // Return either as a card or just the chart
  if (asCard) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
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