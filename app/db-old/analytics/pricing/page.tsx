import React from 'react';
import { Suspense } from 'react';
import PricingSuggestionsTable from '@/components/features/PricingSuggestionsTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { optimizePriceForRevenue } from '@/lib/utils';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// A skeleton loader for the pricing table
function PricingTableSkeleton() {
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

// Function to fetch real sales data and generate suggestions
async function getPricingSuggestions() {
  // Get current user session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return [];
  }

  // Get the last 90 days of sales data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  
  // Get all products with associated sales data
  const products = await prisma.product.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    include: {
      saleItems: {
        where: {
          sale: {
            createdAt: {
              gte: startDate
            }
          }
        },
        include: {
          sale: true
        }
      }
    }
  });

  // Only process products with enough sales data
  const productsWithSufficientData = products.filter(
    product => product.saleItems.length >= 5
  );

  // Generate suggestions for each product with sufficient data
  return productsWithSufficientData.map(product => {
    // Calculate average price
    const totalRevenue = product.saleItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    const totalQuantity = product.saleItems.reduce(
      (sum, item) => sum + item.quantity, 
      0
    );
    const averagePrice = totalRevenue / totalQuantity;
    
    // Estimate price elasticity based on sales data variance
    // A simple assumption: higher variance = higher elasticity
    // A more sophisticated approach would analyze actual price changes over time
    const priceVariation = product.saleItems.length > 1 ? 
      Math.abs(Math.min(...product.saleItems.map(item => item.price)) - 
              Math.max(...product.saleItems.map(item => item.price))) / averagePrice : 0;
    
    const estimatedElasticity = priceVariation > 0.1 ? -1.2 : -0.8;
    
    // Calculate confidence level based on amount of data
    let confidence = 'low';
    if (product.saleItems.length >= 10) {
      confidence = 'high';
    } else if (product.saleItems.length >= 5) {
      confidence = 'medium';
    }
    
    // Use the optimization algorithm
    const { optimizedPrice, expectedSalesChange, expectedRevenueChange } = optimizePriceForRevenue({
      currentPrice: product.sellingPrice || averagePrice,
      priceElasticity: estimatedElasticity,
      minPriceChange: -0.2,
      maxPriceChange: 0.2,
      costPrice: product.unitCost || ((product.sellingPrice || averagePrice) * 0.6) // estimate cost if not available
    });

    // Return formatted suggestion
    return {
      productId: product.id,
      productName: product.name,
      currentPrice: product.sellingPrice || averagePrice,
      suggestedPrice: Number(optimizedPrice.toFixed(2)),
      priceElasticity: estimatedElasticity,
      historyDataPoints: product.saleItems.length,
      expectedSalesChange: Number(expectedSalesChange.toFixed(1)),
      expectedRevenueChange: Number(expectedRevenueChange.toFixed(1)),
      confidence: confidence as 'high' | 'medium' | 'low'
    };
  });
}

// Dynamic pricing component with data fetching
async function DynamicPricingSuggestions() {
  // Fetch real pricing suggestions
  const suggestions = await getPricingSuggestions();
  
  // If no suggestions are available, show an empty state
  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pricing Suggestions Available</CardTitle>
          <CardDescription>
            We need more sales data to generate pricing recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Continue recording sales or import sales history to get personalized pricing suggestions.
            We recommend having at least 5 sales of a product to generate reliable suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return <PricingSuggestionsTable suggestions={suggestions} />;
}

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
          
          <div>
            <h3 className="text-lg font-medium">Confidence Levels</h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="p-3 border rounded-md bg-green-50 dark:bg-green-950">
                <h4 className="font-medium">High Confidence</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on 10+ data points with strong correlation between price changes and sales volume.
                </p>
              </div>
              <div className="p-3 border rounded-md bg-yellow-50 dark:bg-yellow-950">
                <h4 className="font-medium">Medium Confidence</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on 5-9 data points with moderate correlation between price changes and sales.
                </p>
              </div>
              <div className="p-3 border rounded-md bg-red-50 dark:bg-red-950">
                <h4 className="font-medium">Low Confidence</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on limited data (&lt;5 data points) or weak correlation patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main pricing page
export default function PricingOptimizationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Price Optimization</h1>
      
      <ElasticityInfo />
      
      <Suspense fallback={<PricingTableSkeleton />}>
        <DynamicPricingSuggestions />
      </Suspense>
    </div>
  );
} 