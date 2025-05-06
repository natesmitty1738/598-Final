'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, BarChart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md mx-auto">
        {/* MX Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center group">
            <div className="p-1.5 bg-gradient-to-r from-brand-blue to-brand-purple rounded-md mr-2 transition-transform group-hover:scale-110">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-foreground">
              Merch<span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple">X</span>
            </span>
          </div>
        </div>
        
        {/* Error information */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/inventory" passHref>
            <Button 
              variant="outline"
              className="w-full sm:w-auto relative group transition flex items-center"
            >
              <Package className="mr-2 h-4 w-4" />
              <span>Inventory</span>
            </Button>
          </Link>
          
          <Link href="/analytics" passHref>
            <Button 
              variant="outline"
              className="w-full sm:w-auto relative group transition flex items-center"
            >
              <BarChart className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </Button>
          </Link>
          
          <Link href="/" passHref>
            <Button className="w-full sm:w-auto flex items-center">
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 