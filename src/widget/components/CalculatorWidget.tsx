import React, { useState } from 'react';
import { CalculatorForm } from './CalculatorForm';
import { CalculatorResults } from './CalculatorResults';
import { calculateSavings } from '../utils/calculations';
import type { FormData, CalculationResults } from '../types';

export const CalculatorWidget: React.FC = () => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleSubmit = async (data: FormData) => {
    setIsCalculating(true);
    setFormData(data);
    
    try {
      // Laske säästöt
      const calculationResults = calculateSavings(data);
      setResults(calculationResults);
      
      // Lähetä data API:lle jos URL on konfiguroitu
      const config = (window as any).E1_WIDGET_CONFIG;
      if (config?.apiUrl) {
        try {
          await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...data,
              results: calculationResults,
              source: 'widget',
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          console.error('Failed to submit to API:', error);
          // Jatka silti - näytä tulokset vaikka API-kutsu epäonnistui
        }
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setFormData(null);
    setResults(null);
  };

  return (
    <div className="e1w-container">
      <div className="e1w-header">
        <h2 className="e1w-title">Lämpöpumpun säästölaskuri</h2>
        <p className="e1w-subtitle">
          Laske kuinka paljon säästät lämpöpumpulla vuosittain
        </p>
      </div>

      {!results ? (
        <CalculatorForm 
          onSubmit={handleSubmit} 
          isLoading={isCalculating}
          initialData={formData}
        />
      ) : (
        <>
          <CalculatorResults results={results} />
          <button 
            onClick={handleReset}
            className="e1w-btn e1w-btn-secondary e1w-reset-btn"
          >
            Laske uudelleen
          </button>
        </>
      )}
    </div>
  );
};