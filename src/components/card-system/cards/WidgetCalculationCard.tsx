import React, { useEffect, useState, useRef } from 'react';
import { type CardTemplate } from '@/lib/supabase';
import { useCardContext } from '../CardContext';
import { WidgetCalculationEngine } from '@/lib/widget-calculation-engine';
import { EditableCalculationResult } from './EditableCalculationResultFixed';
import { useCardStyles } from '@/hooks/useCardStyles';

interface WidgetCalculationCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
  formulas?: any[]; // Pre-loaded formulas from config.json
  widgetMode?: boolean; // Whether we're in widget mode
}

export function WidgetCalculationCard({ card, formulas = [], widgetMode = false }: WidgetCalculationCardProps) {
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

  // Get formulas and lookup tables from global widget data if not provided
  const widgetFormulas = formulas.length > 0 ? formulas : 
    (typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA?.formulas) || [];
  
  const widgetLookupTables = 
    (typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA?.lookupTables) || [];

  // Process calculation using widget engine
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

      if (isAlreadyComplete && fieldDependencies.length > 0) {
        // Allow re-calculation if dependencies changed
      } else if (isAlreadyComplete) {
        return;
      }

      // Allow re-calculation if form data has changed
      if (hasProcessedCalculationRef.current) {
        hasProcessedCalculationRef.current = false;
      }

      if (!card.config?.main_result) {
        return;
      }

      // Process calculation
      hasProcessedCalculationRef.current = true;
      setIsCalculating(true);
      setError(null);

      try {
        // Create widget calculation engine with pre-loaded formulas and lookup tables
        const engine = new WidgetCalculationEngine(
          widgetFormulas,
          sessionId,
          formData,
          widgetLookupTables
        );

        // Clear cache to ensure fresh calculation with current form data
        engine.clearCache();

        // Process the calculation
        const result = await engine.process(card.config.main_result);
        console.log('WidgetCalculationCard received result:', result);

        if (result.success) {
          try {
          // Ensure result is always a string - handle objects safely
          let resultString: string | null = null;
          try {
            if (result.result != null) {
              // Safe type checking to avoid React Error #185
              const resultType = Object.prototype.toString.call(result.result);
              
              if (resultType === '[object Object]') {
                // Try to extract value from object safely
                const obj = result.result as any;
                if (obj && typeof obj === 'object' && obj.value !== undefined) {
                  resultString = String(obj.value);
                  // Also check for unit in object
                  if (obj.unit) result.unit = obj.unit;
                } else if (obj && typeof obj === 'object' && obj.result !== undefined) {
                  resultString = String(obj.result);
                  if (obj.unit) result.unit = obj.unit;
                } else {
                  resultString = String(result.result);
                }
              } else {
                resultString = String(result.result);
              }
            }
          } catch (typeError) {
            resultString = String(result.result || '0');
          }
          
          // Ensure we have a safe result string
          const safeResultString = resultString || '';
          
          // Extract unit from result if it contains a space (e.g., "20820 kWh")
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
          const numericValue = parseFloat(valueToFormat.replace(/\s/g, '').replace(',', '.'));
          const formattedResult = !isNaN(numericValue) 
            ? numericValue.toLocaleString('fi-FI') 
            : valueToFormat;
          
          setCalculatedResult(formattedResult);
          setOriginalResult(formattedResult);
          setResultUnit(extractedUnit || result.unit || ''); // Use extracted unit, or result.unit, or empty
          
          setFormulaName(null);

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
            } catch (updateError) {
              // Field update failed
            }
          }
          
          // Auto-complete the card if calculation succeeds
          // In widget mode, always auto-complete calculation cards to enable progressive disclosure
          if (card.config?.auto_complete_on_success || widgetMode) {
            completeCard(card.id);
          }
          } catch (innerError) {
            console.error('Error in result.success block:', innerError);
            setError('Result processing failed: ' + (innerError instanceof Error ? innerError.message : String(innerError)));
          }
        } else {
          setError(result.error || 'Calculation failed');
        }

        // Update field dependencies for future re-calculations
        if (result.dependencies) {
          setFieldDependencies(result.dependencies);
        }

        // Extract shortcode name for override checking
        const shortcodeMatch = card.config.main_result.match(/\[(?:calc|lookup):([^\]]+)\]/);
        if (shortcodeMatch) {
          setFormulaName(shortcodeMatch[1]);
        }
      } catch (error) {
        console.error(
          `Error processing calculation for card "${card.name}":`,
          error
        );
        setError(
          error instanceof Error ? error.message : 'Calculation failed'
        );
      } finally {
        console.log('🔵 About to call setIsCalculating(false)');
        try {
          setIsCalculating(false);
          console.log('✅ setIsCalculating(false) completed');
        } catch (finallyError) {
          console.error('❌ Error in finally block:', finallyError);
        }
      }
      } catch (outerError) {
        console.error('❌ Error in processCalculation:', outerError);
        try {
          setError('Calculation failed: ' + (outerError instanceof Error ? outerError.message : String(outerError)));
        } catch (setErrorError) {
          console.error('❌ Error setting error:', setErrorError);
        }
      }
    };

    // Prevent infinite loops by checking if we're already processing
    if (isCalculating) {
      console.log('Already calculating, skipping...');
      return;
    }
    
    try {
      processCalculation();
    } catch (error) {
      console.error('Error in processCalculation useEffect:', error);
      setError('Calculation process failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [
    card.id, // Only depend on card ID, not entire card object
    card.config?.main_result, // And the main result config
    JSON.stringify(formData), // Stringify to avoid object reference changes
    cardStates[card.id]?.isRevealed, // Only track this card's reveal state
    cardStates[card.id]?.status, // And completion status
    // Remove other deps that can cause loops
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
        console.log(
          `💾 Stored overridden result in field "${card.config.field_name}": ${numericResult}`
        );
      }
    }

    // Mark card as complete if needed
    // In widget mode, always complete to enable progressive disclosure
    if (
      (card.config?.auto_complete_on_success || widgetMode) &&
      cardStates[card.id]?.status !== 'complete'
    ) {
      completeCard(card.id);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const emailTemplate = card.config?.email_template || 'default';
      await submitData(emailTemplate);
      setSubmitSuccess(true);
      
      // Mark card as complete after successful submission
      completeCard(card.id);
      
      console.log('✅ Form submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      setError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = cardStates[card.id]?.status === 'complete';
  const canSubmit = card.config?.show_submit_button && calculatedResult && !isComplete;

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
            <p style={styles.calculationCard.description as React.CSSProperties}>
              {card.config.description}
            </p>
          )}
        </div>
      )}

      {/* Main Result Field */}
      <div style={styles.calculationCard.resultSection as React.CSSProperties}>
        <div style={styles.calculationCard.resultDisplay as React.CSSProperties}>
          {error ? (
            <div style={styles.calculationCard.errorMessage as React.CSSProperties}>
              {error}
            </div>
          ) : calculatedResult && card.config?.enable_edit_mode ? (
            <EditableCalculationResult
              value={`${calculatedResult}${resultUnit ? ` ${resultUnit}` : ''}`}
              originalValue={`${originalResult || calculatedResult}${resultUnit ? ` ${resultUnit}` : ''}`}
              unit={resultUnit || ''}
              onUpdate={handleResultOverride}
              editButtonText={card.config?.edit_prompt || 'Korjaa lukemaa'}
              isCalculating={isCalculating}
            />
          ) : calculatedResult ? (
            <div style={styles.calculationCard.metricDisplay as React.CSSProperties}>
              <div style={styles.calculationCard.metricValue as React.CSSProperties}>
                {String(calculatedResult || '')}
              </div>
              <div style={styles.calculationCard.metricUnit as React.CSSProperties}>
                {resultUnit || (card.title?.includes('hinta') ? '€' : 'kWh')}
              </div>
            </div>
          ) : (
            <div style={styles.calculationCard.placeholder as React.CSSProperties}>
              Syötä arvot yllä nähdäksesi laskelman
            </div>
          )}
        </div>
      </div>
      
      {/* Submit button if configured */}
      {canSubmit && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            ...styles.submitButton as React.CSSProperties,
            marginTop: '20px',
            width: '100%',
          }}
        >
          {isSubmitting ? 'Lähetetään...' : submitSuccess ? '✓ Lähetetty' : 'Lähetä'}
        </button>
      )}
    </div>
  );
}