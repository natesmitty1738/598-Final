import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from './PageHeader';

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
}

interface DataLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  navItems: {
    href: string;
    label: string;
    icon: LucideIcon;
  }[];
}

function NavItem({ href, label, icon: Icon, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
        isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 opacity-70" />
      <span>{label}</span>
    </Link>
  );
}

export function DataLayout({
  children,
  title,
  description,
  icon,
  actions,
  navItems
}: DataLayoutProps) {
  const pathname = usePathname();
  
  return (
    <div className="w-full max-w-screen-xl mx-auto px-6 mb-6">
      <PageHeader title={title}>
        {actions}
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-6">
        <Card className="w-full sm:w-64 h-fit">
          <CardContent className="p-3">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
              ))}
            </nav>
          </CardContent>
        </Card>
        
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
} 