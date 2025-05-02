'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ButtonLoader } from '@/components/ui/button-loader';

// simple business profile form
export default function BusinessProfileTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    businessName: '',
    industry: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    // fetch business profile data
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/business-profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching business profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        toast.success('Business profile updated successfully');
      } else {
        toast.error('Failed to update business profile');
      }
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast.error('An error occurred while updating');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="sm" />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            name="businessName"
            value={profile.businessName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            name="industry"
            value={profile.industry}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={profile.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={profile.city}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              name="state"
              value={profile.state}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="zipCode">Zip/Postal Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={profile.zipCode}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={profile.country}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={profile.website}
              onChange={handleChange}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <ButtonLoader className="mr-2" />}
          Save Business Profile
        </Button>
      </div>
    </form>
  );
} 