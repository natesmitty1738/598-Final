import React from 'react';
import Link from 'next/link';
import { CheckCircle, ChevronRight } from 'lucide-react';

interface CompletionStepProps {
  userData: {
    businessProfile: any;
    initialInventory: any[];
    paymentSetup: any;
  };
  onComplete: () => void;
}

export default function CompletionStep({ userData, onComplete }: CompletionStepProps) {
  const businessName = userData.businessProfile?.businessName || 'your business';
  const productCount = userData.initialInventory?.length || 0;
  
  React.useEffect(() => {
    // Mark onboarding as complete in the database
    const markComplete = async () => {
      try {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error marking onboarding as complete:', error);
      }
    };
    
    markComplete();
  }, []);
  
  return (
    <div className="py-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Setup Complete!</h2>
      
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        Congratulations! You've successfully set up {businessName} on MerchX. 
        Your account is now ready to use with {productCount} products in your inventory.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
        <div className="card p-6">
          <h3 className="font-medium mb-2">Next Steps</h3>
          <ul className="space-y-2 text-left">
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Explore your dashboard</span>
            </li>
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Add more inventory items</span>
            </li>
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Create your first sale</span>
            </li>
          </ul>
        </div>
        
        <div className="card p-6">
          <h3 className="font-medium mb-2">Learning Resources</h3>
          <ul className="space-y-2 text-left">
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Watch tutorial videos</span>
            </li>
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Read our user guide</span>
            </li>
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Explore best practices</span>
            </li>
          </ul>
        </div>
        
        <div className="card p-6">
          <h3 className="font-medium mb-2">Get Support</h3>
          <ul className="space-y-2 text-left">
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Contact our support team</span>
            </li>
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Join our community forum</span>
            </li>
            <li className="flex items-center text-sm">
              <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
              <span>Schedule a training call</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={onComplete}
        >
          Go to Dashboard
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
        
        <Link
          href="/inventory"
          className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Manage Inventory
        </Link>
      </div>
    </div>
  );
} 