'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  FileSpreadsheet, 
  Package, 
  Layers, 
  ShoppingBag,
  FileUp,
  History,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CsvUpload from '@/components/shared/CsvUpload';
import ProductManagementForm from '@/components/shared/ProductManagementForm';
import ContentWrapper from '@/components/layout/ContentWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import external components and types
import ProductsOverview from './ProductsOverview';
import SalesOverview from './SalesOverview';
import { ProductFilter } from '@/app/types/product';
import { SalesFilter } from '@/app/types/sale';

// Define types for dashboard data
interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockQuantity: number;
}

interface HighMarginProduct {
  id: string;
  name: string;
  margin: number;
  price: number;
}

interface ProjectedEarning {
  month: string;
  actual: number | null;
  projected: number;
}

interface PeakSellingHour {
  hour: string;
  sales: number;
}

interface PriceSuggestion {
  id: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  potential: number;
}

interface OptimalItem {
  id: string;
  name: string;
  score: number;
  reason: string;
}

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

const getTotalInventoryValue = (products: any[]) => {
  return products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.cost || p.unitCost || 0)), 0);
};

const getLowStockCount = (products: any[]) => {
  return products.filter((p) => (p.stockQuantity || 0) < 5).length;
};

const getLowStockProducts = (products: any[], limit = 5) => {
  return products
    .filter((p) => (p.stockQuantity || 0) < 5)
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stockQuantity: p.stockQuantity || 0,
    }));
};

const getHighMarginProducts = (products: any[], limit = 5) => {
  return products
    .filter((p) => p.cost || p.unitCost)
    .sort((a, b) => {
      const aPrice = a.price || a.sellingPrice || 0;
      const bPrice = b.price || b.sellingPrice || 0;
      const aCost = a.cost || a.unitCost || 0;
      const bCost = b.cost || b.unitCost || 0;
      
      const aMargin = aCost && aPrice ? ((aPrice - aCost) / aPrice) : 0;
      const bMargin = bCost && bPrice ? ((bPrice - bCost) / bPrice) : 0;
      
      return bMargin - aMargin;
    })
    .slice(0, limit)
    .map((p) => {
      const price = p.price || p.sellingPrice || 0;
      const cost = p.cost || p.unitCost || 0;
      const margin = cost && price ? ((price - cost) / price) * 100 : 0;
      
      return {
        id: p.id,
        name: p.name,
        price,
        margin,
      };
    });
};

// Create a content loading component
function ContentLoadingSpinner() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading inventory data...</p>
    </div>
  );
}

// Creating a combined dashboard data interface
interface DashboardData {
  inventoryMetrics: {
    totalProducts: number;
    lowStockCount: number;
    inventoryValue: number;
    averageUnitCost: number;
  };
  salesMetrics: SalesMetrics;
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  highMarginProducts: HighMarginProduct[];
  possibleNetIncome: number;
  projectedEarnings: ProjectedEarning[];
  peakSellingHours: PeakSellingHour[];
  priceSuggestions: PriceSuggestion[];
  optimalItems: OptimalItem[];
}

