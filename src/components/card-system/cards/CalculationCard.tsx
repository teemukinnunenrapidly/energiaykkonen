import React, { useEffect, useState } from 'react';
import { useCardContext } from '../CardContext';
import { evaluate } from 'mathjs';
import type { CardTemplate } from '@/lib/supabase';

interface CalculationCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
}

export function CalculationCard({ card }: CalculationCardProps) {
  const { formData } = useCardContext();
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    calculateResult();
  }, [formData, card.config]);

  const calculateResult = () => {
    try {
      setIsCalculating(true);
      setError(null);

      const { formula, depends_on } = card.config;
      
      if (!formula) {
        setError('No calculation formula provided');
        return;
      }

      if (!depends_on || !Array.isArray(depends_on) || depends_on.length === 0) {
        setError('No dependencies specified for calculation');
        return;
      }

      // Check if all required dependencies are available
      const missingDependencies = depends_on.filter(field => {
        const value = formData[field];
        return value === undefined || value === null || value === '';
      });

      if (missingDependencies.length > 0) {
        // Don't show error, just don't calculate yet
        setResult(null);
        return;
      }

      // Create restricted scope with only the specified dependencies
      const scope: Record<string, number> = {};
      depends_on.forEach(field => {
        const value = formData[field];
        if (value !== undefined && value !== null && value !== '') {
          // Convert to number and validate
          const numValue = parseFloat(value.toString());
          if (!isNaN(numValue)) {
            scope[field] = numValue;
          }
        }
      });

      // Verify we have all required values
      if (Object.keys(scope).length !== depends_on.length) {
        setError('Some required values are not valid numbers');
        return;
      }

      // Use mathjs evaluate for safe mathematical expression parsing
      const calculatedResult = evaluate(formula, scope);
      
      // Ensure result is a valid number
      if (typeof calculatedResult === 'number' && !isNaN(calculatedResult) && isFinite(calculatedResult)) {
        setResult(calculatedResult);
      } else {
        setError('Calculation result is not a valid number');
      }
    } catch (err) {
      console.error('Calculation error:', err);
      setError(`Calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatResult = (value: number) => {
    const { result_format } = card.config;
    
    switch (result_format) {
      case 'currency':
        return `€${value.toLocaleString('fi-FI', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toLocaleString('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
      case 'number':
      default:
        return value.toLocaleString('fi-FI', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
  };

  // Show loading state while calculating
  if (isCalculating) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 border-l-4 border-blue-500">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{card.title}</h3>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Calculation</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Calculating...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 border-l-4 border-red-500">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{card.title}</h3>
          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">Error</span>
        </div>
        <div className="text-red-600 mt-4">
          <p className="font-medium">Calculation Error:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Show waiting state when dependencies are not met
  if (result === null) {
    const { depends_on } = card.config;
    const missingFields = depends_on?.filter(field => !formData[field]) || [];
    
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border-l-4 border-yellow-500">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{card.title}</h3>
          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Waiting</span>
        </div>
        <div className="text-yellow-700 mt-4">
          <p className="font-medium">Complete these fields to see your calculation:</p>
          <ul className="text-sm mt-2 space-y-1">
            {missingFields.map(field => (
              <li key={field} className="flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Show successful calculation result
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{card.title}</h3>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Calculation</span>
      </div>
      <div className="text-3xl font-bold text-green-600 mt-4">
        {formatResult(result)}
      </div>
      {card.config.description && (
        <p className="text-sm text-gray-600 mt-2">{card.config.description}</p>
      )}
      
      {/* Development debug panel - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p className="font-medium text-gray-700">Debug Info:</p>
          <p>Formula: {card.config.formula}</p>
          <p>Dependencies: {JSON.stringify(card.config.depends_on)}</p>
          <p>Form Data: {JSON.stringify(formData)}</p>
        </div>
      )}
    </div>
  );
}
