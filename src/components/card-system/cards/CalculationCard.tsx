import React, { useEffect, useState, useRef } from 'react';
import type { CardTemplate } from '@/lib/supabase';
import {
  getFormulas,
  resolveFormulaDependencies,
  executeFormulaWithFieldResolution,
} from '@/lib/formula-service';
import { useCardContext } from '../CardContext';
import { processDisplayContentWithSession } from '@/lib/shortcode-processor';
import { storeCalculationResult, evaluateExpression } from '@/lib/calculation-engine';
import { 
  storeSessionCalculation,
  processFormulaWithSession,
  evaluateProcessedFormula,
  needsRecalculation,
  markCalculationCurrent,
  discoverDependenciesFromFormula,
  discoverDependenciesFromLookup
} from '@/lib/session-data-table';

interface CalculationCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
}

export function CalculationCard({ card }: CalculationCardProps) {
  const { formData, completeCard, uncompleteCard, cardStates, sessionId } =
    useCardContext();
  const [calculatedResult, setCalculatedResult] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasProcessedCalculationRef = useRef<boolean>(false);

  // Parse shortcode to extract formula name and type (supports both calc and lookup)
  const parseShortcode = (shortcode: string): { name: string; type: 'calc' | 'lookup' } | null => {
    const match = shortcode.match(/\[(calc|lookup):([^\]]+)\]/);
    return match ? { type: match[1] as 'calc' | 'lookup', name: match[2] } : null;
  };

  // Process shortcode and calculate result
  useEffect(() => {
    const processShortcode = async () => {
      // Add small delay to ensure session data is fully stored
      await new Promise(resolve => setTimeout(resolve, 100));
      // Only process calculation if this card is revealed (not blurred)
      const cardState = cardStates[card.id];
      const isThisCardRevealed = cardState?.isRevealed === true;
      const isAlreadyComplete = cardState?.status === 'complete';

      if (!isThisCardRevealed) {
        console.log(
          `🔴 CalculationCard "${card.name}" is NOT revealed yet, NOT processing calculation`
        );
        hasProcessedCalculationRef.current = false; // Reset when card becomes blurred
        return;
      }

      // Check if we need to recalculate based on dependencies
      // For lookup cards, use the lookup name; for regular cards, use card name
      const shortcodeInfo = parseShortcode(card.config.main_result);
      const calculationName = shortcodeInfo && shortcodeInfo.type === 'lookup' 
        ? shortcodeInfo.name 
        : card.name;
      const needsRecalc = needsRecalculation(sessionId, calculationName);
      
      if (isAlreadyComplete && !needsRecalc) {
        console.log(
          `⏭️ CalculationCard "${card.name}" is already complete and dependencies haven't changed, skipping calculation`
        );
        return;
      }
      
      if (needsRecalc) {
        console.log(
          `🔄 CalculationCard "${card.name}" needs recalculation due to dependency changes`
        );
        hasProcessedCalculationRef.current = false; // Force recalculation
        setCalculatedResult(null); // Clear old result
        uncompleteCard(card.id); // Mark as incomplete
      }

      // Prevent processing calculation multiple times
      if (hasProcessedCalculationRef.current) {
        console.log(
          `⏭️ CalculationCard "${card.name}" has already processed calculation, skipping`
        );
        return;
      }

      if (!card.config?.main_result) {
        console.log(
          `🔴 CalculationCard "${card.name}" has no main_result configured`
        );
        return;
      }

      console.log(
        `🔄 CalculationCard "${card.name}" IS revealed and not complete yet, processing calculation`
      );
      hasProcessedCalculationRef.current = true;
      
      // Set calculating state early to prevent flashing
      setIsCalculating(true);
      setError(null);

      // Use unified session-based approach for all calculations
      console.log(
        `🧮 Using session-based calculation for: ${card.config.main_result}`
      );

      if (shortcodeInfo && shortcodeInfo.type === 'lookup') {
        // Handle lookup shortcodes directly using the shortcode processor
        console.log(`🔍 Processing lookup shortcode: ${card.config.main_result}`);
        
        // Auto-discover dependencies for lookup shortcodes
        // This ensures that lookup calculations are invalidated when dependent fields change
        const lookupName = shortcodeInfo.name;
        await discoverDependenciesFromLookup(lookupName);
        
        const result = await processDisplayContentWithSession(
          card.config.main_result,
          sessionId,
          formData
        );
        
        if (!result.success) {
          setError(result.error || 'Lookup processing failed');
          console.log(`❌ CalculationCard "${card.name}" lookup failed: ${result.error}`);
          uncompleteCard(card.id);
          hasProcessedCalculationRef.current = false; // Allow retry
          setIsCalculating(false);
          return;
        }
        
        // Parse and format the lookup result properly
        let formattedResult = result.result || card.config.main_result;
        
        // Try to extract numeric value and format it with units
        if (result.result && typeof result.result === 'string') {
          // Check if the result looks like a numeric value (possibly with units)
          const numericMatch = result.result.match(/^([\d\s,]+(?:\.\d+)?)\s*(.*)$/);
          
          if (numericMatch) {
            const numericPart = numericMatch[1].replace(/[\s,]/g, ''); // Remove spaces and commas
            const unitPart = numericMatch[2].trim();
            
            const numericValue = parseFloat(numericPart);
            
            if (!isNaN(numericValue)) {
              // Format with Finnish locale and include units
              const formattedNumber = numericValue.toLocaleString('fi-FI');
              formattedResult = unitPart ? `${formattedNumber} ${unitPart}` : formattedNumber;
              
              console.log(`🎯 [FORMAT] Lookup result formatted: ${result.result} → ${formattedResult}`);
            }
          }
        }
        
        setCalculatedResult(formattedResult);
        
        // Store the lookup result in session table for dependency tracking
        if (result.result && typeof result.result === 'string') {
          const numericMatch = result.result.match(/^([\\d\\s,]+(?:\\.\\d+)?)/);
          if (numericMatch) {
            const numericValue = parseFloat(numericMatch[1].replace(/[\\s,]/g, ''));
            if (!isNaN(numericValue)) {
              storeSessionCalculation(sessionId, lookupName, numericValue, '');
              // Mark this calculation as current (remove from invalidation queue)
              markCalculationCurrent(sessionId, lookupName);
            }
          }
        }
        
        console.log(`✅ CalculationCard "${card.name}" lookup result: ${formattedResult}`);
        completeCard(card.id);
        setIsCalculating(false);
        return;
      }
      
      // Handle calc shortcodes and direct formula references
      let currentFormula: any = null;
      
      if (shortcodeInfo && shortcodeInfo.type === 'calc') {
        const formulas = await getFormulas();
        currentFormula = formulas.find(f => f.name === shortcodeInfo.name);
      }
      
      // If no formula found by shortcode, look for a formula with the card name
      if (!currentFormula) {
        const formulas = await getFormulas();
        currentFormula = formulas.find(f => f.name === card.name);
      }
      
      // Auto-discover dependencies from the formula
      if (currentFormula) {
        discoverDependenciesFromFormula(currentFormula.name, currentFormula.formula_text);
      }

      if (!currentFormula) {
        setError(`No formula configuration found for this calculation`);
        uncompleteCard(card.id);
        hasProcessedCalculationRef.current = false; // Allow retry
        setIsCalculating(false);
        return;
      }

      // Step 1: Process formula with session data (handles [field:], [calc:], and [lookup:] references)
      const processed = await processFormulaWithSession(currentFormula.formula_text, sessionId);
      
      if (!processed.success) {
        setError(processed.error || 'Failed to process formula with session data');
        console.log(`❌ CalculationCard "${card.name}" processing failed: ${processed.error}`);
        uncompleteCard(card.id);
        hasProcessedCalculationRef.current = false; // Allow retry
        setIsCalculating(false);
        return;
      }

      // Step 2: Evaluate the processed formula
      const result = evaluateProcessedFormula(processed.processedFormula!);
      
      if (!result.success) {
        setError(result.error || 'Formula evaluation failed');
        console.log(`❌ CalculationCard "${card.name}" evaluation failed: ${result.error}`);
        uncompleteCard(card.id);
        hasProcessedCalculationRef.current = false; // Allow retry
        setIsCalculating(false);
        return;
      }

      // Step 3: Format and display result
      // Get unit from formula database or use fallback based on formula name
      let unit = currentFormula.unit || '';
      
      // Fallback unit mapping based on formula names (temporary until database has unit field)
      if (!unit) {
        const nameLower = currentFormula.name.toLowerCase();
        if (nameLower.includes('energiantarve') && nameLower.includes('kwh')) {
          unit = 'kW';
        } else if (nameLower.includes('öljyn menekki')) {
          unit = 'L/vuosi';
        } else if (nameLower.includes('kaasun menekki')) {
          unit = 'MWh/vuosi'; 
        } else if (nameLower.includes('puun menekki')) {
          unit = 'motti/vuosi';
        }
      }
      
      const formattedResult = unit 
        ? `${result.result!.toLocaleString('fi-FI')} ${unit}`
        : result.result!.toLocaleString('fi-FI');
      setCalculatedResult(formattedResult);
      
      // Step 4: Store in session table for future calculations
      storeSessionCalculation(sessionId, currentFormula.name, result.result!, unit);
      
      // Step 5: Mark this calculation as current (remove from invalidation queue)
      markCalculationCurrent(sessionId, currentFormula.name);
      
      console.log(`✅ CalculationCard "${card.name}" calculated: ${result.result} ${unit}`);
      completeCard(card.id);
      setIsCalculating(false);
    };

    processShortcode();
  }, [card.config?.main_result, formData, sessionId, cardStates[card.id]?.isRevealed ?? false]);

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
        {isCalculating ? (
          <div className="text-4xl font-bold text-blue-600 flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            Lasketaan...
          </div>
        ) : error ? (
          <div className="text-lg font-medium text-red-600">{error}</div>
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
