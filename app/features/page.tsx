import React from 'react';
import { BarChart3, Package, ShoppingCart, Users, FileText, Shield, Zap, Globe, HelpCircle } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-32 md:px-6">
      <div className="flex flex-col items-center text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Powerful Features for Your Business
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Everything you need to manage your inventory, track sales, and grow your business.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Feature 1 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-5">
            <Package className="h-6 w-6 text-brand-blue" />
          </div>
          <h3 className="text-xl font-bold mb-2">Inventory Management</h3>
          <p className="text-muted-foreground">
            Track stock levels, set reorder points, and manage product variants all in one place.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-brand-purple/10 rounded-lg flex items-center justify-center mb-5">
            <ShoppingCart className="h-6 w-6 text-brand-purple" />
          </div>
          <h3 className="text-xl font-bold mb-2">Sales Tracking</h3>
          <p className="text-muted-foreground">
            Monitor sales performance, track trends, and identify your best-selling products.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-5">
            <BarChart3 className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
          <p className="text-muted-foreground">
            Gain insights with customizable dashboards, reports, and performance metrics.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-5">
            <Users className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
          <p className="text-muted-foreground">
            Assign roles, manage permissions, and collaborate with your team seamlessly.
          </p>
        </div>

        {/* Feature 5 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-5">
            <FileText className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Comprehensive Reports</h3>
          <p className="text-muted-foreground">
            Generate detailed reports for inventory, sales, and financial performance.
          </p>
        </div>

        {/* Feature 6 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-5">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Secure Data Storage</h3>
          <p className="text-muted-foreground">
            Rest easy knowing your business data is protected with enterprise-grade security.
          </p>
        </div>

        {/* Feature 7 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-5">
            <Zap className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Fast Performance</h3>
          <p className="text-muted-foreground">
            Lightning-fast interface that works smoothly even with large inventories.
          </p>
        </div>

        {/* Feature 8 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-teal-500/10 rounded-lg flex items-center justify-center mb-5">
            <Globe className="h-6 w-6 text-teal-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Global Access</h3>
          <p className="text-muted-foreground">
            Access your inventory system from anywhere with our cloud-based solution.
          </p>
        </div>

        {/* Feature 9 */}
        <div className="md:col-span-2 lg:col-span-1 bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20 rounded-xl p-6">
          <div className="h-12 w-12 bg-white/90 rounded-lg flex items-center justify-center mb-5">
            <HelpCircle className="h-6 w-6 text-brand-blue" />
          </div>
          <h3 className="text-xl font-bold mb-2">Personalized Support</h3>
          <p className="text-muted-foreground">
            Get help when you need it with our dedicated support team and comprehensive knowledge base.
          </p>
        </div>
      </div>

      <div className="mt-20 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Ready to streamline your inventory management?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands of businesses that trust MerchX for their inventory needs.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="/register" className="btn-primary py-3 px-8">
            Get Started Now
          </a>
          <a href="/pricing" className="border border-border bg-card hover:bg-primary/5 py-3 px-8 rounded-lg font-medium">
            View Pricing
          </a>
        </div>
      </div>
    </div>
  );
} 