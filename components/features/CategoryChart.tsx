import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';
import { useTheme } from 'next-themes';

// Define a consistent color palette that works in both light and dark modes
const CHART_COLORS = [
  '#4f46e5', // indigo-600
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#0ea5e9', // sky-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#06b6d4', // cyan-500
];

// Colors for dark mode that are lighter and more visible
const DARK_MODE_BAR_COLOR = '#818cf8'; // A lighter indigo color for dark mode
const LIGHT_MODE_BAR_COLOR = '#4f46e5'; // Darker indigo for light mode

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
  // Whether to show as a pie chart instead of a bar chart
  displayAsPie?: boolean;
  // Height of the chart container
  height?: number | string;
  // Whether to show the component as a standalone card
  asCard?: boolean;
};

export default function CategoryChart({
  title,
  data,
  categoryKey,
  valueKey,
  valueLabel,
  displayAsPie = false,
  height = 300,
  asCard = false
}: CategoryChartProps) {
  const { resolvedTheme } = useTheme();
  const [barColor, setBarColor] = useState(LIGHT_MODE_BAR_COLOR);
  const [textColor, setTextColor] = useState('rgba(0, 0, 0, 0.87)');
  
  // Update colors when theme changes
  useEffect(() => {
    setBarColor(resolvedTheme === 'dark' ? DARK_MODE_BAR_COLOR : LIGHT_MODE_BAR_COLOR);
    setTextColor(resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)');
  }, [resolvedTheme]);
  
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
        <div className="p-6 pt-0">{emptyState}</div>
      </div>
    ) : emptyState;
  }

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

  // Custom pie label renderer that respects theme colors
  const renderPieLabel = ({ name, percent }: { name: string, percent: number }) => {
    // truncate long names to prevent label overlap
    const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
    return `${displayName} (${Math.round(percent * 100)}%)`;
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return `$${formatLargeNumber(value)}`;
  };

  const chartContent = (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        {displayAsPie ? (
          <PieChart 
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={categoryKey}
              cx="50%"
              cy="50%"
              outerRadius="70%"
              innerRadius={0}
              paddingAngle={2}
              fill="#8884d8"
              label={renderPieLabel}
              labelLine={true}
              stroke="var(--border)"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => {
                const numValue = Number(value);
                return [valueLabel?.includes('$') ? `$${numValue.toLocaleString()}` : numValue.toLocaleString(), displayValueLabel];
              }}
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--foreground)'
              }}
            />
            <Legend 
              formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
              wrapperStyle={{
                paddingTop: '10px',
                fontSize: '12px'
              }}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        ) : (
          <BarChart 
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 30 }}
            barCategoryGap={20}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--border)" 
              opacity={0.3} 
              vertical={false}
            />
            <XAxis 
              dataKey={categoryKey} 
              stroke={textColor}
              opacity={0.7}
              tick={{ fill: textColor, fontSize: 11 }}
              tickLine={{ stroke: textColor }}
              axisLine={{ stroke: textColor }}
              height={40}
              angle={-20}
              textAnchor="end"
              interval={0}
              tickFormatter={(value) => value.length > 12 ? value.substring(0, 10) + '...' : value}
            />
            <YAxis 
              stroke={textColor}
              opacity={0.7}
              tick={{ fill: textColor }}
              tickLine={{ stroke: textColor }}
              axisLine={{ stroke: textColor }}
              tickFormatter={(value) => {
                if (valueLabel?.includes('$')) {
                  return `$${formatLargeNumber(value)}`;
                }
                return Math.round(value).toString();
              }}
              width={45}
              padding={{ top: 10 }}
              domain={[0, 'auto']}
            />
            <Tooltip 
              formatter={(value) => {
                const numValue = Number(value);
                return [valueLabel?.includes('$') ? `$${numValue.toLocaleString()}` : numValue.toLocaleString(), displayValueLabel];
              }}
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--foreground)'
              }}
              labelStyle={{
                color: 'var(--foreground)'
              }}
            />
            <Legend 
              formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
              wrapperStyle={{
                paddingTop: '10px',
                fontSize: '12px'
              }}
              verticalAlign="top"
              height={36}
            />
            <Bar 
              dataKey={valueKey} 
              fill={barColor} 
              name={displayValueLabel}
              radius={[4, 4, 0, 0]}
              barSize={40}
              minPointSize={3}
            >
              <LabelList 
                dataKey={valueKey} 
                position="top" 
                fill={textColor}
                formatter={(value: number) => {
                  if (value === 0) return '';
                  return valueLabel?.includes('$') ? `$${formatLargeNumber(value)}` : formatLargeNumber(value);
                }}
                offset={8}
                style={{ fontWeight: 500, fontSize: '12px' }}
              />
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
  
  // Return either as a card or just the chart
  if (asCard) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
        {title && <div className="flex flex-col space-y-1.5 p-6 pb-2"><h3 className="text-lg font-semibold">{title}</h3></div>}
        <div className="p-6 pt-0 flex-1">
          {chartContent}
        </div>
      </div>
    );
  }
  
  return chartContent;
} 