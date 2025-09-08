import React, { useEffect, useState, useRef } from 'react';
import { type CardTemplate } from '@/lib/supabase';
import { useCardContext } from '../CardContext';
import { WidgetCalculationEngine } from '@/lib/widget-calculation-engine';
import { EditableCalculationResult } from '../../../widget/components/EditableCalculationResult';

interface WidgetCalculationCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
  formulas?: any[]; // Pre-loaded formulas from config.json
}

export function WidgetCalculationCard({ card, formulas = [] }: WidgetCalculationCardProps) {
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
      console.log(`🔍 WidgetCalculationCard "${card.name}" useEffect triggered`);
      console.log(`  - Form data:`, JSON.stringify(formData));
      console.log(`  - Field dependencies:`, JSON.stringify(fieldDependencies));
      console.log(`  - Available formulas:`, widgetFormulas.length);
      if (widgetFormulas.length > 0) {
        console.log(`  - Formula names:`, widgetFormulas.map((f: any) => f.name).join(', '));
      }
      console.log(`  - Main result to calculate:`, card.config?.main_result);

      // Only process calculation if this card is revealed
      const cardState = cardStates[card.id];
      const isThisCardRevealed = cardState?.isRevealed === true;
      const isAlreadyComplete = cardState?.status === 'complete';

      if (!isThisCardRevealed) {
        console.log(
          `🔴 WidgetCalculationCard "${card.name}" is NOT revealed yet, NOT processing calculation`
        );
        hasProcessedCalculationRef.current = false;
        return;
      }

      if (isAlreadyComplete && fieldDependencies.length > 0) {
        console.log(
          `🔄 WidgetCalculationCard "${card.name}" is complete but dependencies may have changed, allowing re-calculation`
        );
      } else if (isAlreadyComplete) {
        console.log(
          `⏭️ WidgetCalculationCard "${card.name}" is already complete, skipping calculation`
        );
        return;
      }

      // Allow re-calculation if form data has changed
      if (hasProcessedCalculationRef.current) {
        console.log(
          `🔄 WidgetCalculationCard "${card.name}" has processed before but form data may have changed, re-calculating`
        );
        hasProcessedCalculationRef.current = false;
      }

      if (!card.config?.main_result) {
        console.log(
          `🔴 WidgetCalculationCard "${card.name}" has no main_result configured`
        );
        return;
      }

      console.log(
        `🔄 WidgetCalculationCard "${card.name}" processing calculation: ${card.config.main_result}`
      );
      console.log('Main result config:', card.config?.main_result);
      console.log('Card config:', card.config);
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

        if (result.success) {
          try {
          // Ensure result is always a string - handle objects safely
          let resultString: string | null = null;
          try {
            if (result.result != null) {
              // Safe type checking to avoid React Error #185
              const resultType = Object.prototype.toString.call(result.result);
              console.log('Result type:', resultType, 'Value:', result.result);
              
              if (resultType === '[object Object]') {
                console.warn('Calculation result is object - extracting value');
                // Try to extract value from object safely
                const obj = result.result as any;
                if (obj && typeof obj === 'object' && obj.value !== undefined) {
                  resultString = String(obj.value);
                } else if (obj && typeof obj === 'object' && obj.result !== undefined) {
                  resultString = String(obj.result);
                } else {
                  resultString = String(result.result);
                }
              } else {
                resultString = String(result.result);
              }
            }
          } catch (typeError) {
            console.error('Error checking result type:', typeError);
            resultString = String(result.result || '0');
          }
          console.log('Setting calculatedResult:', { resultString, type: typeof resultString });
          
          // Extra safety: ensure resultString is a safe primitive string
          const safeResultString = resultString === null ? '' : String(resultString || '');
          console.log('Safe result string:', { safeResultString, type: typeof safeResultString });
          
          console.log('🔵 About to call setCalculatedResult');
          setCalculatedResult(safeResultString);
          console.log('✅ setCalculatedResult completed');
          
          console.log('🔵 About to call setOriginalResult');
          setOriginalResult(safeResultString);
          console.log('✅ setOriginalResult completed');
          
          console.log('🔵 About to call setResultUnit');
          setResultUnit('');
          console.log('✅ setResultUnit completed');
          
          console.log('🔵 About to call setFormulaName');
          setFormulaName(null);
          console.log('✅ setFormulaName completed');

          // Store the calculated result in formData using the configured field_name
          if (card.config?.field_name && safeResultString) {
            console.log('🔵 About to process field storage');
            try {
              // Handle Finnish number format: "2 706,6" -> 2706.6
              const numericResult = parseFloat(
                safeResultString
                  .replace(/\s/g, '') // Remove spaces (thousands separator)
                  .replace(',', '.') // Convert comma to dot for decimal
              );
              console.log('🔵 Parsed numeric result:', numericResult);
              if (!isNaN(numericResult)) {
                console.log('🔵 About to call updateField');
                updateField(card.config.field_name, numericResult);
                console.log('✅ updateField completed');
                console.log(
                  `💾 Stored calculation result in field "${card.config.field_name}": ${numericResult}`
                );
              }
            } catch (updateError) {
              console.error('❌ Error updating field:', updateError);
            }
          }
          
          console.log('🔵 About to check auto_complete_on_success');
          // Auto-complete the card if calculation succeeds
          if (card.config?.auto_complete_on_success) {
            console.log('🔵 About to call completeCard');
            completeCard(card.id);
            console.log('✅ completeCard completed');
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
    card,
    formData,
    cardStates,
    completeCard,
    sessionId,
    updateField,
    widgetFormulas,
    // Remove isCalculating from deps to prevent loops
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
    if (
      card.config?.auto_complete_on_success &&
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
    <div className="card">
      {card.name && (
        <h3 className="card-title">
          {String(card.name || '')}
        </h3>
      )}

      {card.description && (
        <div className="calculation-description" style={{ marginBottom: '20px', color: '#6b7280' }}>
          {String(card.description || '')}
        </div>
      )}

      <div className="results-card">
        <div className="results-summary">
          {isCalculating ? (
            <div className="calculating-message" style={{ color: '#3b82f6' }}>
              Calculating...
            </div>
          ) : error ? (
            <div className="calculation-error" style={{ color: '#ef4444' }}>
              ERROR: {String(error || '')}
            </div>
          ) : calculatedResult && calculatedResult.trim() !== '' ? (
            <>
              <div className="result-item">
                <span className="result-label">
                  Result:
                </span>
                <span className="result-value primary">
                  {String(calculatedResult || '')}
                </span>
              </div>
              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="calculate-button"
                  style={{
                    marginTop: '20px',
                    width: '100%',
                  }}
                >
                  {isSubmitting ? 'Submitting...' : submitSuccess ? '✓ Submitted' : 'Submit'}
                </button>
              )}
            </>
          ) : (
            <div className="no-result-message" style={{ color: '#9ca3af' }}>
              Enter values above to see calculation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}