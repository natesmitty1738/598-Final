import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

interface DashboardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DashboardHeaderProps {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className={cn("flex-1 w-full", className)}>
      {children}
    </div>
  );
}

export function DashboardHeader({ 
  title, 
  description, 
  className,
  actions 
}: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export function DashboardSection({ 
  children, 
  className,
  title,
  description
}: DashboardSectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-medium">{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <div className={cn("bg-card rounded-md border shadow-sm", className)}>
      {children}
    </div>
  );
} 