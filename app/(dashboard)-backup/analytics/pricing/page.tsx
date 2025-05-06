'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowUp, 
  ArrowDown, 
  Info, 
  Check, 
  AlertTriangle,
  DollarSign,
  BarChart4,
  TrendingUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Mock pricing suggestion data structure
interface PricingSuggestion {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  priceElasticity: number;
  expectedSalesChange: number;
  expectedRevenueChange: number;
  confidence: 'high' | 'medium' | 'low';
  historyDataPoints: number;
}

// Mock data - would be fetched from an API in production
const mockPricingSuggestions: PricingSuggestion[] = [
  {
    productId: '1',
    productName: 'Black T-Shirt',
    currentPrice: 24.99,
    suggestedPrice: 29.99,
    priceElasticity: -1.2,
    expectedSalesChange: -8.5,
    expectedRevenueChange: 15.2,
    confidence: 'high',
    historyDataPoints: 12
  },
  {
    productId: '2',
    productName: 'Logo Hoodie',
    currentPrice: 49.99,
    suggestedPrice: 44.99,
    priceElasticity: -2.1,
    expectedSalesChange: 18.3,
    expectedRevenueChange: 8.5,
    confidence: 'medium',
    historyDataPoints: 8
  },
  {
    productId: '3',
    productName: 'Snapback Cap',
    currentPrice: 19.99,
    suggestedPrice: 22.99,
    priceElasticity: -0.9,
    expectedSalesChange: -4.2,
    expectedRevenueChange: 5.7,
    confidence: 'medium',
    historyDataPoints: 7
  },
  {
    productId: '4',
    productName: 'Denim Jacket',
    currentPrice: 89.99,
    suggestedPrice: 79.99,
    priceElasticity: -1.8,
    expectedSalesChange: 16.2,
    expectedRevenueChange: 4.8,
    confidence: 'low',
    historyDataPoints: 4
  },
  {
    productId: '5',
    productName: 'Canvas Tote Bag',
    currentPrice: 14.99,
    suggestedPrice: 17.99,
    priceElasticity: -0.7,
    expectedSalesChange: -3.5,
    expectedRevenueChange: 7.2,
    confidence: 'high',
    historyDataPoints: 15
  }
];

// Elasticity info component
function ElasticityInfo() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Dynamic Pricing with Price Elasticity</CardTitle>
        <CardDescription>
          Optimize your product prices based on demand elasticity analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">What is Price Elasticity?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Price elasticity of demand (PED) measures how the quantity demanded of a product responds to a change in its price.
              It's calculated as the percentage change in quantity demanded divided by the percentage change in price.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">How We Calculate Optimal Prices</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Our algorithm analyzes historical price changes and their impact on sales to determine each product's elasticity.
              It then uses a constraint-based optimization model to find the price point that maximizes revenue, 
              taking into account your costs, inventory levels, and seasonal factors.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="border rounded-lg p-3">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                  <BarChart4 className="h-4 w-4" />
                </div>
                <h4 className="font-medium">Historical Analysis</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                We analyze your historical price changes and corresponding sales volume changes to calculate product-specific 
                elasticity values.
              </p>
            </div>
            
            <div className="border rounded-lg p-3">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="font-medium">Revenue Optimization</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Using elasticity data, we model how different price points would impact sales volume and total revenue, 
                identifying the optimal price.
              </p>
            </div>
            
            <div className="border rounded-lg p-3">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-2">
                  <DollarSign className="h-4 w-4" />
                </div>
                <h4 className="font-medium">Business Factors</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                We adjust the mathematically optimal price by factoring in inventory levels, seasonality, competitive positioning, 
                and your costs.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main pricing suggestions component
function PricingSuggestionsTable() {
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [applyingPriceFor, setApplyingPriceFor] = useState<string | null>(null);
  
  // Filter suggestions based on confidence level
  const filteredSuggestions = mockPricingSuggestions.filter(suggestion => {
    if (confidenceLevel === 'high') return suggestion.confidence === 'high';
    if (confidenceLevel === 'medium') return ['high', 'medium'].includes(suggestion.confidence);
    return true; // 'low' includes all
  });
  
  // Handler for confidence level changes
  const handleConfidenceLevelChange = (value: string) => {
    setConfidenceLevel(value as 'high' | 'medium' | 'low');
  };
  
  // Mock handler for applying price changes
  const handleApplyPrice = async (productId: string, newPrice: number) => {
    setApplyingPriceFor(productId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success message
      toast.success(`Price updated to $${newPrice.toFixed(2)} successfully!`);
    } catch (error) {
      toast.error('Failed to update price. Please try again.');
    } finally {
      setApplyingPriceFor(null);
    }
  };
  
  // Format number as currency
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Dynamic Pricing Suggestions</CardTitle>
            <CardDescription>Optimize prices based on price elasticity analysis</CardDescription>
          </div>
          <Select defaultValue={confidenceLevel} onValueChange={handleConfidenceLevelChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Confidence Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High Confidence Only</SelectItem>
              <SelectItem value="medium">Medium+ Confidence</SelectItem>
              <SelectItem value="low">All Suggestions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pricing suggestions match your criteria.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Suggested Price</TableHead>
                <TableHead>Elasticity</TableHead>
                <TableHead>Revenue Impact</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuggestions.map(suggestion => (
                <TableRow key={suggestion.productId}>
                  <TableCell className="font-medium">{suggestion.productName}</TableCell>
                  <TableCell>{formatter.format(suggestion.currentPrice)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">{formatter.format(suggestion.suggestedPrice)}</span>
                      <Badge 
                        variant={suggestion.suggestedPrice > suggestion.currentPrice ? "destructive" : "default"}
                        className="ml-2"
                      >
                        {suggestion.suggestedPrice > suggestion.currentPrice ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs((suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{suggestion.priceElasticity.toFixed(1)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-emerald-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="font-medium">+{suggestion.expectedRevenueChange.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-2 ${
                        suggestion.confidence === 'high' ? 'bg-green-500' : 
                        suggestion.confidence === 'medium' ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`}></span>
                      <span className="capitalize">{suggestion.confidence}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      disabled={applyingPriceFor === suggestion.productId}
                      onClick={() => handleApplyPrice(suggestion.productId, suggestion.suggestedPrice)}
                    >
                      {applyingPriceFor === suggestion.productId ? (
                        "Applying..."
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-1" />
                          Apply
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        <div className="mt-4 p-3 border rounded-md bg-muted/20">
          <div className="flex items-start">
            <Info className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="mb-1">
                <strong>How this works:</strong> Our algorithm analyzes price elasticity of demand by examining historical 
                price changes and resulting sales volume fluctuations.
              </p>
              <p>
                Price suggestions aim to maximize revenue by finding the optimal price point 
                based on elasticity, cost data, inventory levels, and seasonal factors.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main pricing page
export default function PricingOptimizationPage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Price Optimization</h1>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Price Optimization</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              You need to be logged in to view price optimization suggestions.
            </p>
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Price Optimization</h1>
      
      <ElasticityInfo />
      
      <PricingSuggestionsTable />
    </div>
  );
} 