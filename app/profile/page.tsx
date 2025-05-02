'use client';

import React, { useState } from 'react';
import { ChevronRight, UserCircle, CreditCard, Bell, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BusinessProfileTab from './BusinessProfileTab';
import AccountSettingsTab from './AccountSettingsTab';
import PaymentMethodsTab from './PaymentMethodsTab';
import NotificationPreferencesTab from './NotificationPreferencesTab';

type SettingsTab = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

export default function ProfilePage() {
  // Define tabs with their content components
  const tabs: SettingsTab[] = [
    {
      id: 'account',
      title: 'Account Settings',
      icon: <UserCircle className="h-4 w-4" />,
      content: <AccountSettingsTab />,
    },
    {
      id: 'business',
      title: 'Business Profile',
      icon: <Building2 className="h-4 w-4" />,
      content: <BusinessProfileTab />,
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      icon: <CreditCard className="h-4 w-4" />,
      content: <PaymentMethodsTab />,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="h-4 w-4" />,
      content: <NotificationPreferencesTab />,
    },
  ];

  // Use React's useState to track the active tab
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Handler for changing tabs
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="container mx-auto py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-8 lg:space-x-12">
        {/* Sidebar with tabs */}
        <aside className="md:w-1/4 mb-8 md:mb-0">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  "justify-start px-4 py-2 h-auto text-sm",
                  activeTab === tab.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => handleTabChange(tab.id)}
              >
                <div className="flex items-center">
                  <span className="mr-2">{tab.icon}</span>
                  <span>{tab.title}</span>
                </div>
                <ChevronRight className={cn(
                  "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                  activeTab === tab.id ? "rotate-90" : ""
                )} />
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 md:max-w-3xl">
          <div className="bg-card rounded-lg border shadow-sm p-6">
            {/* Display content for active tab */}
            {tabs.find(tab => tab.id === activeTab)?.content}
          </div>
        </main>
      </div>
    </div>
  );
} 