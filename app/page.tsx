'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import AppleWatchGrid from '@/components/ui/apple-watch-grid';
import ElectricitySection from '@/components/ui/electricity-section';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // If user is authenticated, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  return (
    <div className="relative overflow-hidden">
      {/* Unified Background Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] opacity-60"></div>
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-[80px] opacity-40"></div>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col justify-center overflow-hidden -mt-[4rem] pt-[4rem]">
        {/* Apple Watch-style grid background with scroll animation */}
        <div className="absolute inset-0 z-0">
          <AppleWatchGrid numDots={150} dotSize={3} />
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="hero-text-container space-y-8">
              <div className="inline-block mb-2">
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-brand-blue">
                  Inventory management made simple
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.2] pb-3 pt-1">
                The <span className="gradient-text">Inventory Platform</span> for Small Business
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4">
                MerchX helps small businesses reduce waste, save time, and increase profits
                with our easy-to-use inventory management system.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {status === 'authenticated' ? (
                  <Link
                    href="/dashboard"
                    className="btn-primary flex items-center justify-center gap-2 group"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="btn-primary flex items-center justify-center gap-2 group"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
                <Link
                  href="/features"
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  See All Features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MerchX Engine Visualization with Electricity Cards */}
      <div className="relative">        
        <ElectricitySection />
      </div>
    </div>
  );
} 