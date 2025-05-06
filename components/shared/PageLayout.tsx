'use client';

import React, { ReactNode } from 'react';
import PageSidebar, { NavItem, FilterGroup } from './PageSidebar';
import ContentWrapper from '@/components/layout/ContentWrapper';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  headerContent?: ReactNode;
  navItems: NavItem[];
  activeNavItem: string;
  onNavChange: (key: string) => void;
  filterGroups?: FilterGroup[];
  onFilterChange?: (key: string, value: string) => void;
  onRefreshClick?: () => void;
  sidebarTitle?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  children,
  headerContent,
  navItems,
  activeNavItem,
  onNavChange,
  filterGroups,
  onFilterChange,
  onRefreshClick,
  sidebarTitle,
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header - full width with wrapper inside */}
      <div className="border-b bg-background">
        <ContentWrapper>
          <div className="py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            
            {headerContent && (
              <div className="flex items-center space-x-3">
                {headerContent}
              </div>
            )}
          </div>
        </ContentWrapper>
      </div>

      {/* Main content area with sidebar - full width container */}
      <ContentWrapper>
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar - outside the wrapper */}
        <PageSidebar
          title={sidebarTitle}
          navItems={navItems}
          activeItem={activeNavItem}
          onNavItemClick={onNavChange}
          filterGroups={filterGroups}
          onFilterChange={onFilterChange}
          onRefreshClick={onRefreshClick}
        />

        {/* Main content - scrollable area */}
        <div className="flex-1 overflow-auto">
          <ContentWrapper>
            <div className="py-6">
              {children}
            </div>
          </ContentWrapper>
        </div>
      </div>
      </ContentWrapper>
    </div>
  );
};

export default PageLayout; 