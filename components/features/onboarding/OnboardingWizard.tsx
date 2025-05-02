'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useOnboardingAutomata from '@/app/hooks/useOnboardingAutomata';
import { StepId } from '@/app/hooks/useOnboardingAutomata';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Import step components
import WelcomeStep from './WelcomeStep';
import BusinessProfileStep from './BusinessProfileStep';
import InventorySetupStep from './InventorySetupStep';
import PaymentSetupStep from './PaymentSetupStep';
import CompletionStep from './CompletionStep';

export default function OnboardingWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Use the onboarding automata for state management
  const {
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
    activeStep,
    currentStepIndex,
    completedSteps,
    formData,
    currentStepData,
    hasUnsavedChanges,
    steps
  } = useOnboardingAutomata();
  
  // Show error toast when API calls fail
  useEffect(() => {
    if (error) {
      toast.error("Error", {
        description: error,
        action: {
          label: "Dismiss",
          onClick: clearError
        }
      });
    }
  }, [error, clearError]);
  
  // Handle automatic redirect after completion
  useEffect(() => {
    // If state is initialized and onboarding is complete, redirect to dashboard
    if (!isLoading && state.isCompleted && completedSteps.includes('completion')) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, state.isCompleted, completedSteps, router]);
  
  // Show loading spinner while initializing
  if (isLoading) {
    return <LoadingSpinner fullscreen message="Loading your setup wizard..." />;
  }
  
  // Handle step completion with optional data
  const handleStepComplete = async (stepId: StepId, data?: any) => {
    try {
      // Complete the step with data
      await completeStep(stepId, data);
      
      // Move to next step (except for final step)
      if (stepId !== 'completion') {
        nextStep();
      }
    } catch (error) {
      console.error("Error completing step:", error);
      toast.error("Error saving progress", {
        description: "Your data is stored locally and will be saved when possible"
      });
      
      // Still move to next step to prevent getting stuck
      if (stepId !== 'completion') {
        nextStep();
      }
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = Math.round((completedSteps.length / steps.length) * 100);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-8 pb-16">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-blue to-brand-purple"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {progressPercentage}% complete
          </p>
        </div>
        
        {/* Steps indicator */}
        <div className="mb-8 flex items-center justify-between px-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-brand-blue text-white'
                      : 'border-2 border-muted bg-card text-muted-foreground'
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span className="font-semibold text-sm">{index + 1}</span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  completedSteps.includes(step.id)
                    ? 'text-green-600 dark:text-green-400'
                    : index === currentStepIndex
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              
              {/* Connector line between circles */}
              {index < steps.length - 1 && (
                <div className={`h-[2px] w-16 sm:w-24 md:w-32 flex-shrink ${
                  completedSteps.includes(step.id) 
                    ? 'bg-green-500' 
                    : 'bg-muted'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main content area */}
        <div className="bg-card shadow-lg border rounded-xl overflow-hidden">
          {/* Display error message if any */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-b border-red-200 dark:border-red-800/30 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <div className="flex-grow">{error}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="ml-2"
              >
                Dismiss
              </Button>
            </div>
          )}
          
          {/* Step content */}
          <div className="p-6 md:p-8">
            {activeStep === 'welcome' && (
              <WelcomeStep 
                onComplete={() => handleStepComplete('welcome')}
                formData={currentStepData}
                updateFormData={(data) => updateStepData('welcome', data)}
                userId={session?.user?.id || ''}
              />
            )}
            
            {activeStep === 'business-profile' && (
              <BusinessProfileStep 
                onComplete={(data) => handleStepComplete('business-profile', data)}
                formData={currentStepData}
                updateFormData={(data) => updateStepData('business-profile', data)}
                userId={session?.user?.id || ''}
              />
            )}
            
            {activeStep === 'inventory-setup' && (
              <InventorySetupStep
                onComplete={(data) => handleStepComplete('inventory-setup', data)}
                formData={currentStepData}
                updateFormData={(data) => updateStepData('inventory-setup', data)}
                userId={session?.user?.id || ''}
              />
            )}
            
            {activeStep === 'payment-setup' && (
              <PaymentSetupStep
                onComplete={(data) => handleStepComplete('payment-setup', data)}
                formData={currentStepData}
                updateFormData={(data) => updateStepData('payment-setup', data)}
                userId={session?.user?.id || ''}
              />
            )}
            
            {activeStep === 'completion' && (
              <CompletionStep
                onComplete={(data) => handleStepComplete('completion', data)}
                formData={formData}
                updateFormData={(data) => updateStepData('completion', data)}
                userId={session?.user?.id || ''}
              />
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="p-6 bg-muted/30 border-t flex justify-between items-center">
            {/* Back button */}
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStepIndex === 0 || isSaving}
              className="space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              {/* Save button - only show if there are unsaved changes */}
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  onClick={saveProgress}
                  disabled={isSaving}
                  className="space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  )}
                </Button>
              )}
              
              {/* Next button or Complete button */}
              {activeStep !== 'completion' ? (
                <Button
                  onClick={() => handleStepComplete(activeStep as StepId)}
                  disabled={isSaving}
                  className="space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}