import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterValue {
  key: string;
  value: any;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  filters?: FilterValue[];
  onRowAction?: (action: 'edit' | 'delete', item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  noDataMessage?: string;
  // Server-side pagination props
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  totalItems?: number;
  currentPage?: number;
  serverSidePagination?: boolean;
  // Server-side sorting props
  onSortChange?: (key: string, direction: SortDirection) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  defaultSortKey,
  defaultSortDirection = 'asc',
  filters = [],
  onRowAction,
  isLoading = false,
  showActions = false,
  noDataMessage = 'No data found',
  // Server-side pagination props
  onPageChange,
  onPageSizeChange,
  totalItems: externalTotalItems,
  currentPage: externalCurrentPage,
  serverSidePagination = false,
  // Server-side sorting props
  onSortChange,
}: DataTableProps<T>) {
  // State
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<string>(defaultSortKey || "");
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Use external page state if server-side pagination is enabled
  const effectiveCurrentPage = serverSidePagination && externalCurrentPage ? externalCurrentPage : currentPage;
  
  // Filter & sort data
  const processedData = useMemo(() => {
    // If server-side pagination is enabled, don't process data locally
    if (serverSidePagination) {
      return data;
    }
    
    // Apply filters
    let result = [...data];
    
    if (filters.length > 0) {
      result = result.filter(item => 
        filters.every(filter => {
          // Handle different filter types
          if (filter.value === undefined || filter.value === null || filter.value === '') {
            return true; // Skip empty filters
          }
          
          const itemValue = (item as any)[filter.key];
          
          // Handle different comparison types based on the filter value
          if (typeof filter.value === 'string' && typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(filter.value.toLowerCase());
          } else if (filter.value === 'all') {
            return true; // 'all' is a special case that matches everything
          } else {
            return itemValue === filter.value;
          }
        })
      );
    }
    
    // Sort data if sort key is specified
    if (sortKey && sortKey !== "") {
      result.sort((a, b) => {
        // Find the column with the matching key to get the sortKey if available
        const column = columns.find(col => col.key === sortKey);
        const actualSortKey = column?.sortKey || sortKey;
        
        let aValue: any = (a as any)[actualSortKey];
        let bValue: any = (b as any)[actualSortKey];
        
        // Handle special cases (could be expanded based on needs)
        if (actualSortKey === 'price' || actualSortKey === 'sellingPrice') {
          aValue = (a as any).price || (a as any).sellingPrice || 0;
          bValue = (b as any).price || (b as any).sellingPrice || 0;
        }
        
        // Handle nullish values
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        
        // Sort based on data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc' 
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        } else {
          // Default numeric comparison
          const numA = Number(aValue) || 0;
          const numB = Number(bValue) || 0;
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
      });
    }
    
    return result;
  }, [data, filters, sortKey, sortDirection, columns, serverSidePagination]);
  
  // Calculate pagination
  const paginatedData = useMemo(() => {
    // For server-side pagination, don't slice the data
    if (serverSidePagination) {
      return processedData;
    }
    
    const startIndex = (effectiveCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, effectiveCurrentPage, pageSize, serverSidePagination]);
  
  // Update total pages when data or page size changes
  useEffect(() => {
    if (serverSidePagination && externalTotalItems !== undefined) {
      // For server-side pagination, use the total items from props
      const calculatedTotalPages = Math.max(1, Math.ceil(externalTotalItems / pageSize));
      setTotalPages(calculatedTotalPages);
    } else {
      // For client-side pagination, calculate from processed data
      const calculatedTotalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
      setTotalPages(calculatedTotalPages);
      
      // If current page is out of bounds, adjust it
      if (currentPage > calculatedTotalPages) {
        setCurrentPage(calculatedTotalPages);
      }
    }
  }, [processedData, pageSize, currentPage, serverSidePagination, externalTotalItems]);
  
  // Handle sorting
  const handleSort = (key: string) => {
    if (!key) return;
    
    console.log("Sort clicked:", key);
    let newDirection: SortDirection;
    
    if (sortKey === key) {
      // Toggle direction if same column
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
    } else {
      // New column, set key and default direction
      newDirection = 'asc';
      setSortKey(key);
      setSortDirection(newDirection);
    }
    
    console.log("New sort state:", key, newDirection);
    
    // Reset to first page on sort change
    if (serverSidePagination) {
      if (onSortChange) {
        console.log("Calling onSortChange with:", key, newDirection);
        onSortChange(key, newDirection);
      }
      if (onPageChange) {
        onPageChange(1);
      }
    } else {
      setCurrentPage(1);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    
    if (serverSidePagination && onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      setCurrentPage(1); // Reset to first page on page size change
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    if (serverSidePagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };
  
  // Calculate the range of items being shown
  const totalItemsCount = serverSidePagination && externalTotalItems !== undefined
    ? externalTotalItems 
    : processedData.length;
    
  const startItem = totalItemsCount === 0 
    ? 0 
    : Math.min(totalItemsCount, (effectiveCurrentPage - 1) * pageSize + 1);
    
  const endItem = Math.min(totalItemsCount, startItem + pageSize - 1);
  
  return (
    <div className="space-y-2">
      {/* Page Size Controls */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Items per page:</span>
          <div className="flex border rounded-md overflow-hidden">
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                className={`px-2.5 py-1 text-xs ${
                  pageSize === size 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'bg-background hover:bg-muted'
                }`}
                onClick={() => handlePageSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  onClick={() => column.sortable !== false ? handleSort(column.key) : undefined}
                  className={`${column.sortable !== false ? 'cursor-pointer' : ''} 
                    ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  <div className={`flex items-center ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {column.header}
                    {column.sortable !== false && (
                      <ArrowUpDown 
                        className={`h-3 w-3 ml-1 ${sortKey === column.key ? 'text-primary' : ''}`} 
                      />
                    )}
                  </div>
                </TableHead>
              ))}
              
              {showActions && (
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <span className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent rounded-full" />
                    Loading data...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell 
                      key={`${item.id}-${column.key}`}
                      className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                    >
                      {column.cell(item)}
                    </TableCell>
                  ))}
                  
                  {showActions && onRowAction && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => onRowAction('edit', item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => onRowAction('delete', item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  {noDataMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        {paginatedData.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{startItem}-{endItem}</span> of{" "}
              <span className="font-medium">{totalItemsCount}</span> items
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(effectiveCurrentPage - 1)}
                disabled={effectiveCurrentPage <= 1 || isLoading}
              >
                <span className="sr-only">Previous</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {effectiveCurrentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(effectiveCurrentPage + 1)}
                disabled={effectiveCurrentPage >= totalPages || isLoading}
              >
                <span className="sr-only">Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 