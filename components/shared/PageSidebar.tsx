'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface NavItem {
  key: string;
  label: string;
}

export interface FilterGroup {
  label: string;
  type: 'select' | 'input';
  key: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

interface PageSidebarProps {
  title?: string;
  navItems: NavItem[];
  activeItem: string;
  onNavItemClick: (key: string) => void;
  filterGroups?: FilterGroup[];
  onFilterChange?: (key: string, value: string) => void;
  onRefreshClick?: () => void;
  showRefreshButton?: boolean;
}

const PageSidebar: React.FC<PageSidebarProps> = ({
  title = 'Navigation',
  navItems,
  activeItem,
  onNavItemClick,
  filterGroups = [],
  onFilterChange,
  onRefreshClick,
  showRefreshButton = true,
}) => {
  return (
    <div className="w-full md:w-64 shrink-0 border-b md:border-r md:border-b-0 md:min-h-[calc(100vh-64px)]">
      <div className="p-4">
        {/* Navigation items */}
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">{title}</h2>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                activeItem === item.key
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
              onClick={() => onNavItemClick(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filter controls */}
        {filterGroups.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Filters</h2>

            {filterGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <label className="text-xs text-muted-foreground">{group.label}</label>
                {group.type === 'select' && group.options ? (
                  <Select 
                    defaultValue={group.defaultValue} 
                    onValueChange={(value) => onFilterChange?.(group.key, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={group.placeholder || group.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {group.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    placeholder={group.placeholder || `Filter ${group.label.toLowerCase()}...`} 
                    onChange={(e) => onFilterChange?.(group.key, e.target.value)}
                  />
                )}
              </div>
            ))}

            {showRefreshButton && (
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={onRefreshClick}>
                Refresh Data
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageSidebar; 