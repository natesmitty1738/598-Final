'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Simple avatar component that doesn't rely on external UI libraries
const UserAvatar = ({ src, alt, fallback }: { src?: string; alt?: string; fallback?: string }) => {
  const [error, setError] = useState(false);
  
  return (
    <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
      {src && !error ? (
        <img
          src={src}
          alt={alt || 'User avatar'}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-lg font-medium">
          {fallback ? fallback.charAt(0).toUpperCase() : <User className="h-10 w-10 text-muted-foreground" />}
        </div>
      )}
    </div>
  );
};

export default function AccountSettingsTab() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    image: ''
  });
  
  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      
      try {
        if (session?.user) {
          setUserData({
            name: session.user.name || '',
            email: session.user.email || '',
            image: session.user.image || ''
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load account data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [session]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Submit data to API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account settings');
      }
      
      // Update session data
      await updateSession({
        name: userData.name,
        email: userData.email,
        image: userData.image
      });
      
      // Show success toast
      toast.success('Account settings updated successfully');
    } catch (error) {
      console.error('Error updating account settings:', error);
      toast.error('Failed to update account settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-6">
        <UserAvatar 
          src={userData.image} 
          alt={userData.name} 
          fallback={userData.name}
        />
        <div>
          <div className="font-medium text-lg">Profile Picture</div>
          <p className="text-sm text-muted-foreground mb-2">
            This will be displayed on your profile
          </p>
          <Input
            name="image"
            value={userData.image}
            onChange={handleChange}
            placeholder="Image URL"
            className="max-w-sm"
          />
        </div>
      </div>
      
      <div className="grid gap-6 pt-4">
        <div className="grid gap-3">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            value={userData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={userData.email}
            onChange={handleChange}
            required
          />
          <p className="text-sm text-muted-foreground">
            This email is used for login.
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
} 