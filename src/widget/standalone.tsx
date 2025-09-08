import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

// Simple standalone calculator component that doesn't depend on Supabase
const StandaloneCalculator: React.FC = () => {
  const [formData, setFormData] = React.useState({
    energy: '',
    currentCost: '',
  });
  const [results, setResults] = React.useState<{
    annualSavings: number;
    fiveYearSavings: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    // Simple calculation logic
    const energy = parseFloat(formData.energy);
    const currentCost = parseFloat(formData.currentCost);

    if (energy && currentCost) {
      // Heat pump calculation: COP 3.8, electricity 0.15€/kWh
      const heatPumpConsumption = energy / 3.8;
      const heatPumpCost = heatPumpConsumption * 0.15;
      const annualSavings = currentCost - heatPumpCost;
      const fiveYearSavings = annualSavings * 5;

      setResults({
        annualSavings: Math.round(annualSavings),
        fiveYearSavings: Math.round(fiveYearSavings),
      });

      // Try to submit to WordPress API if available
      const config = (window as any).E1_WIDGET_CONFIG;
      if (config?.apiUrl) {
        try {
          await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-WP-Nonce': config.nonce || '',
            },
            body: JSON.stringify({
              data: {
                energy,
                currentCost,
                annualSavings: Math.round(annualSavings),
                fiveYearSavings: Math.round(fiveYearSavings),
              },
              widget_id: 'standalone-calculator',
            }),
          });
        } catch (error) {
          console.warn('Failed to submit to WordPress API:', error);
        }
      }
    }

    setIsCalculating(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({ energy: '', currentCost: '' });
    setResults(null);
  };

  return (
    <div className="e1-calculator-standalone max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Lämpöpumpun säästölaskuri
        </h2>
        <p className="text-gray-600">
          Laske kuinka paljon säästät lämpöpumpulla vuosittain
        </p>
      </div>

      {!results ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="energy"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Vuosittainen energiantarve (kWh)
            </label>
            <input
              type="number"
              id="energy"
              value={formData.energy}
              onChange={(e) => handleInputChange('energy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Esim. 15000"
              required
              min="0"
              max="100000"
            />
          </div>

          <div>
            <label
              htmlFor="currentCost"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nykyiset lämmityskustannukset (€/vuosi)
            </label>
            <input
              type="number"
              id="currentCost"
              value={formData.currentCost}
              onChange={(e) => handleInputChange('currentCost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Esim. 2000"
              required
              min="0"
              max="50000"
            />
          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? 'Lasketaan...' : 'Laske säästöt'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Arvioidut säästöt
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Vuosisäästö:</span>
                <span className="text-2xl font-bold text-green-800">
                  {results.annualSavings} €
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-green-700">5 vuoden säästö:</span>
                <span className="text-2xl font-bold text-green-800">
                  {results.fiveYearSavings} €
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Laske uudelleen
          </button>
        </div>
      )}
    </div>
  );
};

// Widget initialization function
function initE1Widget(elementId: string, config?: any) {
  const container = document.getElementById(elementId);

  if (!container) {
    console.error(`E1 Widget: Container with id "${elementId}" not found`);
    return null;
  }

  // Store config globally
  if (config) {
    (window as any).E1_WIDGET_CONFIG = config;
  }

  // Create React root and render widget
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <StandaloneCalculator />
    </React.StrictMode>
  );

  return root;
}

// Auto-initialize if default container exists
if (typeof window !== 'undefined') {
  // Expose widget API globally
  (window as any).E1Widget = {
    init: initE1Widget,
    version: '2.1.0',
    config: (window as any).E1_WIDGET_CONFIG || {},
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const defaultContainer = document.getElementById('e1-calculator-widget');
      if (defaultContainer) {
        initE1Widget('e1-calculator-widget');
      }
    });
  } else {
    const defaultContainer = document.getElementById('e1-calculator-widget');
    if (defaultContainer) {
      initE1Widget('e1-calculator-widget');
    }
  }
}

export { initE1Widget };