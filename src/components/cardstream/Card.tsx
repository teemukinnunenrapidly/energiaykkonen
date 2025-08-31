/**
 * Card Component with Design Token System
 * Implements all card variants and states from cardstream-design-system.json
 */

import React from 'react';

export type CardVariant =
  | 'form'
  | 'calculation'
  | 'info'
  | 'action'
  | 'progress';
export type CardState = 'default' | 'locked' | 'active' | 'complete';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  state?: CardState;
  className?: string;
  animate?: boolean;
}

export function Card({
  children,
  variant = 'form',
  state = 'default',
  className = '',
  animate = false,
}: CardProps) {
  const variantClass =
    variant !== 'form' ? `cs-card--${variant}` : 'cs-card--form';
  const stateClass = state !== 'default' ? `cs-card--${state}` : '';
  const animateClass = animate ? 'cs-animate-reveal' : '';

  return (
    <div
      className={`cs-card ${variantClass} ${stateClass} ${animateClass} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  stepIndicator?: string;
  title: string;
  description?: string;
}

export function CardHeader({
  stepIndicator,
  title,
  description,
}: CardHeaderProps) {
  return (
    <>
      {stepIndicator && (
        <span className="cs-step-indicator">{stepIndicator}</span>
      )}
      <h2 className="cs-card-title">{title}</h2>
      {description && <p className="cs-card-description">{description}</p>}
    </>
  );
}

interface MetricDisplayProps {
  value: string | number;
  unit?: string;
  className?: string;
}

export function MetricDisplay({
  value,
  unit,
  className = '',
}: MetricDisplayProps) {
  return (
    <div className={`metric-display ${className}`}>
      <span className="cs-metric-value">{value}</span>
      {unit && <span className="cs-metric-unit">{unit}</span>}
    </div>
  );
}
