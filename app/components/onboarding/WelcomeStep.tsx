import React, { useEffect, useRef } from 'react';
import { Rocket, ShoppingBag, BarChart, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface WelcomeStepProps {
  onComplete: () => void;
}

export default function WelcomeStep({ onComplete }: WelcomeStepProps) {
  const cardsRef = useRef<HTMLDivElement>(null);

  // Handle mouse movement for glow effect
  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll('.feature-card');
    if (!cards) return;

    const handleMouseMove = (e: MouseEvent) => {
      cards.forEach((card: Element) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex mb-6 p-3 rounded-full bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20 dark:border-brand-purple/20">
            <ShoppingBag className="h-8 w-8 text-brand-blue dark:text-brand-purple" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple">MerchX</span></h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your complete solution for inventory management without the complexity.
            Let's set up your business in a few simple steps.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={onComplete}
              className="bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white px-6 py-3 rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            
            <Link href="/help" className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-md text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
        
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/5 to-brand-purple/5 rounded-xl blur-3xl transform -translate-y-4"></div>
          <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
            <Image 
              src="/images/dashboard-preview.png" 
              alt="MerchX Dashboard Preview" 
              width={1200} 
              height={675}
              className="w-full h-auto"
              priority
              // Fallback if image doesn't exist
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22675%22%20viewBox%3D%220%200%201200%20675%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20fill%3D%22%23FBFBFC%22%20width%3D%221200%22%20height%3D%22675%22%2F%3E%3Cg%20transform%3D%22translate(100%2C100)%22%3E%3Crect%20fill%3D%22%23EEEFF3%22%20width%3D%221000%22%20height%3D%22450%22%20rx%3D%2210%22%2F%3E%3Ctext%20fill%3D%22%23797A8B%22%20font-family%3D%22-apple-system%2C%20BlinkMacSystemFont%2C%20Segoe%20UI%2C%20Roboto%2C%20Oxygen%2C%20Ubuntu%2C%20Cantarell%2C%20Fira%20Sans%2C%20Droid%20Sans%2C%20Helvetica%20Neue%2C%20sans-serif%22%20font-size%3D%2225%22%20font-weight%3D%22600%22%20text-anchor%3D%22middle%22%20x%3D%22500%22%20y%3D%22225%22%3EMerchX%20Dashboard%20Preview%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                target.alt = 'MerchX Dashboard Placeholder';
                target.style.background = 'linear-gradient(to right, #f0f4f8, #e1ebf4)';
              }}
            />
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-6 text-center">What we'll cover in the setup</h2>
        
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="feature-card p-5 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 p-2.5 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-brand-blue" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium mb-1">Business Profile</h3>
                <p className="text-sm text-muted-foreground">Set up your business information and customize your store settings.</p>
              </div>
            </div>
          </div>
          
          <div className="feature-card p-5 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 p-2.5 rounded-lg">
                <BarChart className="h-5 w-5 text-brand-purple" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium mb-1">Inventory Setup</h3>
                <p className="text-sm text-muted-foreground">Add your initial products and set up stock levels to start tracking.</p>
              </div>
            </div>
          </div>
          
          <div className="feature-card p-5 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-indigo-400/10 to-indigo-500/5 p-2.5 rounded-lg">
                <CreditCard className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium mb-1">Payment Setup</h3>
                <p className="text-sm text-muted-foreground">Configure your payment methods to start accepting orders.</p>
              </div>
            </div>
          </div>
          
          <div className="feature-card p-5 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gradient-to-br from-green-400/10 to-green-500/5 p-2.5 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium mb-1">Ready to Launch</h3>
                <p className="text-sm text-muted-foreground">Get familiar with the dashboard and start managing your business.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Your progress will be automatically saved at each step.</p>
          <button
            type="button"
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white px-6 py-3 rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center mx-auto"
          >
            Continue Setup
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
} 