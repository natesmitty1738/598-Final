import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect reports pages by checking for authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    // Redirect to login if not authenticated
    redirect('/login?callbackUrl=/reports');
  }
  
  return <>{children}</>;
} 