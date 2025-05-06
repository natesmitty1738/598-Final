import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  message?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  fullscreen = false, 
  message 
}: LoadingSpinnerProps) {
  // Determine spinner size based on prop
  const spinnerSize = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }[size];
  
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`animate-spin rounded-full border-2 border-t-transparent border-primary ${spinnerSize}`} />
      {message && (
        <p className="text-muted-foreground">{message}</p>
      )}
    </div>
  );
  
  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinnerContent}
      </div>
    );
  }
  
  return spinnerContent;
} 