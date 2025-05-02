import { Metadata } from 'next';

// Proper way to define metadata in Next.js - in a server component layout
export const metadata: Metadata = {
  title: 'Setup Wizard | MerchX',
  description: 'Complete your setup to get started with MerchX',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 