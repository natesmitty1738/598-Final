'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export interface NotificationPreferencesData {
  email: {
    orderConfirmations: boolean;
    inventoryAlerts: boolean;
    salesReports: boolean;
    marketingUpdates: boolean;
  };
  sms: {
    orderConfirmations: boolean;
    inventoryAlerts: boolean;
    salesReports: boolean;
  };
  inApp: {
    orderConfirmations: boolean;
    inventoryAlerts: boolean;
    salesReports: boolean;
    systemUpdates: boolean;
  };
}

export interface NotificationPreferencesFormProps {
  initialData?: Partial<NotificationPreferencesData>;
  onSubmit: (data: NotificationPreferencesData) => Promise<void>;
  onCancel?: () => void;
  isWizardMode?: boolean;
}

export default function NotificationPreferencesForm({
  initialData,
  onSubmit,
  onCancel,
  isWizardMode = false
}: NotificationPreferencesFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with provided data or defaults
  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    email: {
      orderConfirmations: initialData?.email?.orderConfirmations ?? true,
      inventoryAlerts: initialData?.email?.inventoryAlerts ?? true,
      salesReports: initialData?.email?.salesReports ?? true,
      marketingUpdates: initialData?.email?.marketingUpdates ?? false,
    },
    sms: {
      orderConfirmations: initialData?.sms?.orderConfirmations ?? false,
      inventoryAlerts: initialData?.sms?.inventoryAlerts ?? false,
      salesReports: initialData?.sms?.salesReports ?? false,
    },
    inApp: {
      orderConfirmations: initialData?.inApp?.orderConfirmations ?? true,
      inventoryAlerts: initialData?.inApp?.inventoryAlerts ?? true,
      salesReports: initialData?.inApp?.salesReports ?? true,
      systemUpdates: initialData?.inApp?.systemUpdates ?? true,
    }
  });
  
  // Update preferences when initialData changes
  useEffect(() => {
    if (initialData) {
      setPreferences(prev => ({
        email: {
          ...prev.email,
          ...(initialData.email || {})
        },
        sms: {
          ...prev.sms,
          ...(initialData.sms || {})
        },
        inApp: {
          ...prev.inApp,
          ...(initialData.inApp || {})
        }
      }));
    }
  }, [initialData]);
  
  const handleToggle = (channel: 'email' | 'sms' | 'inApp', key: string) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !prev[channel][key as keyof typeof prev[typeof channel]]
      }
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    try {
      await onSubmit(preferences);
      
      if (!isWizardMode) {
        toast.success('Notification preferences saved successfully');
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="w-full">
      {isWizardMode && (
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900">
              <Bell className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-center">Notification Preferences</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
            Set up how you'd like to be notified about important business events.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium">Email Notifications</h3>
          </div>
          
          <div className="pl-7 space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="email-order-confirmations" className="cursor-pointer">
                Order Confirmations
              </Label>
              <Switch
                id="email-order-confirmations"
                checked={preferences.email.orderConfirmations}
                onCheckedChange={() => handleToggle('email', 'orderConfirmations')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="email-inventory-alerts" className="cursor-pointer">
                Inventory Alerts
              </Label>
              <Switch
                id="email-inventory-alerts"
                checked={preferences.email.inventoryAlerts}
                onCheckedChange={() => handleToggle('email', 'inventoryAlerts')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="email-sales-reports" className="cursor-pointer">
                Sales Reports
              </Label>
              <Switch
                id="email-sales-reports"
                checked={preferences.email.salesReports}
                onCheckedChange={() => handleToggle('email', 'salesReports')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="email-marketing-updates" className="cursor-pointer">
                Marketing Updates
              </Label>
              <Switch
                id="email-marketing-updates"
                checked={preferences.email.marketingUpdates}
                onCheckedChange={() => handleToggle('email', 'marketingUpdates')}
              />
            </div>
          </div>
        </div>
        
        {/* SMS Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-medium">SMS Notifications</h3>
          </div>
          
          <div className="pl-7 space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="sms-order-confirmations" className="cursor-pointer">
                Order Confirmations
              </Label>
              <Switch
                id="sms-order-confirmations"
                checked={preferences.sms.orderConfirmations}
                onCheckedChange={() => handleToggle('sms', 'orderConfirmations')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="sms-inventory-alerts" className="cursor-pointer">
                Inventory Alerts
              </Label>
              <Switch
                id="sms-inventory-alerts"
                checked={preferences.sms.inventoryAlerts}
                onCheckedChange={() => handleToggle('sms', 'inventoryAlerts')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="sms-sales-reports" className="cursor-pointer">
                Sales Reports
              </Label>
              <Switch
                id="sms-sales-reports"
                checked={preferences.sms.salesReports}
                onCheckedChange={() => handleToggle('sms', 'salesReports')}
              />
            </div>
          </div>
        </div>
        
        {/* In-App Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium">In-App Notifications</h3>
          </div>
          
          <div className="pl-7 space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="inapp-order-confirmations" className="cursor-pointer">
                Order Confirmations
              </Label>
              <Switch
                id="inapp-order-confirmations"
                checked={preferences.inApp.orderConfirmations}
                onCheckedChange={() => handleToggle('inApp', 'orderConfirmations')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="inapp-inventory-alerts" className="cursor-pointer">
                Inventory Alerts
              </Label>
              <Switch
                id="inapp-inventory-alerts"
                checked={preferences.inApp.inventoryAlerts}
                onCheckedChange={() => handleToggle('inApp', 'inventoryAlerts')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="inapp-sales-reports" className="cursor-pointer">
                Sales Reports
              </Label>
              <Switch
                id="inapp-sales-reports"
                checked={preferences.inApp.salesReports}
                onCheckedChange={() => handleToggle('inApp', 'salesReports')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Label htmlFor="inapp-system-updates" className="cursor-pointer">
                System Updates
              </Label>
              <Switch
                id="inapp-system-updates"
                checked={preferences.inApp.systemUpdates}
                onCheckedChange={() => handleToggle('inApp', 'systemUpdates')}
              />
            </div>
          </div>
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