'use client';

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Inter } from 'next/font/google';

import SetupWizard from '@/components/onboarding/SetupWizard';

const inter = Inter({ subsets: ['latin'] });

// Moving metadata elsewhere - should be in a separate layout.tsx file

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const res = await fetch('/api/onboarding/status');
        const data = await res.json();
        
        if (data.completed) {
          // If onboarding is already completed, redirect to dashboard
          setOnboardingComplete(true);
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkOnboardingStatus();
  }, [router]);
  
  if (loading || onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <main className={`min-h-screen bg-background ${inter.className}`}>
      <Suspense fallback={<div>Loading...</div>}>
        <SetupWizard />
      </Suspense>
    </main>
  );
} 