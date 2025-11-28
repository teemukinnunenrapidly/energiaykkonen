import React, { useEffect, useState, useRef } from 'react';
import { type CardTemplate } from '@/lib/supabase';
import { useCardContext } from '../CardContext';
import { useCardStyles } from '@/hooks/useCardStyles';
import { gtmEvents } from '@/config/gtm';
import { NextButton } from '../NextButton';
import { Calculator } from 'lucide-react';
// Sentry utilities removed; calculation errors will surface via UI or server logs

interface CalculationCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
  isLastCard?: boolean;
}

export function CalculationCard({
  card,
  isLastCard = false,
}: CalculationCardProps) {
  const styles = useCardStyles();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine card style variant: 'primary' (green bg) or 'inverted' (white bg)
  const cardStyle = card.config?.card_style || 'primary';
  const isInverted = cardStyle === 'inverted';

  // Select the appropriate style object based on variant
  const cardStyles = isInverted
    ? (styles as any).invertedCalculationCard
    : (styles as any).customCalculationCard;

  const {
    formData,
    completeCard,
    cardStates,
    sessionId,
    updateField,
    submitData,
  } = useCardContext();
  const [calculatedResult, setCalculatedResult] = useState<string | null>(null);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [resultUnit, setResultUnit] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldDependencies, setFieldDependencies] = useState<string[]>([]);
  // const [formulaName, setFormulaName] = useState<string | null>(null); // Unused for now
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const hasProcessedCalculationRef = useRef<boolean>(false);
  const lastDependencyValuesRef = useRef<Record<string, any>>({});
  const isManuallyOverriddenRef = useRef<boolean>(false);

  // Process calculation
  useEffect(() => {
    const processCalculation = async () => {
      try {
        // Only process calculation if this card is revealed
        const cardState = cardStates[card.id];
        const isThisCardRevealed = cardState?.isRevealed === true;
        const isAlreadyComplete = cardState?.status === 'complete';

        if (!isThisCardRevealed) {
          hasProcessedCalculationRef.current = false;
          return;
        }

        // Skip recalculation if user has manually overridden the value
        if (isManuallyOverriddenRef.current) {
          return;
        }

        // Check if dependencies have changed
        let dependenciesChanged = false;
        if (fieldDependencies.length > 0) {
          const currentDependencyValues: Record<string, any> = {};
          for (const dep of fieldDependencies) {
            currentDependencyValues[dep] = formData[dep];
          }

          // Compare with last known values
          dependenciesChanged =
            JSON.stringify(currentDependencyValues) !==
            JSON.stringify(lastDependencyValuesRef.current);

          if (dependenciesChanged) {
            // Dependencies changed for card
            lastDependencyValuesRef.current = currentDependencyValues;
          }
        }

        // Check if we need to recalculate
        const needsRecalculation =
          !hasProcessedCalculationRef.current || dependenciesChanged;

        if (!needsRecalculation && isAlreadyComplete) {
          return;
        }

        // Reset the processed flag to allow recalculation
        hasProcessedCalculationRef.current = false;

        if (!card.config?.main_result) {
          return;
        }

        // Process calculation
        hasProcessedCalculationRef.current = true;
        setIsCalculating(true);
        setError(null);

        try {
          // Use unified calculation engine (with Supabase) - dynamic import
          const { UnifiedCalculationEngine } = await import(
            '@/lib/unified-calculation-engine'
          );
          const { supabase } = await import('@/lib/supabase');
          const engine = new UnifiedCalculationEngine(
            supabase,
            sessionId,
            formData
          );
          const result = await engine.process(card.config.main_result);
          // 'CalculationCard received result:', result);

          if (result.success) {
            try {
              // Ensure result is always a string - handle objects safely
              let resultString: string | null = null;
              let unitFromObject: string = '';
              try {
                if (result.result !== null) {
                  // Safe type checking to avoid React Error #185
                  const resultType = Object.prototype.toString.call(
                    result.result
                  );

                  if (resultType === '[object Object]') {
                    // Try to extract value from object safely
                    const obj = result.result as any;
                    if (
                      obj &&
                      typeof obj === 'object' &&
                      obj.value !== undefined
                    ) {
                      resultString = String(obj.value);
                      // Also check for unit in object
                      if (obj.unit) {
                        unitFromObject = String(obj.unit);
                      }
                    } else if (
                      obj &&
                      typeof obj === 'object' &&
                      obj.result !== undefined
                    ) {
                      resultString = String(obj.result);
                      if (obj.unit) {
                        unitFromObject = String(obj.unit);
                      }
                    } else {
                      resultString = String(result.result);
                    }
                  } else {
                    resultString = String(result.result);
                  }
                }
              } catch {
                resultString = String(result.result || '0');
              }

              // Ensure we have a safe result string
              const safeResultString = resultString || '';

              // Extract unit from result if it contains a space (e.g., "20820 kWh").
              // Default to kWh when the formula name hints energy and unit is missing.
              let extractedUnit = '';
              let valueToFormat = safeResultString;

              // Check if the result contains a unit (has a space)
              const parts = safeResultString.trim().split(/\s+/);
              if (parts.length > 1) {
                // Last part is likely the unit
                extractedUnit = parts[parts.length - 1];
                // Everything else is the value
                valueToFormat = parts.slice(0, -1).join(' ');
              }

              // Format result with Finnish number formatting
              const numericValue = parseFloat(
                valueToFormat.replace(/\s/g, '').replace(',', '.')
              );
              const formattedResult = !isNaN(numericValue)
                ? numericValue.toLocaleString('fi-FI')
                : valueToFormat;

              setCalculatedResult(formattedResult);
              setOriginalResult(formattedResult);
              // Prefer explicit unit from object -> extracted text -> sensible default for energy calcs
              let finalUnit = unitFromObject || extractedUnit || '';
              if (
                !finalUnit &&
                /energiantarve|kwh/i.test(card.title || card.name || '')
              ) {
                finalUnit = 'kWh';
              }
              setResultUnit(finalUnit);

              // Track successful calculation
              gtmEvents.calculationComplete(
                card.title || card.name || 'unknown_calculation',
                {
                  card_id: card.id,
                  result: formattedResult,
                  unit: finalUnit,
                  formula: card.config?.main_result,
                }
              );

              // setFormulaName(null); // Unused for now

              // Store the calculated result in formData using the configured field_name
              if (card.config?.field_name && formattedResult) {
                try {
                  // Handle Finnish number format: "2 706,6" -> 2706.6
                  const numericResult = parseFloat(
                    formattedResult
                      .replace(/\s/g, '') // Remove spaces (thousands separator)
                      .replace(',', '.') // Convert comma to dot for decimal
                  );
                  if (!isNaN(numericResult)) {
                    updateField(card.config.field_name, numericResult);
                  }
                } catch {
                  // Field update failed
                }
              }

              // Auto-complete the card if calculation succeeds
              if (card.config?.auto_complete_on_success) {
                completeCard(card.id);
              }
            } catch (innerError) {
              console.error('Error in result.success block:', innerError);
              setError(
                'Result processing failed: ' +
                  (innerError instanceof Error
                    ? innerError.message
                    : String(innerError))
              );
            }
          } else {
            const errorMessage = result.error || 'Calculation failed';
            setError(errorMessage);
            // Track calculation error
            gtmEvents.errorOccurred('calculation_failed', errorMessage);
          }

          // Update field dependencies for future re-calculations
          if (result.dependencies) {
            setFieldDependencies(result.dependencies);

            // Store current dependency values for change detection
            const currentDependencyValues: Record<string, any> = {};
            for (const dep of result.dependencies) {
              currentDependencyValues[dep] = formData[dep];
            }
            lastDependencyValuesRef.current = currentDependencyValues;
          }

          // Extract shortcode name for override checking
          const shortcodeMatch = card.config.main_result.match(
            /\[(?:calc|lookup):([^\]]+)\]/
          );
          if (shortcodeMatch) {
            // setFormulaName(shortcodeMatch[1]); // Unused for now
          }
        } catch (error) {
          console.error(
            `Error processing calculation for card "${card.name}":`,
            error
          );
          // tracking disabled; rely on UI error and Vercel logs
          const errorMessage =
            error instanceof Error ? error.message : 'Calculation failed';
          setError(errorMessage);
          // Track calculation error
          gtmEvents.errorOccurred('calculation_process_failed', errorMessage);
        } finally {
          // '🔵 About to call setIsCalculating(false)');
          try {
            setIsCalculating(false);
            // '✅ setIsCalculating(false) completed');
          } catch (finallyError) {
            console.error('❌ Error in finally block:', finallyError);
          }
        }
      } catch (outerError) {
        console.error('❌ Error in processCalculation:', outerError);
        try {
          setError(
            'Calculation failed: ' +
              (outerError instanceof Error
                ? outerError.message
                : String(outerError))
          );
        } catch (setErrorError) {
          console.error('❌ Error setting error:', setErrorError);
        }
      }
    };

    // Prevent infinite loops by checking if we're already processing
    if (isCalculating) {
      // 'Already calculating, skipping...');
      return;
    }

    try {
      processCalculation();
    } catch (error) {
      console.error('Error in processCalculation useEffect:', error);
      setError(
        'Calculation process failed: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }, [
    card.id, // Only depend on card ID, not entire card object
    card.config?.main_result, // And the main result config
    JSON.stringify(formData), // Stringify to avoid object reference changes
    cardStates[card.id]?.isRevealed, // Only track this card's reveal state
    cardStates[card.id]?.status, // And completion status
  ]);

  const handleResultOverride = (newValue: number | string) => {
    const updatedResult = String(newValue);
    setCalculatedResult(updatedResult);

    // Store the overridden result in formData
    if (card.config?.field_name && updatedResult) {
      const numericResult = parseFloat(
        updatedResult.replace(/\s/g, '').replace(',', '.')
      );
      if (!isNaN(numericResult)) {
        updateField(card.config.field_name, numericResult);
        // Stored overridden result in field
      }
    }

    // Mark card as complete if needed
    if (
      card.config?.auto_complete_on_success &&
      cardStates[card.id]?.status !== 'complete'
    ) {
      completeCard(card.id);
    }
  };

  // Inline editing helpers
  const startEditing = () => {
    if (!calculatedResult) {
      return;
    }
    // Extract numeric value from formatted string (e.g., "23 540" -> "23540")
    const numericStr = calculatedResult.replace(/\s/g, '').replace(',', '.');
    setEditValue(numericStr);
    setIsEditing(true);
  };

  const handleInlineSave = () => {
    const parsed = parseFloat(editValue.replace(/\s/g, '').replace(',', '.'));
    if (!isNaN(parsed)) {
      // Format with Finnish locale
      const formatted = parsed.toLocaleString('fi-FI');
      // Mark as manually overridden to prevent recalculation
      isManuallyOverriddenRef.current = true;
      handleResultOverride(formatted);
    }
    setIsEditing(false);
  };

  const handleRevert = () => {
    if (originalResult) {
      // Clear manual override flag to allow recalculation
      isManuallyOverriddenRef.current = false;
      setCalculatedResult(originalResult);
      // Also update formData
      if (card.config?.field_name) {
        const numericResult = parseFloat(
          originalResult.replace(/\s/g, '').replace(',', '.')
        );
        if (!isNaN(numericResult)) {
          updateField(card.config.field_name, numericResult);
        }
      }
    }
  };

  const isOverridden =
    calculatedResult !== originalResult && originalResult !== null;

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    // Track calculation start event
    gtmEvents.calculationStart(
      card.title || card.name || 'unknown_calculation'
    );

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const emailTemplate = card.config?.email_template || 'default';
      const result = await submitData(emailTemplate);
      setSubmitSuccess(true);

      // Mark card as complete after successful submission
      completeCard(card.id);

      // Track successful form submission
      gtmEvents.formSubmit(card.title || card.name || 'unknown_calculation', {
        card_id: card.id,
        email_template: emailTemplate,
        calculation_result: calculatedResult,
        lead_id: result?.leadId,
      });

      // '✅ Form submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Submission failed';
      setError(errorMessage);
      // Track submission error
      gtmEvents.errorOccurred('calculation_submission_failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = cardStates[card.id]?.status === 'complete';
  const canSubmit =
    card.config?.show_submit_button && calculatedResult && !isComplete;

  return (
    <div
      style={{
        ...(cardStyles?.container || styles.calculationCard.container),
        ...(isMobile && cardStyles?.containerMobile
          ? cardStyles.containerMobile
          : {}),
      }}
    >
      {/* Header section */}
      {(card.title || card.config?.description) && (
        <div
          style={
            (cardStyles?.header ||
              styles.calculationCard.header) as React.CSSProperties
          }
        >
          {/* Icon */}
          <div style={cardStyles?.iconContainer as React.CSSProperties}>
            <Calculator style={cardStyles?.icon as React.CSSProperties} />
          </div>

          <h3
            style={{
              ...(cardStyles?.title || styles.calculationCard.title),
            }}
          >
            {card.title || card.name}
          </h3>
          {card.config?.description && (
            <p
              style={{
                ...(cardStyles?.description ||
                  styles.calculationCard.description),
              }}
            >
              {card.config.description}
            </p>
          )}
        </div>
      )}

      {/* Main Result Field */}
      <div
        style={
          (cardStyles?.resultSection ||
            styles.calculationCard.resultSection) as React.CSSProperties
        }
      >
        {error ? (
          <div
            style={styles.calculationCard.errorMessage as React.CSSProperties}
          >
            {error}
          </div>
        ) : calculatedResult ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              flexWrap: 'wrap',
              position: 'relative',
            }}
          >
            {/* Muokattu badge */}
            {isOverridden && (
              <div
                style={{
                  position: 'absolute',
                  top: '-24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: isInverted
                    ? cardStyles?.overriddenBadge?.background ||
                      'rgba(13,148,48,0.2)'
                    : 'rgba(255,255,255,0.2)',
                  color: isInverted
                    ? cardStyles?.overriddenBadge?.color ||
                      styles.colors.brand.primary
                    : '#ffffff',
                  fontSize: '0.75rem',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontWeight: 500,
                }}
              >
                Muokattu
              </div>
            )}
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleInlineSave();
                  }
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                onBlur={handleInlineSave}
                autoFocus
                size={Math.max(editValue.length, 6)}
                style={{
                  ...(cardStyles?.metricValue ||
                    styles.calculationCard.metricValue),
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isInverted
                    ? cardStyles?.inputUnderline?.borderBottom ||
                      `3px solid ${styles.colors.brand.primary}60`
                    : '3px solid rgba(255,255,255,0.6)',
                  outline: 'none',
                  textAlign: 'center',
                  caretColor: isInverted
                    ? cardStyles?.inputUnderline?.caretColor ||
                      styles.colors.brand.primary
                    : '#ffffff',
                }}
              />
            ) : (
              <div
                onClick={
                  card.config?.enable_edit_mode ? startEditing : undefined
                }
                style={{
                  ...(cardStyles?.metricValue ||
                    styles.calculationCard.metricValue),
                  cursor: card.config?.enable_edit_mode ? 'pointer' : 'default',
                  transition: 'opacity 0.2s',
                }}
                title={
                  card.config?.enable_edit_mode
                    ? 'Klikkaa muokataksesi'
                    : undefined
                }
              >
                {String(calculatedResult || '')}
              </div>
            )}
            <div
              style={
                cardStyles?.metricUnit || styles.calculationCard.metricUnit
              }
            >
              {resultUnit || (card.title?.includes('hinta') ? '€' : 'kWh')}
            </div>
          </div>
        ) : (
          <div
            style={styles.calculationCard.resultDisplay as React.CSSProperties}
          >
            Syötä arvot yllä nähdäksesi laskelman
          </div>
        )}
      </div>

      {/* Edit/Revert Button */}
      {calculatedResult && card.config?.enable_edit_mode && !isEditing && (
        <div style={cardStyles?.editSection as React.CSSProperties}>
          {isOverridden ? (
            <button
              onClick={handleRevert}
              style={{
                ...(cardStyles?.editButton || {}),
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              ↩ Palauta laskettu arvo ({originalResult} {resultUnit})
            </button>
          ) : (
            <button
              onClick={startEditing}
              style={{
                ...(cardStyles?.editButton || {}),
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              ✏️ Korjaa lukemaa
            </button>
          )}
        </div>
      )}

      {/* Submit button if configured */}
      {canSubmit && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            ...(styles.submitButton as React.CSSProperties),
            marginTop: '20px',
            width: '100%',
          }}
        >
          {isSubmitting
            ? 'Lähetetään...'
            : submitSuccess
              ? '✓ Lähetetty'
              : 'Lähetä'}
        </button>
      )}

      {/* Next Button */}
      <div style={cardStyles?.nextButtonSection as React.CSSProperties}>
        <NextButton
          card={card}
          isLastCard={isLastCard}
          variant={isInverted ? 'default' : 'inverse'}
        />
      </div>
    </div>
  );
}
