import { ResultsSummary } from '@/components/ui/results-summary';
import { CalculationResults } from '@/lib/calculations';

// Sample calculation results for testing
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

export default function TestResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Results Summary UI Test
          </h1>
          <p className="text-xl text-gray-600">
            Testing the Results Summary component with sample data
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <ResultsSummary results={sampleResults} />
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Test Data
          </h2>
          <p className="text-blue-700 text-sm">
            This page is for testing the Results Summary UI component. The data
            shown above represents: a 150m² house with 3 residents, current
            heating cost of €2,400/year, switching to heat pump.
          </p>
        </div>
      </div>
    </div>
  );
}
