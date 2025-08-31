/**
 * Button Components with CardStream Design System
 * All styles reference design tokens - no hardcoded values
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'minimal' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantClass = `cs-button--${variant}`;

  return (
    <button className={`cs-button ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface ButtonGroupProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ButtonGroup({
  children,
  align = 'left',
  gap = 'md',
  className = '',
}: ButtonGroupProps) {
  const gapValue =
    gap === 'sm'
      ? 'var(--cs-spacing-2)'
      : gap === 'lg'
        ? 'var(--cs-spacing-6)'
        : 'var(--cs-spacing-4)';

  return (
    <div
      className={`button-group ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          align === 'center'
            ? 'center'
            : align === 'right'
              ? 'flex-end'
              : 'flex-start',
        gap: gapValue,
        marginTop: 'var(--cs-spacing-6)',
      }}
    >
      {children}
    </div>
  );
}
