/**
 * OnboardingAutomata.ts
 *
 * A state machine for automating the onboarding process and ensuring
 * user progress is saved automatically, even with interruptions.
 */

export type StepId = 'welcome' | 'business-profile' | 'inventory-setup' | 'payment-setup' | 'completion';

export interface Step {
  id: StepId;
  title: string;
  required: boolean;
}

export interface OnboardingData {
  businessProfile: any;
  initialInventory: any[];
  paymentSetup: any;
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
    businessProfile: null,
    initialInventory: [],
    paymentSetup: null,
  },
  steps: ONBOARDING_STEPS,
  hasUnsavedChanges: false,
  isCompleted: false,
};

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
      hasUnsavedChanges: true,
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
  
  // Update form data for the current step
  updateFormData: (state: OnboardingState, stepId: StepId, data: any): OnboardingState => {
    const newFormData = {
      ...state.formData,
      [stepId === 'business-profile' ? 'businessProfile' : 
        stepId === 'inventory-setup' ? 'initialInventory' : 
        stepId === 'payment-setup' ? 'paymentSetup' : stepId]: data,
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
      hasUnsavedChanges: false,
      lastSavedAt: new Date(),
    };
  },
  
  // Mark state as saved
  markSaved: (state: OnboardingState): OnboardingState => {
    return {
      ...state,
      hasUnsavedChanges: false,
      lastSavedAt: new Date(),
    };
  }
};

// Save progress to the server
export async function saveProgress(state: OnboardingState, stepId?: StepId, data?: any): Promise<boolean> {
  if (!state.hasUnsavedChanges && !data) return true;
  
  try {
    const response = await fetch('/api/onboarding/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stepId: stepId || state.activeStep,
        data: data || state.formData[stepId || state.activeStep],
        allData: state.formData,
        completedSteps: state.completedSteps,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    return false;
  }
}

// Helpers for the automata

// Auto-save debouncer with a specified delay
export function createAutoSave(saveCallback: () => Promise<void>, delay = 2000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (immediate = false) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (immediate) {
      saveCallback();
    } else {
      timeoutId = setTimeout(() => {
        saveCallback();
        timeoutId = null;
      }, delay);
    }
  };
}

// Check if all required steps are completed
export function isOnboardingComplete(state: OnboardingState): boolean {
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