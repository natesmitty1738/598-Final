'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// list of industry options
const industries = [
  'Food & Beverage',
  'Retail',
  'Fashion & Apparel',
  'Electronics',
  'Home & Furniture',
  'Health & Beauty',
  'Sports & Outdoors',
  'Books & Stationery',
  'Toys & Games',
  'Art & Crafts',
  'Jewelry & Accessories',
  'Other',
];

export type BusinessProfileData = {
  id?: string;
  businessName: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  logo?: string;
};

export interface BusinessProfileFormProps {
  initialData?: Partial<BusinessProfileData>;
  onSubmit: (data: BusinessProfileData) => Promise<void>;
  onCancel?: () => void;
  isWizardMode?: boolean; // determines if this is part of the onboarding wizard
}

export default function BusinessProfileForm({
  initialData,
  onSubmit,
  onCancel,
  isWizardMode = false
}: BusinessProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with provided data or defaults
  const [profileData, setProfileData] = useState<BusinessProfileData>({
    businessName: initialData?.businessName || '',
    industry: initialData?.industry || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    taxId: initialData?.taxId || '',
    logo: initialData?.logo || ''
  });
  
  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setProfileData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select change for industry field
  const handleSelectChange = (value: string) => {
    setProfileData(prev => ({
      ...prev,
      industry: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    // Validate required fields
    if (!profileData.businessName?.trim()) {
      setError('Business name is required');
      setSaving(false);
      return;
    }
    
    // Validate phone number format if provided
    if (profileData.phone && !/^\+?[\d\s()-]{7,15}$/.test(profileData.phone)) {
      setError('Please enter a valid phone number');
      setSaving(false);
      return;
    }
    
    // Validate website format if provided
    if (profileData.website && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(profileData.website)) {
      setError('Please enter a valid website URL');
      setSaving(false);
      return;
    }
    
    try {
      await onSubmit(profileData);
      if (!isWizardMode) {
        toast.success('Business profile saved successfully');
      }
    } catch (err) {
      console.error('Error saving business profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="w-full">
      {isWizardMode && (
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900">
              <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-center">Business Profile</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
            Tell us about your business to help us customize your experience.
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
            <Label htmlFor="businessName">
              Business Name*
            </Label>
            <Input
              id="businessName"
              name="businessName"
              value={profileData.businessName}
              onChange={handleInputChange}
              required
              placeholder="Your Business Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">
              Industry
            </Label>
            <Select
              value={profileData.industry || ''}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">
              Address
            </Label>
            <Input
              id="address"
              name="address"
              value={profileData.address || ''}
              onChange={handleInputChange}
              placeholder="Street Address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">
              City
            </Label>
            <Input
              id="city"
              name="city"
              value={profileData.city || ''}
              onChange={handleInputChange}
              placeholder="City"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">
              State/Province
            </Label>
            <Input
              id="state"
              name="state"
              value={profileData.state || ''}
              onChange={handleInputChange}
              placeholder="State or Province"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zipCode">
              Zip/Postal Code
            </Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={profileData.zipCode || ''}
              onChange={handleInputChange}
              placeholder="Zip or Postal Code"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">
              Country
            </Label>
            <Input
              id="country"
              name="country"
              value={profileData.country || ''}
              onChange={handleInputChange}
              placeholder="Country"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={profileData.phone || ''}
              onChange={handleInputChange}
              placeholder="Phone Number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">
              Website
            </Label>
            <Input
              id="website"
              name="website"
              value={profileData.website || ''}
              onChange={handleInputChange}
              placeholder="e.g., https://example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="taxId">
              Tax ID
            </Label>
            <Input
              id="taxId"
              name="taxId"
              value={profileData.taxId || ''}
              onChange={handleInputChange}
              placeholder="Tax ID or Business Registration Number"
            />
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