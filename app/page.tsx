'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, CheckCircle2, LineChart, Package2, BarChart4, AlertTriangle } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [timeSpentBefore] = useState(14); // hours per week on inventory before using app
  const [timeSpentAfter] = useState(3); // hours per week on inventory after using app
  const [hourlyWage] = useState(20); // average hourly wage for staff
  const [weeksPerYear] = useState(52);
  const [wastePercentageBefore] = useState(18); // percentage of waste before
  const [wastePercentageAfter] = useState(7); // percentage of waste after
  const [monthlyInventoryValue] = useState(8500); // monthly inventory value for a coffee shop
  
  // Calculate ROI metrics
  const hoursSaved = timeSpentBefore - timeSpentAfter;
  const annualLaborSavings = hoursSaved * hourlyWage * weeksPerYear;
  const wasteReduction = wastePercentageBefore - wastePercentageAfter;
  const monthlySavings = (monthlyInventoryValue * wasteReduction / 100);
  const annualSavings = monthlySavings * 12 + annualLaborSavings;
  const totalROI = Math.round((annualSavings / 1200) * 100); // assuming $1200/year subscription

  if (isAuthenticated) {
    return <AuthenticatedHomePage session={session} />;
  }

  return <UnauthenticatedHomePage annualSavings={annualSavings} totalROI={totalROI} hoursSaved={hoursSaved} wasteReduction={wasteReduction} />;
}

