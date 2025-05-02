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
  // size mappings
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  // container classes
  const containerClasses = fullscreen 
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-primary`}></div>
        {message && <p className="text-muted-foreground text-sm">{message}</p>}
      </div>
    </div>
  );
} 