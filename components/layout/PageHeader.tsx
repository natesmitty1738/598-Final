import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className="w-screen relative left-[calc(-50vw+50%)] mb-6">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center pb-4", className)}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          
          {children && (
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              {children}
            </div>
          )}
        </div>
      </div>
      <div className="border-b w-full" />
    </div>
  );
} 