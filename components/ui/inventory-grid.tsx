'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useVelocity } from 'framer-motion';
import { useTheme } from 'next-themes';

interface InventoryGridProps {
  numBoxes?: number;
  boxSize?: number;
  children?: React.ReactNode;
}

export default function InventoryGrid({
  numBoxes = 150,
  boxSize = 10,
  children
}: InventoryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  // Get scroll velocity for rebound effect
  const scrollVelocity = useVelocity(scrollY);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Determine box colors based on theme - increased opacity values
  const getBoxColor = () => {
    const colors = isDarkMode 
      ? [
          'rgba(59, 130, 246, 0.25)', // blue - more visible
          'rgba(99, 102, 241, 0.25)', // indigo - more visible
          'rgba(168, 85, 247, 0.25)', // purple - more visible
          'rgba(255, 255, 255, 0.15)', // white - more visible
        ]
      : [
          'rgba(59, 130, 246, 0.2)', // blue - more visible
          'rgba(99, 102, 241, 0.2)', // indigo - more visible
          'rgba(168, 85, 247, 0.2)', // purple - more visible
          'rgba(0, 0, 0, 0.1)', // black - more visible
        ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Calculate grid dimensions - make it slightly rectangular
  const gridSizeX = Math.ceil(Math.sqrt(numBoxes) * 1.5); // wider grid
  const gridSizeY = Math.ceil(Math.sqrt(numBoxes) * 0.8); // shorter grid
  
  // State to hold boxes (initialized empty to avoid hydration mismatch)
  const [boxes, setBoxes] = useState<any[]>([]);
  
  // Create boxes only on client-side to avoid hydration errors
  useEffect(() => {
    const boxesArray = [];
    for (let y = 0; y < gridSizeY; y++) {
      for (let x = 0; x < gridSizeX; x++) {
        // Skip fewer boxes for more density
        if (Math.random() > 0.6) continue; // changed from 0.7
        
        // randomize rotation for more visual interest
        const rotation = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 degrees
        
        // Add parallax factor - different boxes move at different speeds based on their position
        // Vary this more for rebound effect
        const parallaxFactor = 0.3 + Math.random() * 0.7; // smaller values for slower movement
        
        // Randomize spring settings for more varied rebound effects
        const springSettings = {
          stiffness: 60 + Math.random() * 60, // varies from 60-120
          damping: 12 + Math.random() * 20,   // varies from 12-32
          mass: 0.8 + Math.random() * 0.7     // varies from 0.8-1.5
        };
        
        boxesArray.push({
          id: `${x}-${y}`,
          x,
          y,
          // Add some random offset to break the grid pattern
          offsetX: (Math.random() - 0.5) * 12, // increased variation
          offsetY: (Math.random() - 0.5) * 12, // increased variation
          // Unique value for animation staggering
          delay: (x + y) * 0.01, // faster appearance
          // Random scale for visual interest - larger on average
          scale: 0.7 + Math.random() * 0.5, // increased from 0.6 + 0.4
          // Color
          color: getBoxColor(),
          // Rotation
          rotation: rotation,
          // Parallax factor for scroll-based movement
          parallaxFactor: parallaxFactor,
          // Spring settings for rebound
          springSettings: springSettings,
          // Each box has its own movement range for Apple Watch-like effect
          movementRange: {
            x: (Math.random() - 0.5) * 20 * parallaxFactor,
            y: (Math.random() - 0.5) * 20 * parallaxFactor,
            rotation: (Math.random() - 0.5) * 10, // slight rotation on scroll
          }
        });
      }
    }
    setBoxes(boxesArray);
  }, [gridSizeX, gridSizeY, isDarkMode]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Background inventory boxes - increased opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <div className="relative h-full w-full">
          {boxes.map((box) => (
            <BoxWithAnimation 
              key={box.id}
              box={box}
              gridSizeX={gridSizeX}
              gridSizeY={gridSizeY}
              boxSize={boxSize * box.scale}
              scrollY={scrollY}
              scrollVelocity={scrollVelocity}
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

interface BoxProps {
  box: {
    id: string;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    delay: number;
    scale: number;
    color: string;
    rotation: number;
    parallaxFactor: number;
    springSettings: {
      stiffness: number;
      damping: number;
      mass: number;
    };
    movementRange: {
      x: number;
      y: number;
      rotation: number;
    };
  };
  gridSizeX: number;
  gridSizeY: number;
  boxSize: number;
  scrollY: any;
  scrollVelocity: any;
}

function BoxWithAnimation({ box, gridSizeX, gridSizeY, boxSize, scrollY, scrollVelocity }: BoxProps) {
  // Calculate box position in percentages with slight offset for organic feel
  const x = `${((box.x + box.offsetX) / gridSizeX) * 100}%`;
  const y = `${((box.y + box.offsetY) / gridSizeY) * 100}%`;
  
  // Create a delayed version of scrollY for rebound effect
  // Using useTransform to apply the parallax factor
  const delayedScrollY = useTransform(
    scrollY,
    (value) => (value as number) * box.parallaxFactor
  );
  
  // Enhanced scroll-based animation with rebound effect
  // Transform scroll position (0-1000) to motion range specific to this box
  const scrollXTransform = useTransform(
    delayedScrollY,
    [0, 500, 1000],
    [box.movementRange.x, 0, -box.movementRange.x]
  );
  
  const scrollYTransform = useTransform(
    delayedScrollY,
    [0, 500, 1000],
    [box.movementRange.y, 0, -box.movementRange.y]
  );
  
  const rotateTransform = useTransform(
    delayedScrollY,
    [0, 500, 1000],
    [box.rotation - box.movementRange.rotation, box.rotation, box.rotation + box.movementRange.rotation]
  );
  
  // Apply velocity influence to spring settings
  // This creates more resistance during fast scrolls and quicker catch-up when stopping
  const velocityInfluence = useTransform(
    scrollVelocity,
    [-2000, 0, 2000],
    [0.3, 1, 0.3]  // Lower values during fast scrolling (more resistance)
  );
  
  // Add spring physics for rebound effect
  // Custom spring settings for each box for varied effects
  const springX = useSpring(scrollXTransform, {
    stiffness: box.springSettings.stiffness,
    damping: box.springSettings.damping,
    mass: box.springSettings.mass,
  });
  
  const springY = useSpring(scrollYTransform, {
    stiffness: box.springSettings.stiffness,
    damping: box.springSettings.damping,
    mass: box.springSettings.mass,
  });
  
  const springRotate = useSpring(rotateTransform, {
    stiffness: box.springSettings.stiffness + 20, // Slightly higher for rotation
    damping: box.springSettings.damping,
    mass: box.springSettings.mass,
  });
  
  // Calculate opacity based on position - boxes closer to center are more visible
  const centerX = gridSizeX / 2;
  const centerY = gridSizeY / 2;
  const distanceFromCenter = Math.sqrt(
    Math.pow(box.x - centerX, 2) + Math.pow(box.y - centerY, 2)
  );
  const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
  // Higher base opacity for better visibility
  const baseOpacity = 0.4 + (1 - distanceFromCenter / maxDistance) * 0.6;
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: boxSize,
        height: boxSize,
        backgroundColor: box.color,
        borderRadius: '1px', // slight rounding for boxes
        x: springX,
        y: springY,
        rotate: springRotate, // Use the springRotate directly
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: baseOpacity * 0.8,
        scale: 1,
        transition: {
          delay: box.delay,
          duration: 0.6 // faster animation
        }
      }}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 }
      }}
    />
  );
} 