function AuthenticatedHomePage({ session }: { session: any }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activity');
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActivityStyles = (color: string) => {
    const styles = {
      green: {
        bg: 'bg-green-500/10',
        text: 'text-green-600 dark:text-green-400',
      },
      blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600 dark:text-blue-400',
      },
      red: {
        bg: 'bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
      },
    };
    return styles[color as keyof typeof styles] || styles.blue;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-block relative">
              <div className="absolute -inset-6 rounded-xl bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 blur-lg opacity-70 dark:opacity-30"></div>
              <h1 className="relative text-4xl font-bold mb-4">
                Welcome back, <span className="gradient-text">{session?.user?.name || 'there'}</span>!
              </h1>
            </div>
          </div>
          <p className="text-xl text-muted-foreground">
            Your inventory management dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/inventory" className="glow-card p-6 transition-all hover:translate-y-[-4px]">
            <div className="flex gap-4 items-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/20">
                <Package2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Inventory</h3>
                <p className="text-xl font-semibold text-foreground">Manage Stock</p>
              </div>
            </div>
          </Link>
          
          <Link href="/sales" className="glow-card p-6 transition-all hover:translate-y-[-4px]">
            <div className="flex gap-4 items-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/20">
                <BarChart4 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Sales</h3>
                <p className="text-xl font-semibold text-foreground">Track Revenue</p>
              </div>
            </div>
          </Link>
          
          <Link href="/analytics" className="glow-card p-6 transition-all hover:translate-y-[-4px]">
            <div className="flex gap-4 items-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/20">
                <LineChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Analytics</h3>
                <p className="text-xl font-semibold text-foreground">View Insights</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="glow-card p-8 bg-secondary/30 mb-12">
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity to show</p>
              </div>
            ) : (
              activities.map((activity, index) => {
                const styles = getActivityStyles(activity.color);
                return (
                  <div key={index} className="p-3 rounded-lg bg-background flex items-center justify-between border border-border/50">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md ${styles.bg} ${styles.text} mr-3`}>
                        {activity.icon === 'BarChart4' && <BarChart4 className="h-5 w-5" />}
                        {activity.icon === 'Package2' && <Package2 className="h-5 w-5" />}
                        {activity.icon === 'AlertTriangle' && <AlertTriangle className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UnauthenticatedHomePage({ annualSavings, totalROI, hoursSaved, wasteReduction }: { 
  annualSavings: number, 
  totalROI: number, 
  hoursSaved: number, 
  wasteReduction: number 
}) {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="animated-bg container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-brand-blue">
                  Inventory management made simple
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Simplify Your <span className="gradient-text">Inventory Management</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                MerchX helps small businesses reduce waste, save time, and increase profits
                with our easy-to-use inventory management system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="btn-primary"
                >
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="#demo"
                  className="px-6 py-3 bg-background border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors"
                >
                  See Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Calculator Section */}
      <div className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Your Potential Return on Investment
              </h2>
              <p className="text-lg text-muted-foreground">
                See how much you could save by switching to MerchX
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="glow-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Time Saved</h3>
                <p className="text-3xl font-bold text-brand-blue dark:text-brand-blue">{hoursSaved} hrs/week</p>
                <p className="mt-2 text-muted-foreground">
                  Reduce inventory management time
                </p>
              </div>
              
              <div className="glow-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Waste Reduction</h3>
                <p className="text-3xl font-bold text-brand-purple dark:text-brand-purple">{wasteReduction}%</p>
                <p className="mt-2 text-muted-foreground">
                  Cut waste with better inventory tracking
                </p>
              </div>
              
              <div className="glow-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Annual Savings</h3>
                <p className="text-3xl font-bold text-brand-pink dark:text-brand-pink">
                  ${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="mt-2 text-muted-foreground">
                  Total yearly savings
                </p>
              </div>
            </div>

            <div className="glow-card p-8 text-center max-w-2xl mx-auto">
              <h3 className="text-xl font-medium mb-3">
                Your ROI with MerchX
              </h3>
              <p className="text-5xl font-bold gradient-text mb-4">
                {totalROI}%
              </p>
              <p className="text-muted-foreground mb-6">
                Average return on investment for a small business
              </p>
              <Link
                href="/register"
                className="btn-primary inline-block"
              >
                Calculate Your ROI
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="demo" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Powerful Features, Simple Interface
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to manage your inventory effectively
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glow-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full border border-blue-500/20">
                  <Package2 className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="text-xl font-medium mb-3">
                  Smart Inventory Tracking
                </h3>
                <p className="text-muted-foreground">
                  Track stock levels, set reorder points, and receive low stock alerts automatically.
                </p>
              </div>
              
              <div className="glow-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full border border-purple-500/20">
                  <BarChart4 className="h-8 w-8 text-purple-600 dark:text-purple-500" />
                </div>
                <h3 className="text-xl font-medium mb-3">
                  Real-time Sales Integration
                </h3>
                <p className="text-muted-foreground">
                  Sales automatically update inventory levels. Get notified when it's time to restock.
                </p>
              </div>
              
              <div className="glow-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-pink-500/10 to-pink-600/10 rounded-full border border-pink-500/20">
                  <LineChart className="h-8 w-8 text-pink-600 dark:text-pink-500" />
                </div>
                <h3 className="text-xl font-medium mb-3">
                  Business Analytics
                </h3>
                <p className="text-muted-foreground">
                  Visual reports to identify trends, optimize stock levels, and reduce waste.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                No hidden fees, no long-term contracts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Starter Plan */}
              <div className="glow-card p-6 border border-border relative">
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-background text-muted-foreground border border-border">
                    STARTER
                  </span>
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-medium mb-2">Starter</h3>
                  <p className="text-muted-foreground mb-4">For small businesses just getting started</p>
                  <p className="text-4xl font-bold mb-6">$29<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Up to 500 inventory items</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Basic reporting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>1 user account</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Email support</span>
                    </li>
                  </ul>
                  
                  <Link href="/register" className="block w-full py-2.5 px-4 bg-card text-foreground border border-border rounded-md text-center hover:bg-secondary/50 transition-colors">
                    Start Free Trial
                  </Link>
                </div>
              </div>
            
              {/* Pro Plan - Highlighted */}
              <div className="glow-card p-6 bg-gradient-to-b from-brand-blue/5 to-brand-purple/5 border border-brand-blue/20 relative">
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20">
                    MOST POPULAR
                  </span>
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-medium mb-2">Professional</h3>
                  <p className="text-muted-foreground mb-4">For growing businesses</p>
                  <p className="text-4xl font-bold mb-6">$99<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited inventory items</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>5 user accounts</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>API access</span>
                    </li>
                  </ul>
                  
                  <Link href="/register" className="btn-primary block w-full py-2.5 text-center">
                    Start Free Trial
                  </Link>
                </div>
              </div>
              
              {/* Enterprise Plan */}
              <div className="glow-card p-6 border border-border relative">
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-background text-muted-foreground border border-border">
                    ENTERPRISE
                  </span>
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-medium mb-2">Enterprise</h3>
                  <p className="text-muted-foreground mb-4">For large operations & chains</p>
                  <p className="text-4xl font-bold mb-6">$299<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Everything in Professional</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multi-location management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited user accounts</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Custom integrations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Dedicated account manager</span>
                    </li>
                  </ul>
                  
                  <Link href="/contact" className="block w-full py-2.5 px-4 bg-card text-foreground border border-border rounded-md text-center hover:bg-secondary/50 transition-colors">
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to streamline your inventory management?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that have simplified their operations and increased profitability with MerchX.
            </p>
            <Link href="/register" className="btn-primary inline-flex">
              Start Your Free 14-Day Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 