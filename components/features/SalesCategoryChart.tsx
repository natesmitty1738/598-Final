'use client';

import { useEffect, useState } from 'react';
import CategoryChart from './CategoryChart';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';

interface SalesRecord {
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

// Extract category from product name (format: "Product Name (Category)")
const extractCategory = (productName: string): string => {
  const match = productName.match(/\(([^)]+)\)/);
  return match ? match[1] : 'Uncategorized';
};

export default function SalesCategoryChart() {
  const [salesData, setSalesData] = useState<
    { category: string; totalSales: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // first try to fetch from the API
    const fetchFromAPI = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/sales/stats/by-category');
        
        if (!response.ok) {
          // If API fails, fallback to CSV
          fetchFromCSV();
          return;
        }
        
        const data = await response.json();
        if (data && Array.isArray(data.categories)) {
          setSalesData(data.categories);
          setLoading(false);
        } else {
          // If API response doesn't have the expected format, fallback to CSV
          fetchFromCSV();
        }
      } catch (err) {
        console.error('Error fetching sales data from API:', err);
        // On any error, fallback to CSV
        fetchFromCSV();
      }
    };
    
    // fallback to CSV file if API is not available
    const fetchFromCSV = () => {
      Papa.parse('/sample_data/sales_history.csv', {
        download: true,
        header: true,
        complete: (results) => {
          // Group data by category and sum sales
          const salesByCategory: Record<string, number> = {};
          
          results.data.forEach((record: any) => {
            if (!record.productName || !record.totalAmount) return;
            
            const category = extractCategory(record.productName);
            const amount = parseFloat(record.totalAmount) || 0;
            
            if (!salesByCategory[category]) {
              salesByCategory[category] = 0;
            }
            
            salesByCategory[category] += amount;
          });
          
          // Convert to array format needed by the chart
          const chartData = Object.entries(salesByCategory).map(([category, totalSales]) => ({
            category,
            totalSales,
          }));
          
          setSalesData(chartData);
          setLoading(false);
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error);
          setError('Could not load sales data');
          setLoading(false);
        }
      });
    };
    
    // Start by trying the API
    fetchFromAPI();
  }, []);
  
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex h-[300px] w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-4">
        <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
          {error}
        </div>
      </Card>
    );
  }
  
  if (salesData.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
          No sales data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
      <div className="h-[300px]">
        <CategoryChart 
          data={salesData} 
          categoryKey="category"
          valueKey="totalSales"
          colors={['#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5']}
        />
      </div>
    </Card>
  );
} 