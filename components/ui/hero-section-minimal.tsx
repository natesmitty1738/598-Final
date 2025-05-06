'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  className?: string;
}

const HeroSectionMinimal: React.FC<HeroSectionProps> = ({ className = "" }) => {
  const { data: session, status } = useSession();
  
  return (
    <div className={`relative min-h-screen flex flex-col justify-center overflow-hidden -mt-[4rem] pt-[4rem] ${className}`}>
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Thin horizontal line above title */}
          <motion.div 
            className="w-16 h-px bg-brand-blue mb-8 mx-auto"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Ultra clean centered headline */}
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-center leading-[1.1] mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="gradient-text">Intelligent</div>
            <div>Inventory Management</div>
          </motion.h1>
          
          {/* Clean subtitle - removed the specified text */}
          <motion.p 
            className="text-lg md:text-xl text-center text-muted-foreground mb-16 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            
          </motion.p>
          
          {/* Simple CTA section */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {status === 'authenticated' ? (
              <Link
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-sm text-sm"
              >
                Go to Dashboard
                <ArrowRight className="inline-block h-4 w-4 ml-2" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-sm text-sm"
              >
                Get Started
                <ArrowRight className="inline-block h-4 w-4 ml-2" />
              </Link>
            )}
          </motion.div>
        </div>
        
        {/* Minimal decorative shapes - optimized */}
        <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="w-64 h-64 border border-gray-200 dark:border-gray-800 rounded-full opacity-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 0.7 }}
          />
        </div>
        
        <div className="absolute bottom-1/3 right-1/4 transform translate-x-1/2 translate-y-1/2">
          <motion.div
            className="w-32 h-32 border border-gray-200 dark:border-gray-800 rounded-full opacity-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
        </div>
        
        <div className="absolute top-1/3 right-1/3">
          <motion.div
            className="w-4 h-4 bg-brand-blue/10 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
        </div>
        
        <div className="absolute bottom-1/3 left-1/3">
          <motion.div
            className="w-6 h-6 bg-purple-500/10 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSectionMinimal; 