/**
 * OnboardingAutomata.ts
 *
 * A state machine for managing onboarding process with improved reliability:
 * - Better error handling and recovery
 * - Simpler data structure
 * - More resilient API requests
 */

export type StepId = 'welcome' | 'business-profile' | 'inventory-setup' | 'payment-setup' | 'completion';

export interface Step {
  id: StepId;
  title: string;
  required: boolean;
}

export interface OnboardingData {
  // Use consistent naming to avoid mapping issues
  welcome: any;
  businessProfile: any;
  inventorySetup: any;
  paymentSetup: any;
  completion: any;
  [key: string]: any;
}

export interface OnboardingState {
  currentStepIndex: number;
  completedSteps: StepId[];
  activeStep: StepId;
  formData: OnboardingData;
  steps: Step[];
  hasUnsavedChanges: boolean;
  isCompleted: boolean;
  lastSavedAt?: Date;
  savingAttempts: number;
}

// Define all possible steps in the onboarding process
export const ONBOARDING_STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome', required: true },
  { id: 'business-profile', title: 'Business Profile', required: true },
  { id: 'inventory-setup', title: 'Inventory Setup', required: true },
  { id: 'payment-setup', title: 'Payment Setup', required: true },
  { id: 'completion', title: 'Completed', required: true },
];

// Define initial state
export const initialState: OnboardingState = {
  currentStepIndex: 0,
  completedSteps: [],
  activeStep: 'welcome',
  formData: {
    welcome: {},
    businessProfile: {},
    inventorySetup: { products: [] },
    paymentSetup: {},
    completion: {}
  },
  steps: ONBOARDING_STEPS,
  hasUnsavedChanges: false,
  isCompleted: false,
  savingAttempts: 0
};

// Get correct data key for a step ID
export function getDataKeyForStep(stepId: StepId): string {
  switch (stepId) {
    case 'business-profile': return 'businessProfile';
    case 'inventory-setup': return 'inventorySetup';
    case 'payment-setup': return 'paymentSetup';
    default: return stepId;
  }
}

// Transition actions for the state machine
export const transitions = {
  // Move to the next step
  next: (state: OnboardingState): OnboardingState => {
    const nextIndex = state.currentStepIndex + 1;
    if (nextIndex >= state.steps.length) {
      return state; // Already at the last step
    }
    
    return {
      ...state,
      currentStepIndex: nextIndex,
      activeStep: state.steps[nextIndex].id,
    };
  },
  
  // Move to the previous step
  previous: (state: OnboardingState): OnboardingState => {
    const prevIndex = state.currentStepIndex - 1;
    if (prevIndex < 0) {
      return state; // Already at the first step
    }
    
    return {
      ...state,
      currentStepIndex: prevIndex,
      activeStep: state.steps[prevIndex].id,
    };
  },
  
  // Update form data for a specific step
  updateFormData: (state: OnboardingState, stepId: StepId, data: any): OnboardingState => {
    const dataKey = getDataKeyForStep(stepId);
    
    const newFormData = {
      ...state.formData,
      [dataKey]: data
    };
    
    return {
      ...state,
      formData: newFormData,
      hasUnsavedChanges: true,
    };
  },
  
  // Mark a step as completed
  completeStep: (state: OnboardingState, stepId: StepId): OnboardingState => {
    // If step is already completed, no change needed
    if (state.completedSteps.includes(stepId)) {
      return state;
    }
    
    // Mark step as completed
    const newCompletedSteps = [...state.completedSteps, stepId];
    
    // Check if all onboarding is completed
    const isCompleted = state.steps.every(step => 
      !step.required || newCompletedSteps.includes(step.id)
    );
    
    return {
      ...state,
      completedSteps: newCompletedSteps,
      isCompleted,
      hasUnsavedChanges: true,
    };
  },

  // Mark all steps up to the current one as completed
  bulkComplete: (state: OnboardingState, upToStepId: StepId): OnboardingState => {
    const currentStepIndex = state.steps.findIndex(step => step.id === upToStepId);
    if (currentStepIndex === -1) return state;
    
    const stepsToComplete = state.steps
      .slice(0, currentStepIndex + 1)
      .map(step => step.id);
    
    const newCompletedSteps = [...new Set([...state.completedSteps, ...stepsToComplete])];
    
    return {
      ...state,
      completedSteps: newCompletedSteps,
      hasUnsavedChanges: true,
    };
  },
  
  // Load existing state from the server
  loadState: (_state: OnboardingState, loadedState: Partial<OnboardingState>): OnboardingState => {
    return {
      ..._state,
      ...loadedState,
      // Ensure we've got proper formData structure with all keys
      formData: {
        ..._state.formData,
        ...(loadedState.formData || {})
      },
      hasUnsavedChanges: false,
      lastSavedAt: new Date(),
      savingAttempts: 0
    };
  },
  
  // Mark state as saved
  markSaved: (state: OnboardingState): OnboardingState => {
    // Create a fresh copy of the state to avoid reference issues
    return {
      ...state,
      // Create a deep copy of formData to prevent accidental mutations
      formData: JSON.parse(JSON.stringify(state.formData)),
      completedSteps: [...state.completedSteps],
      hasUnsavedChanges: false,
      lastSavedAt: new Date(),
      savingAttempts: 0
    };
  },
  
  // Increment save attempts counter
  incrementSaveAttempts: (state: OnboardingState): OnboardingState => {
    return {
      ...state,
      savingAttempts: state.savingAttempts + 1
    };
  }
};

