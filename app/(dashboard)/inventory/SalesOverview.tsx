import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, FilterValue, SortDirection } from '@/components/shared/DataTable';
import { salesColumns, formatCurrency } from '@/components/shared/ColumnDefinitions';
import { SaleRecord, SalesFilter } from '@/app/types/sale';

interface SalesOverviewProps {
  salesMetrics: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  activeFilters?: SalesFilter;
}

export default function SalesOverview({ 
  salesMetrics,
  activeFilters = {} 
}: SalesOverviewProps) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableFilters, setTableFilters] = useState<FilterValue[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Fetch sales data
  useEffect(() => {
    fetchSales();
  }, [currentPage, pageSize, sortKey, sortDirection]);
  
  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const url = `/api/sales?page=${currentPage}&limit=${pageSize}&sortKey=${sortKey}&sortDir=${sortDirection}`;
      console.log("Fetching sales with URL:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch sales");
      const data = await response.json();
      setSales(data.sales || []);
      setTotalItems(data.total || 0);
      console.log("Fetched sales:", data.sales.length);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Transform sidebar filters to table filters format
  useEffect(() => {
    const filters: FilterValue[] = [];
    
    if (activeFilters.period) {
      filters.push({
        key: 'period',
        value: activeFilters.period
      });
    }
    
    if (activeFilters.customerType && activeFilters.customerType !== 'all') {
      filters.push({
        key: 'customerType',
        value: activeFilters.customerType
      });
    }
    
    if (activeFilters.search) {
      // Search filter doesn't directly map to a single field
      // This will be handled in DataTable filtering logic
      filters.push({
        key: 'search',
        value: activeFilters.search
      });
    }
    
    setTableFilters(filters);
  }, [activeFilters]);
  
  // Handle row actions if needed
  const handleRowAction = (action: 'edit' | 'delete', sale: SaleRecord) => {
    if (action === 'edit') {
      toast.info(`Edit sale ID: ${sale.id}`);
      // Implement edit functionality
    } else if (action === 'delete') {
      toast.error(`Delete sale ID: ${sale.id}`);
      // Implement delete functionality
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to page 1 when changing page size
  };
  
  // Handle sort change
  const handleSortChange = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
    setCurrentPage(1); // Reset to page 1 when changing sort
  };
  
  return (
    <div className="space-y-4">
      {/* Sales Summary Stats - Smaller Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Sales</p>
              <h3 className="text-lg font-medium">{salesMetrics.totalSales}</h3>
            </div>
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <h3 className="text-lg font-medium">{formatCurrency(salesMetrics.totalRevenue)}</h3>
            </div>
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avg Order Value</p>
              <h3 className="text-lg font-medium">
                {salesMetrics.totalSales > 0 
                  ? formatCurrency(salesMetrics.averageOrderValue)
                  : formatCurrency(0)
                }
              </h3>
            </div>
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
              <h3 className="text-lg font-medium">{salesMetrics.conversionRate > 0 ? `${salesMetrics.conversionRate.toFixed(1)}%` : '0%'}</h3>
            </div>
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      {/* Sales Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Sales</h2>
        <DataTable
          data={sales}
          columns={salesColumns}
          isLoading={isLoading}
          defaultSortKey={sortKey}
          defaultSortDirection={sortDirection}
          filters={tableFilters}
          showActions={true}
          onRowAction={handleRowAction}
          noDataMessage="No sales found. Add sales to view them here."
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          totalItems={totalItems}
          currentPage={currentPage}
          serverSidePagination={true}
          onSortChange={handleSortChange}
        />
      </div>
    </div>
  );
} 