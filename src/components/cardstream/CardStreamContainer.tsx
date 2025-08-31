/**
 * CardStream Container Component
 * Main container following the CardStream design system
 * Every style references design tokens from cardstream-design-system.json
 */

import React from 'react';

interface CardStreamContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function CardStreamContainer({ children, className = '' }: CardStreamContainerProps) {
  return (
    <div className={`cs-container ${className}`}>
      {children}
    </div>
  );
}

interface CardStreamProps {
  children: React.ReactNode;
  className?: string;
}

export function CardStream({ children, className = '' }: CardStreamProps) {
  return (
    <div className={`cs-card-stream ${className}`}>
      {children}
    </div>
  );
}

interface VisualPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function VisualPanel({ children, className = '' }: VisualPanelProps) {
  return (
    <div className={`cs-visual-panel ${className}`}>
      {children}
    </div>
  );
}