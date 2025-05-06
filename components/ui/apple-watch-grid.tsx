'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useTheme } from 'next-themes';

interface SupplyGridProps {
  numLines?: number;
  lineThickness?: number;
  children?: React.ReactNode;
}

export default function AppleWatchGrid({
  numLines = 12,
  lineThickness = 1,
  children
}: SupplyGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // State to hold supply lines
  const [lines, setLines] = useState<any[]>([]);
  
  // Create supply lines only on client-side to avoid hydration errors
  useEffect(() => {
    // Reduce the number of animations by using static positions for some elements
    const linesArray = [];
    
    // Create horizontal lines (supply chains)
    for (let i = 0; i < numLines; i++) {
      // Randomize vertical position with some clustering
      const positionY = (i / numLines) * 100 + (Math.random() - 0.5) * 8;
      // Randomize width (percentage of screen width)
      const width = 10 + Math.random() * 45; // increased max width for more coverage
      // Randomize horizontal position
      const positionX = Math.random() * (100 - width);
      
      // Parallax factor for Apple Watch-like scroll effect
      const parallaxFactor = 0.5 + Math.random() * 1.5;
      
      // Create a main "supply line"
      linesArray.push({
        id: `h-line-${i}`,
        positionX,
        positionY,
        width,
        height: lineThickness,
        isVertical: false,
        // Animation properties - simplified
        delay: i * 0.05,
        speed: 0.2 + Math.random() * 0.2,
        color: getRandomColor(isDarkMode),
        hasNodes: Math.random() > 0.6, // more lines have node connections
        parallaxFactor: parallaxFactor,
        // Movement range for scroll effect
        movementRange: {
          x: (Math.random() - 0.5) * 15 * parallaxFactor,
          y: (Math.random() - 0.5) * 8 * parallaxFactor,
        }
      });
      
      // Add vertical "branch" connections for only some lines (reduced)
      if (Math.random() > 0.7) { // slightly more branches than before
        const branchCount = 1 + Math.floor(Math.random()); // 1 or 2 branches
        
        for (let j = 0; j < branchCount; j++) {
          // Randomize position along parent line
          const branchX = positionX + (width * (j + 1)) / (branchCount + 1);
          // Randomize height
          const branchHeight = 8 + Math.random() * 12;
          // Randomize direction (up or down)
          const direction = Math.random() > 0.5 ? -1 : 1;
          const branchY = direction > 0 ? positionY : positionY - branchHeight;
          
          // Branch-specific parallax
          const branchParallax = parallaxFactor * 0.8; // slightly reduced from parent
          
          linesArray.push({
            id: `v-branch-${i}-${j}`,
            positionX: branchX,
            positionY: branchY,
            width: lineThickness,
            height: branchHeight,
            isVertical: true,
            delay: i * 0.05 + 0.1,
            speed: 0.1,
            color: getRandomColor(isDarkMode),
            parentId: `h-line-${i}`,
            parallaxFactor: branchParallax,
            // Different movement pattern for branches
            movementRange: {
              x: (Math.random() - 0.5) * 10 * branchParallax,
              y: direction * 10 * branchParallax, // extend in direction of branch
            }
          });
          
          // Add more nodes
          if (Math.random() > 0.6) { // increased chance of nodes
            const nodeSize = lineThickness * 3; // larger nodes
            const nodeY = direction > 0 ? branchY + branchHeight - nodeSize : branchY;
            
            // Node-specific parallax
            const nodeParallax = branchParallax * 1.2; // amplified for nodes
            
            linesArray.push({
              id: `node-${i}-${j}`,
              positionX: branchX - nodeSize / 2 + lineThickness / 2,
              positionY: nodeY,
              width: nodeSize,
              height: nodeSize,
              isNode: true,
              delay: i * 0.05 + 0.2,
              speed: 0.1,
              color: getRandomColor(isDarkMode),
              parentId: `v-branch-${i}-${j}`,
              parallaxFactor: nodeParallax,
              // Nodes have more pronounced movement
              movementRange: {
                x: (Math.random() - 0.5) * 15 * nodeParallax,
                y: (Math.random() - 0.5) * 15 * nodeParallax,
              }
            });
          }
        }
      }
    }
    
    setLines(linesArray);
  }, [numLines, lineThickness, isDarkMode]);
  
  // Helper function to get colors that fit the theme - increased opacity
  function getRandomColor(isDark: boolean) {
    const colors = isDark 
      ? [
          'rgba(59, 130, 246, 0.35)', // blue - more visible
          'rgba(99, 102, 241, 0.35)', // indigo - more visible
          'rgba(168, 85, 247, 0.35)', // purple - more visible
        ]
      : [
          'rgba(59, 130, 246, 0.25)', // blue - more visible
          'rgba(99, 102, 241, 0.25)', // indigo - more visible
          'rgba(168, 85, 247, 0.25)', // purple - more visible
        ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Supply chain grid background - increased opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <div className="relative h-full w-full overflow-hidden">
          {lines.map((line) => (
            <SupplyLine 
              key={line.id}
              line={line}
              scrollY={scrollY}
              isDarkMode={isDarkMode}
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

interface SupplyLineProps {
  line: {
    id: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    isVertical?: boolean;
    isNode?: boolean;
    delay: number;
    speed: number;
    color: string;
    parentId?: string;
    hasNodes?: boolean;
    parallaxFactor: number;
    movementRange: {
      x: number;
      y: number;
    };
  };
  scrollY: any;
  isDarkMode: boolean;
}

function SupplyLine({ line, scrollY, isDarkMode }: SupplyLineProps) {
  // Set position in percentages
  const x = `${line.positionX}%`;
  const y = `${line.positionY}%`;
  
  // Enhanced scroll-based animation with Apple Watch-like reactivity
  // Transform scroll position to motion range specific to this line
  const scrollXTransform = useTransform(
    scrollY,
    [0, 500, 1000],
    [-line.movementRange.x, 0, line.movementRange.x]
  );
  
  const scrollYTransform = useTransform(
    scrollY,
    [0, 500, 1000],
    [-line.movementRange.y, 0, line.movementRange.y]
  );
  
  // Add spring physics for smooth Apple Watch-like movement
  const springX = useSpring(scrollXTransform, {
    damping: 15,
    stiffness: 90,
    mass: 0.5
  });
  
  const springY = useSpring(scrollYTransform, {
    damping: 15,
    stiffness: 90,
    mass: 0.5
  });
  
  // Define the element style based on type
  let elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: `${line.width}%`,
    height: line.isNode ? `${line.height}px` : `${line.height}px`,
    backgroundColor: line.color,
    borderRadius: line.isNode ? '2px' : '1px',
  };
  
  // Add subtle glow effect in dark mode - increased glow
  if (isDarkMode) {
    elementStyle.boxShadow = `0 0 3px ${line.color}`;
  }
  
  // Calculate hover styles
  const hoverStyles = line.isNode ? {
    scale: 1.3,
    opacity: 1,
    boxShadow: `0 0 5px ${line.color}`
  } : {};
  
  return (
    <motion.div
      style={{
        ...elementStyle,
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 0.85, // increased from 0.6
        scale: 1,
        transition: {
          delay: line.delay,
          duration: 0.6 // faster animation
        }
      }}
      whileHover={{
        ...hoverStyles,
        transition: { duration: 0.2 }
      }}
    />
  );
} 