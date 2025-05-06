'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUp, 
  ArrowDown, 
  Info, 
  Check, 
  AlertTriangle,
  DollarSign,
  BarChart4,
  TrendingUp,
  AlertCircle 
} from "lucide-react";
import { PriceElasticityResult } from '@/lib/analytics';
import { formatter } from "@/lib/utils";

interface PricingSuggestionsTableProps {
  suggestions: PriceElasticityResult[];
  isLoading?: boolean;
  onConfidenceLevelChange?: (level: 'high' | 'medium' | 'low') => void;
  onApplyPriceChange?: (productId: string, newPrice: number) => Promise<void>;
}

export default function PricingSuggestionsTable({
  suggestions,
  isLoading = false,
  onConfidenceLevelChange,
  onApplyPriceChange
}: PricingSuggestionsTableProps) {
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [applyingPriceFor, setApplyingPriceFor] = useState<string | null>(null);
  
  // Handle confidence level change
  const handleConfidenceLevelChange = (value: string) => {
    const level = value as 'high' | 'medium' | 'low';
    setConfidenceLevel(level);
    if (onConfidenceLevelChange) {
      onConfidenceLevelChange(level);
    }
  };
  
  // Handle price change application
  const handleApplyPrice = async (productId: string, newPrice: number) => {
    if (onApplyPriceChange) {
      setApplyingPriceFor(productId);
      try {
        await onApplyPriceChange(productId, newPrice);
      } finally {
        setApplyingPriceFor(null);
      }
    }
  };
  
  // Helper to render confidence badge
  const renderConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-red-500">Low</Badge>;
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-28" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
        {suggestions.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/50">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No pricing suggestions available</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting the confidence level or check back later</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Suggested Price</TableHead>
                <TableHead>Expected Impact</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map(suggestion => (
                <TableRow key={suggestion.productId}>
                  <TableCell className="font-medium">{suggestion.productName}</TableCell>
                  <TableCell>{formatter.format(suggestion.currentPrice)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">{formatter.format(suggestion.suggestedPrice)}</span>
                      <Badge 
                        variant={suggestion.suggestedPrice > suggestion.currentPrice ? "destructive" : "default"}
                        className="ml-2 px-2 py-1"
                      >
                        {suggestion.suggestedPrice > suggestion.currentPrice ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        <span className="font-bold">
                          {Math.abs(((suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice) * 100).toFixed(1)}%
                        </span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <BarChart4 className="h-3 w-3 mr-1" />
                        <span className="text-sm">Sales: </span>
                        <span className={`text-sm ml-1 font-medium ${suggestion.expectedSalesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {suggestion.expectedSalesChange >= 0 ? '+' : ''}
                          {suggestion.expectedSalesChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span className="text-sm">Revenue: </span>
                        <span className="text-sm ml-1 font-medium text-green-600">
                          +{suggestion.expectedRevenueChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {renderConfidenceBadge(suggestion.confidence)}
                      <span className="text-xs text-muted-foreground">
                        Based on {suggestion.historyDataPoints} data points
                      </span>
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
                based on elasticity (E = {-1.2}), cost data, inventory levels, and seasonal factors.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 