import React, { useState, useEffect } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate } from '@/lib/supabase';
import { useCardStyles, cssValue } from '@/hooks/useCardStyles';
import { gtmEvents } from '@/config/gtm';
import { QuantitySelector } from '../fields/QuantitySelector';
import { NextButton } from '../NextButton';

// Cloudflare account hash for image URLs
const CLOUDFLARE_ACCOUNT_HASH =
  process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH || 'AkEHl6uYQM8NNRufIXHzFw';

// Hook to detect mobile viewport
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

interface FormCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value?: string) => void;
  isLastCard?: boolean;
}

export function FormCard({
  card,
  onFieldFocus,
  isLastCard = false,
}: FormCardProps) {
  const styles = useCardStyles();
  const isMobile = useIsMobile();

  // Determine card style variant: 'default', 'inverted', 'visual-overlay', 'cta', or 'cta-inverted'
  const cardStyle = card.config?.card_style || 'default';
  const isHighlight = cardStyle === 'inverted';
  const isVisualOverlay = cardStyle === 'visual-overlay';
  const isCta = cardStyle === 'cta';
  const isCtaInverted = cardStyle === 'cta-inverted';
  const highlightStyles = isHighlight
    ? (styles as any).highlightFormCard
    : null;
  const visualOverlayStyles = isVisualOverlay
    ? (styles as any).visualOverlayFormCard
    : null;
  const ctaStyles = isCta ? (styles as any).ctaFormCard : null;
  const ctaInvertedStyles = isCtaInverted
    ? (styles as any).ctaFormCardInverted
    : null;

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
  // Track button hover/focus state per option to compute styles purely from config
  const [buttonInteraction, setButtonInteraction] = useState<
    Record<string, { isHovered: boolean; isFocused: boolean }>
  >({});
  // Background image URL for visual-overlay style
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null
  );

  // Fetch background image for visual-overlay style
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      if (!isVisualOverlay) {
        return;
      }

      const visualObjectId = card.config?.linked_visual_object_id;
      if (!visualObjectId) {
        return;
      }

      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: images } = await supabase
          .from('visual_object_images')
          .select('cloudflare_image_id')
          .eq('visual_object_id', visualObjectId)
          .order('display_order')
          .limit(1);

        if (images && images.length > 0) {
          const imageUrl = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${images[0].cloudflare_image_id}/public`;
          setBackgroundImageUrl(imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch background image:', error);
      }
    };

    fetchBackgroundImage();
  }, [isVisualOverlay, card.config?.linked_visual_object_id]);

  const getButtonKey = (fieldName: string, optionValue: string) =>
    `${fieldName}:${optionValue}`;
  const setButtonHover = (key: string, value: boolean) =>
    setButtonInteraction(prev => ({
      ...prev,
      [key]: { ...prev[key], isHovered: value },
    }));
  const setButtonFocus = (key: string, value: boolean) =>
    setButtonInteraction(prev => ({
      ...prev,
      [key]: { ...prev[key], isFocused: value },
    }));

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

  const handleFieldBlur = () => {
    setFocusedField(null);
    // Validation only happens on submit, not on blur
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    // Track form start event
    gtmEvents.formStart(card.title || card.name || 'unknown_form');

    // Validate required fields before attempting submission
    const validationErrors: Record<string, string> = {};
    const fields = card.card_fields || [];
    for (const f of fields) {
      if (!f.required) {
        continue;
      }
      const fieldValue = formData[f.field_name];
      const isFilled =
        f.field_type === 'checkbox'
          ? fieldValue === true
          : fieldValue !== undefined &&
            fieldValue !== null &&
            String(fieldValue).trim() !== '';
      if (!isFilled) {
        validationErrors[f.field_name] = 'This field is required';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...validationErrors }));
      return; // Block submission until required fields are satisfied
    }

    setIsSubmitting(true);
    try {
      // Submit the form data using the CardContext submit functionality
      if (submitData) {
        const result = await submitData(card.config?.submit_email_template);
        if (result?.pdfUrl) {
          setPdfUrl(result.pdfUrl as string);
        }

        // Track successful form submission
        gtmEvents.formSubmit(card.title || card.name || 'unknown_form', {
          card_id: card.id,
          lead_id: result?.leadId,
          pdf_generated: !!result?.pdfUrl,
        });
      }

      // Mark this card as complete when submit button is clicked
      completeCard(card.id);

      // Show success message
      setSubmitSuccess(true);

      // Keep success message visible - don't auto-hide
      // setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      // Submission failed
      // Track error event
      gtmEvents.errorOccurred(
        'form_submission',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Could add error state here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.field_name] || '';
    const error = errors[field.field_name];

    switch (field.field_type) {
      case 'quantity':
        return (
          <QuantitySelector
            field={field}
            value={formData[field.field_name] || 0}
            onFieldChange={handleFieldChange}
            onFieldFocus={handleFieldFocus}
            onFieldBlur={handleFieldBlur}
            error={error}
            focusedField={focusedField}
            isCardCompleted={isCardCompleted}
          />
        );

      case 'text':
      case 'email':
      case 'number':
      case 'phone':
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
              type={field.field_type === 'phone' ? 'tel' : field.field_type}
              inputMode={field.field_type === 'phone' ? 'tel' : undefined}
              autoComplete={field.field_type === 'phone' ? 'tel' : undefined}
              value={value}
              onChange={e =>
                handleFieldChange(field.field_name, e.target.value)
              }
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur()}
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
              onBlur={() => handleFieldBlur()}
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
                        onBlur={() => handleFieldBlur()}
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
                  onBlur={() => handleFieldBlur()}
                  disabled={isCardCompleted}
                  style={{
                    accentColor: styles.colors.brand.primary,
                  }}
                />
                {field.field_name === 'gdpr_consent' ? (
                  <>
                    Hyväksyn{' '}
                    <a
                      href="https://energiaykkonen.fi/tietosuojaseloste/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: styles.colors.brand.primary,
                        textDecoration: 'underline',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      tietosuojaselosteen
                    </a>
                  </>
                ) : (
                  field.label
                )}
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
              onBlur={() => handleFieldBlur()}
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
        const labelId = `label-${field.field_name}`;
        const helpTextId = field.help_text
          ? `help-${field.field_name}`
          : undefined;
        const errorId = errors[field.field_name]
          ? `error-${field.field_name}`
          : undefined;
        const selectedValues = Array.isArray(value)
          ? value
          : value
            ? [value]
            : [];

        return (
          <div
            style={{ marginBottom: styles.formElements.formGroup.marginBottom }}
          >
            {/* Button groups should display label and required indicator for context & accessibility */}
            <label
              id={labelId}
              style={{
                ...getLabelStyle(field.field_name),
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {field.label}
              {field.required && (
                <span style={{ color: styles.colors.state.error }}>*</span>
              )}
            </label>
            {field.help_text && (
              <p
                id={helpTextId}
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
              role={selectOnlyOne ? 'radiogroup' : 'group'}
              aria-labelledby={labelId}
              aria-required={selectOnlyOne && field.required ? true : undefined}
              aria-invalid={selectOnlyOne && error ? true : undefined}
              aria-describedby={
                [helpTextId, errorId].filter(Boolean).join(' ') || undefined
              }
              style={
                styles.formElements.buttons.container as React.CSSProperties
              }
            >
              {field.options?.map((opt: any) => {
                // Handle both string and object options
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isSelected = selectedValues.includes(optValue);
                const key = getButtonKey(field.field_name, optValue);
                const interaction = buttonInteraction[key] || {
                  isHovered: false,
                  isFocused: false,
                };
                const isHovered = interaction.isHovered;
                const isFocused = interaction.isFocused;

                return (
                  <button
                    key={optValue}
                    type="button"
                    onClick={e => {
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
                      // Remove lingering focus ring after mouse click (prevents double borders)
                      setButtonFocus(key, false);
                      if (e.detail !== 0) {
                        (e.currentTarget as HTMLButtonElement).blur();
                      }
                    }}
                    onFocus={() => {
                      handleFieldFocus(field);
                      if (!isCardCompleted) {
                        setButtonFocus(key, true);
                      }
                    }}
                    onBlur={() => {
                      // For button groups, avoid on-blur required validation which can
                      // briefly fire before state updates, causing a flicker of
                      // "This field is required" despite a valid selection.
                      setButtonFocus(key, false);
                    }}
                    disabled={isCardCompleted}
                    role={selectOnlyOne ? 'radio' : undefined}
                    aria-checked={selectOnlyOne ? isSelected : undefined}
                    aria-pressed={!selectOnlyOne ? isSelected : undefined}
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
                              : {}),
                          }
                        : {}),
                      // Apply hover/focus only when not selected to avoid double borders
                      ...(!isSelected && isHovered
                        ? (styles.formElements.buttons
                            .buttonHover as React.CSSProperties)
                        : {}),
                      ...(!isSelected && isFocused
                        ? (styles.formElements.buttons
                            .buttonFocus as React.CSSProperties)
                        : {}),
                      ...(isCardCompleted && !isSelected
                        ? (styles.formElements.buttons
                            .buttonDisabled as React.CSSProperties)
                        : {}),
                    }}
                    onMouseEnter={() => {
                      if (!isCardCompleted) {
                        setButtonHover(key, true);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isCardCompleted) {
                        setButtonHover(key, false);
                      }
                    }}
                  >
                    <span
                      style={
                        styles.formElements.buttons
                          .buttonContent as React.CSSProperties
                      }
                    >
                      <span
                        style={
                          styles.formElements.buttons
                            .buttonText as React.CSSProperties
                        }
                      >
                        {optLabel}
                      </span>
                    </span>
                    {/* Checkmark indicator intentionally removed */}
                  </button>
                );
              })}
            </div>
            {error && (
              <p
                id={errorId}
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

  // Visual Overlay variant - full width background with form on right (golden ratio)
  if (isVisualOverlay && visualOverlayStyles) {
    return (
      <div
        style={{
          ...(visualOverlayStyles.wrapper as React.CSSProperties),
          backgroundImage: backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : undefined,
          backgroundColor: backgroundImageUrl
            ? undefined
            : styles.colors.brand.primary,
        }}
      >
        {/* Gradient overlay for readability */}
        <div style={visualOverlayStyles.overlay as React.CSSProperties} />

        {/* Form container - positioned at golden ratio */}
        <div
          style={{
            ...(visualOverlayStyles.formContainer as React.CSSProperties),
            ...(isMobile ? visualOverlayStyles.formContainerMobile : {}),
          }}
        >
          {/* Header */}
          <div style={visualOverlayStyles.header as React.CSSProperties}>
            <h2 style={visualOverlayStyles.title as React.CSSProperties}>
              {card.title || card.name}
            </h2>
            {card.config?.description && (
              <p style={visualOverlayStyles.description as React.CSSProperties}>
                {card.config.description}
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div style={visualOverlayStyles.formSection as React.CSSProperties}>
            {card.card_fields
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map(field => (
                <div key={field.field_name}>{renderField(field)}</div>
              ))}

            {/* Next Button - shown for non-submit form cards */}
            {!card.config?.has_submit_button && (
              <NextButton card={card} isLastCard={isLastCard} />
            )}

            {/* Submit Button Section */}
            {card.config?.has_submit_button && (
              <div
                style={visualOverlayStyles.submitWrapper as React.CSSProperties}
              >
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
                      <span style={{ fontSize: '24px', marginRight: '8px' }}>
                        ✓
                      </span>
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
                      ...(visualOverlayStyles.submitButton as React.CSSProperties),
                      ...(isSubmitting
                        ? { opacity: 0.7, cursor: 'not-allowed' }
                        : {}),
                    }}
                    onMouseEnter={e => {
                      if (!isSubmitting) {
                        Object.assign(
                          e.currentTarget.style,
                          visualOverlayStyles.submitButtonHover
                        );
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSubmitting) {
                        Object.assign(
                          e.currentTarget.style,
                          visualOverlayStyles.submitButton,
                          {
                            transform: 'none',
                            boxShadow: 'none',
                          }
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
        </div>
      </div>
    );
  }

  // CTA Card variant - two-column layout with content left, form right
  if (isCta && ctaStyles) {
    // Parse benefits from config if provided
    const benefits = card.config?.cta_benefits || [];
    const ctaBadge = card.config?.cta_badge || null;

    return (
      <div
        style={{
          ...(ctaStyles.wrapper as React.CSSProperties),
          ...(isMobile ? ctaStyles.wrapperMobile : {}),
        }}
      >
        {/* Decorative background element */}
        <div style={ctaStyles.backgroundDecoration as React.CSSProperties} />

        {/* Left column - Content */}
        <div
          style={{
            ...(ctaStyles.contentColumn as React.CSSProperties),
            ...(isMobile ? { alignItems: 'center' } : {}),
          }}
        >
          {/* Optional badge */}
          {ctaBadge && (
            <span style={ctaStyles.badge as React.CSSProperties}>
              {ctaBadge}
            </span>
          )}

          {/* Title */}
          <h2 style={ctaStyles.title as React.CSSProperties}>
            {card.title || card.name}
          </h2>

          {/* Description */}
          {card.config?.description && (
            <p
              style={{
                ...(ctaStyles.description as React.CSSProperties),
                ...(isMobile ? { margin: '0 auto' } : {}),
              }}
            >
              {card.config.description}
            </p>
          )}

          {/* Benefits list */}
          {benefits.length > 0 && (
            <div
              style={{
                ...(ctaStyles.benefitsList as React.CSSProperties),
                ...(isMobile ? { alignItems: 'center' } : {}),
              }}
            >
              {benefits.map((benefit: string, index: number) => (
                <div
                  key={index}
                  style={ctaStyles.benefitItem as React.CSSProperties}
                >
                  <span style={ctaStyles.benefitIcon as React.CSSProperties}>
                    ✓
                  </span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column - Form */}
        <div style={ctaStyles.formColumn as React.CSSProperties}>
          {/* Form Fields */}
          <div style={ctaStyles.formSection as React.CSSProperties}>
            {card.card_fields
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map(field => (
                <div key={field.field_name}>{renderField(field)}</div>
              ))}

            {/* Next Button - shown for non-submit form cards */}
            {!card.config?.has_submit_button && (
              <NextButton card={card} isLastCard={isLastCard} />
            )}

            {/* Submit Button Section */}
            {card.config?.has_submit_button && (
              <div style={ctaStyles.submitWrapper as React.CSSProperties}>
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
                      <span style={{ fontSize: '24px', marginRight: '8px' }}>
                        ✓
                      </span>
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
                      ...(ctaStyles.submitButton as React.CSSProperties),
                      ...(isSubmitting
                        ? { opacity: 0.7, cursor: 'not-allowed' }
                        : {}),
                    }}
                    onMouseEnter={e => {
                      if (!isSubmitting) {
                        Object.assign(
                          e.currentTarget.style,
                          ctaStyles.submitButtonHover
                        );
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSubmitting) {
                        Object.assign(
                          e.currentTarget.style,
                          ctaStyles.submitButton,
                          {
                            transform: 'none',
                            boxShadow: ctaStyles.submitButton.boxShadow,
                          }
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
        </div>
      </div>
    );
  }

  // CTA Inverted Card variant - white background, green form area
  if (isCtaInverted && ctaInvertedStyles) {
    const ctaBadge = card.config?.cta_badge || null;

    // Custom label style for form area - left-aligned on mobile
    const getInvertedLabelStyle = () => ({
      display: styles.formElements.label.display,
      fontSize: styles.formElements.label.fontSize,
      fontWeight: styles.formElements.label.fontWeight,
      color: ctaInvertedStyles.formLabelColor,
      textTransform: cssValue(styles.formElements.label.textTransform),
      letterSpacing: styles.formElements.label.letterSpacing,
      marginBottom: styles.formElements.label.marginBottom,
      transition: styles.formElements.label.transition,
      textAlign: 'left' as const, // Always left-align labels
    });

    // Custom input style - transparent background with full border on all devices
    const getInvertedInputStyle = (
      fieldName: string,
      error: string | undefined
    ) => {
      let borderColor = ctaInvertedStyles.formInputBorder;
      if (error) {
        borderColor = styles.colors.state.error;
      } else if (focusedField === fieldName) {
        borderColor = styles.colors.brand.primary;
      }

      return {
        width: '100%',
        padding: '12px 16px',
        fontSize: '16px',
        background: 'transparent',
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderLeft: `1px solid ${borderColor}`,
        borderRadius: '8px',
        outline: 'none',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
        ...(focusedField === fieldName
          ? { boxShadow: '0 0 0 3px rgba(10, 117, 38, 0.15)' }
          : {}),
      };
    };

    // Render field with inverted styles for dark background
    const renderInvertedField = (field: any) => {
      const value = formData[field.field_name] || '';
      const error = errors[field.field_name];

      switch (field.field_type) {
        case 'text':
        case 'email':
        case 'number':
        case 'phone':
          return (
            <div
              style={{
                marginBottom: styles.formElements.formGroup.marginBottom,
                textAlign: 'left', // Override centered text from mobile wrapper
              }}
            >
              <label style={getInvertedLabelStyle()}>
                {field.label}
                {field.required && <span style={{ color: '#fca5a5' }}>*</span>}
              </label>
              <input
                type={field.field_type === 'phone' ? 'tel' : field.field_type}
                inputMode={field.field_type === 'phone' ? 'tel' : undefined}
                autoComplete={field.field_type === 'phone' ? 'tel' : undefined}
                value={value}
                onChange={e =>
                  handleFieldChange(field.field_name, e.target.value)
                }
                onFocus={() => handleFieldFocus(field)}
                onBlur={() => handleFieldBlur()}
                style={getInvertedInputStyle(field.field_name, error)}
              />
              {error && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#fca5a5',
                    marginTop: '4px',
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
              style={{
                marginBottom: styles.formElements.formGroup.marginBottom,
                textAlign: 'left', // Override centered text from mobile wrapper
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: styles.typography.fontSizeBase,
                  color: styles.colors.text.primary,
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={e =>
                    handleFieldChange(field.field_name, e.target.checked)
                  }
                  style={{ accentColor: styles.colors.brand.primary }}
                />
                {field.field_name === 'gdpr_consent' ? (
                  <>
                    Hyväksyn{' '}
                    <a
                      href="https://energiaykkonen.fi/tietosuojaseloste/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: styles.colors.brand.primary,
                        textDecoration: 'underline',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      tietosuojaselosteen
                    </a>
                  </>
                ) : (
                  field.label
                )}
              </label>
              {error && (
                <p
                  style={{
                    fontSize: '12px',
                    color: styles.colors.state.error,
                    marginTop: '4px',
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          );

        default:
          return renderField(field);
      }
    };

    return (
      <div
        style={{
          ...(ctaInvertedStyles.wrapper as React.CSSProperties),
          ...(isMobile ? ctaInvertedStyles.wrapperMobile : {}),
        }}
      >
        {/* Decorative background element */}
        <div
          style={ctaInvertedStyles.backgroundDecoration as React.CSSProperties}
        />

        {/* Left column - Content */}
        <div
          style={{
            ...(ctaInvertedStyles.contentColumn as React.CSSProperties),
            ...(isMobile ? { alignItems: 'center' } : {}),
          }}
        >
          {ctaBadge && (
            <span style={ctaInvertedStyles.badge as React.CSSProperties}>
              {ctaBadge}
            </span>
          )}

          <h2 style={ctaInvertedStyles.title as React.CSSProperties}>
            {card.title || card.name}
          </h2>

          <p
            style={{
              ...(ctaInvertedStyles.description as React.CSSProperties),
              ...(isMobile ? { margin: '0 auto' } : {}),
            }}
          >
            {card.config?.description ||
              'Täytä tietosi ja saat automaattisen säästölaskelman sähköpostiisi.'}
          </p>

          {/* Benefits section - only show on desktop, mobile shows after form */}
          {!isMobile && (
            <div style={{ marginTop: '32px' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#0a7526',
                  margin: 0,
                }}
              >
                Energiaykkönen Oy
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '16px 0 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '15px',
                    color: '#374151',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      color: '#0a7526',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    ✓
                  </span>
                  <span>
                    Lämmitysjärjestelmien asiantuntija tuhansien kohteiden
                    kokemuksella
                  </span>
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '15px',
                    color: '#374151',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      color: '#0a7526',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    ✓
                  </span>
                  <span>
                    Asiakkaistamme 94 % suosittelee palvelujamme myös
                    tuttavilleen
                  </span>
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '15px',
                    color: '#374151',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      color: '#0a7526',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    ✓
                  </span>
                  <span>
                    5 vuoden asennustakuu ja 10 vuoden huolenpitosopimus
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right column - Form with green background */}
        <div
          style={{
            ...(ctaInvertedStyles.formColumn as React.CSSProperties),
            ...(isMobile ? ctaInvertedStyles.formColumnMobile : {}),
          }}
        >
          <div style={ctaInvertedStyles.formSection as React.CSSProperties}>
            {card.card_fields
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map(field => (
                <div key={field.field_name}>{renderInvertedField(field)}</div>
              ))}

            {!card.config?.has_submit_button && (
              <NextButton card={card} isLastCard={isLastCard} />
            )}

            {card.config?.has_submit_button && (
              <div
                style={ctaInvertedStyles.submitWrapper as React.CSSProperties}
              >
                {submitSuccess ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#0a7526',
                      fontSize: '16px',
                      fontWeight: '500',
                    }}
                  >
                    <span style={{ fontSize: '24px', marginRight: '8px' }}>
                      ✓
                    </span>
                    {pdfUrl ? (
                      <>
                        Säästölaskelmasi on valmis.{' '}
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#0a7526',
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
                      ...(ctaInvertedStyles.submitButton as React.CSSProperties),
                      ...(isSubmitting
                        ? { opacity: 0.7, cursor: 'not-allowed' }
                        : {}),
                    }}
                    onMouseEnter={e => {
                      if (!isSubmitting) {
                        Object.assign(
                          e.currentTarget.style,
                          ctaInvertedStyles.submitButtonHover
                        );
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSubmitting) {
                        Object.assign(
                          e.currentTarget.style,
                          ctaInvertedStyles.submitButton,
                          {
                            transform: 'none',
                            boxShadow: ctaInvertedStyles.submitButton.boxShadow,
                          }
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
        </div>

        {/* Benefits section - only show on mobile, after form */}
        {isMobile && (
          <div style={{ marginTop: '24px', textAlign: 'left' }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0a7526',
                margin: 0,
              }}
            >
              Energiaykkönen Oy
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '16px 0 0 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <li
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '15px',
                  color: '#374151',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{ color: '#0a7526', flexShrink: 0, marginTop: '2px' }}
                >
                  ✓
                </span>
                <span>
                  Lämmitysjärjestelmien asiantuntija tuhansien kohteiden
                  kokemuksella
                </span>
              </li>
              <li
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '15px',
                  color: '#374151',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{ color: '#0a7526', flexShrink: 0, marginTop: '2px' }}
                >
                  ✓
                </span>
                <span>
                  Asiakkaistamme 94 % suosittelee palvelujamme myös tuttavilleen
                </span>
              </li>
              <li
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '15px',
                  color: '#374151',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{ color: '#0a7526', flexShrink: 0, marginTop: '2px' }}
                >
                  ✓
                </span>
                <span>
                  5 vuoden asennustakuu ja 10 vuoden huolenpitosopimus
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={
        isHighlight
          ? (highlightStyles.container as React.CSSProperties)
          : {
              padding: isMobile
                ? (styles.responsive as any)?.mobile?.card?.padding || '16px'
                : styles.card.base.padding,
              position: cssValue(styles.card.base.position),
              overflow: styles.card.base.overflow,
            }
      }
    >
      {/* Header section */}
      <div
        style={
          isHighlight
            ? (highlightStyles.header as React.CSSProperties)
            : (styles.card.header as React.CSSProperties)
        }
      >
        <div style={isHighlight ? { width: '100%' } : { flex: 1 }}>
          <h2
            style={
              isHighlight
                ? (highlightStyles.title as React.CSSProperties)
                : {
                    fontSize: styles.card.title.fontSize,
                    fontWeight: styles.card.title.fontWeight,
                    color: styles.card.title.color,
                    lineHeight: styles.card.title.lineHeight,
                    marginBottom: styles.card.title.marginBottom,
                    letterSpacing: styles.card.title.letterSpacing,
                  }
            }
          >
            {card.title || card.name}
          </h2>
          {card.config?.description && (
            <p
              style={
                isHighlight
                  ? (highlightStyles.description as React.CSSProperties)
                  : {
                      fontSize: styles.card.description.fontSize,
                      fontWeight: styles.card.description.fontWeight,
                      color: styles.card.description.color,
                      lineHeight: styles.card.description.lineHeight,
                      marginBottom: styles.card.description.marginBottom,
                    }
              }
            >
              {card.config.description}
            </p>
          )}
        </div>
      </div>

      {/* Form Fields (in highlight mode, includes submit button for grid layout) */}
      <div
        style={
          isHighlight
            ? (highlightStyles.formSection as React.CSSProperties)
            : undefined
        }
      >
        {card.card_fields
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(field => (
            <div key={field.field_name}>{renderField(field)}</div>
          ))}

        {/* Next Button - shown for non-submit form cards */}
        {!card.config?.has_submit_button && (
          <NextButton card={card} isLastCard={isLastCard} />
        )}

        {/* Submit Button Section */}
        {card.config?.has_submit_button && (
          <div
            style={
              isHighlight
                ? (highlightStyles.submitWrapper as React.CSSProperties)
                : (styles.submitButton.wrapper as React.CSSProperties)
            }
          >
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
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>
                    ✓
                  </span>
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
                style={
                  isHighlight
                    ? {
                        ...(highlightStyles.submitButton as React.CSSProperties),
                        ...(isSubmitting
                          ? { opacity: 0.7, cursor: 'not-allowed' }
                          : {}),
                      }
                    : {
                        ...(styles.submitButton.button as React.CSSProperties),
                        ...(isSubmitting
                          ? (styles.submitButton
                              .buttonDisabled as React.CSSProperties)
                          : {}),
                      }
                }
                onMouseEnter={e => {
                  if (!isSubmitting && isHighlight) {
                    Object.assign(
                      e.currentTarget.style,
                      highlightStyles.submitButtonHover
                    );
                  } else if (!isSubmitting) {
                    Object.assign(
                      e.currentTarget.style,
                      styles.submitButton.buttonHover
                    );
                  }
                }}
                onMouseLeave={e => {
                  if (!isSubmitting && isHighlight) {
                    Object.assign(
                      e.currentTarget.style,
                      highlightStyles.submitButton,
                      {
                        transform: 'none',
                        boxShadow: 'none',
                      }
                    );
                  } else if (!isSubmitting) {
                    Object.assign(
                      e.currentTarget.style,
                      styles.submitButton.button,
                      {
                        transform: 'none',
                        boxShadow: 'none',
                      }
                    );
                  }
                }}
                onMouseDown={e => {
                  if (!isSubmitting && !isHighlight) {
                    Object.assign(
                      e.currentTarget.style,
                      styles.submitButton.buttonActive
                    );
                  }
                }}
                onMouseUp={e => {
                  if (!isSubmitting && isHighlight) {
                    Object.assign(
                      e.currentTarget.style,
                      highlightStyles.submitButtonHover
                    );
                  } else if (!isSubmitting) {
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
    </div>
  );
}
