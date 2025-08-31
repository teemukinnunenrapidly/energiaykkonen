/**
 * Card Type Variants using CardStream Design System
 * Each card type follows the token-based styling system
 */

import React from 'react';
import { Card, CardHeader, MetricDisplay } from './Card';
import { Button, ButtonGroup } from './Button';
import { Badge, ProgressBar } from './Badge';

interface FormCardProps {
  stepIndicator?: string;
  title: string;
  description?: string;
  onSubmit?: () => void;
  children?: React.ReactNode;
}

export function FormCard({
  stepIndicator,
  title,
  description,
  onSubmit,
  children,
}: FormCardProps) {
  return (
    <Card variant="form" animate>
      <CardHeader
        stepIndicator={stepIndicator}
        title={title}
        description={description}
      />

      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        {children}
      </form>
    </Card>
  );
}

interface CalculationCardProps {
  title: string;
  description?: string;
  metrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
  }>;
  badge?: {
    text: string;
    variant?: 'default' | 'primary' | 'success';
  };
}

export function CalculationCard({
  title,
  description,
  metrics,
  badge,
}: CalculationCardProps) {
  return (
    <Card variant="calculation" animate>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--cs-spacing-4)',
        }}
      >
        <div>
          <h2 className="cs-card-title">{title}</h2>
          {description && <p className="cs-card-description">{description}</p>}
        </div>
        {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--cs-spacing-6)',
        }}
      >
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="cs-label">{metric.label}</div>
            <MetricDisplay value={metric.value} unit={metric.unit} />
          </div>
        ))}
      </div>
    </Card>
  );
}

interface InfoCardProps {
  title: string;
  description?: string;
  content: string;
  icon?: React.ReactNode;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export function InfoCard({
  title,
  description,
  content,
  icon,
  action,
}: InfoCardProps) {
  return (
    <Card variant="info">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--cs-spacing-4)',
        }}
      >
        {icon && (
          <div
            style={{
              color: 'var(--cs-color-semantic-info)',
              fontSize: 'var(--cs-font-size-xl)',
            }}
          >
            {icon}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <h3 className="cs-card-title">{title}</h3>
          {description && <p className="cs-card-description">{description}</p>}

          <div
            style={{
              fontSize: 'var(--cs-font-size-base)',
              color: 'var(--cs-color-text-primary)',
              lineHeight: 'var(--cs-line-height-relaxed)',
            }}
          >
            {content}
          </div>

          {action && (
            <ButtonGroup align="left" className="mt-4">
              <Button variant="minimal" onClick={action.onClick}>
                {action.text}
              </Button>
            </ButtonGroup>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  description?: string;
  primaryAction: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  disabled?: boolean;
}

export function ActionCard({
  title,
  description,
  primaryAction,
  secondaryAction,
  disabled = false,
}: ActionCardProps) {
  return (
    <Card variant="action" state={disabled ? 'locked' : 'default'}>
      <h2 className="cs-card-title" style={{ textAlign: 'center' }}>
        {title}
      </h2>

      {description && (
        <p className="cs-card-description" style={{ textAlign: 'center' }}>
          {description}
        </p>
      )}

      <ButtonGroup align="center">
        <Button
          variant="primary"
          onClick={primaryAction.onClick}
          disabled={disabled}
        >
          {primaryAction.text}
        </Button>

        {secondaryAction && (
          <Button
            variant="ghost"
            onClick={secondaryAction.onClick}
            disabled={disabled}
          >
            {secondaryAction.text}
          </Button>
        )}
      </ButtonGroup>
    </Card>
  );
}

interface ProgressCardProps {
  title: string;
  description?: string;
  steps: Array<{
    label: string;
    complete: boolean;
  }>;
  currentStep?: number;
  progress?: number;
}

export function ProgressCard({
  title,
  description,
  steps,
  currentStep = 0,
  progress = 0,
}: ProgressCardProps) {
  return (
    <Card variant="progress">
      <CardHeader title={title} description={description} />

      <ProgressBar
        value={progress}
        label={`${Math.round(progress)}% Complete`}
      />

      <div style={{ marginTop: 'var(--cs-spacing-6)' }}>
        {steps.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--cs-spacing-3)',
              marginBottom: 'var(--cs-spacing-3)',
            }}
          >
            <div
              style={{
                width: 'var(--cs-spacing-6)',
                height: 'var(--cs-spacing-6)',
                borderRadius: 'var(--cs-border-radius-full)',
                background: step.complete
                  ? 'var(--cs-color-semantic-success)'
                  : index === currentStep
                    ? 'var(--cs-color-brand-primary)'
                    : 'var(--cs-color-background-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--cs-font-size-xs)',
                fontWeight: 'var(--cs-font-weight-semibold)',
                color:
                  step.complete || index === currentStep
                    ? 'var(--cs-color-text-inverse)'
                    : 'var(--cs-color-text-tertiary)',
              }}
            >
              {step.complete ? '✓' : index + 1}
            </div>

            <span
              style={{
                fontSize: 'var(--cs-font-size-base)',
                color: step.complete
                  ? 'var(--cs-color-semantic-success)'
                  : index === currentStep
                    ? 'var(--cs-color-text-primary)'
                    : 'var(--cs-color-text-secondary)',
                fontWeight:
                  index === currentStep
                    ? 'var(--cs-font-weight-medium)'
                    : 'var(--cs-font-weight-normal)',
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
