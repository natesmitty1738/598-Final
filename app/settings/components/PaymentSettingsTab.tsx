'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PaymentMethodsForm from '@/components/shared/PaymentMethodsForm';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function PaymentSettingsTab() {
  const { data: session } = useSession();
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPaymentConfig = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/payment-config');
        if (response.ok) {
          const data = await response.json();
          setPaymentConfig(data);
        }
      } catch (error) {
        console.error('Error fetching payment configuration:', error);
        toast.error('Failed to load payment configuration');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentConfig();
  }, [session]);

  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/payment-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment settings');
      }
      
      const updatedConfig = await response.json();
      setPaymentConfig(updatedConfig);
      
      toast.success('Payment settings updated successfully');
    } catch (error) {
      console.error('Error updating payment settings:', error);
      toast.error('Failed to update payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Configure how you accept payments from customers</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Configure how you accept payments from customers</CardDescription>
      </CardHeader>
      <CardContent>
        <PaymentMethodsForm
          initialData={paymentConfig || {}}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
} 