import React, { useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';

interface PaymentSetupStepProps {
  initialData: any;
  onComplete: (data: any) => void;
}

type PaymentConfig = {
  acceptCash: boolean;
  acceptCardPayments: boolean;
  acceptInvoicePayments: boolean;
  stripeEnabled: boolean;
  stripeAccountId?: string;
  stripeConnected: boolean;
};

export default function PaymentSetupStep({ initialData, onComplete }: PaymentSetupStepProps) {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(
    initialData || {
      acceptCash: true,
      acceptCardPayments: false,
      acceptInvoicePayments: false,
      stripeEnabled: false,
      stripeConnected: false,
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleToggle = (field: keyof PaymentConfig) => {
    setPaymentConfig(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  
  const handleConnectStripe = async () => {
    // In a real app, this would redirect to Stripe OAuth flow
    try {
      // Mock API call to connect Stripe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPaymentConfig(prev => ({
        ...prev,
        stripeEnabled: true,
        stripeConnected: true,
        stripeAccountId: 'acct_' + Math.random().toString(36).substring(2, 15),
      }));
    } catch (err) {
      setError('Failed to connect to Stripe');
      console.error('Error connecting to Stripe:', err);
    }
  };
  
  const handleDisconnectStripe = () => {
    setPaymentConfig(prev => ({
      ...prev,
      stripeEnabled: false,
      stripeConnected: false,
      stripeAccountId: undefined,
    }));
  };
  
  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    
    try {
      // Save payment configuration to the API
      const response = await fetch('/api/payment-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentConfig),
      });
      
      if (response.ok) {
        const savedConfig = await response.json();
        onComplete(savedConfig);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save payment configuration');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error saving payment configuration:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="py-6">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900">
          <CreditCard className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-center">Payment Setup</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
        Configure how you'll accept payments from your customers.
      </p>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-4 mb-8">
        {/* Cash payments */}
        <div 
          className={`card p-4 cursor-pointer ${
            paymentConfig.acceptCash ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => handleToggle('acceptCash')}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Cash Payments</h3>
              <p className="text-sm text-muted-foreground">
                Accept cash payments from your customers
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full border ${
              paymentConfig.acceptCash 
                ? 'bg-blue-500 border-blue-500 flex items-center justify-center'
                : 'border-gray-300'
            }`}>
              {paymentConfig.acceptCash && (
                <CheckCircle2 className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
        </div>
        
        {/* Card payments in person */}
        <div 
          className={`card p-4 cursor-pointer ${
            paymentConfig.acceptCardPayments ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => handleToggle('acceptCardPayments')}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Card Payments</h3>
              <p className="text-sm text-muted-foreground">
                Accept credit/debit card payments in person
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full border ${
              paymentConfig.acceptCardPayments 
                ? 'bg-blue-500 border-blue-500 flex items-center justify-center'
                : 'border-gray-300'
            }`}>
              {paymentConfig.acceptCardPayments && (
                <CheckCircle2 className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
        </div>
        
        {/* Invoice payments */}
        <div 
          className={`card p-4 cursor-pointer ${
            paymentConfig.acceptInvoicePayments ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => handleToggle('acceptInvoicePayments')}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Invoice Payments</h3>
              <p className="text-sm text-muted-foreground">
                Send invoices to customers for later payment
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full border ${
              paymentConfig.acceptInvoicePayments 
                ? 'bg-blue-500 border-blue-500 flex items-center justify-center'
                : 'border-gray-300'
            }`}>
              {paymentConfig.acceptInvoicePayments && (
                <CheckCircle2 className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
        </div>
        
        {/* Stripe integration */}
        <div className="card p-6">
          <h3 className="font-medium mb-2">Online Payments with Stripe</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Stripe account to accept online payments through your website or send payment links to customers.
          </p>
          
          {paymentConfig.stripeConnected ? (
            <div>
              <div className="flex items-center mb-4 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span>Connected to Stripe (Account ID: {paymentConfig.stripeAccountId})</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnectStripe}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950"
              >
                Disconnect Stripe
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectStripe}
              className="px-4 py-2 bg-[#635BFF] text-white rounded-md hover:bg-[#8780FA]"
            >
              Connect with Stripe
            </button>
          )}
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
} 