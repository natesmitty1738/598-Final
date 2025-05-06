'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ className = "" }) => {
  const { data: session, status } = useSession();
  
  return (
    <div className={`relative min-h-screen flex flex-col justify-center overflow-hidden -mt-[4rem] pt-[4rem] ${className}`}>
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
              Reduce waste, save time, and increase profits.
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
  );
};

export default HeroSection; 