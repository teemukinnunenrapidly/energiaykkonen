import React, { useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate } from '@/lib/supabase';
import { useCardStyles, cssValue } from '@/hooks/useCardStyles';

interface FormCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value?: string) => void;
}

export function FormCard({ card, onFieldFocus }: FormCardProps) {
  const styles = useCardStyles();
  const {
    formData,
    updateField,
    cardStates,
    submitData,
    completeCard,
    uncompleteCard,
  } = useCardContext();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Check if this card is completed - removed auto-disable for completed cards
  // const isCardCompleted = cardStates[card.id]?.status === 'complete';
  const isCardCompleted = false; // Cards remain editable even when marked as complete

  // Common label style used across all field types
  const getLabelStyle = (fieldName: string) => ({
    display: styles.formElements.label.display,
    fontSize: styles.formElements.label.fontSize,
    fontWeight: styles.formElements.label.fontWeight,
    color:
      focusedField === fieldName
        ? styles.colors.brand.primary
        : styles.formElements.label.color,
    textTransform: cssValue(styles.formElements.label.textTransform),
    letterSpacing: styles.formElements.label.letterSpacing,
    marginBottom: styles.formElements.label.marginBottom,
    transition: styles.formElements.label.transition,
  });

  const handleFieldChange = (fieldName: string, value: any) => {
    updateField(fieldName, value);

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }

    // Check if this card only has button fields
    const onlyHasButtons = card.card_fields?.every(
      (f: any) => f.field_type === 'buttons'
    );

    // If card only has button fields and card is currently completed
    if (onlyHasButtons && cardStates[card.id]?.status === 'complete') {
      // Check if all button fields are now empty/deselected
      const allButtonsDeselected = card.card_fields?.every((f: any) => {
        const fieldValue =
          f.field_name === fieldName ? value : formData[f.field_name];
        return (
          !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      });

      // If all buttons are deselected, uncomplete the card
      if (allButtonsDeselected) {
        uncompleteCard(card.id);
      }
    }
  };

  const handleFieldFocus = (field: any) => {
    setFocusedField(field.field_name);
    if (onFieldFocus) {
      onFieldFocus(card.id, field.field_name, formData[field.field_name]);
    }
  };

  const handleFieldBlur = (field: any) => {
    setFocusedField(null);
    // Validate required fields on blur
    if (field.required && !formData[field.field_name]) {
      setErrors(prev => ({
        ...prev,
        [field.field_name]: 'This field is required',
      }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit the form data using the CardContext submit functionality
      if (submitData) {
        const result = await submitData(card.config?.submit_email_template);
        if (result?.pdfUrl) {
          setPdfUrl(result.pdfUrl as string);
        }
      }

      // Mark this card as complete when submit button is clicked
      completeCard(card.id);

      // Show success message
      setSubmitSuccess(true);

      // Keep success message visible - don't auto-hide
      // setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Submission failed:', error);
      // Could add error state here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.field_name] || '';
    const error = errors[field.field_name];

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div
            style={{ marginBottom: styles.formElements.formGroup.marginBottom }}
          >
            <label style={getLabelStyle(field.field_name)}>
              {field.label}
              {field.required && (
                <span style={{ color: styles.colors.state.error }}>*</span>
              )}
            </label>
            <input
              type={field.field_type}
              value={value}
              onChange={e =>
                handleFieldChange(field.field_name, e.target.value)
              }
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              disabled={isCardCompleted}
              style={{
                ...(styles.formElements.input as React.CSSProperties),
                ...(focusedField === field.field_name
                  ? styles.formElements.input.focus
                  : {}),
                ...(error ? styles.formElements.input.error : {}),
                ...(isCardCompleted ? styles.formElements.input.disabled : {}),
              }}
            />
            {field.help_text && (
              <p
                style={{
                  fontSize: styles.typography.fontSizeBase,
                  color: styles.colors.text.tertiary,
                  marginTop: '4px',
                }}
              >
                {field.help_text}
              </p>
            )}
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
          </div>
        );

      case 'select':
        return (
          <div
            style={{ marginBottom: styles.formElements.formGroup.marginBottom }}
          >
            <label style={getLabelStyle(field.field_name)}>
              {field.label}
              {field.required && (
                <span style={{ color: styles.colors.state.error }}>*</span>
              )}
            </label>
            <select
              value={value}
              onChange={e =>
                handleFieldChange(field.field_name, e.target.value)
              }
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              disabled={isCardCompleted}
              style={{
                ...(styles.formElements.input as React.CSSProperties),
                ...(styles.formElements.select as React.CSSProperties),
                ...(focusedField === field.field_name
                  ? styles.formElements.input.focus
                  : {}),
                ...(error ? styles.formElements.input.error : {}),
                ...(isCardCompleted ? styles.formElements.input.disabled : {}),
              }}
            >
              <option value="">Select...</option>
              {field.options?.map((opt: any) => {
                // Handle both string and object options
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                return (
                  <option key={optValue} value={optValue}>
                    {optLabel}
                  </option>
                );
              })}
            </select>
            {field.help_text && (
              <p
                style={{
                  fontSize: styles.typography.fontSizeBase,
                  color: styles.colors.text.tertiary,
                  marginTop: '4px',
                }}
              >
                {field.help_text}
              </p>
            )}
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
          </div>
        );

      case 'radio':
        return (
          <div
            style={{ marginBottom: styles.formElements.formGroup.marginBottom }}
          >
            <label style={getLabelStyle(field.field_name)}>{field.label}</label>
            <div
              style={{
                display: styles.formElements.fieldRow.display,
                gridTemplateColumns:
                  styles.formElements.fieldRow.gridTemplateColumns,
                gap: styles.formElements.fieldRow.gap,
                marginBottom: styles.formElements.fieldRow.marginBottom,
                marginTop: '8px',
              }}
            >
              {field.options?.map((opt: any) => {
                // Handle both string and object options
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                return (
                  <div
                    key={optValue}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: isCardCompleted ? 0.5 : 1,
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: isCardCompleted ? 'not-allowed' : 'pointer',
                        fontSize: styles.typography.fontSizeBase,
                        color: styles.colors.text.primary,
                      }}
                    >
                      <input
                        type="radio"
                        name={field.field_name}
                        value={optValue}
                        checked={value === optValue}
                        onChange={e =>
                          handleFieldChange(field.field_name, e.target.value)
                        }
                        onFocus={() => handleFieldFocus(field)}
                        onBlur={() => handleFieldBlur(field)}
                        disabled={isCardCompleted}
                        style={{
                          accentColor: styles.colors.brand.primary,
                        }}
                      />
                      {optLabel}
                    </label>
                  </div>
                );
              })}
            </div>
            {field.help_text && (
              <p
                style={{
                  fontSize: styles.typography.fontSizeBase,
                  color: styles.colors.text.tertiary,
                  marginTop: '4px',
                }}
              >
                {field.help_text}
              </p>
            )}
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
          </div>
        );

      case 'checkbox':
        return (
          <div
            style={{ marginBottom: styles.formElements.formGroup.marginBottom }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                opacity: isCardCompleted ? 0.5 : 1,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isCardCompleted ? 'not-allowed' : 'pointer',
                  fontSize: styles.typography.fontSizeBase,
                  fontWeight: styles.formElements.label.fontWeight,
                  color: styles.colors.text.primary,
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={e =>
                    handleFieldChange(field.field_name, e.target.checked)
                  }
                  onFocus={() => handleFieldFocus(field)}
                  onBlur={() => handleFieldBlur(field)}
                  disabled={isCardCompleted}
                  style={{
                    accentColor: styles.colors.brand.primary,
                  }}
                />
                {field.label}
              </label>
            </div>
            {field.help_text && (
              <p
                style={{
                  fontSize: styles.typography.fontSizeBase,
                  color: styles.colors.text.tertiary,
                  marginTop: '4px',
                }}
              >
                {field.help_text}
              </p>
            )}
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
          </div>
        );

      case 'textarea':
        return (
          <div
            style={{ marginBottom: styles.formElements.formGroup.marginBottom }}
          >
            <label style={getLabelStyle(field.field_name)}>
              {field.label}
              {field.required && (
                <span style={{ color: styles.colors.state.error }}>*</span>
              )}
            </label>
            <textarea
              value={value}
              onChange={e =>
                handleFieldChange(field.field_name, e.target.value)
              }
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              disabled={isCardCompleted}
              style={{
                ...(styles.formElements.input as React.CSSProperties),
                ...(focusedField === field.field_name
                  ? styles.formElements.input.focus
                  : {}),
                ...(error ? styles.formElements.input.error : {}),
                ...(isCardCompleted ? styles.formElements.input.disabled : {}),
                minHeight: '80px',
                resize: 'vertical' as any,
              }}
            />
            {field.help_text && (
              <p
                style={{
                  fontSize: styles.typography.fontSizeBase,
                  color: styles.colors.text.tertiary,
                  marginTop: '4px',
                }}
              >
                {field.help_text}
              </p>
            )}
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
          </div>
        );

      case 'buttons':
        const selectOnlyOne = field.validation_rules?.selectOnlyOne !== false;
        const selectedValues = Array.isArray(value)
          ? value
          : value
            ? [value]
            : [];

        return (
          <div
            style={{ marginBottom: styles.formElements.formGroup.marginBottom }}
          >
            <label style={getLabelStyle(field.field_name)}>
              {field.label}
              {field.required && (
                <span style={{ color: styles.colors.state.error }}>*</span>
              )}
            </label>
            {field.help_text && (
              <p
                style={{
                  fontSize: styles.typography.fontSizeBase,
                  color: styles.colors.text.tertiary,
                  marginTop: '4px',
                  marginBottom: '8px',
                }}
              >
                {field.help_text}
              </p>
            )}
            <div
              style={
                styles.formElements.buttons.container as React.CSSProperties
              }
            >
              {field.options?.map((opt: any) => {
                // Handle both string and object options
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isSelected = selectedValues.includes(optValue);

                return (
                  <button
                    key={optValue}
                    type="button"
                    onClick={() => {
                      if (isCardCompleted) {
                        return;
                      }

                      if (selectOnlyOne) {
                        // Single selection mode
                        handleFieldChange(
                          field.field_name,
                          isSelected ? '' : optValue
                        );
                      } else {
                        // Multi-selection mode
                        const newValues = isSelected
                          ? selectedValues.filter((v: string) => v !== optValue)
                          : [...selectedValues, optValue];
                        handleFieldChange(field.field_name, newValues);
                      }
                    }}
                    onFocus={e => {
                      handleFieldFocus(field);
                      if (!isCardCompleted) {
                        Object.assign(
                          e.currentTarget.style,
                          styles.formElements.buttons.buttonFocus
                        );
                      }
                    }}
                    onBlur={e => {
                      handleFieldBlur(field);
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.outlineOffset = '0';
                    }}
                    disabled={isCardCompleted}
                    style={{
                      ...(styles.formElements.buttons
                        .button as React.CSSProperties),
                      ...(isSelected
                        ? {
                            ...styles.formElements.buttons.buttonSelected,
                            ...(isCardCompleted
                              ? {
                                  background:
                                    styles.formElements.buttons.buttonDisabled
                                      .background,
                                }
                              : {}), // Use disabled background when completed
                          }
                        : {}),
                      ...(isCardCompleted && !isSelected
                        ? styles.formElements.buttons.buttonDisabled
                        : {}),
                    }}
                    onMouseEnter={e => {
                      if (!isCardCompleted && !isSelected) {
                        // Apply hover styles
                        Object.assign(
                          e.currentTarget.style,
                          styles.formElements.buttons.buttonHover
                        );
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isCardCompleted && !isSelected) {
                        // Reset to base styles
                        Object.assign(
                          e.currentTarget.style,
                          styles.formElements.buttons.button
                        );
                      }
                    }}
                  >
                    <span
                      style={
                        styles.formElements.buttons
                          .buttonContent as React.CSSProperties
                      }
                    >
                      {!selectOnlyOne && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by button click
                          style={{
                            ...(styles.formElements.buttons.multiSelect
                              .checkbox as React.CSSProperties),
                            ...(isSelected
                              ? styles.formElements.buttons.multiSelect
                                  .checkboxChecked
                              : {}),
                          }}
                          disabled={isCardCompleted}
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                      <span
                        style={
                          styles.formElements.buttons
                            .buttonText as React.CSSProperties
                        }
                      >
                        {optLabel}
                      </span>
                    </span>
                    {isSelected && selectOnlyOne && (
                      <span
                        style={{
                          ...(styles.formElements.buttons
                            .buttonIndicator as React.CSSProperties),
                          ...styles.formElements.buttons
                            .buttonIndicatorSelected,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
          </div>
        );

      default:
        return <p>Unsupported field type: {field.field_type}</p>;
    }
  };

  if (!card.card_fields || card.card_fields.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          color: styles.colors.text.tertiary,
          fontSize: styles.typography.fontSizeBase,
          textAlign: 'center',
        }}
      >
        No fields defined for this card
      </div>
    );
  }

  return (
    <div
      style={{
        padding: styles.card.base.padding,
        position: cssValue(styles.card.base.position),
        overflow: styles.card.base.overflow,
      }}
    >
      {/* Header section with separator */}
      <div style={styles.card.header as React.CSSProperties}>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: styles.card.title.fontSize,
              fontWeight: styles.card.title.fontWeight,
              color: styles.card.title.color,
              lineHeight: styles.card.title.lineHeight,
              marginBottom: styles.card.title.marginBottom,
              letterSpacing: styles.card.title.letterSpacing,
            }}
          >
            {card.title || card.name}
          </h2>
          {card.config?.description && (
            <p
              style={{
                fontSize: styles.card.description.fontSize,
                fontWeight: styles.card.description.fontWeight,
                color: styles.card.description.color,
                lineHeight: styles.card.description.lineHeight,
                marginBottom: styles.card.description.marginBottom,
              }}
            >
              {card.config.description}
            </p>
          )}
        </div>
      </div>

      {/* Form Fields */}
      {card.card_fields
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(field => (
          <div key={field.field_name}>{renderField(field)}</div>
        ))}

      {/* Submit Button Section */}
      {card.config?.has_submit_button && (
        <div style={styles.submitButton.wrapper as React.CSSProperties}>
          {submitSuccess ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: styles.colors.state.success,
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              {isSubmitting ? null : (
                <span style={{ fontSize: '24px', marginRight: '8px' }}>✓</span>
              )}
              {pdfUrl ? (
                <>
                  Säästölaskelmasi on valmis.{' '}
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: styles.colors.brand.primary,
                      textDecoration: 'underline',
                      fontWeight: 600,
                    }}
                  >
                    Lataa PDF
                  </a>
                </>
              ) : (
                'Luodaan säästölaskelmaa'
              )}
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                ...(styles.submitButton.button as React.CSSProperties),
                ...(isSubmitting
                  ? (styles.submitButton.buttonDisabled as React.CSSProperties)
                  : {}),
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  Object.assign(
                    e.currentTarget.style,
                    styles.submitButton.buttonHover
                  );
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  Object.assign(
                    e.currentTarget.style,
                    styles.submitButton.button,
                    { transform: 'none', boxShadow: 'none' }
                  );
                }
              }}
              onMouseDown={e => {
                if (!isSubmitting) {
                  Object.assign(
                    e.currentTarget.style,
                    styles.submitButton.buttonActive
                  );
                }
              }}
              onMouseUp={e => {
                if (!isSubmitting) {
                  Object.assign(
                    e.currentTarget.style,
                    styles.submitButton.buttonHover
                  );
                }
              }}
            >
              {isSubmitting ? (
                <>
                  {card.config?.submit_button_text || 'Lähetä'}
                  <span
                    style={{
                      ...(styles.submitButton.buttonLoading
                        .spinner as React.CSSProperties),
                      display: 'inline-block',
                      marginLeft: '8px',
                    }}
                  />
                </>
              ) : (
                card.config?.submit_button_text || 'Lähetä'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
