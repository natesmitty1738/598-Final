'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type BusinessProfile = {
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

export default function BusinessProfileForm() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BusinessProfile>({
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
  });
  
  useEffect(() => {
    if (session) {
      fetchBusinessProfile();
    }
  }, [session]);
  
  const fetchBusinessProfile = async () => {
    try {
      const response = await fetch('/api/business-profile');
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      }
    } catch (err) {
      console.error('Error fetching business profile:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    try {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSuccess('Business profile saved successfully!');
        const data = await response.json();
        setFormData(data);
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-card dark:bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Business Profile</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
          {success}
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
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label htmlFor="industry" className="block mb-2 text-sm font-medium">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
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
              className="w-full px-4 py-2 border rounded-md bg-background"
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
              className="w-full px-4 py-2 border rounded-md bg-background"
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
              className="w-full px-4 py-2 border rounded-md bg-background"
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
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label htmlFor="country" className="block mb-2 text-sm font-medium">
              Country
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block mb-2 text-sm font-medium">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label htmlFor="website" className="block mb-2 text-sm font-medium">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md bg-background"
              placeholder="https://example.com"
            />
          </div>
          
          <div>
            <label htmlFor="taxId" className="block mb-2 text-sm font-medium">
              Tax ID
            </label>
            <input
              type="text"
              id="taxId"
              name="taxId"
              value={formData.taxId || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
} 