import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface WelcomeStepProps {
  onComplete: () => void;
  userName?: string;
}

export default function WelcomeStep({ onComplete, userName }: WelcomeStepProps) {
  return (
    <div className="text-center max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          {/* MX Logo with gradient X */}
          <div className="font-bold text-5xl tracking-tight">
            M<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">X</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          Welcome{userName ? `, ${userName}` : ''}!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Let's set up your business.
        </p>
      </div>
      
      <Button onClick={onComplete} size="lg" className="relative group transition">
        <span>Get started</span>
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
} 