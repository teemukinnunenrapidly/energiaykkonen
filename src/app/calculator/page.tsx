import { Metadata } from 'next';
import { ResultsSummary } from '@/components/ui/results-summary';
import { CalculationResults } from '@/lib/calculations';

export const metadata: Metadata = {
  title: 'E1 Calculator - Energiaykkönen',
  description:
    'Calculate your energy savings and payback period for heat pump installation',
};

// Sample calculation results for preview
const sampleResults: CalculationResults = {
  annualEnergyNeed: 15500,
  heatPumpConsumption: 4650,
  heatPumpCostAnnual: 558,
  annualSavings: 1842,
  fiveYearSavings: 9210,
  tenYearSavings: 18420,
  paybackPeriod: 8.1,
  co2Reduction: 3100,
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            E1 Calculator
          </h1>
          <p className="text-xl text-gray-600">
            Calculate your energy savings and payback period for heat pump
            installation
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Calculator form will be implemented in the next subtasks
            </p>
            <p className="text-sm text-gray-400 mt-2">
              This is the foundation structure for the E1 Calculator
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Preview: Results Summary UI
            </h2>
            <p className="text-blue-700 text-sm">
              This is how the results will be displayed after calculation (Task
              6.1 implementation)
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ResultsSummary results={sampleResults} />
          </div>
        </div>
      </div>
    </div>
  );
}
