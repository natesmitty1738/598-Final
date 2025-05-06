/**
 * 1. Uses localStorage for all form data until explicit save/completion 
 * 2. Only sends data to server on these events:
 *    - Explicit save by clicking Save button
 *    - Completion of the entire process
 *    - Navigating away (beforeunload)
 * 3. Batches data to reduce API calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Types
export type StepId = 'welcome' | 'business-profile' | 'inventory-setup' | 'payment-setup';

export interface OnboardingState {
  currentStepIndex: number;
  completedSteps: StepId[];
  activeStep: StepId;
  formData: {
    welcome: any;
    businessProfile: any;
    inventorySetup: any;
    paymentSetup: any;
    [key: string]: any;
  };
  hasUnsavedChanges: boolean;
  isCompleted: boolean;
  lastSavedAt?: Date;
}

// Constants
const STEPS: { id: StepId; title: string }[] = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'business-profile', title: 'Business Profile' },
  { id: 'inventory-setup', title: 'Inventory Setup' },
  { id: 'payment-setup', title: 'Payment Setup' },
];

const STORAGE_KEY = 'onboarding_state';
const ACTIVITY_TIMEOUT = 60000; // 60 seconds before saving on inactivity

// Get data key for a step ID
export function getDataKeyForStep(stepId: StepId): string {
  switch (stepId) {
    case 'business-profile': return 'businessProfile';
    case 'inventory-setup': return 'inventorySetup';
    case 'payment-setup': return 'paymentSetup';
    default: return stepId;
  }
}

// Initial state
const initialState: OnboardingState = {
  currentStepIndex: 0,
  completedSteps: [],
  activeStep: 'welcome',
  formData: {
    welcome: {},
    businessProfile: {},
    inventorySetup: { products: [] },
    paymentSetup: {}
  },
  hasUnsavedChanges: false,
  isCompleted: false,
};

// Helper for localStorage operations
const storage = {
  save: (state: OnboardingState): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStepIndex: state.currentStepIndex,
        completedSteps: state.completedSteps,
        activeStep: state.activeStep,
        formData: state.formData,
        isCompleted: state.isCompleted
      }));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  },
  load: (): Partial<OnboardingState> | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      return null;
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
  }
};

export default function useOnboardingAutomata() {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for tracking user activity
  const lastActivityRef = useRef<number>(Date.now());
  
  // Server save function
  const saveToServer = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Create a clean, simple payload with all data
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: state.activeStep,
          completedSteps: state.completedSteps,
          formData: state.formData[getDataKeyForStep(state.activeStep)]
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        lastSavedAt: new Date()
      }));
      
      return true;
    } catch (err) {
      console.error('Error saving onboarding progress:', err);
      setError('Failed to save progress. Changes are stored locally.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state]);
  
  // Mark onboarding as complete
  const markComplete = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark onboarding as complete');
      }
      
      return true;
    } catch (error) {
      console.error('Error during completion:', error);
      return false;
    }
  }, []);
  
  // Register activity to track user interaction
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (error) setError(null);
  }, [error]);
  
  // Set up activity tracking
  useEffect(() => {
    const trackActivity = () => registerActivity();
    
    // Add event listeners for user activity
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('click', trackActivity);
    window.addEventListener('scroll', trackActivity);
    window.addEventListener('touchstart', trackActivity);
    
    // Check for inactivity and save to localStorage only
    const checkActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      if (timeSinceLastActivity > ACTIVITY_TIMEOUT && state.hasUnsavedChanges) {
        storage.save(state);
        setState(prev => ({ ...prev, hasUnsavedChanges: false }));
      }
    };
    
    const activityInterval = setInterval(checkActivity, ACTIVITY_TIMEOUT);
    
    // Save data when navigating away
    const handleBeforeUnload = () => {
      if (state.hasUnsavedChanges) {
        storage.save(state);
        
        // Attempt to save to server synchronously (not guaranteed to complete)
        const formData = new FormData();
        formData.append('stepId', state.activeStep);
        formData.append('completedSteps', JSON.stringify(state.completedSteps));
        formData.append('formData', JSON.stringify(state.formData[getDataKeyForStep(state.activeStep)]));
        
        navigator.sendBeacon('/api/onboarding/progress', formData);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Clean up all listeners
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(activityInterval);
      
      // Final save
      if (state.hasUnsavedChanges) {
        storage.save(state);
      }
    };
  }, [registerActivity, state]);
  
  // Initialize state on mount
  useEffect(() => {
    async function initialize() {
      try {
        // First try to load from localStorage for instant display
        const localState = storage.load();
        
        if (localState) {
          setState(current => ({
            ...current,
            ...localState,
            hasUnsavedChanges: false
          }));
        }
        
        // Then try to fetch from server
        const response = await fetch('/api/onboarding/status');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.completedSteps?.length > 0) {
            // Merge server data with localStorage data, prioritizing server for completion status
            setState(current => ({
              ...current,
              completedSteps: data.completedSteps || current.completedSteps,
              activeStep: data.activeStep || current.activeStep,
              currentStepIndex: data.currentStepIndex !== undefined 
                ? data.currentStepIndex 
                : current.currentStepIndex,
              formData: {
                ...current.formData,
                ...(data.formData || {})
              },
              isCompleted: data.completed || current.isCompleted,
              hasUnsavedChanges: false
            }));
          }
        } else {
          // Use local state instead
          setIsLoading(false);
          
          // Create toast notification about offline mode
          toast.error("Connection issue", {
            description: "Unable to connect to the server. Using local state."
          });
        }
      } catch (err) {
        console.error('Error initializing onboarding state:', err);
        // If we have localStorage data, we can continue with that
      } finally {
        setIsLoading(false);
      }
    }
    
    initialize();
  }, []);
  
  // Update form data
  const updateStepData = useCallback((stepId: StepId, data: any) => {
    const dataKey = getDataKeyForStep(stepId);
    
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [dataKey]: data
      },
      hasUnsavedChanges: true
    }));
    
    // Save to localStorage immediately but don't mark as saved to server
    storage.save({
      ...state,
      formData: {
        ...state.formData,
        [dataKey]: data
      }
    });
  }, [state]);
  
  // Move to next step
  const nextStep = useCallback(() => {
    if (state.currentStepIndex >= STEPS.length - 1) return;
    
    setState(prev => ({
      ...prev,
      currentStepIndex: prev.currentStepIndex + 1,
      activeStep: STEPS[prev.currentStepIndex + 1].id
    }));
    
    // Save to localStorage when changing steps
    storage.save({
      ...state,
      currentStepIndex: state.currentStepIndex + 1,
      activeStep: STEPS[state.currentStepIndex + 1].id
    });
  }, [state]);
  
  // Move to previous step
  const previousStep = useCallback(() => {
    if (state.currentStepIndex <= 0) return;
    
    setState(prev => ({
      ...prev,
      currentStepIndex: prev.currentStepIndex - 1,
      activeStep: STEPS[prev.currentStepIndex - 1].id
    }));
    
    // Save to localStorage when changing steps
    storage.save({
      ...state,
      currentStepIndex: state.currentStepIndex - 1,
      activeStep: STEPS[state.currentStepIndex - 1].id
    });
  }, [state]);
  
  // Mark step as completed and optionally move to next step
  const completeStep = useCallback(async (stepId: StepId, data?: any) => {
    // Update data if provided
    if (data) {
      updateStepData(stepId, data);
    }
    
    // Don't add duplicates
    if (!state.completedSteps.includes(stepId)) {
      // Add to completed steps
      const newCompletedSteps = [...state.completedSteps, stepId];
      
      setState(prev => ({
        ...prev,
        completedSteps: newCompletedSteps,
        isCompleted: stepId === 'payment-setup',
        hasUnsavedChanges: true
      }));
      
      // Save to localStorage
      storage.save({
        ...state,
        completedSteps: newCompletedSteps,
        isCompleted: stepId === 'payment-setup'
      });
      
      // If this is the final step, save to server and mark complete
      if (stepId === 'payment-setup') {
        try {
          // Save progress first
          await saveToServer();
          
          // Then mark as complete
          const success = await markComplete();
          
          if (success) {
            // Clear localStorage on successful completion
            storage.clear();
            
            toast.success("Setup complete!", {
              description: "Your account is ready to use"
            });
          }
        } catch (error) {
          console.error('Error during completion:', error);
          setError('There was an issue completing your setup, but your progress is saved.');
        }
      }
    }
  }, [state, updateStepData, saveToServer, markComplete]);
  
  // Manually save progress
  const saveProgress = useCallback(async () => {
    const success = await saveToServer();
    
    if (success) {
      toast.success("Progress saved!", { 
        description: "Your changes have been saved"
      });
    }
  }, [saveToServer]);
  
  // Reset error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    state,
    isLoading,
    isSaving,
    error,
    clearError,
    nextStep,
    previousStep,
    updateStepData,
    completeStep,
    saveProgress,
    activeStep: state.activeStep,
    currentStepIndex: state.currentStepIndex,
    completedSteps: state.completedSteps,
    formData: state.formData,
    currentStepData: state.formData[getDataKeyForStep(state.activeStep)] || {},
    hasUnsavedChanges: state.hasUnsavedChanges,
    steps: STEPS
  };
} 