import React from 'react';
import { ShoppingBag, BarChart, CreditCard } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

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
          <div className="inline-flex mb-4 w-20 h-20 justify-center items-center rounded-full bg-gradient-to-br from-brand-gradient-start via-brand-gradient-mid to-brand-gradient-end text-white font-bold text-2xl shadow-lg">
            MX
          </div>
          
          <h1 className="text-2xl font-bold mb-3">Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple">MerchX</span></h1>
          
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Let's set up your busines.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 p-2 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-brand-blue" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">Business Profile</h3>
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