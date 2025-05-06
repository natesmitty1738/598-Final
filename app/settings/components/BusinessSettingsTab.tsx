'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BusinessProfileForm from '@/components/shared/BusinessProfileForm';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function BusinessSettingsTab() {
  const { data: session } = useSession();
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/business-profile');
        if (response.ok) {
          const data = await response.json();
          setBusinessProfile(data);
        }
      } catch (error) {
        console.error('Error fetching business profile:', error);
        toast.error('Failed to load business profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessProfile();
  }, [session]);

  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/business-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update business profile');
      }
      
      const updatedProfile = await response.json();
      setBusinessProfile(updatedProfile);
      
      toast.success('Business profile updated successfully');
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast.error('Failed to update business profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business details and contact information</CardDescription>
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
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Update your business details and contact information</CardDescription>
      </CardHeader>
      <CardContent>
        <BusinessProfileForm
          initialData={businessProfile || {}}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
} 