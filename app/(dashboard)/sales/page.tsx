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

interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export default function SalesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductData, setSelectedProductData] = useState<Product | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "STRIPE">("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to record sale");
      }

      const data = await response.json();
      toast.success("Sale recorded successfully");
      setSaleItems([]);
      router.refresh();
    } catch (error) {
      console.error("Error recording sale:", error);
      toast.error(error instanceof Error ? error.message : "Failed to record sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <p>Loading products...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <ProductSelect 
                  value={selectedProduct} 
                  onValueChange={handleProductSelect} 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Number(e.target.value))}
                />
              </div>

              <Button 
                onClick={handleAddItem} 
                className="w-full"
                disabled={!selectedProduct || !selectedProductData || quantity < 1}
              >
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {saleItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x ${item.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.productId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={(value: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "STRIPE") => setPaymentMethod(value)}
                >
                  <SelectTrigger>
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
                className="w-full"
                disabled={isSubmitting || saleItems.length === 0}
              >
                {isSubmitting ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 