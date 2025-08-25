import React from 'react';
import { cn } from '@/lib/utils';

// Base container component with responsive behavior
interface BaseContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function BaseContainer({
  children,
  className,
  as: Component = 'div',
}: BaseContainerProps) {
  return (
    <Component className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </Component>
  );
}

// Main form container with responsive max-widths
interface FormContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function FormContainer({
  children,
  className,
  size = 'lg',
}: FormContainerProps) {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  return (
    <BaseContainer className={cn(maxWidths[size], 'py-6 sm:py-8', className)}>
      {children}
    </BaseContainer>
  );
}

// Section container for form sections
interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  isLocked?: boolean;
}

export function SectionContainer({
  children,
  className,
  isActive = false,
  isCompleted = false,
  isLocked = false,
}: SectionContainerProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-4 sm:p-6 transition-all duration-200',
        'bg-white shadow-sm',
        {
          'border-blue-200 bg-blue-50': isActive,
          'border-green-200 bg-green-50': isCompleted,
          'border-gray-200 bg-gray-50 opacity-60': isLocked,
          'border-gray-200': !isActive && !isCompleted && !isLocked,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

// Field container for individual form fields
interface FieldContainerProps {
  children: React.ReactNode;
  className?: string;
  isRequired?: boolean;
  hasError?: boolean;
}

export function FieldContainer({
  children,
  className,
  isRequired = false,
  hasError = false,
}: FieldContainerProps) {
  return (
    <div
      className={cn(
        'space-y-2',
        {
          'border-l-4 border-red-400 pl-4': hasError,
          'border-l-4 border-blue-400 pl-4': isRequired && !hasError,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

// Grid container for responsive field layouts
interface GridContainerProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export function GridContainer({
  children,
  className,
  cols = 1,
  gap = 'md',
}: GridContainerProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gaps = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('grid', gridCols[cols], gaps[gap], className)}>
      {children}
    </div>
  );
}

// Responsive sidebar container for split-screen layouts
interface SidebarContainerProps {
  children: React.ReactNode;
  className?: string;
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
}

export function SidebarContainer({
  children,
  className,
  side = 'right',
  width = 'md',
}: SidebarContainerProps) {
  const widths = {
    sm: 'w-full lg:w-1/4',
    md: 'w-full lg:w-1/3',
    lg: 'w-full lg:w-2/5',
  };

  const order = {
    left: 'order-1 lg:order-1',
    right: 'order-2 lg:order-2',
  };

  return (
    <div
      className={cn(
        'flex-shrink-0',
        widths[width],
        order[side],
        'p-4 sm:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

// Main content container for split-screen layouts
interface MainContentContainerProps {
  children: React.ReactNode;
  className?: string;
  side?: 'left' | 'right';
}

export function MainContentContainer({
  children,
  className,
  side = 'left',
}: MainContentContainerProps) {
  const order = {
    left: 'order-2 lg:order-1',
    right: 'order-1 lg:order-2',
  };

  return (
    <div className={cn('flex-1 min-w-0', order[side], 'p-4 sm:p-6', className)}>
      {children}
    </div>
  );
}

// Split screen container for calculator layout
interface SplitScreenContainerProps {
  children: React.ReactNode;
  className?: string;
  leftWidth?: 'sm' | 'md' | 'lg';
  rightWidth?: 'sm' | 'md' | 'lg';
}

export function SplitScreenContainer({
  children,
  className,
  leftWidth = 'lg',
  rightWidth = 'md',
}: SplitScreenContainerProps) {
  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row min-h-screen',
        'bg-gray-50',
        className
      )}
    >
      <MainContentContainer side="left" className="flex-1">
        <div className="h-full flex items-center justify-center">
          {/* Left side content (visualization) */}
          {React.Children.toArray(children)[0]}
        </div>
      </MainContentContainer>

      <SidebarContainer
        side="right"
        width={rightWidth}
        className="bg-white shadow-lg"
      >
        {/* Right side content (form) */}
        {React.Children.toArray(children)[1]}
      </SidebarContainer>
    </div>
  );
}

// Scrollable container for form sections
interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showScrollbar?: boolean;
}

export function ScrollableContainer({
  children,
  className,
  maxHeight = 'max-h-[600px]',
  showScrollbar = true,
}: ScrollableContainerProps) {
  return (
    <div
      className={cn(
        'overflow-y-auto',
        maxHeight,
        {
          'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100':
            showScrollbar,
          'scrollbar-hide': !showScrollbar,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

// Card container for form elements
interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function CardContainer({
  children,
  className,
  variant = 'default',
}: CardContainerProps) {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    outlined: 'bg-transparent border-2 border-gray-200',
    elevated: 'bg-white border border-gray-200 shadow-lg',
  };

  return (
    <div className={cn('rounded-lg p-4 sm:p-6', variants[variant], className)}>
      {children}
    </div>
  );
}

// Responsive text container
interface TextContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export function TextContainer({
  children,
  className,
  size = 'base',
  weight = 'normal',
}: TextContainerProps) {
  const sizes = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  };

  const weights = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <div className={cn(sizes[size], weights[weight], className)}>
      {children}
    </div>
  );
}
