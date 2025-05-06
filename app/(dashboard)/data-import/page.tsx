'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Database, FileSpreadsheet, Upload } from 'lucide-react';
import CsvUpload from '@/components/shared/CsvUpload';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';

// Sample interfaces for the data types
interface SalesHistoryItem {
  date: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface InventoryItem {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitCost?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  location?: string;
  size?: string;
  color?: string;
}

export default function DataImportPage() {
  const router = useRouter();
  
  // State to track data and upload status
  const [salesHistory, setSalesHistory] = useState<SalesHistoryItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle sales history data
  const handleSalesHistoryParsed = (data: any[]) => {
    setSalesHistory(data);
  };
  
  // Handle inventory items data
  const handleInventoryItemsParsed = (data: any[]) => {
    setInventoryItems(data);
  };
  
  // Submit sales history to the server
  const submitSalesHistory = async () => {
    if (salesHistory.length === 0) {
      toast.error('No sales history data to submit');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Make API call to save sales history
      const response = await fetch('/api/sales-history/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ salesHistory })
      });
      
      if (!response.ok) {
        throw new Error('Failed to import sales history');
      }
      
      const result = await response.json();
      
      toast.success(`Successfully imported ${result.count} sales records`);
      setSalesHistory([]);
      
      // Redirect to analytics page
      setTimeout(() => {
        router.push('/analytics');
      }, 1500);
    } catch (error) {
      console.error('Error importing sales history:', error);
      toast.error('Failed to import sales history. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Submit inventory items to the server
  const submitInventoryItems = async () => {
    if (inventoryItems.length === 0) {
      toast.error('No inventory items to submit');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Make API call to save inventory items
      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inventoryItems })
      });
      
      if (!response.ok) {
        throw new Error('Failed to import inventory items');
      }
      
      const result = await response.json();
      
      toast.success(`Successfully imported ${result.count} inventory items`);
      setInventoryItems([]);
      
      // Redirect to inventory page
      setTimeout(() => {
        router.push('/inventory');
      }, 1500);
    } catch (error) {
      console.error('Error importing inventory items:', error);
      toast.error('Failed to import inventory items. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container p-6 space-y-6">
      <PageHeader 
        title="Data Import" 
        description="Import your business data from CSV files"
      />
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Import Business Data
            </CardTitle>
            <CardDescription>
              Import sales history and inventory items from CSV files to analyze your business performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales" className="space-y-6">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Sales History
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Inventory Items
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sales" className="space-y-6">
                <div className="space-y-4">
                  <CsvUpload 
                    type="salesHistory" 
                    onDataParsed={handleSalesHistoryParsed} 
                  />
                  
                  {salesHistory.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">
                          {salesHistory.length} Sales Records Ready to Import
                        </h3>
                        <Button 
                          onClick={submitSalesHistory}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
                              Importing...
                            </>
                          ) : (
                            'Import Sales History'
                          )}
                        </Button>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                <th className="px-4 py-3 text-left font-medium">Product</th>
                                <th className="px-4 py-3 text-left font-medium">Quantity</th>
                                <th className="px-4 py-3 text-left font-medium">Unit Price</th>
                                <th className="px-4 py-3 text-left font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {salesHistory.slice(0, 5).map((item, index) => (
                                <tr key={index} className="hover:bg-muted/50">
                                  <td className="px-4 py-2">{item.date}</td>
                                  <td className="px-4 py-2">{item.productName}</td>
                                  <td className="px-4 py-2">{item.quantity}</td>
                                  <td className="px-4 py-2">${item.unitPrice.toFixed(2)}</td>
                                  <td className="px-4 py-2">${item.totalAmount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {salesHistory.length > 5 && (
                          <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/20">
                            Showing 5 of {salesHistory.length} records
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="inventory" className="space-y-6">
                <div className="space-y-4">
                  <CsvUpload 
                    type="inventoryItems" 
                    onDataParsed={handleInventoryItemsParsed} 
                  />
                  
                  {inventoryItems.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">
                          {inventoryItems.length} Inventory Items Ready to Import
                        </h3>
                        <Button 
                          onClick={submitInventoryItems}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
                              Importing...
                            </>
                          ) : (
                            'Import Inventory Items'
                          )}
                        </Button>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium">SKU</th>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Category</th>
                                <th className="px-4 py-3 text-left font-medium">Stock</th>
                                <th className="px-4 py-3 text-left font-medium">Unit Cost</th>
                                <th className="px-4 py-3 text-left font-medium">Selling Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {inventoryItems.slice(0, 5).map((item, index) => (
                                <tr key={index} className="hover:bg-muted/50">
                                  <td className="px-4 py-2">{item.sku}</td>
                                  <td className="px-4 py-2">{item.name}</td>
                                  <td className="px-4 py-2">{item.category || 'Uncategorized'}</td>
                                  <td className="px-4 py-2">{item.stockQuantity ?? 'N/A'}</td>
                                  <td className="px-4 py-2">{item.unitCost ? `$${item.unitCost.toFixed(2)}` : 'N/A'}</td>
                                  <td className="px-4 py-2">{item.sellingPrice ? `$${item.sellingPrice.toFixed(2)}` : 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {inventoryItems.length > 5 && (
                          <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/20">
                            Showing 5 of {inventoryItems.length} records
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-start">
          <Button 
            variant="outline" 
            asChild
            className="flex items-center gap-2"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 