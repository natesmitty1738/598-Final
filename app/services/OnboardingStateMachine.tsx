/**
 * OnboardingStateMachine.tsx
 * 
 * Defines the state machine for the onboarding flow, including state transitions
 * and persistence logic.
 */

import { createMachine, assign } from 'xstate';
import { OnboardingData, StepId } from './OnboardingAutomata';

// Define the context shape for our state machine
export interface OnboardingContext {
  completedSteps: StepId[];
  activeStep: StepId;
  formData: OnboardingData;
  isDirty: boolean;
  lastSaved?: Date;
  error?: string;
}

// Define all possible events for the state machine
export type OnboardingEvent =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'GOTO'; step: StepId }
  | { type: 'COMPLETE_STEP'; stepId: StepId; data?: any }
  | { type: 'UPDATE_DATA'; stepId: StepId; data: any }
  | { type: 'SAVE'; immediate?: boolean }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'LOAD_STATE'; state: Partial<OnboardingContext> };

// Define the states for our machine
export const steps: StepId[] = ['welcome', 'business-profile', 'inventory-setup', 'payment-setup', 'completion'];

// Initial context
export const initialContext: OnboardingContext = {
  completedSteps: [],
  activeStep: 'welcome',
  formData: {
    businessProfile: null,
    initialInventory: [],
    paymentSetup: null,
  },
  isDirty: false,
};

// Create onboarding state machine
export const onboardingMachine = createMachine<OnboardingContext, OnboardingEvent>({
  id: 'onboarding',
  initial: 'loading',
  context: initialContext,
  states: {
    loading: {
      on: {
        LOAD_STATE: {
          target: 'idle',
          actions: assign((ctx, event) => ({
            ...ctx,
            ...event.state,
            isDirty: false,
            lastSaved: new Date(),
          })),
        },
      },
    },
    idle: {
      on: {
        NEXT: {
          target: 'idle',
          actions: assign((ctx) => {
            const currentIndex = steps.indexOf(ctx.activeStep);
            const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
            return {
              ...ctx,
              activeStep: steps[nextIndex],
              isDirty: true,
            };
          }),
        },
        PREVIOUS: {
          target: 'idle',
          actions: assign((ctx) => {
            const currentIndex = steps.indexOf(ctx.activeStep);
            const prevIndex = Math.max(currentIndex - 1, 0);
            return {
              ...ctx,
              activeStep: steps[prevIndex],
            };
          }),
        },
        GOTO: {
          target: 'idle',
          actions: assign((ctx, event) => ({
            ...ctx,
            activeStep: event.step,
            isDirty: true,
          })),
        },
        COMPLETE_STEP: {
          target: 'saving',
          actions: assign((ctx, event) => {
            // Update form data if provided
            const newFormData = event.data
              ? {
                  ...ctx.formData,
                  [event.stepId === 'business-profile'
                    ? 'businessProfile'
                    : event.stepId === 'inventory-setup'
                    ? 'initialInventory'
                    : event.stepId === 'payment-setup'
                    ? 'paymentSetup'
                    : event.stepId]: event.data,
                }
              : ctx.formData;

            // Add step to completed steps if not already included
            const newCompletedSteps = ctx.completedSteps.includes(event.stepId)
              ? ctx.completedSteps
              : [...ctx.completedSteps, event.stepId];

            // Find the next step
            const currentIndex = steps.indexOf(event.stepId);
            const nextIndex = Math.min(currentIndex + 1, steps.length - 1);

            return {
              ...ctx,
              formData: newFormData,
              completedSteps: newCompletedSteps,
              activeStep: steps[nextIndex],
              isDirty: true,
            };
          }),
        },
        UPDATE_DATA: {
          target: 'idle',
          actions: assign((ctx, event) => {
            const newFormData = {
              ...ctx.formData,
              [event.stepId === 'business-profile'
                ? 'businessProfile'
                : event.stepId === 'inventory-setup'
                ? 'initialInventory'
                : event.stepId === 'payment-setup'
                ? 'paymentSetup'
                : event.stepId]: event.data,
            };

            return {
              ...ctx,
              formData: newFormData,
              isDirty: true,
            };
          }),
        },
        SAVE: {
          target: 'saving',
        },
      },
    },
    saving: {
      on: {
        SAVE_SUCCESS: {
          target: 'idle',
          actions: assign((ctx) => ({
            ...ctx,
            isDirty: false,
            lastSaved: new Date(),
            error: undefined,
          })),
        },
        SAVE_ERROR: {
          target: 'idle',
          actions: assign((ctx, event) => ({
            ...ctx,
            error: event.error,
          })),
        },
      },
    },
  },
});

// Action creators for the state machine
export const onboardingActions = {
  next: () => ({ type: 'NEXT' }),
  previous: () => ({ type: 'PREVIOUS' }),
  goTo: (step: StepId) => ({ type: 'GOTO', step }),
  completeStep: (stepId: StepId, data?: any) => ({ type: 'COMPLETE_STEP', stepId, data }),
  updateData: (stepId: StepId, data: any) => ({ type: 'UPDATE_DATA', stepId, data }),
  save: (immediate?: boolean) => ({ type: 'SAVE', immediate }),
  saveSuccess: () => ({ type: 'SAVE_SUCCESS' }),
  saveError: (error: string) => ({ type: 'SAVE_ERROR', error }),
  loadState: (state: Partial<OnboardingContext>) => ({ type: 'LOAD_STATE', state }),
};

// Helper functions
export function isStepComplete(state: OnboardingContext, stepId: StepId): boolean {
  return state.completedSteps.includes(stepId);
}

export function getStepIndex(stepId: StepId): number {
  return steps.indexOf(stepId);
}

export function isLastStep(stepId: StepId): boolean {
  return getStepIndex(stepId) === steps.length - 1;
}

export function getNextIncompleteStep(state: OnboardingContext): StepId | null {
  for (const step of steps) {
    if (!state.completedSteps.includes(step)) {
      return step;
    }
  }
  return null;
}

export function calculateProgress(state: OnboardingContext): number {
  const completedCount = state.completedSteps.length;
  return Math.round((completedCount / steps.length) * 100);
} 