'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Toaster, toast } from 'sonner';

// Define the shape of our notification preferences
export interface NotificationPreferences {
  success: boolean;
  error: boolean;
  info: boolean;
}

// Create a context to hold our notification preferences and methods
interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (newPreferences: Partial<NotificationPreferences>) => Promise<void>;
  showNotification: (type: 'success' | 'error' | 'info', message: string, options?: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create the provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  // Initialize with default values (all enabled)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    success: true,
    error: true,
    info: true,
  });
  
  // Store original toast methods
  // moved outside of the component state to prevent recreation on every render
  const originalToast = React.useRef({
    success: toast.success,
    error: toast.error,
    info: toast.info
  });
  
  // Function to update preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>): Promise<void> => {
    try {
      // Update local state
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);
      
      // Save to localStorage for immediate effect
      localStorage.setItem('notificationPreferences', JSON.stringify(updatedPreferences));
      
      // Save to API if user is logged in
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/notification-preferences', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedPreferences),
          });
          
          if (!response.ok) {
            console.warn('Failed to save notification preferences to API');
          }
        } catch (error) {
          console.warn('Error saving notification preferences to API:', error);
        }
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return Promise.reject(error);
    }
  };
  
  // Load preferences from API or localStorage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      // Try to load from API first
      try {
        const response = await fetch('/api/notification-preferences');
        if (response.ok) {
          const apiPreferences = await response.json();
          setPreferences({
            success: apiPreferences.success ?? true,
            error: apiPreferences.error ?? true,
            info: apiPreferences.info ?? true,
          });
          return;
        }
      } catch (error) {
        console.warn('Error loading notification preferences from API:', error);
      }
      
      // Fall back to localStorage if API fails or user is not logged in
      const storedPreferences = localStorage.getItem('notificationPreferences');
      if (storedPreferences) {
        try {
          const parsedPreferences = JSON.parse(storedPreferences);
          setPreferences({
            success: parsedPreferences.success ?? true,
            error: parsedPreferences.error ?? true,
            info: parsedPreferences.info ?? true,
          });
        } catch (error) {
          console.error('Failed to parse notification preferences:', error);
        }
      }
    };
    
    loadPreferences();
  }, []);
  
  // Enhanced notification function that respects user preferences
  const showNotification = (type: 'success' | 'error' | 'info', message: string, options?: any) => {
    // Only show notification if the user has enabled this type
    if (preferences[type]) {
      originalToast.current[type](message, options);
    }
  };
  
  // Override the standard toast functions to respect preferences
  useEffect(() => {
    // override toast methods with our preference-aware versions
    toast.success = (message: string, options?: any) => {
      if (preferences.success) {
        return originalToast.current.success(message, options);
      }
      // Return empty promise to maintain API compatibility
      return Promise.resolve();
    };
    
    toast.error = (message: string, options?: any) => {
      if (preferences.error) {
        return originalToast.current.error(message, options);
      }
      // Return empty promise to maintain API compatibility
      return Promise.resolve();
    };
    
    toast.info = (message: string, options?: any) => {
      if (preferences.info) {
        return originalToast.current.info(message, options);
      }
      // Return empty promise to maintain API compatibility
      return Promise.resolve();
    };
    
    // cleanup function to restore original methods when component unmounts
    return () => {
      toast.success = originalToast.current.success;
      toast.error = originalToast.current.error;
      toast.info = originalToast.current.info;
    };
  }, [preferences]); // re-run when preferences change
  
  return (
    <NotificationContext.Provider value={{ preferences, updatePreferences, showNotification }}>
      {children}
      <Toaster position="top-right" />
    </NotificationContext.Provider>
  );
}

// Create a hook for easy access to the notification context
export function useToast() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 