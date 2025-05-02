"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Product } from "@prisma/client";
import { ProductSelect } from "./components/ProductSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2, PlusCircle, History } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

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

export default function SalesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductData, setSelectedProductData] = useState<Product | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "STRIPE">("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("new-sale");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editFormData, setEditFormData] = useState({
    paymentMethod: "CASH" as "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "STRIPE",
    paymentStatus: "COMPLETED" as "PENDING" | "COMPLETED" | "CANCELLED",
    totalAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchSales()]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetch(`/api/sales?page=${currentPage}&limit=10`);
      if (!response.ok) {
        throw new Error("Failed to fetch sales history");
      }
      const data = await response.json();
      setSalesHistory(data.sales);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching sales history:", error);
      toast.error("Failed to load sales history");
    }
  };

  const totalAmount = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleProductSelect = (value: string, product: Product | undefined) => {
    setSelectedProduct(value);
    setSelectedProductData(product);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !selectedProductData || quantity < 1) {
      toast.error("Please select a product and quantity");
      return;
    }

    // Check if product has a valid price
    if (!selectedProductData.sellingPrice || selectedProductData.sellingPrice <= 0) {
      toast.error("Cannot add product with zero or missing price");
      return;
    }

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
        price: selectedProductData.sellingPrice,
        product: selectedProductData
      }]);
    }

    setQuantity(1);
    setSelectedProduct("");
    setSelectedProductData(undefined);
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
      fetchSales();
      setActiveTab("sales-history");
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Failed to complete sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setEditFormData({
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus as any,
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
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-screen-xl mx-auto px-6 mb-6">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto px-6 mb-6">
      <PageHeader 
        title="Sales Management"
      >
        <Button 
          className={`flex items-center gap-2 ${activeTab === "new-sale" ? "bg-primary" : "bg-muted"}`}
          onClick={() => setActiveTab("new-sale")}
          variant={activeTab === "new-sale" ? "default" : "outline"}
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Sale</span>
        </Button>
        <Button 
          className={`flex items-center gap-2 ${activeTab === "sales-history" ? "bg-primary" : "bg-muted"}`}
          onClick={() => setActiveTab("sales-history")}
          variant={activeTab === "sales-history" ? "default" : "outline"}
        >
          <History className="h-4 w-4" />
          <span>Sales History</span>
        </Button>
      </PageHeader>

      {activeTab === "new-sale" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="product">Product</Label>
                    <ProductSelect
                      products={products}
                      value={selectedProduct}
                      onSelect={handleProductSelect}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      min={1}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button onClick={handleAddItem} className="whitespace-nowrap" type="button">
                    Add Item
                  </Button>
                </div>

                {saleItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Sale Items</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {saleItems.map((item) => (
                            <TableRow key={item.productId}>
                              <TableCell>{item.product.name}</TableCell>
                              <TableCell>${item.price.toFixed(2)}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.productId)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">
                              Total
                            </TableCell>
                            <TableCell className="font-bold">
                              ${totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value: any) => setPaymentMethod(value)}
                    >
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

                  <Button
                    onClick={handleSubmit}
                    disabled={saleItems.length === 0 || isSubmitting}
                    className="w-full md:w-auto md:float-right"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                      </>
                    ) : (
                      "Complete Sale"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No sales found
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesHistory.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>{sale.items.length} items</TableCell>
                          <TableCell>
                            {sale.paymentMethod.replace('_', ' ')}
                          </TableCell>
                          <TableCell>{sale.paymentStatus}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSale(sale)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSale(sale.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 bg-muted rounded-md">
                    {currentPage} of {totalPages}
                  </span>
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
            </CardContent>
          </Card>
        </div>
      )}

      {isEditDialogOpen && selectedSale && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editPaymentMethod">Payment Method</Label>
                <Select
                  value={editFormData.paymentMethod}
                  onValueChange={(value: any) =>
                    setEditFormData({ ...editFormData, paymentMethod: value })
                  }
                >
                  <SelectTrigger id="editPaymentMethod">
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

              <div className="space-y-2">
                <Label htmlFor="editPaymentStatus">Payment Status</Label>
                <Select
                  value={editFormData.paymentStatus}
                  onValueChange={(value: any) =>
                    setEditFormData({ ...editFormData, paymentStatus: value })
                  }
                >
                  <SelectTrigger id="editPaymentStatus">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTotalAmount">Total Amount</Label>
                <Input
                  id="editTotalAmount"
                  type="number"
                  value={editFormData.totalAmount}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      totalAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <Button onClick={handleUpdateSale} className="w-full">
                Update Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 