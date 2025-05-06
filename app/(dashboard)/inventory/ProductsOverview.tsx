import React, { useState, useEffect } from 'react';
import { Package, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, FilterValue, SortDirection } from '@/components/shared/DataTable';
import { productColumns, formatCurrency } from '@/components/shared/ColumnDefinitions';
import { Product, ProductFilter } from '@/app/types/product';

interface ProductsOverviewProps {
  inventoryMetrics: {
    totalProducts: number;
    lowStockCount: number;
    inventoryValue: number;
    averageUnitCost: number;
  };
  activeFilters?: ProductFilter;
}

export default function ProductsOverview({ 
  inventoryMetrics,
  activeFilters = {} 
}: ProductsOverviewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableFilters, setTableFilters] = useState<FilterValue[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Fetch products data
  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, sortKey, sortDirection]);
  
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const url = `/api/products?page=${currentPage}&limit=${pageSize}&sortKey=${sortKey}&sortDir=${sortDirection}`;
      console.log("Fetching products with URL:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || []);
      setTotalItems(data.total || 0);
      console.log("Fetched products:", data.products.length);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Transform sidebar filters to table filters format
  useEffect(() => {
    const filters: FilterValue[] = [];
    
    if (activeFilters.category && activeFilters.category !== 'all') {
      filters.push({
        key: 'category',
        value: activeFilters.category
      });
    }
    
    if (activeFilters.status && activeFilters.status !== 'all') {
      // Map status filter to corresponding stock quantity condition
      if (activeFilters.status === 'out-of-stock') {
        filters.push({
          key: 'stockQuantity',
          value: 0
        });
      } else if (activeFilters.status === 'low-stock') {
        // For low-stock, we'll need custom handling in the DataTable component
        // This is just a placeholder - actual implementation would check if stock < 5
        filters.push({
          key: 'stockStatus',
          value: 'low'
        });
      } else if (activeFilters.status === 'in-stock') {
        // For in-stock, we'll need custom handling as well
        filters.push({
          key: 'stockStatus',
          value: 'in'
        });
      }
    }
    
    if (activeFilters.search) {
      filters.push({
        key: 'name',
        value: activeFilters.search
      });
    }
    
    setTableFilters(filters);
  }, [activeFilters]);
  
  // Handle row actions if needed
  const handleRowAction = (action: 'edit' | 'delete', product: Product) => {
    if (action === 'edit') {
      toast.info(`Edit product: ${product.name}`);
      // Implement edit functionality
    } else if (action === 'delete') {
      toast.error(`Delete product: ${product.name}`);
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
      {/* Inventory Summary Stats - Smaller Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Products</p>
              <h3 className="text-lg font-medium">{inventoryMetrics.totalProducts}</h3>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
              <h3 className="text-lg font-medium">
                {inventoryMetrics.lowStockCount}
              </h3>
            </div>
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Inventory Value</p>
              <h3 className="text-lg font-medium">{formatCurrency(inventoryMetrics.inventoryValue)}</h3>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="bg-card rounded-md p-3 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avg. Unit Cost</p>
              <h3 className="text-lg font-medium">
                {inventoryMetrics.totalProducts > 0 
                  ? formatCurrency(inventoryMetrics.averageUnitCost)
                  : formatCurrency(0)
                }
              </h3>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      {/* Products Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Products</h2>
        <DataTable
          data={products}
          columns={productColumns}
          isLoading={isLoading}
          defaultSortKey={sortKey}
          defaultSortDirection={sortDirection}
          filters={tableFilters}
          showActions={true}
          onRowAction={handleRowAction}
          noDataMessage="No products found. Add products to view them here."
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