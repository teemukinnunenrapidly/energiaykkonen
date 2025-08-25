/**
 * CSS Transition System for Form System
 * Provides consistent visual feedback with accessibility support
 */

// Transition duration constants
export const TRANSITION_DURATIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// Transition easing functions
export const TRANSITION_EASING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Common transition properties
export const TRANSITION_PROPERTIES = {
  all: 'all',
  colors:
    'color, background-color, border-color, text-decoration-color, fill, stroke',
  opacity: 'opacity',
  transform: 'transform',
  shadow: 'box-shadow',
  border: 'border-color, border-width',
  spacing: 'padding, margin',
  size: 'width, height, max-width, max-height, min-width, min-height',
} as const;

/**
 * Generate CSS transition string
 */
export function createTransition(
  properties: keyof typeof TRANSITION_PROPERTIES | string = 'all',
  duration: keyof typeof TRANSITION_DURATIONS = 'normal',
  easing: keyof typeof TRANSITION_EASING = 'smooth'
): string {
  const props =
    TRANSITION_PROPERTIES[properties as keyof typeof TRANSITION_PROPERTIES] ||
    properties;
  const dur = TRANSITION_DURATIONS[duration];
  const ease = TRANSITION_EASING[easing];

  return `${props} ${dur} ${ease}`;
}

/**
 * Generate CSS transition object for React inline styles
 */
export function createTransitionStyle(
  properties: keyof typeof TRANSITION_PROPERTIES | string = 'all',
  duration: keyof typeof TRANSITION_DURATIONS = 'normal',
  easing: keyof typeof TRANSITION_EASING = 'smooth'
): React.CSSProperties {
  return {
    transition: createTransition(properties, duration, easing),
  };
}

/**
 * Generate CSS transition classes for Tailwind
 */
export function createTransitionClasses(
  properties: keyof typeof TRANSITION_PROPERTIES | string = 'all',
  duration: keyof typeof TRANSITION_DURATIONS = 'normal'
): string {
  const durationMap = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
    slower: 'duration-500',
  };

  const easingMap = {
    fast: 'ease-out',
    normal: 'ease-in-out',
    slow: 'ease-in-out',
    slower: 'ease-in-out',
  };

  return `transition-${properties} ${durationMap[duration]} ${easingMap[duration]}`;
}

/**
 * Hover transition utilities
 */
export const HOVER_TRANSITIONS = {
  // Scale transforms
  scale: {
    small: 'hover:scale-105',
    medium: 'hover:scale-110',
    large: 'hover:scale-125',
  },

  // Shadow transitions
  shadow: {
    small: 'hover:shadow-md',
    medium: 'hover:shadow-lg',
    large: 'hover:shadow-xl',
  },

  // Color transitions
  colors: {
    primary: 'hover:bg-primary-600 hover:text-white',
    secondary: 'hover:bg-secondary-600 hover:text-white',
    accent: 'hover:bg-accent-600 hover:text-white',
  },
} as const;

/**
 * Focus transition utilities
 */
export const FOCUS_TRANSITIONS = {
  ring: {
    small: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    medium: 'focus:ring-4 focus:ring-blue-500 focus:ring-offset-2',
    large: 'focus:ring-8 focus:ring-blue-500 focus:ring-offset-2',
  },

  border: {
    primary: 'focus:border-blue-500',
    secondary: 'focus:border-gray-500',
    accent: 'focus:border-green-500',
  },
} as const;

/**
 * Animation utilities for form interactions
 */
export const ANIMATION_UTILITIES = {
  // Fade animations
  fade: {
    in: 'animate-in fade-in duration-200',
    out: 'animate-out fade-out duration-200',
    inUp: 'animate-in fade-in slide-in-from-bottom-2 duration-300',
    inDown: 'animate-in fade-in slide-in-from-top-2 duration-300',
    inLeft: 'animate-in fade-in slide-in-from-right-2 duration-300',
    inRight: 'animate-in fade-in slide-in-from-left-2 duration-300',
  },

  // Slide animations
  slide: {
    inUp: 'animate-in slide-in-from-bottom-4 duration-300',
    inDown: 'animate-in slide-in-from-top-4 duration-300',
    inLeft: 'animate-in slide-in-from-right-4 duration-300',
    inRight: 'animate-in slide-in-from-left-4 duration-300',
  },

  // Scale animations
  scale: {
    in: 'animate-in zoom-in-95 duration-200',
    out: 'animate-out zoom-out-95 duration-200',
  },
} as const;

