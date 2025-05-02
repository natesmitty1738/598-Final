'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Package, Sun, Moon, LogOut, User, Settings, Wand2, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import ClientOnly from '@/components/shared/ClientOnly';

export default function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Track scrolling to add background when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
        <div className="w-full px-6">
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
                    <NavLink href="/dashboard" active={isActive('/dashboard')}>
                      Dashboard
                    </NavLink>
                    <NavLink href="/inventory" active={isActive('/inventory')}>
                      Inventory
                    </NavLink>
                    <NavLink href="/sales" active={isActive('/sales')}>
                      Sales
                    </NavLink>
                    <NavLink href="/analytics" active={isActive('/analytics')}>
                      Analytics
                    </NavLink>
                    <NavLink href="/reports" active={isActive('/reports')}>
                      Reports
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
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-foreground/70 hover:text-foreground focus:outline-none transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {session ? (
                <div className="relative ml-1">
                  <button
                    onClick={toggleMenu}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 flex items-center justify-center text-brand-blue dark:text-brand-purple border border-brand-blue/20 dark:border-brand-purple/20">
                      {session.user?.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                    </div>
                  </button>

                  {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-card border border-border backdrop-blur-sm focus:outline-none overflow-hidden">
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm font-medium border-b border-border/50">
                          {session.user?.name || 'User'}
                        </div>
                        <Link href="/profile" className="flex items-center px-4 py-2 text-sm hover:bg-primary/5">
                          <User className="h-4 w-4 mr-2 opacity-70" />
                          Profile
                        </Link>
                        <Link href="/onboarding" className="flex items-center px-4 py-2 text-sm hover:bg-primary/5">
                          <Wand2 className="h-4 w-4 mr-2 opacity-70" />
                          Setup Wizard
                        </Link>
                        <Link href="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-primary/5">
                          <Settings className="h-4 w-4 mr-2 opacity-70" />
                          Settings
                        </Link>
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
                <div className="flex items-center ml-1 space-x-1">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-primary/5"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Simple hamburger menu button */}
              <button
                onClick={toggleMenu}
                className="md:hidden ml-2 p-2 text-foreground/70 hover:text-foreground focus:outline-none"
                aria-label="Toggle menu"
              >
                <div className="w-5 flex flex-col gap-1.5">
                  <span className="block h-0.5 w-5 bg-current rounded-sm"></span>
                  <span className="block h-0.5 w-5 bg-current rounded-sm"></span>
                  <span className="block h-0.5 w-5 bg-current rounded-sm"></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </ClientOnly>
      
      {/* Simple dropdown menu for mobile */}
      {isMenuOpen && (
        <div className="md:hidden py-3 px-4 mt-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border/40 shadow-lg mx-4">
          <nav>
            <div className="space-y-1 py-2">
              {session ? (
                <>
                  <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink href="/inventory">Inventory</MobileNavLink>
                  <MobileNavLink href="/sales">Sales</MobileNavLink>
                  <MobileNavLink href="/analytics">Analytics</MobileNavLink>
                  <MobileNavLink href="/reports">Reports</MobileNavLink>
                  <div className="my-2 h-px bg-border/20"></div>
                  <MobileNavLink href="/profile">Profile</MobileNavLink>
                  <MobileNavLink href="/settings">Settings</MobileNavLink>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center justify-start px-3 py-2 rounded-md text-destructive hover:bg-destructive/5 text-sm font-medium"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/pricing">Pricing</MobileNavLink>
                  <MobileNavLink href="/features">Features</MobileNavLink>
                  <div className="my-2 h-px bg-border/20"></div>
                  <MobileNavLink href="/login">Log in</MobileNavLink>
                  <Link 
                    href="/register" 
                    className="block w-full btn-primary text-center mt-2 py-2 text-sm"
                  >
                    Sign up
                  </Link>
                </>
              )}
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
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
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
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/5 text-foreground'
          : 'hover:bg-primary/5 text-foreground/80 hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  );
} 