// Save progress to the server with improved error handling
export async function saveProgress(state: OnboardingState, stepId?: StepId, data?: any): Promise<boolean> {
  if (!state.hasUnsavedChanges && !data) return true;
  
  // Max retries for saving
  const maxRetries = 3;
  let currentRetry = 0;
  
  while (currentRetry <= maxRetries) {
    try {
      // Use AbortController to handle timeouts gracefully
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout
      
      try {
        const dataKey = stepId ? getDataKeyForStep(stepId) : getDataKeyForStep(state.activeStep);
        
        // Create a clean, simple payload with minimal data
        const requestData = {
          stepId: stepId || state.activeStep,
          completedSteps: state.completedSteps,
          formData: data || state.formData[dataKey] || {}
        };
        
        console.log('Saving onboarding progress:', {
          stepId: requestData.stepId,
          completedStepsCount: requestData.completedSteps.length
        });
        
        const response = await fetch('/api/onboarding/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal,
          credentials: 'include'
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
          console.error('User not authenticated for saving progress, retrying...');
          // Wait a bit before retrying in case of session restoration
          await new Promise(resolve => setTimeout(resolve, 1000));
          currentRetry++;
          continue;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error saving progress: ${response.status} - ${errorText}`);
          currentRetry++;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, currentRetry)));
          continue;
        }
        
        return true;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // If the request was aborted or failed, retry
        console.error('Error during onboarding save request (retry attempt ' + currentRetry + '):', fetchError);
        currentRetry++;
        // Exponential backoff 
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, currentRetry)));
        continue;
      }
    } catch (error) {
      console.error('Error saving onboarding progress (retry attempt ' + currentRetry + '):', error);
      currentRetry++;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, currentRetry)));
      continue;
    }
  }
  
  console.log('Failed to save progress after retries, proceeding anyway');
  return false;
}

// Auto-save debouncer with specified delay
export function createAutoSave(saveCallback: () => Promise<void>, delay = 2000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastSaveTime = 0;
  let isSaving = false;
  
  return (immediate = false) => {
    // If already saving, don't schedule another save
    if (isSaving) {
      console.log('Save in progress, not scheduling another');
      return;
    }
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // For immediate saves, check if we've saved recently
    if (immediate) {
      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTime;
      
      // If we saved recently, don't save again immediately
      if (timeSinceLastSave < 1000) {
        console.log('Saved too recently, skipping immediate save');
        return;
      }
      
      // Mark as saving
      isSaving = true;
      
      // Save and update last save time
      saveCallback().finally(() => {
        lastSaveTime = Date.now();
        isSaving = false;
      });
    } else {
      // For delayed saves, schedule with the delay
      timeoutId = setTimeout(() => {
        // Only save if we haven't saved too recently
        const now = Date.now();
        const timeSinceLastSave = now - lastSaveTime;
        
        if (timeSinceLastSave < 1000) {
          console.log('Saved too recently, skipping scheduled save');
          return;
        }
        
        // Mark as saving
        isSaving = true;
        
        // Save and update last save time
        saveCallback().finally(() => {
          lastSaveTime = Date.now();
          isSaving = false;
          timeoutId = null;
        });
      }, delay);
    }
  };
}

// Check if all required steps are completed
export function isOnboardingComplete(state: OnboardingState): boolean {
  // Check flag first
  if (state.isCompleted === true) {
    // Double-check that all required steps are actually completed
    const allRequiredStepsCompleted = state.steps
      .filter(step => step.required)
      .every(step => state.completedSteps.includes(step.id));
      
    // If all required steps are not completed, override the flag
    if (!allRequiredStepsCompleted) {
      console.log('Warning: isCompleted flag is true but not all required steps are completed');
      return false;
    }
    
    return true;
  }
  
  // If flag is false, do the step check
  return state.steps
    .filter(step => step.required)
    .every(step => state.completedSteps.includes(step.id));
}

// Get the next incomplete step
export function getNextIncompleteStep(state: OnboardingState): StepId | null {
  const nextStep = state.steps.find(
    step => step.required && !state.completedSteps.includes(step.id)
  );
  
  return nextStep ? nextStep.id : null;
}

// Calculate progress percentage
export function calculateProgress(state: OnboardingState): number {
  const requiredSteps = state.steps.filter(step => step.required);
  if (requiredSteps.length === 0) return 100;
  
  const completedRequired = requiredSteps.filter(
    step => state.completedSteps.includes(step.id)
  ).length;
  
  return Math.round((completedRequired / requiredSteps.length) * 100);
} 