// Products import, add, logs component implementations
function ProductsImport() {
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInventoryItemsParsed = (data: any[]) => {
    setInventoryItems(data);
  };
  
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
      
      toast.success(`Successfully imported ${result.count || inventoryItems.length} inventory items`);
      setInventoryItems([]);
    } catch (error) {
      console.error('Error importing inventory items:', error);
      toast.error('Failed to import inventory items. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Import Products Data</h2>
        <p className="text-muted-foreground mb-6">Upload your product inventory from a CSV file</p>
        
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.slice(0, 5).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell className="text-right">${item.sellingPrice?.toFixed(2) || '-'}</TableCell>
                        <TableCell className="text-right">{item.stockQuantity || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {inventoryItems.length > 5 && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Showing 5 of {inventoryItems.length} records
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsAdd() {
  const [isSaving, setIsSaving] = useState(false);
  
  const handleAddProducts = async (products: any[]) => {
    setIsSaving(true);
    try {
      // Call API to add products
      const responses = await Promise.all(
        products.map(product => 
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
          })
        )
      );
      
      const failedResponses = responses.filter(response => !response.ok);
      
      if (failedResponses.length > 0) {
        throw new Error(`Failed to add ${failedResponses.length} products`);
      }
      
      toast.success(`Successfully added ${products.length} products`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error('Failed to add some products. Please try again.');
      return Promise.reject(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add Products Manually</h2>
        <p className="text-muted-foreground mb-6">Add new products to your inventory</p>
        
        <ProductManagementForm
          onSubmit={handleAddProducts}
          maxProducts={10}
        />
      </div>
    </div>
  );
}

function ProductsLogs() {
  const [inventoryChanges, setInventoryChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchInventoryChanges();
  }, [currentPage]);
  
  const fetchInventoryChanges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/history?page=${currentPage}&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch inventory changes");
      const data = await response.json();
      setInventoryChanges(data.changes || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching inventory changes:", error);
      toast.error("Failed to load inventory history");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Inventory History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchInventoryChanges()}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
              Loading...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <span className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent rounded-full" />
                    Loading history...
                  </div>
                </TableCell>
              </TableRow>
            ) : inventoryChanges.length > 0 ? (
              inventoryChanges.map((change) => (
                <TableRow key={change.id}>
                  <TableCell>{new Date(change.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{change.product?.name || 'Unknown product'}</TableCell>
                  <TableCell>
                    <span className={
                      change.type === 'INCREASE' ? 'text-green-600' : 
                      change.type === 'DECREASE' ? 'text-red-600' : 
                      'text-blue-600'
                    }>
                      {change.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{change.quantity}</TableCell>
                  <TableCell>{change.userId}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No inventory changes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {inventoryChanges.length > 0 && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Sales import, add, logs component implementations
function SalesImport() {
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSalesHistoryParsed = (data: any[]) => {
    setSalesHistory(data);
  };
  
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
      
      toast.success(`Successfully imported ${result.count || salesHistory.length} sales records`);
      setSalesHistory([]);
    } catch (error) {
      console.error('Error importing sales history:', error);
      toast.error('Failed to import sales history. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Import Sales Data</h2>
        <p className="text-muted-foreground mb-6">Upload your sales history from a CSV file</p>
        
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesHistory.slice(0, 5).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {salesHistory.length > 5 && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Showing 5 of {salesHistory.length} records
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SalesAdd() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    fetchProducts();
    
    // calculate total whenever sale items change
    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalAmount(total);
  }, [saleItems]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const handleProductSelect = (value: string) => {
    setSelectedProduct(value);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !products.find(p => p.id === selectedProduct)) {
      toast.error("Please select a valid product");
      return;
    }

    const selectedProductObj = products.find(p => p.id === selectedProduct);
    if (!selectedProductObj) return;

    const existingItem = saleItems.find(item => item.productId === selectedProduct);

    if (existingItem) {
      setSaleItems(saleItems.map(item => 
        item.productId === selectedProduct 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setSaleItems([...saleItems, {
        productId: selectedProduct,
        quantity,
        price: selectedProductObj.sellingPrice || 0,
        product: selectedProductObj
      }]);
    }

    setQuantity(1);
    setSelectedProduct("");
  };

  const handleRemoveItem = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.productId !== productId));
  };

  const handleSubmit = async () => {
    if (saleItems.length === 0) {
      toast.error("Please add at least one item to the sale");
      return;
    }

    if (totalAmount <= 0) {
      toast.error("Total sale amount must be greater than zero");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: saleItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          paymentMethod,
          totalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create sale");
      }

      toast.success("Sale completed successfully");
      setSaleItems([]);
      setPaymentMethod("CASH");
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Failed to complete sale");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add New Sale</h2>
        
        <div className="mb-6">
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-5">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProduct} onValueChange={handleProductSelect}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (${product.sellingPrice?.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="col-span-4 flex items-end">
              <Button 
                onClick={handleAddItem} 
                className="w-full"
                disabled={!selectedProduct}
              >
                Add Item
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleItems.length > 0 ? (
                  saleItems.map(item => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No items added to sale
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-lg font-semibold">
              Total: ${totalAmount.toFixed(2)}
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={saleItems.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                'Complete Sale'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesLogs() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchSales();
  }, [currentPage]);
  
  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sales?page=${currentPage}&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch sales");
      const data = await response.json();
      setSales(data.sales || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sales History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchSales()}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
              Loading...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <span className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent rounded-full" />
                    Loading sales...
                  </div>
                </TableCell>
              </TableRow>
            ) : sales.length > 0 ? (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{sale.items?.length || 0} items</TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sale.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
                      sale.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {sale.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">${sale.totalAmount?.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No sales found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {sales.length > 0 && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get tab from URL or default
  const mainTabParam = searchParams.get('tab') || 'products';
  const [mainTab, setMainTab] = useState(mainTabParam);
  
  // Sub-tabs for products and sales
  const productTabParam = searchParams.get('productTab') || 'overview';
  const salesTabParam = searchParams.get('salesTab') || 'overview';
  const [productTab, setProductTab] = useState(productTabParam);
  const [salesTab, setSalesTab] = useState(salesTabParam);
  
  // Filters state
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // Consolidated dashboard data 
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    inventoryMetrics: {
      totalProducts: 0,
      lowStockCount: 0,
      inventoryValue: 0,
      averageUnitCost: 0
    },
    salesMetrics: {
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      conversionRate: 0
    },
    topProducts: [],
    lowStockProducts: [],
    highMarginProducts: [],
    possibleNetIncome: 0,
    projectedEarnings: [],
    peakSellingHours: [],
    priceSuggestions: [],
    optimalItems: []
  });
  
  // Navigation items
  const navItems = [
    { key: 'products', label: 'Products', icon: Package },
    { key: 'sales', label: 'Sales', icon: ShoppingBag }
  ];
  
  // Define filter groups for products
  const productFilterGroups = [
    {
      label: 'Category',
      type: 'select' as const,
      key: 'category',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'home', label: 'Home & Kitchen' }
      ]
    },
    {
      label: 'Status',
      type: 'select' as const,
      key: 'status',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'in-stock', label: 'In Stock' },
        { value: 'low-stock', label: 'Low Stock' },
        { value: 'out-of-stock', label: 'Out of Stock' }
      ]
    },
    {
      label: 'Search',
      type: 'input' as const,
      key: 'search',
      placeholder: 'Search products...'
    }
  ];
  
  // Define filter groups for sales
  const salesFilterGroups = [
    {
      label: 'Period',
      type: 'select' as const,
      key: 'period',
      defaultValue: 'month',
      options: [
        { value: 'week', label: 'Last Week' },
        { value: 'month', label: 'Last Month' },
        { value: 'quarter', label: 'Last Quarter' },
        { value: 'year', label: 'Last Year' }
      ]
    },
    {
      label: 'Customer Type',
      type: 'select' as const,
      key: 'customerType',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Customers' },
        { value: 'retail', label: 'Retail' },
        { value: 'wholesale', label: 'Wholesale' },
        { value: 'online', label: 'Online' }
      ]
    },
    {
      label: 'Search',
      type: 'input' as const,
      key: 'search',
      placeholder: 'Search sales...'
    }
  ];
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle main tab change
  const handleMainTabChange = (key: string) => {
    setMainTab(key);
    
    // Update URL without refresh
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    
    router.push(`/inventory?${params.toString()}`, { scroll: false });
  };
  
  // Handle sub tab change
  const handleSubTabChange = (subTab: string) => {
    if (mainTab === 'products') {
      setProductTab(subTab);
      
      // Update URL without refresh
      const params = new URLSearchParams(searchParams);
      params.set('productTab', subTab);
      
      router.push(`/inventory?${params.toString()}`, { scroll: false });
    } else if (mainTab === 'sales') {
      setSalesTab(subTab);
      
      // Update URL without refresh
      const params = new URLSearchParams(searchParams);
      params.set('salesTab', subTab);
      
      router.push(`/inventory?${params.toString()}`, { scroll: false });
    }
  };
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          
          // Fetch analytics data
          const analyticsResponse = await fetch('/api/analytics?timeRange=30');
          const analyticsData = await analyticsResponse.json();
          
          // Fetch products data
          const productsResponse = await fetch('/api/products');
          const productsData = await productsResponse.json();
          
          // Calculate inventory metrics
          const products = productsData.products || [];
          const totalInventoryValue = getTotalInventoryValue(products);
          const totalProductCount = products.length;
          
          // Update dashboard data
          setDashboardData({
            inventoryMetrics: {
              totalProducts: totalProductCount,
              lowStockCount: getLowStockCount(products),
              inventoryValue: totalInventoryValue,
              averageUnitCost: totalProductCount ? totalInventoryValue / totalProductCount : 0,
            },
            salesMetrics: {
              totalSales: analyticsData.totalSales || 0,
              totalRevenue: analyticsData.totalRevenue || 0,
              averageOrderValue: analyticsData.totalSales ? analyticsData.totalRevenue / analyticsData.totalSales : 0,
              conversionRate: analyticsData.conversionRate || 0,
            },
            topProducts: analyticsData.topSellingProducts || [],
            lowStockProducts: getLowStockProducts(products),
            highMarginProducts: getHighMarginProducts(products),
            possibleNetIncome: analyticsData.totalRevenue ? analyticsData.totalRevenue * 0.15 : 0,
            projectedEarnings: analyticsData.projectedEarnings || [],
            peakSellingHours: analyticsData.peakSellingHours || [],
            priceSuggestions: analyticsData.priceSuggestions || [],
            optimalItems: analyticsData.optimalItems || []
          });
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          toast.error('Failed to load dashboard data');
          setIsLoading(false);
        }
      }
    };
    
    if (status !== 'loading') {
      fetchDashboardData();
    }
  }, [status]);
  
  // Render functions for each tab
  const renderProductsDashboard = () => {
    return (
      <ProductsOverview 
        inventoryMetrics={dashboardData.inventoryMetrics}
        activeFilters={filters as ProductFilter}
      />
    );
  };
  
  const renderSalesDashboard = () => {
    return (
      <SalesOverview 
        salesMetrics={dashboardData.salesMetrics}
        activeFilters={filters as SalesFilter}
          />
    );
  };
  
  // Header content with action buttons
  const headerContent = (
    <>
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5"
        onClick={() => {
          // Set tab based on current main tab
          if (mainTab === 'products') {
            handleMainTabChange('products');
            handleSubTabChange('add');
          } else {
            handleMainTabChange('sales');
            handleSubTabChange('add');
          }
        }}
      >
        <Package className="h-4 w-4" />
        <span>{mainTab === 'sales' ? 'Sales' : 'Products'} Manager</span>
      </Button>
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5"
        onClick={() => handleSubTabChange('import')}
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>Import</span>
      </Button>
    </>
  );
  
  // Get sub tab for the active section
  const getSubNavContent = () => {
    const activeTab = mainTab === 'products' ? productTab : salesTab;
    
    return (
          <div className="mb-6">
        <Tabs 
          value={activeTab}
          onValueChange={handleSubTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              <span>Logs</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-1.5">
              <FileUp className="h-3.5 w-3.5" />
              <span>Import</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
  };
  
  // Render the appropriate content based on tabs
  const renderContent = () => {
    if (mainTab === 'products') {
      if (productTab === 'overview') return renderProductsDashboard();
      if (productTab === 'import') return <ProductsImport />;
      if (productTab === 'add') return <ProductsAdd />;
      if (productTab === 'logs') return <ProductsLogs />;
    } else if (mainTab === 'sales') {
      if (salesTab === 'overview') return renderSalesDashboard();
      if (salesTab === 'import') return <SalesImport />;
      if (salesTab === 'add') return <SalesAdd />;
      if (salesTab === 'logs') return <SalesLogs />;
    }
    
    // Default fallback
    return renderProductsDashboard();
  };
  
  // Determine the current filter groups based on active tab
  const currentFilterGroups = mainTab === 'products' ? productFilterGroups : salesFilterGroups;
  
  // Show loading spinner if authentication is in progress
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Simple non-sticky header */}
      <div className="border-b bg-background p-4.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Inventory</h1>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              {headerContent}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 bg-background md:sticky md:top-[4.5rem] md:self-start md:max-h-[calc(100vh-4.5rem)] md:overflow-y-auto">
          <div className="p-4.5">
            {/* Navigation items */}
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Categories</h2>
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    mainTab === item.key
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                  onClick={() => handleMainTabChange(item.key)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Filter controls */}
              <div className="mt-6 space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">Filters</h2>

              {currentFilterGroups.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <label className="text-xs text-muted-foreground">{group.label}</label>
                    {group.type === 'select' && group.options ? (
                      <Select 
                        defaultValue={group.defaultValue} 
                        onValueChange={(value) => handleFilterChange(group.key, value)}
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
                        onChange={(e) => handleFilterChange(group.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => toast.success("Data refreshed")}>
                  Refresh Data
                </Button>
              </div>
          </div>
        </div>
        
        {/* Border element that spans full height */}
        <div className="hidden md:block absolute top-0 bottom-0 left-64 w-[1px] bg-border"></div>

        {/* Main content */}
        <div className="flex-1 p-4.5 md:p-6 overflow-auto">
          <ContentWrapper>
            {getSubNavContent()}
            {renderContent()}
          </ContentWrapper>
        </div>
      </div>
    </div>
  );
} 