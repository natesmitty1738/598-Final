'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '../components/OnboardingWizard';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If the user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/onboarding');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
          <p className="text-muted-foreground">Loading your setup wizard...</p>
        </div>
      </div>
    );
  }

  // If the user is authenticated, show the onboarding wizard
  if (session) {
    return <OnboardingWizard />;
  }

  // This should not be visible, but render a placeholder for SSR
  return null;
} 