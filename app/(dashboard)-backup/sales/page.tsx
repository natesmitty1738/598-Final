"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Product } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2, PlusCircle, History } from "lucide-react";
import DynamicDashboard, { ModuleConfig } from "@/components/features/DynamicDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import LineChart from "@/components/features/LineChart";
import BarChart from "@/components/features/BarChart";

interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface SaleItemDB {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface Sale {
  id: string;
  totalAmount: number;
  paymentMethod: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "STRIPE";
  paymentStatus: string;
  createdAt: string;
  userId: string;
  items: SaleItemDB[];
}

// modules for the sales dashboard

// New Sale Entry Module
function NewSaleModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
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
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-auto">
        <div className="mb-4">
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
      </div>
      
      <div className="border-t pt-4 mt-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod" className="w-[180px]">
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
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || saleItems.length === 0}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Complete Sale"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sales History Module
function SalesHistoryModule() {
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editFormData, setEditFormData] = useState({
    paymentMethod: "CASH",
    paymentStatus: "COMPLETED",
    totalAmount: 0,
  });
  
  useEffect(() => {
    fetchSales();
  }, [currentPage]);
  
  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const baseUrl = "/api/sales";
      let url = `${baseUrl}?page=${currentPage}&limit=10`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch sales");
      const data = await response.json();
      
      setSalesHistory(data.sales);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setEditFormData({
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      totalAmount: sale.totalAmount,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSale = async () => {
    if (!selectedSale) return;

    try {
      const response = await fetch(`/api/sales/${selectedSale.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to update sale");
      }

      toast.success("Sale updated successfully");
      setIsEditDialogOpen(false);
      fetchSales();
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Failed to update sale");
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sale");
      }

      toast.success("Sale deleted successfully");
      fetchSales();
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Failed to delete sale");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
    setCurrentPage(newPage);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
          <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {salesHistory.length > 0 ? (
                  salesHistory.map(sale => (
                        <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>{sale.items?.length || 0} items</TableCell>
                      <TableCell>{sale.paymentMethod.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right">${sale.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                        <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                            size="icon"
                                onClick={() => handleEditSale(sale)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                            size="icon"
                                onClick={() => handleDeleteSale(sale.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No sales found
                    </TableCell>
                  </TableRow>
                    )}
                  </TableBody>
                </Table>
          </div>
        )}
              </div>

      {/* Pagination controls */}
              {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
        </div>
      )}

      {/* Edit sale dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Sale</DialogTitle>
            </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPaymentMethod" className="text-right">
                Payment Method
              </Label>
                <Select
                  value={editFormData.paymentMethod}
                onValueChange={(value) => setEditFormData({...editFormData, paymentMethod: value as any})}
                >
                <SelectTrigger id="editPaymentMethod" className="col-span-3">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPaymentStatus" className="text-right">
                Status
              </Label>
                <Select
                  value={editFormData.paymentStatus}
                onValueChange={(value) => setEditFormData({...editFormData, paymentStatus: value})}
                >
                <SelectTrigger id="editPaymentStatus" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTotalAmount" className="text-right">
                Total Amount
              </Label>
                <Input
                  id="editTotalAmount"
                  type="number"
                step="0.01"
                  value={editFormData.totalAmount}
                onChange={(e) => setEditFormData({...editFormData, totalAmount: parseFloat(e.target.value) || 0})}
                className="col-span-3"
                />
              </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSale}>
              Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

// Price Suggestions Module
function PriceSuggestionsModule() {
  // mock data for demonstration
  const mockData = [
    { product: "Product A", currentPrice: 29.99, suggestedPrice: 32.99, change: "+10.0%" },
    { product: "Product B", currentPrice: 49.99, suggestedPrice: 45.99, change: "-8.0%" },
    { product: "Product C", currentPrice: 19.99, suggestedPrice: 24.99, change: "+25.0%" },
    { product: "Product D", currentPrice: 39.99, suggestedPrice: 42.99, change: "+7.5%" },
    { product: "Product E", currentPrice: 59.99, suggestedPrice: 54.99, change: "-8.3%" }
  ];
  
  return (
    <div className="h-full overflow-auto">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Suggested Price</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((item) => (
              <TableRow key={item.product}>
                <TableCell>{item.product}</TableCell>
                <TableCell className="text-right">${item.currentPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">${item.suggestedPrice.toFixed(2)}</TableCell>
                <TableCell className={`text-right ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Projected Earnings Module
function ProjectedEarningsModule() {
  // mock data for demonstration
  const mockData = [
    { month: "Jan", earnings: 45000 },
    { month: "Feb", earnings: 48500 },
    { month: "Mar", earnings: 52000 },
    { month: "Apr", earnings: 56000 },
    { month: "May", earnings: 60500 },
    { month: "Jun", earnings: 65000 },
    { month: "Jul", earnings: 62000 },
    { month: "Aug", earnings: 67000 },
    { month: "Sep", earnings: 72000 },
    { month: "Oct", earnings: 78000 },
    { month: "Nov", earnings: 85000 },
    { month: "Dec", earnings: 95000 }
  ];
  
  return (
    <div className="h-full">
      <LineChart
        data={mockData}
        xAxisKey="month"
        dataKeys={["earnings"]}
        dataLabels={["Projected Earnings"]}
        yAxisFormatters={[(value) => `$${value.toLocaleString()}`]}
        height={330}
      />
    </div>
  );
}

// Peak Selling Hours Module
function PeakSellingHoursModule() {
  // mock data for demonstration
  const mockData = [
    { hour: "9am", sales: 24 },
    { hour: "10am", sales: 36 },
    { hour: "11am", sales: 45 },
    { hour: "12pm", sales: 68 },
    { hour: "1pm", sales: 72 },
    { hour: "2pm", sales: 56 },
    { hour: "3pm", sales: 48 },
    { hour: "4pm", sales: 52 },
    { hour: "5pm", sales: 64 },
    { hour: "6pm", sales: 58 },
    { hour: "7pm", sales: 43 },
    { hour: "8pm", sales: 32 }
  ];
  
  return (
    <div className="h-full">
      <BarChart
        data={mockData}
        categoryKey="hour"
        valueKey="sales"
        valueLabel="Sales"
        height={330}
      />
    </div>
  );
}

// main sales dashboard page
export default function SalesPage() {
  // define all available modules
  const modules: ModuleConfig[] = [
    {
      id: 'new-sale',
      title: 'New Sale',
      description: 'Create a new sale transaction',
      component: <NewSaleModule />,
      defaultSize: 'full',
      minimizable: true,
      removable: false
    },
    {
      id: 'sales-history',
      title: 'Sales History',
      description: 'View and manage past sales',
      component: <SalesHistoryModule />,
      defaultSize: 'full',
      minimizable: true,
      removable: true
    },
    {
      id: 'price-suggestions',
      title: 'Price Suggestions',
      description: 'AI-driven price optimization suggestions',
      component: <PriceSuggestionsModule />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'projected-earnings',
      title: 'Projected Earnings',
      description: 'Forecasted earnings for upcoming periods',
      component: <ProjectedEarningsModule />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    },
    {
      id: 'peak-selling-hours',
      title: 'Peak Selling Hours',
      description: 'Sales volume by time of day',
      component: <PeakSellingHoursModule />,
      defaultSize: 'medium',
      minimizable: true,
      removable: true
    }
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="p-8">Loading sales dashboard...</div>}>
        <DynamicDashboard
          title="Sales Dashboard"
          modules={modules}
          storageKey="sales-dashboard"
          columns={4}
          availableSizes={['medium', 'large', 'full']}
        />
      </Suspense>
    </div>
  );
} 