/**
 * Form-specific transition utilities
 */
export const FORM_TRANSITIONS = {
  // Field focus states
  field: {
    focus:
      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
    error:
      'border-red-500 focus:ring-red-500 focus:border-red-500 transition-all duration-200',
    success:
      'border-green-500 focus:ring-green-500 focus:border-green-500 transition-all duration-200',
  },

  // Section transitions
  section: {
    enter: 'animate-in fade-in-0 slide-in-from-bottom-4 duration-300',
    exit: 'animate-out fade-out-0 slide-out-to-bottom-4 duration-300',
    active: 'border-blue-200 bg-blue-50 transition-all duration-200',
    completed: 'border-green-200 bg-green-50 transition-all duration-200',
    locked: 'opacity-60 pointer-events-none transition-all duration-200',
  },

  // Button transitions
  button: {
    primary:
      'transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95',
    secondary:
      'transition-all duration-200 hover:bg-gray-100 active:bg-gray-200',
    disabled: 'transition-all duration-200 opacity-50 cursor-not-allowed',
  },
} as const;

/**
 * Accessibility-aware transitions
 * Respects user's reduced motion preferences
 */
export function createAccessibleTransition(
  properties: keyof typeof TRANSITION_PROPERTIES | string = 'all',
  duration: keyof typeof TRANSITION_DURATIONS = 'normal',
  easing: keyof typeof TRANSITION_EASING = 'smooth'
): string {
  // Check if user prefers reduced motion
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      return 'none';
    }
  }

  return createTransition(properties, duration, easing);
}

/**
 * Generate CSS custom properties for transitions
 */
export function generateTransitionCSS(): string {
  return `
    :root {
      --transition-fast: ${TRANSITION_DURATIONS.fast};
      --transition-normal: ${TRANSITION_DURATIONS.normal};
      --transition-slow: ${TRANSITION_DURATIONS.slow};
      --transition-slower: ${TRANSITION_DURATIONS.slower};
      
      --easing-smooth: ${TRANSITION_EASING.smooth};
      --easing-bounce: ${TRANSITION_EASING.bounce};
    }
    
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
}

/**
 * Utility function to apply transitions to DOM elements
 */
export function applyTransition(
  element: HTMLElement,
  properties: keyof typeof TRANSITION_PROPERTIES | string = 'all',
  duration: keyof typeof TRANSITION_DURATIONS = 'normal',
  easing: keyof typeof TRANSITION_EASING = 'smooth'
): void {
  if (element) {
    element.style.transition = createTransition(properties, duration, easing);
  }
}

/**
 * Utility function to remove transitions from DOM elements
 */
export function removeTransition(element: HTMLElement): void {
  if (element) {
    element.style.transition = 'none';
  }
}

/**
 * Predefined transition combinations for common use cases
 */
export const COMMON_TRANSITIONS = {
  // Form field interactions
  fieldInteraction: createTransition('colors, shadow', 'fast', 'smooth'),

  // Button interactions
  buttonInteraction: createTransition('all', 'fast', 'smooth'),

  // Section state changes
  sectionState: createTransition('all', 'normal', 'smooth'),

  // Page transitions
  pageTransition: createTransition('all', 'slow', 'smooth'),

  // Modal animations
  modalAnimation: createTransition('all', 'slower', 'bounce'),
} as const;

// Export all transition utilities
export default {
  createTransition,
  createTransitionStyle,
  createTransitionClasses,
  createAccessibleTransition,
  generateTransitionCSS,
  applyTransition,
  removeTransition,
  TRANSITION_DURATIONS,
  TRANSITION_EASING,
  TRANSITION_PROPERTIES,
  HOVER_TRANSITIONS,
  FOCUS_TRANSITIONS,
  ANIMATION_UTILITIES,
  FORM_TRANSITIONS,
  COMMON_TRANSITIONS,
};
