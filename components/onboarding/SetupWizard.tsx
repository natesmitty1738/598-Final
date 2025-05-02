'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import shared form components
import BusinessProfileForm, { BusinessProfileData } from '@/components/shared/BusinessProfileForm';
import AccountSettingsForm, { AccountSettingsData } from '@/components/shared/AccountSettingsForm';
import PaymentMethodsForm, { PaymentMethodsData } from '@/components/shared/PaymentMethodsForm';
import ProductManagementForm, { ProductData } from '@/components/shared/ProductManagementForm';
import NotificationPreferencesForm, { NotificationPreferencesData } from '@/components/shared/NotificationPreferencesForm';

// Import welcome and completion components
import WelcomeStep from './WelcomeStep';
import CompletionStep from './CompletionStep';

// Define step types
type StepId = 
  | 'welcome' 
  | 'account-settings' 
  | 'business-profile' 
  | 'product-setup' 
  | 'payment-setup' 
  | 'notification-preferences'
  | 'completion';

interface StepConfig {
  id: StepId;
  title: string;
  required: boolean;
  checkCompletion?: () => boolean;
}

// Setup wizard component
export default function SetupWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State for tracking steps and data
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data for each step
  const [accountData, setAccountData] = useState<Partial<AccountSettingsData>>({});
  const [businessData, setBusinessData] = useState<Partial<BusinessProfileData>>({});
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [paymentData, setPaymentData] = useState<Partial<PaymentMethodsData>>({});
  const [notificationData, setNotificationData] = useState<Partial<NotificationPreferencesData>>({});
  
  // Define the steps
  const steps: StepConfig[] = [
    { id: 'welcome', title: 'Welcome', required: true },
    { id: 'account-settings', title: 'Account', required: true },
    { id: 'business-profile', title: 'Business', required: true },
    { id: 'product-setup', title: 'Products', required: false },
    { id: 'payment-setup', title: 'Payments', required: true },
    { id: 'notification-preferences', title: 'Notifications', required: false },
    { id: 'completion', title: 'Done', required: true }
  ];
  
  // Load existing setup data
  useEffect(() => {
    const loadSetupData = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        // Load onboarding status
        const statusResponse = await fetch('/api/onboarding/status');
        
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          
          // Set completed steps
          setCompletedSteps(data.completedSteps || []);
          
          // Find the next incomplete step
          if (data.activeStep) {
            const stepIndex = steps.findIndex(step => step.id === data.activeStep);
            if (stepIndex !== -1) {
              setCurrentStepIndex(stepIndex);
            }
          }
          
          // Set form data
          if (data.formData) {
            // Set all the form data that was loaded
            if (data.formData.accountSettings) setAccountData(data.formData.accountSettings);
            if (data.formData.businessProfile) setBusinessData(data.formData.businessProfile);
            if (data.formData.products) setProductData(data.formData.products);
            if (data.formData.paymentMethods) setPaymentData(data.formData.paymentMethods);
            if (data.formData.notificationPreferences) setNotificationData(data.formData.notificationPreferences);
          }
          
          // If onboarding is completed, redirect to dashboard
          if (data.completed) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Error loading setup data:', err);
        toast.error('Failed to load your setup data');
      } finally {
        setLoading(false);
      }
    };
    
    loadSetupData();
  }, [session, router]);
  
  // Smart detection to determine missing setup items
  useEffect(() => {
    const detectMissingSetup = async () => {
      if (!session?.user || loading) return;
      
      try {
        // Check if business profile exists
        const businessResponse = await fetch('/api/business-profile');
        if (businessResponse.ok) {
          const businessProfile = await businessResponse.json();
          if (businessProfile && businessProfile.id) {
            setBusinessData(businessProfile);
            if (!completedSteps.includes('business-profile')) {
              setCompletedSteps(prev => [...prev, 'business-profile']);
            }
          }
        }
        
        // Check if account has been set up
        if (session.user.name && session.user.email) {
          setAccountData({
            name: session.user.name,
            email: session.user.email,
            image: session.user.image
          });
          if (!completedSteps.includes('account-settings')) {
            setCompletedSteps(prev => [...prev, 'account-settings']);
          }
        }
        
        // Check if products exist
        const productsResponse = await fetch('/api/products');
        if (productsResponse.ok) {
          const products = await productsResponse.json();
          if (products && products.length > 0) {
            setProductData(products);
            if (!completedSteps.includes('product-setup')) {
              setCompletedSteps(prev => [...prev, 'product-setup']);
            }
          }
        }
        
        // Check for payment configuration
        const paymentResponse = await fetch('/api/payment-config');
        if (paymentResponse.ok) {
          const paymentConfig = await paymentResponse.json();
          if (paymentConfig && paymentConfig.id) {
            setPaymentData(paymentConfig);
            if (!completedSteps.includes('payment-setup')) {
              setCompletedSteps(prev => [...prev, 'payment-setup']);
            }
          }
        }
        
      } catch (err) {
        console.error('Error detecting setup state:', err);
      }
    };
    
    detectMissingSetup();
  }, [session, loading, completedSteps]);
  
  // Navigate to next step
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };
  
  // Navigate to previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  // Mark step as completed
  const completeStep = async (stepId: StepId, data?: any) => {
    setSaving(true);
    setError(null);
    
    try {
      // Save progress to the API
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId,
          completedSteps: [...completedSteps, stepId],
          formData: data || getDataForStep(stepId)
        }),
      });
      
      if (response.ok) {
        // Add to completed steps if not already there
        if (!completedSteps.includes(stepId)) {
          setCompletedSteps(prev => [...prev, stepId]);
        }
        
        // If it's the final step, redirect to dashboard
        if (stepId === 'completion') {
          // Complete onboarding
          await fetch('/api/onboarding/complete', {
            method: 'POST',
          });
          
          toast.success('Setup complete! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save progress');
      }
    } catch (err) {
      console.error('Error saving step:', err);
      setError(err instanceof Error ? err.message : 'Failed to save progress');
      toast.error('Error saving your progress');
    } finally {
      setSaving(false);
    }
  };
  
  // Get data for a specific step
  const getDataForStep = (stepId: StepId) => {
    switch (stepId) {
      case 'account-settings':
        return { accountSettings: accountData };
      case 'business-profile':
        return { businessProfile: businessData };
      case 'product-setup':
        return { products: productData };
      case 'payment-setup':
        return { paymentMethods: paymentData };
      case 'notification-preferences':
        return { notificationPreferences: notificationData };
      default:
        return {};
    }
  };
  
  // Handle account settings form submission
  const handleAccountSettingsSubmit = async (data: AccountSettingsData) => {
    setAccountData(data);
    try {
      await completeStep('account-settings', { accountSettings: data });
      nextStep();
    } catch (error) {
      console.error('Error saving account settings:', error);
      toast.error('Failed to save account settings');
    }
  };
  
  // Handle business profile form submission
  const handleBusinessProfileSubmit = async (data: BusinessProfileData) => {
    setBusinessData(data);
    try {
      await completeStep('business-profile', { businessProfile: data });
      nextStep();
    } catch (error) {
      console.error('Error saving business profile:', error);
      toast.error('Failed to save business profile');
    }
  };
  
  // Handle product setup form submission
  const handleProductSetupSubmit = async (products: ProductData[]) => {
    setProductData(products);
    try {
      await completeStep('product-setup', { products });
      nextStep();
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Failed to save products');
    }
  };
  
  // Handle payment setup form submission
  const handlePaymentSetupSubmit = async (data: PaymentMethodsData) => {
    setPaymentData(data);
    try {
      await completeStep('payment-setup', { paymentMethods: data });
      nextStep();
    } catch (error) {
      console.error('Error saving payment methods:', error);
      toast.error('Failed to save payment methods');
    }
  };
  
  // Handle notification preferences form submission
  const handleNotificationPreferencesSubmit = async (data: NotificationPreferencesData) => {
    setNotificationData(data);
    try {
      await completeStep('notification-preferences', { notificationPreferences: data });
      nextStep();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    }
  };
  
  // Complete onboarding
  const completeOnboarding = async () => {
    setSaving(true);
    try {
      // Call the onboarding/complete endpoint that will save all data
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete onboarding');
      }
      
      // Update completed steps
      setCompletedSteps(prev => 
        prev.includes('completion') ? prev : [...prev, 'completion']
      );
      
      toast.success('Setup completed successfully!');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to complete onboarding. Please try again.');
      toast.error('Failed to complete setup');
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = Math.round((completedSteps.length / steps.length) * 100);
  
  // Get the active step ID
  const activeStepId = steps[currentStepIndex]?.id || 'welcome';
  
  // Function to navigate to specific step by index
  const goToStep = (index: number) => {
    // Only allow navigating to completed steps or the next available step
    const targetStepId = steps[index].id;
    const canNavigate = completedSteps.includes(targetStepId) || 
                        index === 0 || 
                        completedSteps.includes(steps[index-1].id) ||
                        index === currentStepIndex + 1;
    
    if (canNavigate) {
      setCurrentStepIndex(index);
    } else {
      toast.error("Please complete the previous steps first");
    }
  };
  
  // Render current step content
  let stepContent;
  switch (activeStepId) {
    case 'welcome':
      stepContent = <WelcomeStep onContinue={nextStep} />;
      break;
    case 'account-settings':
      stepContent = <AccountSettingsForm 
        initialData={accountData} 
        onSubmit={handleAccountSettingsSubmit} 
        loading={saving}
      />;
      break;
    case 'business-profile':
      stepContent = <BusinessProfileForm 
        initialData={businessData} 
        onSubmit={handleBusinessProfileSubmit} 
        loading={saving}
      />;
      break;
    case 'product-setup':
      stepContent = <ProductManagementForm 
        initialData={productData} 
        onSubmit={handleProductSetupSubmit} 
        loading={saving}
      />;
      break;
    case 'payment-setup':
      stepContent = <PaymentMethodsForm 
        initialData={paymentData} 
        onSubmit={handlePaymentSetupSubmit} 
        loading={saving}
      />;
      break;
    case 'notification-preferences':
      stepContent = <NotificationPreferencesForm 
        initialData={notificationData} 
        onSubmit={handleNotificationPreferencesSubmit} 
        loading={saving}
      />;
      break;
    case 'completion':
      stepContent = <CompletionStep 
        onComplete={completeOnboarding} 
        loading={saving} 
        error={error}
      />;
      break;
    default:
      stepContent = <div>Step not found</div>;
  }
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4">
      {/* Step navigation */}
      <div className="py-6 md:py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start mb-8">
          <ol className="flex flex-wrap gap-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStepIndex === index;
              
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                      ${isCompleted ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' : ''}
                      ${isCurrent && !isCompleted ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' : ''}
                      ${!isCurrent && !isCompleted ? 'text-muted-foreground' : ''}
                      ${isCompleted || isCurrent ? 'hover:bg-muted/80' : 'cursor-not-allowed opacity-60'}
                    `}
                    onClick={() => goToStep(index)}
                    disabled={!isCompleted && !isCurrent && !(completedSteps.includes(steps[index-1]?.id || ''))}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-xs">
                        {index + 1}
                      </span>
                    )}
                    <span>{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="mb-12">
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          {/* Step content */}
          <div className="p-6 md:p-8">
            {stepContent}
          </div>
          
          {/* Bottom navigation */}
          {activeStepId !== 'welcome' && activeStepId !== 'completion' && (
            <div className="flex justify-between items-center bg-muted/20 border-t p-4">
              {/* Back button */}
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0 || saving}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <div className="flex space-x-4">
                {/* Skip button for non-required steps */}
                {!steps[currentStepIndex].required && activeStepId !== 'welcome' && activeStepId !== 'completion' && (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      // Mark the current step as completed (skipped)
                      await fetch('/api/onboarding/skip', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          stepId: activeStepId,
                        }),
                      });
                      
                      // Update local state to reflect the skip
                      setCompletedSteps(prev => 
                        prev.includes(activeStepId) ? prev : [...prev, activeStepId]
                      );
                      
                      // Move to next step
                      nextStep();
                    }}
                    disabled={saving}
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 