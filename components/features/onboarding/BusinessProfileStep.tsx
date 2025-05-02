import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BusinessProfileStepProps {
  formData: any;
  userId: string;
  onComplete: (data: any) => void;
  updateFormData: (data: any) => void;
}

type BusinessProfile = {
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

export default function BusinessProfileStep({ formData, onComplete, updateFormData, userId }: BusinessProfileStepProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with formData or empty object with default values
  const [profileData, setProfileData] = useState<BusinessProfile>({
    businessName: formData?.businessName || '',
    industry: formData?.industry || '',
    address: formData?.address || '',
    city: formData?.city || '',
    state: formData?.state || '',
    zipCode: formData?.zipCode || '',
    country: formData?.country || '',
    phone: formData?.phone || '',
    website: formData?.website || '',
    taxId: formData?.taxId || '',
    logo: formData?.logo || '',
  });
  
  // Load existing data if available
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      setProfileData({
        businessName: formData.businessName || '',
        industry: formData.industry || '',
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        zipCode: formData.zipCode || '',
        country: formData.country || '',
        phone: formData.phone || '',
        website: formData.website || '',
        taxId: formData.taxId || '',
        logo: formData.logo || '',
      });
    }
  }, [formData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update local state
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Update the form data in parent component with each change
    // This updates the state but doesn't save to the server
    updateFormData({
      ...profileData,
      [name]: value
    });
  };
  
  // Handle select change for the industry field
  const handleSelectChange = (value: string) => {
    // Update local state
    setProfileData((prev) => ({
      ...prev,
      industry: value,
    }));
    
    // Update parent's form data without saving to server
    updateFormData({
      ...profileData,
      industry: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    // Validate required fields
    if (!profileData.businessName || profileData.businessName.trim() === '') {
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
      // Save to the API first
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (response.ok) {
        const savedData = await response.json();
        
        // Update the form data with the saved data
        updateFormData(savedData);
        
        // Complete this step
        onComplete(savedData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save business profile');
        setSaving(false);
      }
    } catch (err) {
      setError('An unexpected error occurred while saving your business profile');
      console.error('Error saving business profile:', err);
      setSaving(false);
    }
  };
  
  // Industry options for dropdown
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
  
  return (
    <div className="py-6 relative z-10">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900">
          <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-center">Business Profile</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
        Tell us about your business to help us customize your experience.
      </p>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className="relative pointer-events-auto"
              style={{ zIndex: 30 }}
              placeholder="Your Business Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">
              Industry
            </Label>
            <Select
              value={profileData.industry}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="relative pointer-events-auto" style={{ zIndex: 30 }}>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-50">
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
              className="relative pointer-events-auto"
              style={{ zIndex: 30 }}
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
              className="relative pointer-events-auto"
              style={{ zIndex: 30 }}
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
              className="relative pointer-events-auto"
              style={{ zIndex: 30 }}
              placeholder="State/Province"
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
              className="relative pointer-events-auto"
              style={{ zIndex: 30 }}
              placeholder="Zip/Postal Code"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              value={profileData.phone || ''}
              onChange={handleInputChange}
              className="relative pointer-events-auto"
              style={{ zIndex: 30 }}
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
              className="relative pointer-events-auto"
              style={{ zIndex: 30 }}
              placeholder="https://www.example.com"
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <Button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 relative z-20"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
} 