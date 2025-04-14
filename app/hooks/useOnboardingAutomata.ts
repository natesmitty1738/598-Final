/**
 * useOnboardingAutomata.ts
 * 
 * A React hook for managing onboarding state with automatic saving.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  OnboardingState, 
  StepId, 
  transitions, 
  initialState, 
  saveProgress, 
  createAutoSave,
  isOnboardingComplete,
  getNextIncompleteStep
} from '../services/OnboardingAutomata';

// User activity tracking constants
const ACTIVITY_TIMEOUT = 5000; // Time in ms to wait before considering the user inactive
const AUTO_SAVE_DELAY = 2000; // Time in ms to wait before auto-saving

export default function useOnboardingAutomata() {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for tracking user activity
  const lastActivityRef = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Create auto-save function
  const performSave = useCallback(async () => {
    if (!state.hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      const success = await saveProgress(state);
      if (success) {
        setState(transitions.markSaved(state));
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
      setError('Failed to auto-save your progress');
    } finally {
      setIsSaving(false);
    }
  }, [state]);
  
  const autoSave = createAutoSave(performSave, AUTO_SAVE_DELAY);
  
  // Track user activity
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);
  
  // Set up activity tracking
  useEffect(() => {
    const trackActivity = () => registerActivity();
    
    // Add event listeners to track user activity
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('click', trackActivity);
    window.addEventListener('scroll', trackActivity);
    window.addEventListener('touchstart', trackActivity);
    
    // Check for inactivity and save if needed
    const checkActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      if (timeSinceLastActivity > ACTIVITY_TIMEOUT && state.hasUnsavedChanges) {
        performSave();
      }
    };
    
    // Set up interval to check activity
    const activityInterval = setInterval(checkActivity, ACTIVITY_TIMEOUT);
    
    // Set up auto-save when component unmounts or before navigation
    const handleBeforeUnload = () => {
      if (state.hasUnsavedChanges) {
        performSave();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(activityInterval);
      
      // Final save on unmount if needed
      if (state.hasUnsavedChanges) {
        performSave();
      }
      
      // Clear any pending save timeouts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [registerActivity, performSave, state.hasUnsavedChanges]);
  
  // Auto-save when state changes with unsaved changes
  useEffect(() => {
    if (state.hasUnsavedChanges) {
      autoSave();
    }
  }, [state, autoSave]);
  
  // Load initial onboarding state from the server
  useEffect(() => {
    const fetchOnboardingState = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/onboarding/status');
        if (response.ok) {
          const data = await response.json();
          
          // Map server data to our state structure
          const loadedState: Partial<OnboardingState> = {
            completedSteps: data.completedSteps || [],
            isCompleted: data.completed || false,
            formData: data.userData || initialState.formData,
          };
          
          // Find the next incomplete step if any
          if (loadedState.completedSteps?.length) {
            const nextIncompleteIndex = initialState.steps.findIndex(
              step => !loadedState.completedSteps?.includes(step.id)
            );
            
            if (nextIncompleteIndex !== -1) {
              loadedState.currentStepIndex = nextIncompleteIndex;
              loadedState.activeStep = initialState.steps[nextIncompleteIndex].id;
            }
          }
          
          setState(transitions.loadState(initialState, loadedState));
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
        setError('Failed to load your onboarding progress');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOnboardingState();
  }, []);
  
  // State transition functions
  const nextStep = useCallback(() => {
    setState(transitions.next(state));
    registerActivity();
  }, [state, registerActivity]);
  
  const previousStep = useCallback(() => {
    setState(transitions.previous(state));
    registerActivity();
  }, [state, registerActivity]);
  
  const updateStepData = useCallback((stepId: StepId, data: any) => {
    setState(transitions.updateFormData(state, stepId, data));
    registerActivity();
    autoSave();
  }, [state, registerActivity, autoSave]);
  
  const completeStep = useCallback(async (stepId: StepId, data?: any) => {
    if (data) {
      setState(transitions.updateFormData(state, stepId, data));
    }
    
    setState(prev => transitions.completeStep(prev, stepId));
    registerActivity();
    
    // Immediate save when completing a step
    setIsSaving(true);
    try {
      await saveProgress(
        transitions.completeStep(state, stepId), 
        stepId, 
        data || state.formData[stepId]
      );
    } catch (error) {
      console.error('Error saving step completion:', error);
      setError('Failed to save your progress');
    } finally {
      setIsSaving(false);
    }
    
    // Auto advance to next step
    nextStep();
  }, [state, registerActivity, nextStep]);
  
  // Force save the current state
  const forceSave = useCallback(async () => {
    await performSave();
  }, [performSave]);
  
  return {
    state,
    isLoading,
    isSaving,
    error,
    nextStep,
    previousStep,
    updateStepData,
    completeStep,
    forceSave,
    isComplete: isOnboardingComplete(state),
    activeStep: state.activeStep,
    currentStepIndex: state.currentStepIndex,
    completedSteps: state.completedSteps,
    formData: state.formData,
    hasUnsavedChanges: state.hasUnsavedChanges,
    getNextIncompleteStep: () => getNextIncompleteStep(state),
  };
} 