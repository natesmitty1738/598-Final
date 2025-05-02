/**
 * MERCHX THEME CONSTANTS
 * 
 * This file defines the official MerchX theme constants that should be used
 * consistently throughout the application. These values match the CSS variables
 * defined in globals.css.
 * 
 * DO NOT MODIFY these values without design team approval.
 * Last updated: 2023-10-31
 */

// Brand colors as HSL values
export const BRAND_COLORS = {
  // Light mode brand colors
  light: {
    blue: 'hsl(214, 100%, 50%)',
    purple: 'hsl(256, 100%, 65%)',
    pink: 'hsl(330, 100%, 70%)',
  },
  // Dark mode brand colors
  dark: {
    blue: 'hsl(214, 100%, 60%)',
    purple: 'hsl(256, 100%, 75%)',
    pink: 'hsl(330, 100%, 80%)',
  }
};

// Gradient definitions
export const GRADIENTS = {
  // Standard horizontal gradient
  horizontal: {
    light: `linear-gradient(to right, ${BRAND_COLORS.light.blue}, ${BRAND_COLORS.light.purple})`,
    dark: `linear-gradient(to right, ${BRAND_COLORS.dark.blue}, ${BRAND_COLORS.dark.purple})`,
  },
  // Three-color gradient
  threeColor: {
    light: `linear-gradient(to right, ${BRAND_COLORS.light.blue}, ${BRAND_COLORS.light.purple}, ${BRAND_COLORS.light.pink})`,
    dark: `linear-gradient(to right, ${BRAND_COLORS.dark.blue}, ${BRAND_COLORS.dark.purple}, ${BRAND_COLORS.dark.pink})`,
  },
  // Button hover gradient
  buttonHover: {
    light: `linear-gradient(to right, ${BRAND_COLORS.light.purple}, ${BRAND_COLORS.light.pink})`,
    dark: `linear-gradient(to right, ${BRAND_COLORS.dark.purple}, ${BRAND_COLORS.dark.pink})`,
  },
};

// Border radius
export const BORDER_RADIUS = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

// Animation durations
export const ANIMATION = {
  fast: '150ms',
  default: '200ms',
  slow: '300ms',
  verySlow: '500ms',
};

// Shadow definitions
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

/**
 * Use these constants in your components for consistency.
 * Example:
 * 
 * import { BRAND_COLORS, GRADIENTS } from '@/app/components/ThemeConstants';
 * 
 * function MyComponent() {
 *   return (
 *     <div style={{ 
 *       background: GRADIENTS.horizontal.light,
 *       borderRadius: BORDER_RADIUS.lg,
 *       transition: `all ${ANIMATION.default} ease`
 *     }}>
 *       Consistent design
 *     </div>
 *   );
 * }
 */ 