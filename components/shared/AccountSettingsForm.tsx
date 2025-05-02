'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export interface AccountSettingsData {
  name: string;
  email: string;
  newPassword?: string;
  confirmPassword?: string;
  currentPassword?: string;
  image?: string;
}

export interface AccountSettingsFormProps {
  initialData?: Partial<AccountSettingsData>;
  onSubmit: (data: AccountSettingsData) => Promise<void>;
  onCancel?: () => void;
  isWizardMode?: boolean;
  hidePassword?: boolean;
}

export default function AccountSettingsForm({
  initialData,
  onSubmit,
  onCancel,
  isWizardMode = false,
  hidePassword = false
}: AccountSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Initialize with provided data or defaults
  const [accountData, setAccountData] = useState<AccountSettingsData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    newPassword: '',
    confirmPassword: '',
    currentPassword: '',
    image: initialData?.image || ''
  });
  
  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setAccountData(prev => ({
        ...prev,
        name: initialData.name || prev.name,
        email: initialData.email || prev.email,
        image: initialData.image || prev.image
      }));
    }
  }, [initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    // Validate required fields
    if (!accountData.name?.trim()) {
      setError('Name is required');
      setSaving(false);
      return;
    }
    
    if (!accountData.email?.trim()) {
      setError('Email is required');
      setSaving(false);
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) {
      setError('Please enter a valid email address');
      setSaving(false);
      return;
    }
    
    // Validate password if changing
    if (changingPassword) {
      if (!accountData.newPassword) {
        setError('New password is required');
        setSaving(false);
        return;
      }
      
      if (accountData.newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        setSaving(false);
        return;
      }
      
      if (accountData.newPassword !== accountData.confirmPassword) {
        setError('Passwords do not match');
        setSaving(false);
        return;
      }
      
      if (!isWizardMode && !accountData.currentPassword) {
        setError('Current password is required');
        setSaving(false);
        return;
      }
    }
    
    try {
      // Submit without password fields if not changing password
      const dataToSubmit = changingPassword 
        ? accountData 
        : {
            name: accountData.name,
            email: accountData.email,
            image: accountData.image
          };
      
      await onSubmit(dataToSubmit as AccountSettingsData);
      
      if (!isWizardMode) {
        toast.success('Account settings saved successfully');
      }
      
      // Reset password fields after successful submission
      if (changingPassword) {
        setAccountData(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: '',
          currentPassword: ''
        }));
        setChangingPassword(false);
      }
    } catch (err) {
      console.error('Error saving account settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save account settings');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="w-full">
      {isWizardMode && (
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900">
              <User className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-center">Account Settings</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
            Update your personal information and account settings.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name*
            </Label>
            <Input
              id="name"
              name="name"
              value={accountData.name}
              onChange={handleInputChange}
              required
              placeholder="Your Full Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address*
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={accountData.email}
              onChange={handleInputChange}
              required
              placeholder="your.email@example.com"
            />
          </div>
          
          {!hidePassword && (
            <>
              {!changingPassword && !isWizardMode ? (
                <div className="col-span-1 md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setChangingPassword(true)}
                  >
                    Change Password
                  </Button>
                </div>
              ) : (
                <>
                  {!isWizardMode && (
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label htmlFor="currentPassword">
                        Current Password*
                      </Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={accountData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Your Current Password"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {isWizardMode ? 'Password*' : 'New Password*'}
                    </Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={accountData.newPassword}
                      onChange={handleInputChange}
                      placeholder={isWizardMode ? 'Create Password' : 'New Password'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password*
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm Password"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          {!isWizardMode && changingPassword && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setChangingPassword(false);
                setAccountData(prev => ({
                  ...prev,
                  newPassword: '',
                  confirmPassword: '',
                  currentPassword: ''
                }));
              }}
              disabled={saving}
            >
              Cancel Password Change
            </Button>
          )}
          
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