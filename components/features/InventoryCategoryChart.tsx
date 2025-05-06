'use client';

import { useEffect, useState } from 'react';
import CategoryChart from './CategoryChart';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';

interface InventoryItem {
  sku: string;
  name: string;
  description: string;
  category: string;
  unitCost: number;
  sellingPrice: number;
  stockQuantity: number;
  location: string;
  size: string;
  color: string;
}

export default function InventoryCategoryChart() {
  const [inventoryData, setInventoryData] = useState<
    { category: string; totalItems: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // first try to fetch from the API
    const fetchFromAPI = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/inventory/stats/by-category');
        
        if (!response.ok) {
          // If API fails, fallback to CSV
          fetchFromCSV();
          return;
        }
        
        const data = await response.json();
        if (data && Array.isArray(data.categories)) {
          setInventoryData(data.categories);
          setLoading(false);
        } else {
          // If API response doesn't have the expected format, fallback to CSV
          fetchFromCSV();
        }
      } catch (err) {
        console.error('Error fetching inventory data from API:', err);
        // On any error, fallback to CSV
        fetchFromCSV();
      }
    };
    
    // fallback to CSV file if API is not available
    const fetchFromCSV = () => {
      Papa.parse('/sample_data/inventory_items.csv', {
        download: true,
        header: true,
        complete: (results) => {
          // Group data by category and count items
          const items = results.data as InventoryItem[];
          const categories: Record<string, number> = {};
          
          items.forEach((item) => {
            if (!item.category || !item.stockQuantity) return;
            
            const category = item.category || 'Uncategorized';
            const quantity = Number(item.stockQuantity) || 0;
            
            if (!categories[category]) {
              categories[category] = 0;
            }
            
            categories[category] += quantity;
          });
          
          // Convert to array format needed by the chart
          const chartData = Object.entries(categories).map(([category, totalItems]) => ({
            category,
            totalItems,
          }));
          
          setInventoryData(chartData);
          setLoading(false);
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error);
          setError('Could not load inventory data');
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
  
  if (inventoryData.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
          No inventory data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Inventory by Category</h3>
      <div className="h-[300px]">
        <CategoryChart 
          data={inventoryData} 
          categoryKey="category"
          valueKey="totalItems"
          colors={['#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3', '#db2777']}
        />
      </div>
    </Card>
  );
} 