'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export interface NotificationPreferences {
  success: boolean;
  error: boolean;
  info: boolean;
}

export interface NotificationsToggleProps {
  initialData?: Partial<NotificationPreferences>;
  onSubmit: (data: NotificationPreferences) => Promise<void>;
  isWizardMode?: boolean;
  showTitle?: boolean;
  buttonText?: string;
}

export default function NotificationsToggle({
  initialData,
  onSubmit,
  isWizardMode = false,
  showTitle = true,
  buttonText,
}: NotificationsToggleProps) {
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    success: initialData?.success ?? true,
    error: initialData?.error ?? true,
    info: initialData?.info ?? true,
  });
  
  // Update preferences when initialData changes
  useEffect(() => {
    if (initialData) {
      setPreferences(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);
  
  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSubmit(preferences);
      
      if (!isWizardMode) {
        // use success notification for saving confirmation
        toast.success('Notification preferences saved');
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>
            Notifications
          </CardTitle>
          <CardDescription>Configure popup messages</CardDescription>
        </CardHeader>
      )}
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Success Notifications */}
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <Label htmlFor="success" className="text-base font-medium cursor-pointer">
                  Success Messages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Confirmation when actions complete successfully
                </p>
              </div>
              <Switch
                id="success"
                checked={preferences.success}
                onCheckedChange={() => handleToggle('success')}
              />
            </div>
            
            {/* Error Notifications */}
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <Label htmlFor="error" className="text-base font-medium cursor-pointer">
                  Error Messages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alerts about errors and failed operations
                </p>
              </div>
              <Switch
                id="error"
                checked={preferences.error}
                onCheckedChange={() => handleToggle('error')}
              />
            </div>
            
            {/* Info Notifications */}
            <div className="flex justify-between items-center py-2">
              <div>
                <Label htmlFor="info" className="text-base font-medium cursor-pointer">
                  Information Messages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Helpful tips and information alerts
                </p>
              </div>
              <Switch
                id="info"
                checked={preferences.info}
                onCheckedChange={() => handleToggle('info')}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : buttonText || (isWizardMode ? 'Save & Continue' : 'Save Changes')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 