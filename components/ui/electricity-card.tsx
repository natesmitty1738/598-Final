import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface ElectricityCardProps {
  children: React.ReactNode;
  color?: 'blue' | 'purple' | 'pink';
  className?: string;
  animationDelay?: number;
}

const ElectricityCard: React.FC<ElectricityCardProps> = ({
  children,
  color = 'blue',
  className = '',
  animationDelay = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Only access theme after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine if dark mode is active
  const isDarkMode = mounted && (theme === 'dark' || resolvedTheme === 'dark');
  
  // Colors based on the brand colors
  const colors = {
    blue: {
      base: '#1C64F2',
      light: '#60A5FA',
      dark: '#1E40AF'
    },
    purple: {
      base: '#8B5CF6',
      light: '#A78BFA',
      dark: '#6D28D9'
    },
    pink: {
      base: '#EC4899',
      light: '#F472B6',
      dark: '#BE185D'
    }
  };
  
  // Get current color based on theme
  const currentColor = isDarkMode ? colors[color].base : colors[color].dark;
  const lightColor = colors[color].light;
  
  // Background, text and border colors based on theme
  const bgColor = isDarkMode ? 'bg-black' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#222]' : 'border-[#e5e7eb]';
  
  // Smoother shadow transition
  const cardStyle = {
    boxShadow: `0 0 ${isHovered ? '20px' : '12px'} ${currentColor}${isHovered ? '25' : '15'}`,
    transition: 'all 1.5s cubic-bezier(0.19, 1, 0.22, 1)'
  };
  
  // Generate a unique ID for SVG gradients
  const cardId = useMemo(() => {
    return `card-${Math.floor(Math.random() * 1000000)}`;
  }, []);
  
  // Animation variants for the card - smoother hover lift
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.8,
        delay: animationDelay,
        ease: "easeOut" 
      } 
    },
    hover: {
      y: -5,
      transition: { 
        duration: 1.2,
        ease: [0.19, 1, 0.22, 1]  // Updated cubic-bezier for smoother motion
      }
    }
  };
  
  // Return early if not mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className={`rounded-xl ${bgColor} border ${borderColor} p-6 ${className}`}>
        {children}
      </div>
    );
  }
  
  // Helper function to calculate transition delay based on index
  const getStaggerDelay = (baseDelay: number) => {
    return isHovered ? baseDelay * 0.2 : baseDelay * 0.4;
  };
  
  return (
    <motion.div
      className={`relative ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Card with subtle animated border */}
      <div className={`relative rounded-xl ${bgColor} border ${borderColor} overflow-hidden p-6 transition-all duration-1000`}
        style={cardStyle}
      >
        {/* Animated electricity effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              {/* Gradient for the glow effect */}
              <radialGradient
                id={`glow-${color}-${cardId}`}
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
              >
                <stop offset="0%" stopColor={currentColor} stopOpacity={isHovered ? "0.25" : "0.15"} />
                <stop offset="100%" stopColor={currentColor} stopOpacity="0" />
              </radialGradient>
              
              {/* Filter for the pulsating effect */}
              <filter id={`electricity-${cardId}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="electricity" />
                <feBlend in="SourceGraphic" in2="electricity" mode="screen" />
              </filter>
            </defs>
            
            {/* Animated corner accents - always visible but enhanced on hover */}
            <g>
              {/* Top left corner */}
              <path 
                d={`M 0,12 L 0,0 L 12,0`} 
                stroke={currentColor} 
                strokeWidth="2"
                fill="none"
                style={{
                  opacity: isHovered ? "1" : "0.5",
                  transition: "opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)"
                }}
              >
                <animate 
                  attributeName="opacity" 
                  values={isHovered ? "0.7;1;0.7" : "0.4;0.6;0.4"} 
                  dur={isHovered ? "2.5s" : "4s"} 
                  repeatCount="indefinite"
                  begin={`${getStaggerDelay(animationDelay)}s`}
                />
              </path>
              
              {/* Top right corner */}
              <path 
                d={`M 100%,0 L 100%,12 M 100%,0 L 100% - 12,0`} 
                stroke={currentColor} 
                strokeWidth="2"
                fill="none"
                transform="translate(-12, 0)"
                style={{
                  opacity: isHovered ? "1" : "0.5",
                  transition: "opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)"
                }}
              >
                <animate 
                  attributeName="opacity" 
                  values={isHovered ? "0.7;1;0.7" : "0.4;0.6;0.4"} 
                  dur={isHovered ? "2.5s" : "4s"} 
                  repeatCount="indefinite"
                  begin={`${getStaggerDelay(animationDelay + 0.5)}s`}
                />
              </path>
              
              {/* Bottom left corner */}
              <path 
                d={`M 0,100% L 0,100% - 12 M 0,100% L 12,100%`} 
                stroke={currentColor} 
                strokeWidth="2"
                fill="none"
                transform="translate(0, -12)"
                style={{
                  opacity: isHovered ? "1" : "0.5",
                  transition: "opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)"
                }}
              >
                <animate 
                  attributeName="opacity" 
                  values={isHovered ? "0.7;1;0.7" : "0.4;0.6;0.4"} 
                  dur={isHovered ? "2.5s" : "4s"} 
                  repeatCount="indefinite"
                  begin={`${getStaggerDelay(animationDelay + 1)}s`}
                />
              </path>
              
              {/* Bottom right corner */}
              <path 
                d={`M 100%,100% L 100%,100% - 12 M 100%,100% L 100% - 12,100%`} 
                stroke={currentColor} 
                strokeWidth="2"
                fill="none"
                transform="translate(-12, -12)"
                style={{
                  opacity: isHovered ? "1" : "0.5",
                  transition: "opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)"
                }}
              >
                <animate 
                  attributeName="opacity" 
                  values={isHovered ? "0.7;1;0.7" : "0.4;0.6;0.4"} 
                  dur={isHovered ? "2.5s" : "4s"} 
                  repeatCount="indefinite"
                  begin={`${getStaggerDelay(animationDelay + 1.5)}s`}
                />
              </path>
            </g>
            
            {/* Pulsating glow - always active but enhanced on hover */}
            <rect 
              x="0" 
              y="0" 
              width="100%" 
              height="100%" 
              fill={`url(#glow-${color}-${cardId})`}
              style={{
                opacity: isHovered ? "0.8" : "0.4",
                transition: "opacity 1.5s cubic-bezier(0.19, 1, 0.22, 1)"
              }}
            >
              <animate 
                attributeName="opacity" 
                values={isHovered ? "0.6;0.8;0.6" : "0.3;0.5;0.3"} 
                dur={isHovered ? "3.5s" : "5s"} 
                repeatCount="indefinite" 
              />
            </rect>
            
            {/* Constant subtle sparkle dots - with smoother transitions */}
            {[...Array(6)].map((_, i) => {
              const x = 10 + (i * 30) % 80; 
              const y = 5 + ((i * 25) + 10) % 90;
              const delay = i * 0.4;
              const size = 1 + (i % 3) * (isHovered ? 1 : 0.6);
              const transitionDelay = i * 0.1;
              
              return (
                <circle 
                  key={i}
                  cx={`${x}%`} 
                  cy={`${y}%`} 
                  r={size} 
                  fill={currentColor}
                  style={{
                    opacity: i >= 3 && !isHovered ? "0" : "1",
                    transition: `opacity 1.5s cubic-bezier(0.19, 1, 0.22, 1) ${transitionDelay}s, r 1.5s cubic-bezier(0.19, 1, 0.22, 1) ${transitionDelay}s`
                  }}
                >
                  <animate 
                    attributeName="opacity" 
                    values={isHovered ? "0.1;0.8;0.1" : "0.1;0.5;0.1"} 
                    dur={isHovered ? "3s" : "4.5s"} 
                    repeatCount="indefinite" 
                    begin={`${delay}s`}
                  />
                  <animate 
                    attributeName="r" 
                    values={isHovered ? 
                      `${size};${size + 1.5};${size}` : 
                      `${size};${size + 0.8};${size}`} 
                    dur={isHovered ? "3.5s" : "5.5s"} 
                    repeatCount="indefinite" 
                    begin={`${delay}s`}
                  />
                </circle>
              );
            })}
          </svg>
        </div>
        
        {/* Border overlay with subtle pulsing */}
        <div className="absolute inset-0 rounded-xl overflow-hidden transition-all duration-1000">
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(40deg, transparent 0%, ${currentColor}${isHovered ? '15' : '10'} 100%)`,
              border: `1px solid ${currentColor}${isHovered ? '50' : '40'}`,
              boxShadow: `0 0 ${isHovered ? '20px' : '15px'} ${currentColor}${isHovered ? '25' : '15'} inset`,
              transition: "all 1.5s cubic-bezier(0.19, 1, 0.22, 1)"
            }}
          >
            {/* Animated border flows - with staggered appearance */}
            {/* Top border flow */}
            <div className="absolute top-0 left-0 w-[100%] h-[1px] overflow-hidden">
              <div 
                className="h-full"
                style={{ 
                  background: `linear-gradient(90deg, transparent, ${currentColor}, transparent)`,
                  width: '50%',
                  animation: isHovered ? `electricity-flow-x 2.8s infinite ${getStaggerDelay(animationDelay)}s` : 'none',
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 1.5s cubic-bezier(0.19, 1, 0.22, 1)"
                }}
              />
            </div>
            
            {/* Right border flow */}
            <div className="absolute top-0 right-0 w-[1px] h-[100%] overflow-hidden">
              <div 
                className="w-full"
                style={{ 
                  background: `linear-gradient(180deg, transparent, ${currentColor}, transparent)`,
                  height: '50%',
                  animation: isHovered ? `electricity-flow-y 2.8s infinite ${getStaggerDelay(animationDelay + 0.5)}s` : 'none',
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 1.5s cubic-bezier(0.19, 1, 0.22, 1) 0.1s"
                }}
              />
            </div>
            
            {/* Bottom border flow */}
            <div className="absolute bottom-0 right-0 w-[100%] h-[1px] overflow-hidden">
              <div 
                className="h-full"
                style={{ 
                  background: `linear-gradient(90deg, transparent, ${currentColor}, transparent)`,
                  width: '50%',
                  animation: isHovered ? `electricity-flow-x-reverse 2.8s infinite ${getStaggerDelay(animationDelay + 1)}s` : 'none',
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 1.5s cubic-bezier(0.19, 1, 0.22, 1) 0.2s"
                }}
              />
            </div>
            
            {/* Left border flow */}
            <div className="absolute bottom-0 left-0 w-[1px] h-[100%] overflow-hidden">
              <div 
                className="w-full"
                style={{ 
                  background: `linear-gradient(180deg, transparent, ${currentColor}, transparent)`,
                  height: '50%',
                  animation: isHovered ? `electricity-flow-y-reverse 2.8s infinite ${getStaggerDelay(animationDelay + 1.5)}s` : 'none',
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 1.5s cubic-bezier(0.19, 1, 0.22, 1) 0.3s"
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Actual card content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default ElectricityCard; 