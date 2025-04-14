'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import BusinessProfileForm from '../components/BusinessProfileForm';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    redirect('/login?callbackUrl=/profile');
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account details and business profile
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card dark:bg-card p-4 rounded-lg shadow-md">
            <nav className="space-y-2">
              <a href="#profile" className="block p-2 rounded-md bg-primary/10 text-primary font-medium">
                Business Profile
              </a>
              <a href="#account" className="block p-2 rounded-md hover:bg-muted/50 transition-colors">
                Account Settings
              </a>
              <a href="#password" className="block p-2 rounded-md hover:bg-muted/50 transition-colors">
                Change Password
              </a>
              <a href="#notifications" className="block p-2 rounded-md hover:bg-muted/50 transition-colors">
                Notification Preferences
              </a>
            </nav>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <section id="profile">
            <BusinessProfileForm />
          </section>
        </div>
      </div>
    </div>
  );
} 