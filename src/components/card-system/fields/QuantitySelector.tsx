import React, { useState } from 'react';
import { useCardStyles } from '@/hooks/useCardStyles';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface QuantitySelectorProps {
  field: {
    field_name: string;
    label: string;
    required?: boolean;
    help_text?: string;
    placeholder?: string;
    validation_rules?: {
      min?: number;
      max?: number;
      step?: number;
      default?: number;
    };
  };
  value: number | string;
  onFieldChange: (fieldName: string, value: number) => void;
  onFieldFocus?: (field: any) => void;
  onFieldBlur?: (field: any) => void;
  error?: string;
  focusedField?: string | null;
  isCardCompleted?: boolean;
}

export function QuantitySelector({
  field,
  value,
  onFieldChange,
  onFieldFocus,
  onFieldBlur,
  error,
  focusedField,
  isCardCompleted = false,
}: QuantitySelectorProps) {
  const styles = useCardStyles();
  const [isHoveredMinus, setIsHoveredMinus] = useState(false);
  const [isHoveredPlus, setIsHoveredPlus] = useState(false);
  const [isFocusedInput, setIsFocusedInput] = useState(false);

  const defaultValue = field.validation_rules?.default ?? 0;
  const min = field.validation_rules?.min ?? 0;
  const max = field.validation_rules?.max ?? 999;
  const step = field.validation_rules?.step ?? 1;

  // Use default value if no value is set
  const numValue =
    typeof value === 'string'
      ? parseFloat(value) || defaultValue
      : value !== undefined && value !== null && value !== 0
        ? value
        : defaultValue;

  // Round to 2 decimal places to avoid floating-point precision issues (e.g., 2.7 + 0.1 = 2.80000000000000004)
  const roundToDecimals = (num: number, decimals: number = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  };

  const handleDecrement = () => {
    if (isCardCompleted) {
      return;
    }
    const newValue = Math.max(min, roundToDecimals(numValue - step));
    onFieldChange(field.field_name, newValue);
  };

  const handleIncrement = () => {
    if (isCardCompleted) {
      return;
    }
    const newValue = Math.min(max, roundToDecimals(numValue + step));
    onFieldChange(field.field_name, newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCardCompleted) {
      return;
    }
    const inputValue = e.target.value;

    // Allow empty input for typing
    if (inputValue === '') {
      onFieldChange(field.field_name, 0);
      return;
    }

    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      // Don't clamp while typing - let user type freely
      onFieldChange(field.field_name, parsed);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocusedInput(true);
    // Select all text so user can immediately type a new value
    e.target.select();
    if (onFieldFocus) {
      onFieldFocus(field);
    }
  };

  const handleBlur = () => {
    setIsFocusedInput(false);
    // Clamp value to min/max when leaving the field
    if (numValue < min) {
      onFieldChange(field.field_name, min);
    } else if (numValue > max) {
      onFieldChange(field.field_name, max);
    }
    if (onFieldBlur) {
      onFieldBlur(field);
    }
  };

  const isAtMin = numValue <= min;
  const isAtMax = numValue >= max;
  const isFocused = focusedField === field.field_name || isFocusedInput;

  // Button base styles from design system
  const buttonBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    fontSize: '24px',
    fontWeight: styles.typography.fontWeightMedium,
    color: styles.colors.text.secondary,
    background: styles.colors.background.primary,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: styles.colors.border.default,
    borderRadius: '8px',
    cursor: isCardCompleted ? 'not-allowed' : 'pointer',
    transition: styles.animations.transitions.default,
    userSelect: 'none',
    flexShrink: 0,
  };

  const buttonHoverStyle: React.CSSProperties = {
    borderColor: styles.colors.border.hover,
    background: styles.colors.background.secondary,
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const buttonDisabledStyle: React.CSSProperties = {
    opacity: 0.4,
    cursor: 'not-allowed',
    background: styles.colors.background.tertiary,
  };

  const getMinusButtonStyle = (): React.CSSProperties => ({
    ...buttonBaseStyle,
    ...(isAtMin || isCardCompleted ? buttonDisabledStyle : {}),
    ...(!isAtMin && !isCardCompleted && isHoveredMinus ? buttonHoverStyle : {}),
  });

  const getPlusButtonStyle = (): React.CSSProperties => ({
    ...buttonBaseStyle,
    ...(isAtMax || isCardCompleted ? buttonDisabledStyle : {}),
    ...(!isAtMax && !isCardCompleted && isHoveredPlus ? buttonHoverStyle : {}),
  });

  // Label styles matching design system
  const labelStyle: React.CSSProperties = {
    display: styles.formElements.label.display,
    fontSize: styles.formElements.label.fontSize,
    fontWeight: styles.formElements.label.fontWeight,
    color: isFocused
      ? styles.colors.brand.primary
      : styles.formElements.label.color,
    textTransform: 'uppercase' as const,
    letterSpacing: styles.formElements.label.letterSpacing,
    marginBottom: styles.formElements.label.marginBottom,
    transition: styles.formElements.label.transition,
  };

  return (
    <div style={{ marginBottom: styles.formElements.formGroup.marginBottom }}>
      {/* Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: styles.formElements.label.marginBottom,
        }}
      >
        <label
          htmlFor={`quantity-${field.field_name}`}
          style={{ ...labelStyle, marginBottom: 0 }}
        >
          {field.label}
          {field.required && (
            <span style={{ color: styles.colors.state.error }}>*</span>
          )}
        </label>
        {field.help_text && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: styles.colors.text.tertiary,
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
                aria-label="Näytä ohje"
              >
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              style={{
                maxWidth: '250px',
                background: styles.colors.text.primary,
                color: styles.colors.background.primary,
                padding: '8px 12px',
                fontSize: '13px',
                lineHeight: '1.4',
              }}
            >
              {field.help_text}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Quantity selector container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
        }}
      >
        {/* Minus button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isAtMin || isCardCompleted}
          onMouseEnter={() => setIsHoveredMinus(true)}
          onMouseLeave={() => setIsHoveredMinus(false)}
          style={getMinusButtonStyle()}
          aria-label={`Vähennä ${field.label}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 10H16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Value input */}
        <input
          id={`quantity-${field.field_name}`}
          type="number"
          value={numValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isCardCompleted}
          min={min}
          max={max}
          step={step}
          aria-label={field.label}
          style={{
            flex: 1,
            minWidth: '60px',
            height: '48px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: styles.typography.fontWeightMedium,
            color: styles.colors.text.primary,
            background: styles.colors.background.primary,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: isFocused
              ? styles.colors.brand.primary
              : styles.colors.border.default,
            borderRadius: '8px',
            outline: 'none',
            transition: styles.animations.transitions.default,
            opacity: isCardCompleted ? 0.5 : 1,
            cursor: isCardCompleted ? 'not-allowed' : 'text',
            // Hide number input arrows
            MozAppearance: 'textfield',
          }}
          // Additional style for webkit browsers to hide arrows
          className="quantity-input"
        />

        {/* Plus button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isAtMax || isCardCompleted}
          onMouseEnter={() => setIsHoveredPlus(true)}
          onMouseLeave={() => setIsHoveredPlus(false)}
          style={getPlusButtonStyle()}
          aria-label={`Lisää ${field.label}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 4V16M4 10H16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p
          style={{
            fontSize: styles.formElements.errorMessage.fontSize,
            color: styles.formElements.errorMessage.color,
            marginTop: styles.formElements.errorMessage.marginTop,
            display: styles.formElements.errorMessage.display,
          }}
        >
          {error}
        </p>
      )}

      {/* CSS to hide number input spinners */}
      <style jsx>{`
        .quantity-input::-webkit-outer-spin-button,
        .quantity-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
