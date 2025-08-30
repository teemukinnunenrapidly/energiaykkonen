import React, { useEffect, useState, useRef } from 'react';
import type { CardTemplate, supabase } from '@/lib/supabase';
import { useCardContext } from '../CardContext';
import { UnifiedCalculationEngine } from '@/lib/unified-calculation-engine';
import { EditableCalculationResult } from './EditableCalculationResult';

interface CalculationCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
}

export function CalculationCard({ card }: CalculationCardProps) {
  const {
    formData,
    completeCard,
    uncompleteCard,
    cardStates,
    sessionId,
    updateField,
  } = useCardContext();
  const [calculatedResult, setCalculatedResult] = useState<string | null>(null);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [resultUnit, setResultUnit] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldDependencies, setFieldDependencies] = useState<string[]>([]);
  const [formulaName, setFormulaName] = useState<string | null>(null);
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

        // Process the content - that's it!
        const result = await engine.process(card.config.main_result);

        // Update field dependencies for future re-calculations
        if (result.dependencies) {
          setFieldDependencies(result.dependencies);
        }

        if (!result.success) {
          setError(result.error || 'Calculation failed');
          console.log(
            `❌ CalculationCard "${card.name}" failed: ${result.error}`
          );
          uncompleteCard(card.id);
          hasProcessedCalculationRef.current = false; // Allow retry
          setIsCalculating(false);
          return;
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
          const numericValue = parseFloat(numericPart.replace(/[^\d.-]/g, ''));
          if (!isNaN(numericValue)) {
            formattedResult = `${numericValue.toLocaleString('fi-FI')} ${unit}`;
          }
        } else {
          console.log(`❌ No unit found in result: "${formattedResult}"`);
          // No unit in result, check if it's a pure number
          const numericResult = Number(result.result);
          if (!isNaN(numericResult)) {
            formattedResult = numericResult.toLocaleString('fi-FI');

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
                  formattedResult = `${numericResult.toLocaleString('fi-FI')} ${formula.unit}`;
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

  // Check if we have a main result shortcode configured
  if (!card.config?.main_result) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border-l-4 border-yellow-500">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">{card.title}</h3>
        </div>
        <div className="text-yellow-700 mt-4">
          <p className="font-medium">No calculation shortcode configured</p>
          <p className="text-sm mt-2">
            Please configure a calculation result shortcode (e.g.,
            [calc:energy-kwh]) in the Card Builder.
          </p>
        </div>
      </div>
    );
  }

  // Render the calculation card with display template and main result
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 border-l-4 border-green-500">
      <div className="mb-2">
        <h3 className="text-lg font-semibold">{card.title}</h3>
      </div>

      {/* Main Result Field */}
      <div className="mt-4">
        {error ? (
          <div className="text-lg font-medium text-red-600">{error}</div>
        ) : calculatedResult && card.config?.enable_edit_mode ? (
          <EditableCalculationResult
            value={calculatedResult}
            originalValue={originalResult || calculatedResult}
            unit={resultUnit}
            onUpdate={newValue => {
              // Store the override in formData
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
            formulaName={formulaName || undefined}
          />
        ) : isCalculating ? (
          <div className="text-4xl font-bold text-blue-600 flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            Lasketaan...
          </div>
        ) : calculatedResult ? (
          <div className="text-4xl font-bold text-green-600">
            {calculatedResult}
          </div>
        ) : (
          <div className="text-2xl font-medium text-gray-500">
            {card.config?.main_result}
          </div>
        )}
      </div>

      {card.config.description && (
        <p className="text-sm text-gray-600 mt-4">{card.config.description}</p>
      )}
    </div>
  );
}
