'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaymentMethod = {
  id: string;
  cardType: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
};

export default function PaymentMethodsTab() {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/payment-config');
        if (response.ok) {
          const data = await response.json();
          setPaymentMethods(data.paymentMethods || []);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const addPaymentMethod = () => {
    // in a real app this would open a payment form or stripe modal
    toast.info('Payment method addition would be implemented with Stripe or similar service');
  };

  const removePaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-config/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPaymentMethods(methods => methods.filter(method => method.id !== id));
        toast.success('Payment method removed');
      } else {
        toast.error('Failed to remove payment method');
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('An error occurred');
    }
  };

  const setDefaultPaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-config/${id}/default`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setPaymentMethods(methods => 
          methods.map(method => ({
            ...method,
            isDefault: method.id === id
          }))
        );
        toast.success('Default payment method updated');
      } else {
        toast.error('Failed to update default payment method');
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        <Button onClick={addPaymentMethod} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No payment methods added yet.</p>
          <Button onClick={addPaymentMethod} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div 
              key={method.id} 
              className={`border rounded-lg p-4 ${method.isDefault ? 'border-primary' : ''}`}
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">
                    {method.cardType} •••• {method.last4}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires {method.expiryMonth}/{method.expiryYear}
                    {method.isDefault && (
                      <span className="ml-2 text-primary font-medium">Default</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!method.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDefaultPaymentMethod(method.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => removePaymentMethod(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 