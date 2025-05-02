'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useTheme } from 'next-themes';

interface Point {
  x: number;
  y: number;
  initialX: number; // Added for animation reference
  initialY: number; // Added for animation reference
  velocityX: number; // Added for movement
  velocityY: number; // Added for movement
  pulseDelay: number; // Added for staggered pulse animation
}

interface GridBackgroundProps {
  dotColor?: string;
  lineColor?: string;
  dotSize?: number;
  numPoints?: number;
  lineWidth?: number;
  connectionRadius?: number;
  animationSpeed?: number; // Added to control animation speed
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  dotSize = 3,
  numPoints = 60,
  lineWidth = 1,
  connectionRadius = 100,
  animationSpeed = 0.15, // Reduced from 0.3 to make movement more subtle
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Determine colors based on theme
  const dotColor = isDarkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
  const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  
  const [points, setPoints] = useState<Point[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const animationRef = useRef<number>();
  
  // Generate points in a grid-like pattern with some randomness
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    setDimensions({ width, height });
    
    // Create grid with more density in center
    const gridSize = Math.min(width, height) / Math.sqrt(numPoints);
    
    const newPoints: Point[] = [];
    
    // Center point of the screen
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < numPoints; i++) {
      // Distribute points with higher density around center
      let x, y;
      
      // For 60% of points, concentrate them more in the center
      if (Math.random() < 0.6) {
        // Add slight random offset to grid positions for organic feel
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (width / 3);
        x = centerX + Math.cos(angle) * distance;
        y = centerY + Math.sin(angle) * distance;
      } else {
        // Rest are distributed around the screen
        x = Math.random() * width;
        y = Math.random() * height;
      }
      
      // Ensure points are on screen
      x = Math.max(20, Math.min(width - 20, x));
      y = Math.max(20, Math.min(height - 20, y));
      
      // Add random velocity for subtle movement
      const velocityX = (Math.random() - 0.5) * 0.2; // Reduced from 0.5 to make movement more subtle
      const velocityY = (Math.random() - 0.5) * 0.2; // Reduced from 0.5 to make movement more subtle
      
      // Random delay for staggered pulse effect
      const pulseDelay = Math.random() * 4; // Random delay between 0-4s
      
      newPoints.push({ 
        x, 
        y, 
        initialX: x, // Store initial position for bounded movement
        initialY: y,
        velocityX, 
        velocityY,
        pulseDelay
      });
    }
    
    setPoints(newPoints);
    setIsInitialized(true);
    
    // Handle resize
    const handleResize = () => {
      setIsInitialized(false);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      
      // Re-initialize after a short delay to ensure smooth transition
      setTimeout(() => {
        setIsInitialized(true);
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // Clean up animation frame if component unmounts
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [numPoints]);
  
  // Animation loop for moving points
  useEffect(() => {
    if (!isInitialized || points.length === 0) return;
    
    const animatePoints = () => {
      setPoints(prevPoints => 
        prevPoints.map(point => {
          // Calculate new position
          let newX = point.x + point.velocityX * animationSpeed;
          let newY = point.y + point.velocityY * animationSpeed;
          
          // Add boundary checks with smooth direction reversal
          // Keep points within 40px of their initial position for subtle movement
          const maxDistance = 40;
          
          if (Math.abs(newX - point.initialX) > maxDistance) {
            // Reverse direction smoothly when reaching boundary
            const velocityX = -point.velocityX;
            newX = point.x + velocityX * animationSpeed;
            return { ...point, x: newX, velocityX };
          }
          
          if (Math.abs(newY - point.initialY) > maxDistance) {
            // Reverse direction smoothly when reaching boundary
            const velocityY = -point.velocityY;
            newY = point.y + velocityY * animationSpeed;
            return { ...point, y: newY, velocityY };
          }
          
          // Ensure points stay on screen
          newX = Math.max(20, Math.min(dimensions.width - 20, newX));
          newY = Math.max(20, Math.min(dimensions.height - 20, newY));
          
          return { ...point, x: newX, y: newY };
        })
      );
      
      animationRef.current = requestAnimationFrame(animatePoints);
    };
    
    animationRef.current = requestAnimationFrame(animatePoints);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, points.length, dimensions, animationSpeed]);
  
  // Track mouse position for interactive effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Find connections between points
  const connections = React.useMemo(() => {
    const result = [];
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      for (let j = i + 1; j < points.length; j++) {
        const otherPoint = points[j];
        const dx = otherPoint.x - point.x;
        const dy = otherPoint.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionRadius) {
          // Calculate opacity based on distance
          const opacity = 1 - (distance / connectionRadius);
          
          result.push({
            id: `${i}-${j}`,
            x1: point.x,
            y1: point.y,
            x2: otherPoint.x,
            y2: otherPoint.y,
            opacity: opacity * 0.5, // Adjust for subtlety
          });
        }
      }
    }
    
    return result;
  }, [points, connectionRadius]);
  
  // Calculate interactivity - points and connections that should react to mouse
  const interactivePoints = React.useMemo(() => {
    return points.map((point, index) => {
      const dx = mousePosition.x - point.x;
      const dy = mousePosition.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 150; // Mouse influence radius
      
      let scale = 1;
      if (distance < maxDistance) {
        // Scale up slightly when mouse is nearby
        scale = 1 + (1 - distance / maxDistance) * 0.5;
      }
      
      return {
        ...point,
        scale,
        id: index,
      };
    });
  }, [points, mousePosition]);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(0.2px)' }}
      >
        {/* Lines connecting dots */}
        {connections.map((connection) => (
          <motion.line
            key={connection.id}
            x1={connection.x1}
            y1={connection.y1}
            x2={connection.x2}
            y2={connection.y2}
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeOpacity={connection.opacity}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          />
        ))}
        
        {/* Dots */}
        {interactivePoints.map((point) => (
          <motion.circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={dotSize}
            fill={dotColor}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: point.scale,
              transition: { 
                opacity: { duration: 1.5 },
                scale: { duration: 0.2 }
              }
            }}
            // Add subtle pulse animation
            whileInView={{
              opacity: [1, 0.85, 1],
              scale: [point.scale, point.scale * 1.05, point.scale],
              transition: {
                opacity: { 
                  repeat: Infinity, 
                  duration: 4,
                  delay: point.pulseDelay,
                  repeatDelay: 7,
                  ease: "easeInOut" 
                },
                scale: { 
                  repeat: Infinity, 
                  duration: 4,
                  delay: point.pulseDelay,
                  repeatDelay: 7,
                  ease: "easeInOut" 
                }
              }
            }}
          />
        ))}
      </svg>
      
      {/* Radial dot grid background */}
      <div 
        className="absolute inset-0 z-[-1]" 
        style={{ 
          backgroundImage: `radial-gradient(${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          opacity: 0.5
        }}
      />
    </div>
  );
};

export default GridBackground; 