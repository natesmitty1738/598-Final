import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface CompletionStepProps {
  onComplete: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function CompletionStep({ 
  onComplete, 
  loading = false,
  error = null
}: CompletionStepProps) {
  return (
    <div className="text-center max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          Almost Done!
        </h1>
      </div>
      
      {error && (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/10 mb-6">
          <p className="text-sm text-destructive font-medium">
            {error}
          </p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          onClick={onComplete} 
          size="lg" 
          className="relative group transition"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              <span>Setting up your account...</span>
            </>
          ) : (
            <>
              <span>Complete Setup</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 