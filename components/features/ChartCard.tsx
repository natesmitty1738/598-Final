import React, { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  description?: string;
}

/**
 * A standardized card component for presenting charts
 * 
 * @param title - The title of the chart
 * @param children - The chart component
 * @param className - Additional classes for the card
 * @param description - Optional description text displayed below the title
 */
export default function ChartCard({ 
  title, 
  children, 
  className = '', 
  description 
}: ChartCardProps) {
  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader className="pb-0">
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-3 pb-4 flex-1">
        <div className="h-full w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
} 