import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface BusinessProfileStepProps {
  initialData: any;
  onComplete: (data: any) => void;
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

export default function BusinessProfileStep({ initialData, onComplete }: BusinessProfileStepProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BusinessProfile>(
    initialData || {
      businessName: '',
      industry: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
      website: '',
      taxId: '',
      logo: '',
    }
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    // Validate required fields
    if (!formData.businessName) {
      setError('Business name is required');
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
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const savedData = await response.json();
        // Complete this step
        onComplete(savedData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save business profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error saving business profile:', err);
    } finally {
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
    <div className="py-6">
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
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="businessName" className="block mb-2 text-sm font-medium">
              Business Name*
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Your Business Name"
            />
          </div>
          
          <div>
            <label htmlFor="industry" className="block mb-2 text-sm font-medium">
              Industry
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Select an industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="address" className="block mb-2 text-sm font-medium">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Street Address"
            />
          </div>
          
          <div>
            <label htmlFor="city" className="block mb-2 text-sm font-medium">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="City"
            />
          </div>
          
          <div>
            <label htmlFor="state" className="block mb-2 text-sm font-medium">
              State/Province
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="State/Province"
            />
          </div>
          
          <div>
            <label htmlFor="zipCode" className="block mb-2 text-sm font-medium">
              Zip/Postal Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Zip/Postal Code"
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
} 