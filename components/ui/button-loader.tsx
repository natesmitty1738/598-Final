import React from 'react';

interface ButtonLoaderProps {
  className?: string;
}

export function ButtonLoader({ className = "" }: ButtonLoaderProps) {
  return (
    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-current ${className}`}></div>
  );
} 