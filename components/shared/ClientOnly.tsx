'use client';

import { useEffect, useState, ReactNode } from 'react';

// this component prevents hydration errors with client-only components
// like charts that depend on browser APIs
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // set mounted state to true when component mounts on client
    setHasMounted(true);
  }, []);

  // avoid rendering children until after client-side hydration
  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
} 