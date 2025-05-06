'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip, 
  Legend,
  TooltipItem,
  ChartOptions
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useTheme } from 'next-themes';

// reg chartjs components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const LIGHT_CHART_COLORS = [
  'rgba(79, 70, 229, 0.7)',   // indigo-600
  'rgba(124, 58, 237, 0.7)',  // violet-600
  'rgba(236, 72, 153, 0.7)',  // pink-600
  'rgba(14, 165, 233, 0.7)',  // sky-600
  'rgba(16, 185, 129, 0.7)',  // emerald-600
  'rgba(245, 158, 11, 0.7)',  // amber-600
  'rgba(239, 68, 68, 0.7)',   // red-600
  'rgba(99, 102, 241, 0.7)',  // indigo-500
  'rgba(132, 204, 22, 0.7)',  // lime-600
  'rgba(6, 182, 212, 0.7)',   // cyan-600
];

const DARK_CHART_COLORS = [
  'rgba(129, 140, 248, 0.7)', // indigo-400
  'rgba(167, 139, 250, 0.7)', // violet-400
  'rgba(244, 114, 182, 0.7)', // pink-400
  'rgba(56, 189, 248, 0.7)',  // sky-400
  'rgba(52, 211, 153, 0.7)',  // emerald-400
  'rgba(251, 191, 36, 0.7)',  // amber-400
  'rgba(248, 113, 113, 0.7)', // red-400
  'rgba(129, 140, 248, 0.7)', // indigo-400
  'rgba(163, 230, 53, 0.7)',  // lime-400
  'rgba(34, 211, 238, 0.7)',  // cyan-400
];

const DARK_MODE_BAR_COLOR = 'rgba(129, 140, 248, 0.7)';
const LIGHT_MODE_BAR_COLOR = 'rgba(79, 70, 229, 0.7)';

type DataItem = {
  [key: string]: string | number;
};

type CategoryChartProps = {
  title?: string;
  data: DataItem[];
  // The name of the field containing the category name
  categoryKey: string;
  // The name of the field containing the value
  valueKey: string;
  // Optional label for the value (e.g. "Revenue", "Value")
  valueLabel?: string;
  // Format function for x-axis labels
  xAxisFormatter?: (value: string) => string;
  // Whether to show as a pie chart instead of a bar chart
  displayAsPie?: boolean;
  // Height of the chart container
  height?: number | string;
  // Whether to show the component as a standalone card
  asCard?: boolean;
  // Custom colors for the chart
  colors?: string[];
};

export default function CategoryChart({
  title,
  data,
  categoryKey,
  valueKey,
  valueLabel,
  xAxisFormatter,
  displayAsPie = false,
  height = 300,
  asCard = false,
  colors
}: CategoryChartProps) {
  const { resolvedTheme } = useTheme();
  const [barColor, setBarColor] = useState(LIGHT_MODE_BAR_COLOR);
  const [textColor, setTextColor] = useState('rgba(0, 0, 0, 0.87)');
  const chartRef = useRef<ChartJS>(null);
  
  // Update colors when theme changes
  useEffect(() => {
    setBarColor(resolvedTheme === 'dark' ? DARK_MODE_BAR_COLOR : LIGHT_MODE_BAR_COLOR);
    setTextColor(resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)');
    
    // Update chart when theme changes
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [resolvedTheme]);
  
  // Make sure we have a default value label
  const displayValueLabel = valueLabel || 'Value';
  
  //handle empty data
  if (!data || data.length === 0) {
    const emptyState = (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
    
    return asCard ? (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {title && <div className="flex flex-col space-y-1.5 p-6 pb-2"><h3 className="text-lg font-semibold">{title}</h3></div>}
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

  // Format currency values
  const formatCurrency = (value: number) => {
    return `$${formatLargeNumber(value)}`;
  };

  // Common tooltip configuration
  const tooltipCallback = {
    label: function(context: TooltipItem<'bar' | 'pie'>) {
      const value = context.raw as number;
      const formattedValue = valueLabel?.includes('$') 
        ? `$${value.toLocaleString()}` 
        : value.toLocaleString();
      return `${context.dataset.label || displayValueLabel}: ${formattedValue}`;
    }
  };
  
  // Extract data for Chart.js format
  const labels = data.map(item => item[categoryKey] as string);
  const values = data.map(item => item[valueKey] as number);
  
  // Prepare chart data
  const barChartData = {
    labels,
    datasets: [
      {
        label: displayValueLabel,
        data: values,
        backgroundColor: colors ? colors[0] : barColor,
        borderRadius: 4,
        borderWidth: 0, // No borders for cleaner look
        borderSkipped: false,
        maxBarThickness: 32 // Slightly thinner bars for a more modern look
      }
    ]
  };
  
  const pieChartData = {
    labels,
    datasets: [
      {
        label: displayValueLabel,
        data: values,
        backgroundColor: colors || (resolvedTheme === 'dark' 
          ? DARK_CHART_COLORS.slice(0, data.length)
          : LIGHT_CHART_COLORS.slice(0, data.length)),
        borderWidth: 1,
        borderColor: resolvedTheme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)'
      }
    ]
  };
  
  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          font: {
            size: 12
          },
          usePointStyle: true, // Use dots instead of rectangles
          padding: 15
        }
      },
      tooltip: {
        callbacks: tooltipCallback,
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: resolvedTheme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
        borderWidth: 1,
        titleColor: textColor,
        bodyColor: textColor,
        boxPadding: 6,
        cornerRadius: 8
      }
    }
  };
  
  // Bar chart specific options
  const barOptions = {
    ...commonOptions,
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: textColor,
          maxRotation: 20,
          minRotation: 20,
          callback: function(value: number | string) {
            const label = labels[value as number];
            return label?.length > 12 ? label.substring(0, 10) + '...' : label;
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          lineWidth: 0.5
        },
        ticks: {
          color: textColor,
          callback: function(value: number | string) {
            if (valueLabel?.includes('$')) {
              return `$${formatLargeNumber(value as number)}`;
            }
            return formatLargeNumber(value as number);
          }
        }
      }
    },
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins?.legend,
        display: true
      }
    }
  };
  
  // Pie chart specific options
  const pieOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins?.legend,
        position: 'bottom'
      }
    }
  };
  
  // Set up the chart component based on the display option
  const chartComponent = displayAsPie ? (
    <div style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }} className="flex items-center justify-center w-full h-full">
      <Pie 
        data={pieChartData}
        options={pieOptions as any}
        ref={chartRef as any}
      />
    </div>
  ) : (
    <div style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }} className="w-full h-full">
      <Bar 
        data={barChartData}
        options={barOptions as any}
        ref={chartRef as any}
      />
    </div>
  );
  
  // Return as a card if specified
  if (asCard) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
        {title && <div className="flex flex-col space-y-1.5 p-6 pb-2"><h3 className="text-lg font-semibold">{title}</h3></div>}
        <div className="p-6 pt-0 flex-1">
          {chartComponent}
        </div>
      </div>
    );
  }
  
  return chartComponent;
} 