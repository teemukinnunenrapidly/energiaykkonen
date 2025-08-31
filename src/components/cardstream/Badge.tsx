/**
 * Badge and Progress Components with CardStream Design System
 * All styles reference design tokens
 */

import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variantClass = `cs-badge--${variant}`;

  return (
    <span className={`cs-badge ${variantClass} ${className}`}>{children}</span>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  label?: string;
}

export function ProgressBar({
  value,
  className = '',
  label,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`progress-container ${className}`}>
      {label && (
        <div
          style={{
            marginBottom: 'var(--cs-spacing-2)',
            fontSize: 'var(--cs-font-size-xs)',
            fontWeight: 'var(--cs-font-weight-medium)',
            color: 'var(--cs-color-text-tertiary)',
          }}
        >
          {label}
        </div>
      )}
      <div className="cs-progress">
        <div
          className="cs-progress-fill"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
