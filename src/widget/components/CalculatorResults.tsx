import React from 'react';
import type { CalculationResults } from '../types';

interface CalculatorResultsProps {
  results: CalculationResults;
}

export const CalculatorResults: React.FC<CalculatorResultsProps> = ({ results }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('fi-FI').format(Math.round(value));
  };

  return (
    <div className="e1w-results">
      <h3 className="e1w-results-title">Arvioidut säästöt lämpöpumpulla</h3>
      
      <div className="e1w-results-grid">
        <div className="e1w-result-card e1w-result-primary">
          <div className="e1w-result-label">Vuosisäästö</div>
          <div className="e1w-result-value">{formatCurrency(results.annualSavings)}</div>
          <div className="e1w-result-detail">
            Nykyinen: {formatCurrency(results.currentCost)} → 
            Uusi: {formatCurrency(results.heatPumpCost)}
          </div>
        </div>

        <div className="e1w-result-card">
          <div className="e1w-result-label">5 vuoden säästö</div>
          <div className="e1w-result-value">{formatCurrency(results.fiveYearSavings)}</div>
        </div>

        <div className="e1w-result-card">
          <div className="e1w-result-label">10 vuoden säästö</div>
          <div className="e1w-result-value">{formatCurrency(results.tenYearSavings)}</div>
        </div>

        <div className="e1w-result-card">
          <div className="e1w-result-label">CO₂-päästövähennys</div>
          <div className="e1w-result-value">{formatNumber(results.co2Reduction)} kg/vuosi</div>
        </div>
      </div>

      <div className="e1w-result-details">
        <h4 className="e1w-details-title">Laskennan tiedot</h4>
        <ul className="e1w-details-list">
          <li>Lämpöpumpun COP-kerroin: {results.cop}</li>
          <li>Sähkön hinta: {results.electricityPrice} €/kWh</li>
          <li>Lämpöpumpun kulutus: {formatNumber(results.heatPumpConsumption)} kWh/vuosi</li>
          {results.paybackTime && (
            <li>Arvioitu takaisinmaksuaika: {results.paybackTime} vuotta</li>
          )}
        </ul>
      </div>

      <div className="e1w-cta-section">
        <p className="e1w-cta-text">
          Kiinnostuitko? Pyydä ilmainen arvio lämpöpumpun asennuksesta!
        </p>
        <a 
          href="https://energiaykkonen.fi/tarjouspyynto"
          target="_blank"
          rel="noopener noreferrer"
          className="e1w-btn e1w-btn-cta"
        >
          Pyydä tarjous
        </a>
      </div>
    </div>
  );
};