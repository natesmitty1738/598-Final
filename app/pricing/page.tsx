import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-32 md:px-6">
      <div className="flex flex-col items-center text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Choose the perfect plan for your business needs, with no hidden fees or surprises.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Starter Plan */}
        <div className="flex flex-col p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-2xl font-bold">Starter</h3>
            <p className="text-muted-foreground mt-2">Perfect for small businesses just getting started</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold">$29</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Up to 250 products
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Basic analytics
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Email support
            </li>
          </ul>
          <Link href="/register" className="mt-auto btn-primary py-3 text-center">
            Get Started
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="flex flex-col p-6 bg-card border-2 border-brand-blue rounded-xl shadow-md relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-blue to-brand-purple text-white text-sm font-medium py-1 px-4 rounded-full">
            Most Popular
          </div>
          <div className="mb-4">
            <h3 className="text-2xl font-bold">Professional</h3>
            <p className="text-muted-foreground mt-2">Everything you need for a growing business</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold">$79</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Unlimited products
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Advanced analytics & reporting
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Priority support
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Team management
            </li>
          </ul>
          <Link href="/register" className="mt-auto bg-gradient-to-r from-brand-blue to-brand-purple hover:opacity-90 text-white font-medium py-3 rounded-lg text-center">
            Get Started
          </Link>
        </div>

        {/* Enterprise Plan */}
        <div className="flex flex-col p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-2xl font-bold">Enterprise</h3>
            <p className="text-muted-foreground mt-2">Custom solutions for large organizations</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold">$199</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Everything in Professional
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Custom integrations
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Dedicated account manager
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              24/7 phone & email support
            </li>
          </ul>
          <Link href="/register" className="mt-auto btn-primary py-3 text-center">
            Contact Sales
          </Link>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6 mt-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">Can I switch plans later?</h3>
            <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">Do you offer a free trial?</h3>
            <p className="text-muted-foreground">Yes, all plans come with a 14-day free trial, no credit card required.</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 