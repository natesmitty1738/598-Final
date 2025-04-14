'use client';

import React, { useState } from 'react';

export default function AnalyticsPage() {
  // Mock data for demonstration
  const [monthlyData] = useState([
    { month: 'Jan', waste: 22, labor: 16, sales: 42000 },
    { month: 'Feb', waste: 20, labor: 15, sales: 44500 },
    { month: 'Mar', waste: 18, labor: 14, sales: 48000 },
    { month: 'Apr', waste: 15, labor: 12, sales: 52000 },
    { month: 'May', waste: 12, labor: 10, sales: 55000 },
    { month: 'Jun', waste: 9, labor: 8, sales: 58000 },
  ]);

  const [annualSavings] = useState({
    wasteReduction: 9180, // Annual savings from waste reduction
    laborSavings: 11440, // Annual savings from labor reduction
    increasedSales: 16000, // Estimated increase in annual sales
    totalSavings: 36620 // Total annual savings and revenue increase
  });

  const [topWasteItems] = useState([
    { name: 'Milk', percentage: 24, weeklyCost: 48 },
    { name: 'Pastries', percentage: 18, weeklyCost: 36 },
    { name: 'Coffee Beans', percentage: 12, weeklyCost: 24 },
    { name: 'Syrups', percentage: 8, weeklyCost: 16 },
    { name: 'Sandwiches', percentage: 6, weeklyCost: 12 }
  ]);

  // Calculate waste reduction over time
  const initialWaste = monthlyData[0].waste;
  const currentWaste = monthlyData[monthlyData.length - 1].waste;
  const wasteReductionPercentage = Math.round(((initialWaste - currentWaste) / initialWaste) * 100);

  // Calculate labor hour reduction over time
  const initialLabor = monthlyData[0].labor;
  const currentLabor = monthlyData[monthlyData.length - 1].labor;
  const laborReductionPercentage = Math.round(((initialLabor - currentLabor) / initialLabor) * 100);

  // Calculate sales increase over time
  const initialSales = monthlyData[0].sales;
  const currentSales = monthlyData[monthlyData.length - 1].sales;
  const salesIncreasePercentage = Math.round(((currentSales - initialSales) / initialSales) * 100);

  // Calculate ROI percentage (assuming $1200/year subscription)
  const annualSubscriptionCost = 1200;
  const roi = Math.round((annualSavings.totalSavings / annualSubscriptionCost) * 100);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Analytics & ROI Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Waste Reduction</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{wasteReductionPercentage}%</p>
          <p className="text-sm text-muted-foreground mt-1">Since implementation</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Labor Hours Saved</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{laborReductionPercentage}%</p>
          <p className="text-sm text-muted-foreground mt-1">Inventory management time</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Sales Increase</h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{salesIncreasePercentage}%</p>
          <p className="text-sm text-muted-foreground mt-1">From better inventory planning</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Annual ROI</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{roi}%</p>
          <p className="text-sm text-muted-foreground mt-1">Return on investment</p>
        </div>
      </div>

      {/* Annual Savings Breakdown */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Annual Savings Breakdown</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Waste Reduction Savings</span>
              <span className="text-green-600 dark:text-green-400 font-semibold">${annualSavings.wasteReduction.toLocaleString()}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(annualSavings.wasteReduction / annualSavings.totalSavings) * 100}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">From reducing expired and unsold items</p>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Labor Cost Savings</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">${annualSavings.laborSavings.toLocaleString()}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(annualSavings.laborSavings / annualSavings.totalSavings) * 100}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">From reduced inventory counting and management time</p>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Increased Sales Revenue</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">${annualSavings.increasedSales.toLocaleString()}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(annualSavings.increasedSales / annualSavings.totalSavings) * 100}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">From better in-stock rates and customer satisfaction</p>
          </div>

          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">Total Annual Benefit</span>
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">${annualSavings.totalSavings.toLocaleString()}</span>
            </div>
            <p className="text-indigo-600 dark:text-indigo-500 mt-1">Annual subscription cost: ${annualSubscriptionCost.toLocaleString()} (ROI: {roi}%)</p>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-bold mb-4">Waste Reduction Trend</h2>
          <div className="h-64 relative">
            <div className="absolute inset-0 flex items-end justify-between px-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex flex-col items-center w-1/6">
                  <div 
                    className="bg-green-500 dark:bg-green-600 rounded-t-sm w-8" 
                    style={{ height: `${(data.waste / 25) * 100}%` }}
                  ></div>
                  <div className="mt-2 text-xs text-muted-foreground">{data.month}</div>
                  <div className="text-xs font-medium">{data.waste}%</div>
                </div>
              ))}
            </div>
            <div className="absolute left-0 right-0 bottom-8 border-t border-border"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Your waste percentage has decreased from {initialWaste}% to {currentWaste}% over 6 months.
          </p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-bold mb-4">Labor Hours Trend</h2>
          <div className="h-64 relative">
            <div className="absolute inset-0 flex items-end justify-between px-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex flex-col items-center w-1/6">
                  <div 
                    className="bg-blue-500 dark:bg-blue-600 rounded-t-sm w-8" 
                    style={{ height: `${(data.labor / 20) * 100}%` }}
                  ></div>
                  <div className="mt-2 text-xs text-muted-foreground">{data.month}</div>
                  <div className="text-xs font-medium">{data.labor} hrs/week</div>
                </div>
              ))}
            </div>
            <div className="absolute left-0 right-0 bottom-8 border-t border-border"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Weekly hours spent on inventory has decreased from {initialLabor} to {currentLabor} over 6 months.
          </p>
        </div>
      </div>

      {/* Top Waste Categories */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Top Waste Categories</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These items represent your highest waste costs. Focus on improving forecasting and storage for these categories.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">% of Total Waste</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Potential Annual Savings</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {topWasteItems.map((item, index) => (
                <tr key={index} className="hover:bg-muted/50">
                  <td className="px-4 py-4 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center">
                      <span className="mr-2">{item.percentage}%</span>
                      <div className="w-24 bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full" 
                          style={{ width: `${item.percentage * 3}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">${item.weeklyCost}</td>
                  <td className="px-4 py-4 text-sm text-green-600 dark:text-green-400 font-medium">
                    ${Math.round(item.weeklyCost * 52 * 0.5).toLocaleString()}
                    <span className="text-xs text-muted-foreground ml-1">(at 50% reduction)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-xl font-bold mb-4">Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Milk Waste Reduction</h3>
                <p className="text-sm text-muted-foreground">Order smaller quantities more frequently. Consider adjusting your par levels for weekends vs weekdays.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Pastry Forecasting</h3>
                <p className="text-sm text-muted-foreground">Implement weather-based forecasting. Sales increase 22% on rainy days and decrease 15% on very hot days.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Storage Optimization</h3>
                <p className="text-sm text-muted-foreground">Implement a First-In-First-Out (FIFO) system with dated labels to prevent older items from being forgotten.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Time-Based Discounting</h3>
                <p className="text-sm text-muted-foreground">Implement automatic discounts of 25% on pastries in the final 2 hours of the day to reduce end-of-day waste.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Automate Ordering</h3>
                <p className="text-sm text-muted-foreground">Set up automatic order generation for your top 10 most predictable items to save 2.5 hours of labor weekly.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Staff Training</h3>
                <p className="text-sm text-muted-foreground">Schedule a 30-minute weekly meeting to review inventory status and waste reports with all staff members.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 