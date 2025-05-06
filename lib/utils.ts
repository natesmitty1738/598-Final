import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatter
export const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// price optimization function using price elasticity to maximize revenue
export function optimizePriceForRevenue({
  currentPrice,
  priceElasticity,
  minPriceChange = -0.2, // default max decrease of 20%
  maxPriceChange = 0.2,  // default max increase of 20%
  costPrice = 0          // optional cost price for profit calculation
}: {
  currentPrice: number;
  priceElasticity: number;
  minPriceChange?: number;
  maxPriceChange?: number;
  costPrice?: number;
}): {
  optimizedPrice: number;
  expectedSalesChange: number;
  expectedRevenueChange: number;
} {
  // safeguard against invalid elasticity values
  if (priceElasticity >= 0) {
    // if elasticity is invalid, return current price with no changes
    return {
      optimizedPrice: currentPrice,
      expectedSalesChange: 0,
      expectedRevenueChange: 0
    };
  }

  // calculate bounds for price changes
  const lowerBound = currentPrice * (1 + minPriceChange);
  const upperBound = currentPrice * (1 + maxPriceChange);
  
  // for revenue maximization with constant elasticity, optimal price is:
  // p* = c/(1+1/e) where c is cost and e is elasticity
  // if no cost is provided (pure revenue maximization), then:
  // p* = p_current * (e/(1+e))
  
  let optimalPrice;
  
  if (costPrice > 0) {
    // maximize profit
    optimalPrice = costPrice / (1 + (1 / priceElasticity));
  } else {
    // maximize revenue with elasticity formula
    optimalPrice = currentPrice * (priceElasticity / (1 + priceElasticity));
  }
  
  // ensure price is within bounds
  const optimizedPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));
  
  // calculate expected changes
  const priceChangePercent = (optimizedPrice / currentPrice) - 1;
  const expectedSalesChange = priceChangePercent * priceElasticity * 100; // as percentage
  const expectedRevenueChange = (1 + priceChangePercent) * (1 + (priceChangePercent * priceElasticity)) * 100 - 100;
  
  return {
    optimizedPrice,
    expectedSalesChange,
    expectedRevenueChange
  };
} 