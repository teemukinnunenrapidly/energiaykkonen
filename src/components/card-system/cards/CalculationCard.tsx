import React, { useEffect, useState, useRef } from 'react';
import { supabase, type CardTemplate } from '@/lib/supabase';
import { useCardContext } from '../CardContext';
import { UnifiedCalculationEngine } from '@/lib/unified-calculation-engine';
import { EditableCalculationResult } from './EditableCalculationResult';
import { useCardStyles, cssValue } from '@/hooks/useCardStyles';

interface CalculationCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
}

export function CalculationCard({ card }: CalculationCardProps) {
  const styles = useCardStyles();
  const {
    formData,
    completeCard,
    uncompleteCard,
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
  const [formulaName, setFormulaName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const hasProcessedCalculationRef = useRef<boolean>(false);

  // Process calculation using unified engine
  useEffect(() => {
    const processCalculation = async () => {
      console.log(`🔍 CalculationCard "${card.name}" useEffect triggered`);
      console.log(`  - Form data:`, formData);
      console.log(`  - Heating type:`, formData.l_mmitysmuoto);
      console.log(`  - Field dependencies:`, fieldDependencies);
      console.log(
        `  - Dependency values:`,
        fieldDependencies.map(field => ({ [field]: formData[field] }))
      );

      // Only process calculation if this card is revealed
      const cardState = cardStates[card.id];
      const isThisCardRevealed = cardState?.isRevealed === true;
      const isAlreadyComplete = cardState?.status === 'complete';

      if (!isThisCardRevealed) {
        console.log(
          `🔴 CalculationCard "${card.name}" is NOT revealed yet, NOT processing calculation`
        );
        hasProcessedCalculationRef.current = false;
        return;
      }

      if (isAlreadyComplete && fieldDependencies.length > 0) {
        console.log(
          `🔄 CalculationCard "${card.name}" is complete but dependencies may have changed, allowing re-calculation`
        );
        // Allow re-calculation even if complete when we have dependencies
      } else if (isAlreadyComplete) {
        console.log(
          `⏭️ CalculationCard "${card.name}" is already complete, skipping calculation`
        );
        return;
      }

      // Allow re-calculation if form data has changed since last calculation
      // (this enables dynamic updates when user changes selections)
      if (hasProcessedCalculationRef.current) {
        console.log(
          `🔄 CalculationCard "${card.name}" has processed before but form data may have changed, re-calculating`
        );
        // Reset the flag to allow re-calculation
        hasProcessedCalculationRef.current = false;
      }

      if (!card.config?.main_result) {
        console.log(
          `🔴 CalculationCard "${card.name}" has no main_result configured`
        );
        return;
      }

      console.log(
        `🔄 CalculationCard "${card.name}" processing calculation: ${card.config.main_result}`
      );
      hasProcessedCalculationRef.current = true;
      setIsCalculating(true);
      setError(null);

      try {
        // Create unified calculation engine (creates fresh cache each time)
        const engine = new UnifiedCalculationEngine(
          supabase,
          sessionId,
          formData
        );

        // Clear cache to ensure fresh calculation with current form data
        engine.clearCache();

        // Process the calculation
        const result = await engine.process(card.config.main_result);

        if (result.success) {
          setCalculatedResult(result.result || null);
          setResultUnit(''); // Remove unit reference as it doesn't exist in ProcessingResult
          setFormulaName(null); // Remove formulaName reference as it doesn't exist in ProcessingResult

          // Store the calculated result in formData using the configured field_name
          if (card.config?.field_name && result.result) {
            // Handle Finnish number format: "2 706,6" -> 2706.6
            const numericResult = parseFloat(
              String(result.result)
                .replace(/\s/g, '') // Remove spaces (thousands separator)
                .replace(',', '.') // Convert comma to dot for decimal
            );
            if (!isNaN(numericResult)) {
              updateField(card.config.field_name, numericResult);
              console.log(
                `💾 Stored calculation result in field "${card.config.field_name}": ${numericResult}`
              );
            }
          }

          // Auto-complete the card if calculation succeeds
          if (card.config?.auto_complete_on_success) {
            completeCard(card.id);
          }
        } else {
          setError(result.error || 'Calculation failed');
        }

        // Update field dependencies for future re-calculations
        if (result.dependencies) {
          setFieldDependencies(result.dependencies);
        }

        // Extract shortcode name for override checking (works for both calc and lookup)
        const shortcodeMatch =
          card.config.main_result?.match(/^\[(\w+):([^\]]+)\]$/);
        let extractedShortcodeName = null;
        if (shortcodeMatch) {
          extractedShortcodeName = shortcodeMatch[2]; // The name part after the colon
          setFormulaName(extractedShortcodeName);
        }

        // Format the result for display with units
        let formattedResult = String(result.result);
        let unit = '';

        console.log(
          `🔍 Processing result: "${formattedResult}" for card "${card.name}"`
        );

        // Extract unit from the processed result (works for both calc and lookup)
        // Updated regex to handle multi-word Finnish units like "mottia puuta", "öljylitraa"
        const resultWithUnitMatch = formattedResult.match(
          /^([\d\s,.-]+)\s+(.+)$/
        );
        if (resultWithUnitMatch) {
          // Result already contains units (like "2500 mottia puuta" or "1500 öljylitraa")
          const numericPart = resultWithUnitMatch[1].trim();
          unit = resultWithUnitMatch[2].trim();

          console.log(
            `✅ Extracted unit from result: "${unit}" (numeric: "${numericPart}")`
          );

          // Reformat the numeric part with Finnish locale
          // Handle Finnish number format: "2 706,6" -> 2706.6
          const numericValue = parseFloat(
            numericPart
              .replace(/\s/g, '') // Remove spaces (thousands separator)
              .replace(',', '.') // Convert comma to dot for decimal
          );
          if (!isNaN(numericValue)) {
            formattedResult = `${numericValue.toLocaleString('fi-FI', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })} ${unit}`;
          }
        } else {
          console.log(`❌ No unit found in result: "${formattedResult}"`);
          // No unit in result, check if it's a pure number
          const numericResult = Number(result.result);
          if (!isNaN(numericResult)) {
            formattedResult = numericResult.toLocaleString('fi-FI', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });

            // Try to get unit from formula metadata for calc shortcodes
            const calcMatch =
              card.config.main_result?.match(/^\[calc:([^\]]+)\]$/);
            if (calcMatch && extractedShortcodeName) {
              try {
                const { data: formula } = await supabase
                  .from('formulas')
                  .select('unit')
                  .eq('name', extractedShortcodeName)
                  .single();

                if (formula?.unit) {
                  unit = formula.unit;
                  formattedResult = `${numericResult.toLocaleString('fi-FI', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })} ${formula.unit}`;
                }
              } catch (unitError) {
                // If unit fetching fails, just use the number without unit
                console.warn(
                  `Could not fetch unit for formula ${extractedShortcodeName}:`,
                  unitError
                );
              }
            }
          }
        }

        // Check if user has an override value for this calculation
        const overrideKey = `override_${extractedShortcodeName || formulaName || 'calc'}`;
        const existingOverride = formData[overrideKey];

        // Set unit first so it's available for all scenarios
        console.log(
          `🔧 Setting resultUnit to: "${unit}" for card "${card.name}"`
        );
        setResultUnit(unit);

        if (
          existingOverride !== undefined &&
          existingOverride !== null &&
          existingOverride !== ''
        ) {
          // User has an override - preserve it in display but update original value
          console.log(
            `🔒 Preserving user override for "${card.name}": ${existingOverride} (new calculated would be: ${formattedResult})`
          );
          const overrideFormatted =
            Number(existingOverride).toLocaleString('fi-FI');
          setCalculatedResult(
            unit ? `${overrideFormatted} ${unit}` : overrideFormatted
          );
          setOriginalResult(formattedResult); // Keep new calculated value as "original" for comparison
        } else {
          // No override - use calculated result
          setCalculatedResult(formattedResult);
          setOriginalResult(formattedResult);
        }

        console.log(
          `✅ CalculationCard "${card.name}" calculated: ${formattedResult}`
        );
        completeCard(card.id);
        setIsCalculating(false);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown calculation error';
        setError(errorMessage);
        console.error(`❌ CalculationCard "${card.name}" error:`, error);
        uncompleteCard(card.id);
        hasProcessedCalculationRef.current = false; // Allow retry
        setIsCalculating(false);
      }
    };

    processCalculation();
  }, [
    card.config?.main_result,
    sessionId,
    cardStates[card.id]?.isRevealed ?? false,
    // Create a stable dependency key from field values
    fieldDependencies.length > 0
      ? fieldDependencies.map(field => formData[field]).join('|')
      : '',
    // Also include the field dependencies array itself to trigger when dependencies change
    fieldDependencies.join(','),
  ]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit the form data using the CardContext submit functionality
      if (submitData) {
        await submitData(card.config?.submit_email_template);
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

  // Check if we have a main result shortcode configured
  if (!card.config?.main_result) {
    return (
      <div
        style={{
          padding: styles.calculationCard.container.padding,
          background: styles.calculationCard.container.background,
        }}
      >
        <div style={styles.calculationCard.header as React.CSSProperties}>
          <h3 style={styles.calculationCard.title as React.CSSProperties}>
            {card.title || card.name}
          </h3>
          <p style={styles.calculationCard.description as React.CSSProperties}>
            {card.config?.description || ''}
          </p>
        </div>
        <div style={styles.calculationCard.errorMessage as React.CSSProperties}>
          <p>No calculation shortcode configured</p>
          <p>
            Please configure a calculation result shortcode (e.g.,
            [calc:energy-kwh]) in the Card Builder.
          </p>
        </div>
      </div>
    );
  }

  // Render the calculation card with display template and main result
  return (
    <div
      style={{
        padding: styles.calculationCard.container.padding,
        background: styles.calculationCard.container.background,
      }}
    >
      {/* Header section */}
      {(card.title || card.config?.description) && (
        <div style={styles.calculationCard.header as React.CSSProperties}>
          <h3 style={styles.calculationCard.title as React.CSSProperties}>
            {card.title || card.name}
          </h3>
          {card.config?.description && (
            <p
              style={styles.calculationCard.description as React.CSSProperties}
            >
              {card.config.description}
            </p>
          )}
        </div>
      )}

      {/* Main Result Field */}
      <div style={styles.calculationCard.resultSection as React.CSSProperties}>
        <div
          style={styles.calculationCard.resultDisplay as React.CSSProperties}
        >
          {error ? (
            <div
              style={styles.calculationCard.errorMessage as React.CSSProperties}
            >
              {error}
            </div>
          ) : calculatedResult && card.config?.enable_edit_mode ? (
            <EditableCalculationResult
              value={calculatedResult}
              originalValue={originalResult || calculatedResult}
              unit={resultUnit}
              onUpdate={newValue => {
                // Store the override in formData using field_name if configured
                if (card.config?.field_name) {
                  // Store the user-edited value in the configured field
                  updateField(card.config.field_name, newValue);
                  console.log(
                    `💾 Stored user-edited value in field "${card.config.field_name}": ${newValue}`
                  );
                }

                // Also store as override for tracking purposes
                const overrideKey = `override_${formulaName || 'calc'}`;
                updateField(overrideKey, newValue);

                // Update display value with unit
                const formattedValue = newValue.toLocaleString('fi-FI');

                // Ensure we have the unit - try multiple sources
                let unitToUse = resultUnit;
                if (!unitToUse && calculatedResult) {
                  // Try to extract unit from current calculatedResult as fallback
                  // Updated to handle multi-word Finnish units like "mottia puuta", "öljylitraa"
                  const currentUnitMatch = calculatedResult.match(
                    /^([\d\s,.-]+)\s+(.+)$/
                  );
                  if (currentUnitMatch) {
                    unitToUse = currentUnitMatch[2].trim();
                  }
                }

                setCalculatedResult(
                  unitToUse ? `${formattedValue} ${unitToUse}` : formattedValue
                );

                console.log(
                  `🔧 User update: ${newValue} -> "${formattedValue}${unitToUse ? ' ' + unitToUse : ''}" (unit: ${unitToUse || 'none'}, resultUnit: ${resultUnit || 'none'}, calculatedResult: ${calculatedResult})`
                );
              }}
              editButtonText={card.config?.edit_button_text || 'Korjaa lukemaa'}
              editPrompt={card.config?.edit_prompt}
              validationMin={
                card.config?.validation_min
                  ? Number(card.config.validation_min)
                  : undefined
              }
              validationMax={
                card.config?.validation_max
                  ? Number(card.config.validation_max)
                  : undefined
              }
              isCalculating={isCalculating}
            />
          ) : isCalculating ? (
            <div
              style={{
                color: styles.colors.state.info,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>Lasketaan...</div>
            </div>
          ) : calculatedResult ? (
            <div>
              <span
                style={
                  styles.calculationCard.metricValue as React.CSSProperties
                }
              >
                {calculatedResult.split(' ')[0]}
              </span>
              {calculatedResult.includes(' ') && (
                <span
                  style={
                    styles.calculationCard.metricUnit as React.CSSProperties
                  }
                >
                  {calculatedResult.split(' ').slice(1).join(' ')}
                </span>
              )}
            </div>
          ) : (
            <div>{card.config?.main_result}</div>
          )}
        </div>
      </div>

      {/* Breakdown section if configured */}
      {card.config?.show_breakdown && calculatedResult && (
        <div style={styles.calculationCard.breakdown as React.CSSProperties}>
          {/* Breakdown items would go here based on configuration */}
        </div>
      )}

      {/* Submit Button Section */}
      {card.config?.has_submit_button && (
        <div>
          {submitSuccess ? (
            <div
              style={{
                color: styles.colors.state.success,
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <p>
                {card.config?.submit_success_message ||
                  'Thank you! Your submission has been received.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                textAlign: cssValue(styles.actionCard.textAlign),
                padding: styles.actionCard.padding,
              }}
            >
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isCalculating}
                style={{
                  ...(styles.actionCard.button as React.CSSProperties),
                  ...(isSubmitting || isCalculating
                    ? (styles.actionCard.button.disabled as React.CSSProperties)
                    : {}),
                }}
                onMouseEnter={e => {
                  if (!isSubmitting && !isCalculating) {
                    Object.assign(
                      e.currentTarget.style,
                      styles.actionCard.button.hover
                    );
                  }
                }}
                onMouseLeave={e => {
                  if (!isSubmitting && !isCalculating) {
                    Object.assign(
                      e.currentTarget.style,
                      styles.actionCard.button
                    );
                  }
                }}
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  card.config?.submit_button_text || 'Submit'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
