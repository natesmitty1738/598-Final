'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, CreditCard, Bell, Building2, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/layout/PageHeader';

import BusinessProfileTab from './BusinessProfileTab';
import AccountSettingsTab from './AccountSettingsTab';
import PaymentMethodsTab from './PaymentMethodsTab';
import NotificationPreferencesTab from './NotificationPreferencesTab';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account');
  const { data: session } = useSession();
  
  // Define profile navigation items
  const profileNavItems = [
    { 
      href: "/profile?tab=account", 
      label: "Account Settings", 
      icon: UserCircle 
    },
    { 
      href: "/profile?tab=business", 
      label: "Business Profile", 
      icon: Building2 
    },
    { 
      href: "/profile?tab=payment", 
      label: "Payment Methods", 
      icon: CreditCard 
    },
    { 
      href: "/profile?tab=notifications", 
      label: "Notifications", 
      icon: Bell 
    }
  ];

  // Handle tab changes from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['account', 'business', 'payment', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Function to render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettingsTab />;
      case 'business':
        return <BusinessProfileTab />;
      case 'payment':
        return <PaymentMethodsTab />;
      case 'notifications':
        return <NotificationPreferencesTab />;
      default:
        return <AccountSettingsTab />;
    }
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto px-6 mb-6">
      <PageHeader title="Settings" />
      
      <div className="flex flex-col sm:flex-row gap-6">
        <Card className="w-full sm:w-64 h-fit">
          <nav className="flex flex-col p-3 space-y-1">
            {profileNavItems.map((item) => {
              const isActive = activeTab === item.href.split('=')[1];
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive 
                      ? "bg-muted text-foreground font-medium" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const tabName = item.href.split('=')[1];
                    setActiveTab(tabName);
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', tabName);
                    window.history.pushState({}, '', url);
                  }}
                >
                  <Icon className="h-4 w-4 opacity-70" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </Card>
        
        <div className="flex-1">
          <Card>
            <CardContent className="p-6">
              {renderTabContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 