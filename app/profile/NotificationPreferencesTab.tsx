'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Custom switch component using just HTML and CSS
const Switch = ({ 
  checked, 
  onCheckedChange, 
  id 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  id: string;
}) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span className="sr-only">Toggle</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

type NotificationPreference = {
  id: string;
  type: string;
  description: string;
  push: boolean;
};

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'new-order',
    type: 'New Order',
    description: 'Receive notifications when a new order is placed',
    push: true
  },
  {
    id: 'shipping-updates',
    type: 'Shipping Updates',
    description: 'Get notified about shipping status changes',
    push: false
  },
  {
    id: 'inventory-alerts',
    type: 'Inventory Alerts',
    description: 'Be alerted when inventory is low',
    push: true
  },
  {
    id: 'payment-confirmations',
    type: 'Payment Confirmations',
    description: 'Receive confirmations for payments',
    push: false
  },
  {
    id: 'marketing-promotions',
    type: 'Marketing & Promotions',
    description: 'Get updates about promotions and marketing opportunities',
    push: false
  }
];

export default function NotificationPreferencesTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notification-preferences');
        if (response.ok) {
          const data = await response.json();
          // Convert old format to new format if necessary
          const newFormat = data.map((pref: any) => ({
            id: pref.id,
            type: pref.type,
            description: pref.description,
            push: pref.push || false
          }));
          setPreferences(newFormat);
        } else {
          // Use default preferences if none are set
          setPreferences(defaultPreferences);
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        // Use default preferences if API fails
        setPreferences(defaultPreferences);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleToggle = (id: string, value: boolean) => {
    setPreferences(prefs => 
      prefs.map(pref => 
        pref.id === id 
          ? { ...pref, push: value } 
          : pref
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Notification preferences saved');
      } else {
        toast.error('Failed to save notification preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
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
      <Card>
        <CardHeader>
          <CardTitle>Popup Notifications</CardTitle>
          <CardDescription>Configure which popup notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="grid gap-4 py-3 border-b last:border-0">
                <div className="flex flex-col">
                  <div className="font-medium">{pref.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {pref.description}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-1">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id={`${pref.id}-push`}
                      checked={pref.push}
                      onCheckedChange={(checked) => handleToggle(pref.id, checked)}
                    />
                    <Label htmlFor={`${pref.id}-push`}>Enabled</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
} 