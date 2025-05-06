import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect settings pages by checking for authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    // Redirect to login if not authenticated
    redirect('/login?callbackUrl=/settings');
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      {children}
    </div>
  );
} 