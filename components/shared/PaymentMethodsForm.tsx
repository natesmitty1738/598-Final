'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export interface PaymentMethodsData {
  acceptCash: boolean;
  acceptCardPayments: boolean;
  acceptInvoicePayments: boolean;
  stripeEnabled: boolean;
  stripeAccountId?: string;
  stripeConnected?: boolean;
}

export interface PaymentMethodsFormProps {
  initialData?: Partial<PaymentMethodsData>;
  onSubmit: (data: PaymentMethodsData) => Promise<void>;
  onCancel?: () => void;
  isWizardMode?: boolean;
  onConnectStripe?: () => void;
}

export default function PaymentMethodsForm({
  initialData,
  onSubmit,
  onCancel,
  isWizardMode = false,
  onConnectStripe
}: PaymentMethodsFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with provided data or defaults
  const [paymentData, setPaymentData] = useState<PaymentMethodsData>({
    acceptCash: initialData?.acceptCash ?? true,
    acceptCardPayments: initialData?.acceptCardPayments ?? false,
    acceptInvoicePayments: initialData?.acceptInvoicePayments ?? false,
    stripeEnabled: initialData?.stripeEnabled ?? false,
    stripeAccountId: initialData?.stripeAccountId || undefined,
    stripeConnected: initialData?.stripeConnected ?? false
  });
  
  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setPaymentData(prev => ({
        ...prev,
        acceptCash: initialData.acceptCash ?? prev.acceptCash,
        acceptCardPayments: initialData.acceptCardPayments ?? prev.acceptCardPayments,
        acceptInvoicePayments: initialData.acceptInvoicePayments ?? prev.acceptInvoicePayments,
        stripeEnabled: initialData.stripeEnabled ?? prev.stripeEnabled,
        stripeAccountId: initialData.stripeAccountId || prev.stripeAccountId,
        stripeConnected: initialData.stripeConnected ?? prev.stripeConnected
      }));
    }
  }, [initialData]);
  
  const handleSwitchChange = (name: keyof PaymentMethodsData) => {
    setPaymentData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
    
    // Special case for stripeEnabled - if disabling stripe, also disable card payments
    if (name === 'stripeEnabled') {
      if (paymentData.stripeEnabled) {
        setPaymentData(prev => ({
          ...prev,
          acceptCardPayments: false,
          stripeEnabled: false
        }));
      }
    }
    
    // If enabling card payments, also enable Stripe
    if (name === 'acceptCardPayments' && !paymentData.acceptCardPayments) {
      setPaymentData(prev => ({
        ...prev,
        stripeEnabled: true,
        acceptCardPayments: true
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    // Validate card payments require Stripe
    if (paymentData.acceptCardPayments && !paymentData.stripeEnabled) {
      setError('Card payments require Stripe to be enabled');
      setSaving(false);
      return;
    }
    
    // At least one payment method should be enabled
    if (!paymentData.acceptCash && !paymentData.acceptCardPayments && !paymentData.acceptInvoicePayments) {
      setError('At least one payment method must be enabled');
      setSaving(false);
      return;
    }
    
    try {
      await onSubmit(paymentData);
      
      if (!isWizardMode) {
        toast.success('Payment methods saved successfully');
      }
    } catch (err) {
      console.error('Error saving payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to save payment methods');
    } finally {
      setSaving(false);
    }
  };
  
  const handleStripeConnect = () => {
    if (onConnectStripe) {
      onConnectStripe();
    }
  };
  
  return (
    <div className="w-full">
      {isWizardMode && (
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
              <CreditCard className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-center">Payment Methods</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
            Configure how you'll accept payments from your customers.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {/* Cash Payments */}
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium">Cash Payments</h3>
                <p className="text-sm text-muted-foreground">Accept cash payments from customers</p>
              </div>
            </div>
            <Switch
              checked={paymentData.acceptCash}
              onCheckedChange={() => handleSwitchChange('acceptCash')}
            />
          </div>
          
          {/* Invoice Payments */}
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">Invoice Payments</h3>
                <p className="text-sm text-muted-foreground">Send invoices to customers</p>
              </div>
            </div>
            <Switch
              checked={paymentData.acceptInvoicePayments}
              onCheckedChange={() => handleSwitchChange('acceptInvoicePayments')}
            />
          </div>
          
          {/* Card Payments with Stripe */}
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium">Card Payments</h3>
                <p className="text-sm text-muted-foreground">Accept credit and debit card payments</p>
              </div>
            </div>
            <Switch
              checked={paymentData.acceptCardPayments}
              onCheckedChange={() => handleSwitchChange('acceptCardPayments')}
            />
          </div>
          
          {/* Stripe Integration */}
          {paymentData.acceptCardPayments && (
            <div className="ml-8 mt-2 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Stripe Integration</h4>
              
              <div className="space-y-4">
                {paymentData.stripeConnected ? (
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Connected to Stripe
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleStripeConnect}
                    variant="outline"
                    className="text-sm"
                  >
                    Connect Stripe Account
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Stripe allows you to accept card payments securely. You'll need to set up a Stripe account.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : isWizardMode ? 'Save & Continue' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
} 