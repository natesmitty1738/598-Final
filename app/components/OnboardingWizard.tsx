'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Loader2, Save } from 'lucide-react';
import { ANIMATION, GRADIENTS } from './ThemeConstants';
import useOnboardingAutomata from '../hooks/useOnboardingAutomata';
import { StepId } from '../services/OnboardingAutomata';

// Import step components
import WelcomeStep from './onboarding/WelcomeStep';
import BusinessProfileStep from './onboarding/BusinessProfileStep';
import InventorySetupStep from './onboarding/InventorySetupStep';
import PaymentSetupStep from './onboarding/PaymentSetupStep';
import CompletionStep from './onboarding/CompletionStep';

// Define the steps in the onboarding process
const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'business-profile', title: 'Business Profile' },
  { id: 'inventory-setup', title: 'Inventory Setup' },
  { id: 'payment-setup', title: 'Payment Setup' },
  { id: 'completion', title: 'Completed' },
];

export default function OnboardingWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Use the onboarding automata for robust state management
  const {
    state,
    isLoading,
    isSaving,
    error,
    nextStep,
    previousStep,
    updateStepData,
    completeStep,
    activeStep,
    currentStepIndex,
    completedSteps,
    formData,
    hasUnsavedChanges
  } = useOnboardingAutomata();
  
  // If isLoading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="bg-gradient-to-r from-brand-blue/5 to-brand-purple/5 rounded-full p-12 flex items-center justify-center">
          <div className="w-16 h-16 relative">
            <Loader2 className="w-16 h-16 text-brand-blue animate-spin" />
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-brand-purple animate-spin animation-delay-150"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const handleStepComplete = (stepId: StepId, data?: any) => {
    completeStep(stepId, data);
  };
  
  // Get current step
  const currentStep = state.steps[currentStepIndex];
  
  // Calculate progress percentage
  const progressPercentage = (completedSteps.length / state.steps.length) * 100;
  
  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Header - reduced padding and more compact layout */}
      <div className="border-b border-border/30 bg-card/30 backdrop-blur-sm py-2 fixed top-16 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Setup Wizard</h1>
            <p className="text-xs text-muted-foreground">Complete your business setup</p>
          </div>
          
          {/* Progress bar - moved to right side for more compact layout */}
          <div className="w-1/3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-blue to-brand-purple rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-16 pb-16">
        {/* Error message if any */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800/30">
            {error}
          </div>
        )}

        {/* Steps indicator */}
        <div className="mb-8 flex items-center justify-between px-2">
          {state.steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                    completedSteps.includes(step.id)
                      ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg'
                      : index === currentStepIndex
                      ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-lg ring-4 ring-brand-blue/20 dark:ring-brand-purple/20'
                      : 'border-2 border-muted bg-card text-muted-foreground'
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold text-sm">{index + 1}</span>
                  )}
                  {index === currentStepIndex && !completedSteps.includes(step.id) && (
                    <div className="absolute -inset-1 rounded-full border-2 border-brand-blue/50 dark:border-brand-purple/50 animate-pulse"></div>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  index === currentStepIndex 
                    ? 'text-foreground font-semibold'
                    : completedSteps.includes(step.id)
                    ? 'text-foreground/90'
                    : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              
              {/* Connector line between steps */}
              {index < state.steps.length - 1 && (
                <div className="flex-1 mx-2 h-1 relative">
                  <div className="absolute inset-0 bg-muted rounded-full"></div>
                  <div 
                    className={`absolute inset-0 rounded-full transition-all duration-500 ease-out ${
                      completedSteps.includes(step.id)
                        ? 'bg-gradient-to-r from-green-400 to-green-500 w-full'
                        : index < currentStepIndex
                        ? 'bg-gradient-to-r from-brand-blue to-brand-purple w-full'
                        : 'w-0'
                    }`}
                    style={{
                      transition: `width ${ANIMATION.slow}`
                    }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Auto-save indicator */}
        {hasUnsavedChanges && (
          <div className="mb-4 text-sm flex justify-end items-center text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Saving progress...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>
        )}
        
        {/* Step content */}
        <div className="bg-card rounded-xl border border-border shadow-sm mb-8 p-6 md:p-8 relative overflow-hidden">
          {/* Decorative gradient background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 rounded-full blur-3xl opacity-70"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-brand-purple/10 to-brand-blue/10 rounded-full blur-3xl opacity-70"></div>
          
          <div className="relative z-10">
            {currentStep.id === 'welcome' && (
              <WelcomeStep onComplete={() => handleStepComplete('welcome')} />
            )}
            
            {currentStep.id === 'business-profile' && (
              <BusinessProfileStep 
                initialData={formData.businessProfile}
                onComplete={(data) => handleStepComplete('business-profile', data)} 
              />
            )}
            
            {currentStep.id === 'inventory-setup' && (
              <InventorySetupStep 
                initialData={formData.initialInventory}
                onComplete={(data) => handleStepComplete('inventory-setup', data)} 
              />
            )}
            
            {currentStep.id === 'payment-setup' && (
              <PaymentSetupStep 
                initialData={formData.paymentSetup}
                onComplete={(data) => handleStepComplete('payment-setup', data)} 
              />
            )}
            
            {currentStep.id === 'completion' && (
              <CompletionStep 
                userData={formData}
                onComplete={() => handleStepComplete('completion')} 
              />
            )}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={previousStep}
            disabled={currentStepIndex === 0}
            className={`flex items-center px-6 py-3 rounded-md transition-all duration-200 ${
              currentStepIndex === 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-card hover:bg-secondary/50 border border-border text-foreground hover:shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          {currentStepIndex < state.steps.length - 1 && (
            <button
              type="button"
              onClick={nextStep}
              className="bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white px-6 py-3 rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center"
            >
              Skip
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 