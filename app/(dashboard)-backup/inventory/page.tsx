"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, PlusCircle, History, ArrowUpDown, Search, Pencil, Trash2, Package } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ProductForm, { Product } from "@/components/forms/ProductForm";
import { Label } from "@/components/ui/label";
import InventoryCategoryChart from "@/components/features/InventoryCategoryChart";
import SalesCategoryChart from "@/components/features/SalesCategoryChart";

// Define InventoryChange type based on schema
interface InventoryChange {
  id: string;
  type: string;
  quantity: number;
  productId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryChanges, setInventoryChanges] = useState<InventoryChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("inventory");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustmentProduct, setAdjustmentProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"INCREASE" | "DECREASE" | "ADJUSTMENT">("INCREASE");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchInventoryChanges()]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage]);

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

  const fetchInventoryChanges = async () => {
    try {
      const response = await fetch(`/api/inventory/history?page=${currentPage}&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch inventory changes");
      const data = await response.json();
      setInventoryChanges(data.changes || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching inventory changes:", error);
      toast.error("Failed to load inventory history");
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("Failed to create product");
        }
      }
      
      toast.success("Product added successfully");
      setIsAddDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to create product");
      return false;
    }
    return true;
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (product: Product) => {
    if (!selectedProduct) return false;

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("Failed to update product");
        }
      }
      
      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      fetchProducts();
      return true;
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(error.message || "Failed to update product");
      return false;
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");
      
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleStockAdjustment = async (productId: string, quantity: number, type: string) => {
    try {
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, type }),
      });

      if (!response.ok) throw new Error("Failed to adjust inventory");
      
      toast.success("Inventory adjusted successfully");
      fetchProducts();
      fetchInventoryChanges();
    } catch (error) {
      console.error("Error adjusting inventory:", error);
      toast.error("Failed to adjust inventory");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort the products based on current sort settings
  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField as keyof Product];
    let bValue = b[sortField as keyof Product];
    
    // Handle undefined and null values
    if (aValue === undefined || aValue === null) aValue = '';
    if (bValue === undefined || bValue === null) bValue = '';
    
    // Convert to strings for comparison
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === "asc") {
      return aStr > bStr ? 1 : -1;
    } else {
      return aStr < bStr ? 1 : -1;
    }
  });

  // Filter products based on search term
  const filteredProducts = sortedProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustStock = (product: Product) => {
    setAdjustmentProduct(product);
    setAdjustmentType("INCREASE");
    setAdjustmentQuantity(1);
    setIsAdjustDialogOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustmentProduct || adjustmentQuantity <= 0) return;
    
    try {
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustmentProduct.id,
          quantity: adjustmentQuantity,
          type: adjustmentType
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to adjust inventory");
      }
      
      toast.success(`Inventory ${adjustmentType.toLowerCase()}d successfully`);
      setIsAdjustDialogOpen(false);
      fetchProducts();
      fetchInventoryChanges();
    } catch (error: any) {
      console.error("Error adjusting inventory:", error);
      toast.error(error.message || "Failed to adjust inventory");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-screen-xl mx-auto px-6 mb-6">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6 space-y-6">
      <PageHeader 
        title="Inventory Management" 
        description="Manage your product inventory and view stock adjustments history"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <InventoryCategoryChart />
        <SalesCategoryChart />
      </div>
      
      <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          {activeTab === "inventory" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </div>
          )}
        </div>

        {activeTab === "inventory" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Products</CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>Add Product</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <ProductForm 
                      onSave={handleAddProduct}
                      buttonText="Create Product"
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead onClick={() => handleSort("sku")} className="cursor-pointer">
                          <div className="flex items-center">
                            SKU 
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                          <div className="flex items-center">
                            Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("category")} className="cursor-pointer">
                          <div className="flex items-center">
                            Category
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("sellingPrice")} className="cursor-pointer">
                          <div className="flex items-center">
                            Price
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("stockQuantity")} className="cursor-pointer">
                          <div className="flex items-center">
                            Stock
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No products found. Add your first product to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono">{product.sku}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell>${typeof product.sellingPrice === 'string' ? parseFloat(product.sellingPrice).toFixed(2) : product.sellingPrice?.toFixed(2) || "0.00"}</TableCell>
                            <TableCell>{product.stockQuantity || 0}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAdjustStock(product)}
                                className="mr-1"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="mr-1"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id!)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryChanges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No inventory changes recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        inventoryChanges.map((change) => (
                          <TableRow key={change.id}>
                            <TableCell>{format(new Date(change.createdAt), "MMM dd, yyyy h:mm a")}</TableCell>
                            <TableCell>{change.product?.name || "Unknown Product"}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                change.type === 'INCREASE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                change.type === 'DECREASE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {change.type}
                              </span>
                            </TableCell>
                            <TableCell>{change.quantity}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3">
                      Page {currentPage} of {totalPages}
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
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              initialData={selectedProduct}
              onSave={handleUpdateProduct}
              buttonText="Update Product"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <div className="font-medium">{adjustmentProduct?.name}</div>
              <div className="text-sm text-muted-foreground">
                Current Stock: {adjustmentProduct?.stockQuantity || 0}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment-type">Adjustment Type</Label>
              <Select 
                value={adjustmentType} 
                onValueChange={(value) => setAdjustmentType(value as any)}
              >
                <SelectTrigger id="adjustment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCREASE">Increase (Add)</SelectItem>
                  <SelectItem value="DECREASE">Decrease (Remove)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Set to Specific Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment-quantity">Quantity</Label>
              <Input
                id="adjustment-quantity"
                type="number"
                min={1}
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdjustment}>
              {adjustmentType === "INCREASE" 
                ? "Add Stock" 
                : adjustmentType === "DECREASE" 
                  ? "Remove Stock" 
                  : "Update Stock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 