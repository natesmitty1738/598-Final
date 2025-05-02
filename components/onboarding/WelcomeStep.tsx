import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onComplete: () => void;
  userName?: string;
}

export default function WelcomeStep({ onComplete, userName }: WelcomeStepProps) {
  return (
    <div className="text-center max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-brand-blue"
            >
              <path d="M20 22h-2"></path>
              <path d="M20 15v2h-2"></path>
              <path d="M4 15h14"></path>
              <path d="M14 15v2"></path>
              <path d="M4 15v7"></path>
              <path d="M12 15v7"></path>
              <path d="M6 7h.01"></path>
              <path d="M2 2h20v9.5H2z"></path>
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          Welcome{userName ? `, ${userName}` : ''}!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Let's set up your business to help you manage inventory, track sales, and grow your business.
        </p>
      </div>
      
      <div className="space-y-6 mb-8">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-medium text-lg mb-2">What will we cover?</h3>
          <ul className="space-y-3 text-left">
            <li className="flex items-start">
              <span className="mr-2 mt-1 text-brand-blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong>Account setup</strong> - Configure your personal account settings
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1 text-brand-blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong>Business profile</strong> - Tell us about your business
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1 text-brand-blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong>Add products</strong> - Set up your initial inventory
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1 text-brand-blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong>Payment methods</strong> - Configure how you'll accept payments
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1 text-brand-blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong>Notification preferences</strong> - Choose how you'd like to be updated
              </span>
            </li>
          </ul>
        </div>
        
        <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <span className="font-medium">⏱️ Time to complete:</span> Approximately 5-10 minutes
          </p>
        </div>
      </div>
      
      <Button onClick={onComplete} size="lg" className="relative group transition">
        <span>Let's get started</span>
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
} 