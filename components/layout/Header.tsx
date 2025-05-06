'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Package, Sun, Moon, LogOut, User, Settings, Wand2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import ClientOnly from '@/components/shared/ClientOnly';
import ContentWrapper from './ContentWrapper';

export default function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  // Function to check onboarding status
  const checkOnboardingStatus = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/onboarding/status');
      if (response.ok) {
        const data = await response.json();
        // Check both possible field names (completed and complete)
        setOnboardingCompleted(data.completed === true || data.complete === true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  }, [session]);

  // Check onboarding status when session changes
  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  // Track scrolling to add background when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when route changes and refresh onboarding status
  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsThemeMenuOpen(false);
    
    // Re-check onboarding status when navigating to a different page
    checkOnboardingStatus();
  }, [pathname, checkOnboardingStatus]);
  
  // Handle clicks outside of the menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the profile menu
      if (isProfileMenuOpen && 
          profileMenuRef.current && 
          !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      
      // Check if the click is outside the mobile menu AND outside the hamburger button
      if (isMobileMenuOpen && 
          mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target as Node) &&
          hamburgerButtonRef.current &&
          !hamburgerButtonRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    
    // Handle browser navigation
    const handlePopState = () => {
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
      setIsThemeMenuOpen(false);
    };
    
    if (isProfileMenuOpen || isMobileMenuOpen || isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('popstate', handlePopState);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isProfileMenuOpen, isMobileMenuOpen, isThemeMenuOpen]);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = (event: React.MouseEvent) => {
    // Stop propagation to prevent the click from immediately triggering the document click handler
    event.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isProfileMenuOpen) setIsProfileMenuOpen(false);
  };

  const toggleTheme = () => {
    // No longer used directly, theme is set via setTheme() calls
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'backdrop-blur-lg bg-background/90 border-b border-border/80 shadow-sm' 
          : 'bg-background/30 backdrop-blur-md border-b border-border/40'
      }`} 
    >
      <ClientOnly>
        <ContentWrapper type="global">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center group">
                <div className="p-1 bg-gradient-to-r from-brand-blue to-brand-purple rounded-md mr-2 transition-transform group-hover:scale-110">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  Merch<span className="gradient-text">X</span>
                </span>
              </Link>
              
              {/* Desktop Navigation - moved here to be next to logo */}
              <nav className="hidden md:flex items-center space-x-1 ml-4">
                {session ? (
                  <>
                    <NavLink href="/" active={isActive('/')}>
                      Dashboard
                    </NavLink>
                    <NavLink href="/inventory" active={isActive('/inventory')}>
                      Inventory
                    </NavLink>
                    <NavLink href="/analytics" active={isActive('/analytics')}>
                      Analytics
                    </NavLink>

                  </>
                ) : (
                  <>
                    <NavLink href="/pricing" active={isActive('/pricing')}>
                      Pricing
                    </NavLink>
                    <NavLink href="/features" active={isActive('/features')}>
                      Features
                    </NavLink>
                  </>
                )}
              </nav>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-1">
              {session ? (
                <div className="relative ml-1 hidden md:block" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 flex items-center justify-center text-brand-blue dark:text-brand-purple border border-brand-blue/20 dark:border-brand-purple/20">
                      {session.user?.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                    </div>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-card border border-border backdrop-blur-sm focus:outline-none overflow-hidden">
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm font-medium border-b border-border/50">
                          {session.user?.name || 'User'}
                        </div>
                        <Link href="/profile" className="flex items-center px-4 py-2 text-sm hover:bg-primary/5">
                          <Settings className="h-4 w-4 mr-2 opacity-70" />
                          Settings
                        </Link>
                        {!onboardingCompleted && (
                          <Link href="/onboarding" className="flex items-center px-4 py-2 text-sm hover:bg-primary/5">
                            <Wand2 className="h-4 w-4 mr-2 opacity-70" />
                            Setup Wizard
                          </Link>
                        )}
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="flex w-full text-left items-center px-4 py-2 text-sm text-destructive hover:bg-destructive/5"
                        >
                          <LogOut className="h-4 w-4 mr-2 opacity-70" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center ml-1 space-x-2">
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-sm font-medium border border-border rounded-md transition-colors hover:bg-primary/5 flex items-center justify-center"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-1.5 text-sm font-medium bg-foreground text-background border border-foreground rounded-md transition-colors hover:opacity-90 flex items-center justify-center"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Hamburger Menu */}
              <button
                ref={hamburgerButtonRef}
                onClick={toggleMobileMenu}
                className="md:hidden ml-2 p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-primary/5 focus:outline-none transition-colors"
                aria-label="Toggle mobile menu"
              >
                <div className="w-6 flex flex-col items-center justify-center gap-1.5 relative h-6">
                  <span className={`block h-[2px] rounded-full bg-current absolute transition-all duration-300 ${
                    isMobileMenuOpen 
                      ? 'w-6 rotate-45 bg-gradient-to-r from-brand-blue to-brand-purple' 
                      : 'w-6 translate-y-[-5px]'
                  }`}></span>
                  <span className={`block h-[2px] rounded-full bg-current absolute transition-all duration-300 ${
                    isMobileMenuOpen 
                      ? 'w-0 opacity-0' 
                      : 'w-4 opacity-100'
                  }`}></span>
                  <span className={`block h-[2px] rounded-full bg-current absolute transition-all duration-300 ${
                    isMobileMenuOpen 
                      ? 'w-6 -rotate-45 bg-gradient-to-r from-brand-blue to-brand-purple' 
                      : 'w-5 translate-y-[5px]'
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </ContentWrapper>
      </ClientOnly>
      
      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef} 
          className="md:hidden py-2 px-3 pb-3 bg-background/95 backdrop-blur-sm rounded-lg border border-border/40 shadow-lg mx-4 mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!session && (
            <div className="mb-3 space-y-1.5">
              <Link 
                href="/register" 
                className="block w-full px-4 py-2 text-sm font-medium text-center bg-background text-foreground border border-border rounded-md hover:bg-primary/5"
              >
                Sign Up
              </Link>
              <Link 
                href="/login" 
                className="block w-full px-4 py-2 text-sm font-medium text-center bg-foreground text-background border border-foreground rounded-md hover:opacity-90"
              >
                Log In
              </Link>
            </div>
          )}
          
          {!session && <div className="border-t border-border"></div>}
          
          <nav>
            <div className="space-y-0 py-3">
              {session ? (
                <>
                  <MobileNavLink href="/">Dashboard</MobileNavLink>
                  <MobileNavLink href="/inventory">Inventory</MobileNavLink>
                  <MobileNavLink href="/analytics">Analytics</MobileNavLink>
                  <div className="border-t border-border mt-2 pt-2"></div>
                  <MobileNavLink href="/profile">
                    Settings
                  </MobileNavLink>
                  {!onboardingCompleted && (
                    <MobileNavLink href="/onboarding">
                      <Wand2 className="h-4 w-4 mr-2 opacity-70" />
                      Setup Wizard
                    </MobileNavLink>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center justify-start px-3 py-1.5 rounded-md text-destructive hover:bg-destructive/5 text-sm font-medium"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/features">Features</MobileNavLink>
                  <MobileNavLink href="/pricing">Pricing</MobileNavLink>
                </>
              )}
              
              <div className="border-t border-border mt-2 pt-2"></div>
              
              {/* Light/Dark mode toggle */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Theme</p>
                  <div className="flex items-center bg-muted/30 p-0.5 rounded-full">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center rounded-full p-1 text-sm transition-colors ${
                        theme === 'light' 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-foreground/60 hover:text-foreground/80'
                      }`}
                      aria-label="Light theme"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center rounded-full p-1 text-sm transition-colors ${
                        theme === 'dark' 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-foreground/60 hover:text-foreground/80'
                      }`}
                      aria-label="Dark theme"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
      
      {/* Add a subtle gradient line at the bottom for better separation */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border/30 to-transparent"></div>
    </header>
  );
}

// Desktop Navigation Link component
function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors relative ${
        active 
          ? 'text-foreground' 
          : 'text-foreground/70 hover:text-foreground hover:bg-primary/5'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-1/2 bg-gradient-to-r from-brand-blue to-brand-purple rounded-full" />
      )}
    </Link>
  );
}

// Mobile Navigation Link component
function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href} 
      className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/5 text-foreground'
          : 'hover:bg-primary/5 text-foreground/80 hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  );
} 