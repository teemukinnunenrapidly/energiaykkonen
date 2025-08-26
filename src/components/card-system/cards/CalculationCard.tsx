import React, { useEffect, useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate } from '@/lib/supabase';

interface CalculationCardProps {
  card: CardTemplate;
}

export function CalculationCard({ card }: CalculationCardProps) {
  const { formData } = useCardContext();
  const [result, setResult] = useState<number>(0);

  useEffect(() => {
    // Implement calculation logic based on card.config.formula
    calculateResult();
  }, [formData]);

  const calculateResult = () => {
    // Example calculation - replace with actual formula parsing
    const { formula } = card.config;
    // Parse and execute formula with formData
    // setResult(calculatedValue);
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
        {card.config.result_format === 'currency' ? '€' : ''} 
        {result.toLocaleString()}
        {card.config.result_format === 'percentage' ? '%' : ''}
      </div>
      {card.config.description && (
        <p className="text-sm text-gray-600 mt-2">{card.config.description}</p>
      )}
    </div>
  );
}
