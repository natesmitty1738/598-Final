'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useTheme } from 'next-themes';

interface AppleWatchGridProps {
  dotColor?: string;
  numDots?: number;
  dotSize?: number;
  children?: React.ReactNode;
}

export default function AppleWatchGrid({
  numDots = 120,
  dotSize = 4,
  children
}: AppleWatchGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Determine dot color based on theme
  const dotColor = isDarkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
  
  // Calculate grid dimensions - make it slightly rectangular
  const gridSizeX = Math.ceil(Math.sqrt(numDots) * 1.5); // wider grid
  const gridSizeY = Math.ceil(Math.sqrt(numDots) * 0.8); // shorter grid
  
  // State to hold dots (initialized empty to avoid hydration mismatch)
  const [dots, setDots] = useState<any[]>([]);
  
  // Create dots only on client-side to avoid hydration errors
  useEffect(() => {
    const dotsArray = [];
    for (let y = 0; y < gridSizeY; y++) {
      for (let x = 0; x < gridSizeX; x++) {
        // Skip some dots for a more organic feel
        if (Math.random() > 0.8) continue;
        
        dotsArray.push({
          id: `${x}-${y}`,
          x,
          y,
          // Add some random offset to break the grid pattern
          offsetX: (Math.random() - 0.5) * 10,
          offsetY: (Math.random() - 0.5) * 10,
          // Unique value for animation staggering
          delay: (x + y) * 0.02,
          // Random scale for visual interest
          scale: 0.8 + Math.random() * 0.5
        });
      }
    }
    setDots(dotsArray);
  }, [gridSizeX, gridSizeY]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Background dots */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="relative h-full w-full">
          {dots.map((dot) => (
            <DotWithAnimation 
              key={dot.id}
              dot={dot}
              gridSizeX={gridSizeX}
              gridSizeY={gridSizeY}
              dotColor={dotColor}
              dotSize={dotSize * dot.scale}
              scrollY={scrollY}
            />
          ))}
        </div>
      </div>
      
      {/* Add back the children if provided */}
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
}

interface DotProps {
  dot: {
    id: string;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    delay: number;
    scale: number;
  };
  gridSizeX: number;
  gridSizeY: number;
  dotColor: string;
  dotSize: number;
  scrollY: any;
}

function DotWithAnimation({ dot, gridSizeX, gridSizeY, dotColor, dotSize, scrollY }: DotProps) {
  // Calculate dot position in percentages with slight offset for organic feel
  const x = `${((dot.x + dot.offsetX) / gridSizeX) * 100}%`;
  const y = `${((dot.y + dot.offsetY) / gridSizeY) * 100}%`;
  
  // Different animation movement patterns based on dot position
  const isLeftSide = dot.x < gridSizeX / 2;
  const isTopHalf = dot.y < gridSizeY / 2;
  
  // Create different animation ranges for different dots
  // This creates the circular/elliptical motion around your content
  let xRange = isLeftSide ? [-20, 20] : [20, -20];
  let yRange = isTopHalf ? [-20, 20] : [20, -20];
  
  // Customize animation per dot's position for swirl effect
  if (dot.x % 3 === 0) {
    xRange = [xRange[0] * 1.5, xRange[1] * 1.5];
  }
  if (dot.y % 2 === 0) {
    yRange = [yRange[0] * 1.2, yRange[1] * 1.2];
  }
  
  // Use scroll position to drive animation
  const xTransform = useTransform(
    scrollY,
    [0, 1000],
    xRange
  );
  
  const yTransform = useTransform(
    scrollY,
    [0, 1000],
    yRange
  );
  
  // Add spring physics for smooth, bouncy movement
  const springX = useSpring(xTransform, {
    damping: 20,
    stiffness: 90,
    mass: 0.8
  });
  
  const springY = useSpring(yTransform, {
    damping: 20,
    stiffness: 90,
    mass: 0.8
  });
  
  // Calculate opacity based on position
  // Dots closer to center are more visible
  const centerX = gridSizeX / 2;
  const centerY = gridSizeY / 2;
  const distanceFromCenter = Math.sqrt(
    Math.pow(dot.x - centerX, 2) + Math.pow(dot.y - centerY, 2)
  );
  const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
  // Use a fixed opacity value to avoid hydration mismatches
  const baseOpacity = 0.3 + (1 - distanceFromCenter / maxDistance) * 0.7;
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: dotSize,
        height: dotSize,
        backgroundColor: dotColor,
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: baseOpacity * 0.8, // Fixed value, no randomness
        transition: {
          delay: dot.delay
        }
      }}
    />
  );
} 