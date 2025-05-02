import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import ElectricityCard from './electricity-card';
import AppleWatchGrid from './apple-watch-grid';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'pink';
}

const ElectricitySection: React.FC = () => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Only access theme after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine if dark mode is active
  const isDarkMode = mounted && (theme === 'dark' || resolvedTheme === 'dark');
  
  const features: Feature[] = [
    {
      title: "Real-time Inventory",
      description: "Track stock levels across all locations with automatic updates",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
      color: "blue"
    },
    {
      title: "Smart Analytics",
      description: "Data-driven insights to optimize your inventory and reduce waste",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M3 3v18h18" />
          <path d="m7 17 4-4 4 4 6-6" />
        </svg>
      ),
      color: "purple"
    },
    {
      title: "Multi-channel Sales",
      description: "Seamlessly integrate with your existing online and offline sales channels",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M9 7 6 4 3 7" />
          <path d="M9 17 6 20 3 17" />
          <path d="M14 4h4v4h-4z" />
          <path d="M14 16h4v4h-4z" />
          <path d="M6 4v16" />
          <path d="M14 8v8" />
        </svg>
      ),
      color: "pink"
    }
  ];

  // Theme-dependent styles
  const bgColor = isDarkMode ? 'bg-black' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const descriptionColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const dotColor = isDarkMode ? '#333' : '#ddd';
  const lineColor = isDarkMode ? '#888' : '#ccc';

  // Return early if not mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className={`py-24 relative overflow-hidden`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${textColor}`}>
              Built on a foundation of <span className="gradient-text">fast, production-grade</span> tooling
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pt-8 pb-24 relative overflow-hidden`}>
      {/* Apple Watch-style grid background with scroll animation */}
      <div className="absolute inset-0 z-0">
        <AppleWatchGrid numDots={120} dotSize={3} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className={`text-4xl font-bold mb-4 ${textColor}`}>
            Built on a foundation of <span className="gradient-text">fast, production-grade</span> tooling
          </h2>
        </div>
      </div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* Background grid pattern - reduce opacity since we now have multiple layers */}
        <div className="absolute inset-0 w-full h-full opacity-5">
          <div className="absolute top-0 left-0 right-0 bottom-0" 
               style={{
                 backgroundImage: `radial-gradient(circle at 25px 25px, ${dotColor} 2px, transparent 0), radial-gradient(circle at 75px 75px, ${dotColor} 2px, transparent 0)`,
                 backgroundSize: '100px 100px'
               }}>
          </div>
          <svg className="absolute w-full h-full" viewBox="0 0 1200 800" fill="none">
            <g opacity="0.2">
              <path d={`M0 400H1200`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
              <path d={`M600 0V800`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
              <path d={`M300 300L900 500`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
              <path d={`M300 500L900 300`} stroke={lineColor} strokeWidth="1" strokeDasharray="4 4"/>
            </g>
          </svg>
        </div>
        
        <div className="relative mx-auto w-full z-10">
          {/* Top row with feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <div key={index}>
                <ElectricityCard 
                  color={feature.color}
                  animationDelay={0.2 * index}
                >
                  <div className="flex flex-col items-start h-full">
                    <div className={`mb-4 ${
                      feature.color === 'blue' 
                        ? 'text-blue-600 dark:text-blue-500' 
                        : feature.color === 'purple' 
                          ? 'text-purple-600 dark:text-purple-500' 
                          : 'text-pink-600 dark:text-pink-500'
                    }`}>
                      {feature.icon}
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${textColor} flex items-center`}>
                      {feature.title}
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </h3>
                    <p className={descriptionColor}>{feature.description}</p>
                  </div>
                </ElectricityCard>
              </div>
            ))}
          </div>
          
          {/* MerchX Engine Card - Center */}
          <div className="max-w-2xl mx-auto">
            <ElectricityCard 
              color="blue"
              animationDelay={0.6}
              className="p-4"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-gradient-start via-brand-gradient-mid to-brand-gradient-end rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-6">
                  MX
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${textColor}`}>MerchX Engine</h3>
                <p className={descriptionColor}>
                  Our powerful inventory management engine combines real-time tracking, predictive analytics, and seamless integrations
                </p>
              </div>
            </ElectricityCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricitySection; 