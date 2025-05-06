import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletionStepProps {
  formData: any;
  userId: string;
  onComplete: (data?: any) => void;
  updateFormData: (data: any) => void;
}

export default function CompletionStep({ formData, onComplete, updateFormData, userId }: CompletionStepProps) {
  const router = useRouter();
  const [businessInfo, setBusinessInfo] = useState({
    businessName: 'your business',
    productCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Get business information from previous steps
  useEffect(() => {
    const fetchOnboardingData = async () => {
      setIsLoading(true);
      try {
        // First check if we already have this data in formData
        if (formData) {
          // Get business name from businessProfile
          const businessName = formData.businessProfile?.businessName || 'your business';
          
          // Get product count from inventorySetup 
          const products = formData.inventorySetup?.products || [];
          const productCount = Array.isArray(products) ? products.length : 0;
          
          if (businessName !== 'your business' || productCount > 0) {
            setBusinessInfo({
              businessName,
              productCount
            });
            
            // Update the form data for completion
            updateFormData({
              businessName,
              productCount
            });
            
            setIsLoading(false);
            return;
          }
        }
        
        // If we don't have the data in formData, fetch it from the API
        try {
          const profileResponse = await fetch('/api/business-profile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            
            // Attempt to get inventory data
            const inventoryResponse = await fetch('/api/inventory');
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              
              const updatedInfo = {
                businessName: profileData.businessName || 'your business',
                productCount: Array.isArray(inventoryData) ? inventoryData.length : 0
              };
              
              setBusinessInfo(updatedInfo);
              
              // Update the form data with the collected info
              updateFormData(updatedInfo);
            }
          }
        } catch (apiError) {
          console.error('Error fetching API data:', apiError);
          // Continue with default values if API fails
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOnboardingData();
  }, [formData, updateFormData]);
  
  useEffect(() => {
    // Mark onboarding as complete in the database
    const markComplete = async () => {
      try {
        const response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (response.ok) {
          setIsCompleted(true);
        } else {
          console.error('Failed to mark onboarding as complete');
        }
      } catch (error) {
        console.error('Error marking onboarding as complete:', error);
      }
    };
    
    markComplete();
  }, []);

  const handleGoToDashboard = () => {
    try {
      setIsRedirecting(true);
      
      // First mark the step as complete
      onComplete();
      
      // Use multiple navigation methods to ensure redirect works
      
      // Method 1: Use Next.js router
      router.push('/');
      
      // Method 2: Use window.location as a fallback
      setTimeout(() => {
        // Use the passed onComplete callback to tell the parent component we're done
        onComplete({});
      }, 300);
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Ultimate fallback - direct location change
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6"></div>
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 mx-auto mb-4 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 mx-auto mb-2 rounded"></div>
          <div className="h-4 w-56 bg-gray-200 dark:bg-gray-800 mx-auto mb-8 rounded"></div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-800 mx-auto rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Setup Complete!</h2>
      
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        Congratulations! You've successfully set up {businessInfo.businessName} on MerchX. 
        Your account is now ready to use with {businessInfo.productCount} products in your inventory.
      </p>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={handleGoToDashboard}
          disabled={isRedirecting}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          {isRedirecting ? 'Redirecting...' : 'Go to Dashboard'}
          {!isRedirecting && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
      
      {/* Direct link fallback */}
      <div className="mt-4 text-sm text-muted-foreground">
        <a 
          href="/" 
          className="text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            handleGoToDashboard();
          }}
        >
          If you're not redirected automatically, click here
        </a>
      </div>
    </div>
  );
} 