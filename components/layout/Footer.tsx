'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, ArrowUp } from 'lucide-react';

export default function Footer() {
  const { theme, setTheme } = useTheme();
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  
  // Only handle mounting for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <footer className="border-t border-border/40 py-2 mt-auto">
      <div className="w-full px-6 mx-auto">
        {/* Use grid for better centering of the middle element */}
        <div className="grid grid-cols-3 opacity-80">
          {/* Logo text and copyright in minimal form */}
          <div className="flex items-center space-x-2 col-span-1 justify-start">
            <span className="text-xs font-medium text-foreground opacity-70">
              Merch<span className="gradient-text">X</span>
            </span>
            <p className="text-xs text-muted-foreground hidden md:block">
              &copy; {currentYear}
            </p>
          </div>
          
          {/* Center Links - truly centered with grid */}
          <div className="flex items-center justify-center space-x-4 md:space-x-6 my-2 md:my-0 col-span-1 text-[10px]">
            <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
          
          {/* Actions - right aligned */}
          <div className="flex items-center space-x-1 col-span-1 justify-end">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1 rounded-md text-foreground/70 hover:text-foreground focus:outline-none transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {mounted && theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </button>
            
            <button
              onClick={scrollToTop}
              className="p-1 rounded-md text-foreground/70 hover:text-foreground focus:outline-none transition-colors"
              aria-label="Back to top"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
} 