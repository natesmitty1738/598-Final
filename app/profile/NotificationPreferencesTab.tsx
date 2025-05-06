'use client';

import React from 'react';
import NotificationsToggle, { NotificationPreferences } from '@/components/shared/NotificationsToggle';
import { useToast } from '@/components/providers/ToastProvider';

export default function NotificationPreferencesTab() {
  const { preferences, updatePreferences } = useToast();

  const handlePreferencesSave = async (data: NotificationPreferences) => {
    return updatePreferences(data);
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <NotificationsToggle 
        initialData={preferences}
        onSubmit={handlePreferencesSave}
      />
    </div>
  );
} 