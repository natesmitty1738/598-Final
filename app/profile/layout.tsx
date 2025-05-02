import { Metadata } from 'next';

// Metadata for profile page (server component)
export const metadata: Metadata = {
  title: 'Profile Settings | MerchX',
  description: 'Manage your account settings and preferences',
};

export default function ProfileLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <>
      {children}
    </>
  );
} 