import React from 'react';
import { ShoppingBag, BarChart, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface WelcomeStepProps {
  onComplete: () => void;
  formData: any;
  updateFormData: (data: any) => void;
  userId: string;
}

export default function WelcomeStep({ onComplete, formData, updateFormData, userId }: WelcomeStepProps) {
  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4 p-2 rounded-full bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20">
            <ShoppingBag className="h-6 w-6 text-brand-blue dark:text-brand-purple" />
          </div>
          
          <h1 className="text-2xl font-bold mb-3">Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple">MerchX</span></h1>
          
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Let's set up your business in a few simple steps. This won't take long!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 p-2 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-brand-blue" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">Business Profile</h3>
                <p className="text-sm text-muted-foreground">Basic business information</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 p-2 rounded-lg">
                <BarChart className="h-5 w-5 text-brand-purple" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">Inventory Setup</h3>
                <p className="text-sm text-muted-foreground">Add your first product</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-indigo-400/10 to-indigo-500/5 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">Payment Setup</h3>
                <p className="text-sm text-muted-foreground">Configure payment methods</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-green-400/10 to-green-500/5 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">Ready to Launch</h3>
                <p className="text-sm text-muted-foreground">Complete setup and go!</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white px-6 py-3 rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center mx-auto"
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
} 