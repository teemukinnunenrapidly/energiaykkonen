import React, { useEffect, useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate } from '@/lib/supabase';
import { evaluate } from 'mathjs';

interface CalculationCardProps {
  card: CardTemplate;
}

export function CalculationCard({ card }: CalculationCardProps) {
  const { formData } = useCardContext();
  const [result, setResult] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateResult();
  }, [formData, card.config]);

  const calculateResult = () => {
    try {
      const { formula, depends_on } = card.config;
      
      if (!formula) {
        setError('No formula specified');
        setResult(0);
        return;
      }

      // Create a restricted scope with only allowed variables
      const scope: Record<string, number> = {};
      
      // Only include specified dependencies to prevent injection attacks
      if (depends_on && Array.isArray(depends_on)) {
        depends_on.forEach(field => {
          const value = formData[field];
          if (value !== undefined && value !== null && value !== '') {
            scope[field] = parseFloat(value) || 0;
          } else {
            scope[field] = 0;
          }
        });
      }

      // Use mathjs evaluate for safe mathematical expression parsing
      const calculatedResult = evaluate(formula, scope);
      
      // Ensure result is a valid number
      if (typeof calculatedResult === 'number' && !isNaN(calculatedResult) && isFinite(calculatedResult)) {
        setResult(calculatedResult);
        setError(null);
      } else {
        setError('Invalid calculation result');
        setResult(0);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setError('Calculation failed');
      setResult(0);
    }
  };

  const formatResult = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
      case 'number':
      default:
        return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{card.title}</h3>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Calculation
        </span>
      </div>
      
      <div className="text-3xl font-bold text-green-600 mt-4">
        {formatResult(result, card.config.result_format)}
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
      
      {card.config.description && (
        <p className="text-sm text-gray-600 mt-2">{card.config.description}</p>
      )}
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">
          <div>Formula: {card.config.formula}</div>
          <div>Dependencies: {JSON.stringify(card.config.depends_on)}</div>
          <div>Form Data: {JSON.stringify(formData)}</div>
        </div>
      )}
    </div>
  );
}
