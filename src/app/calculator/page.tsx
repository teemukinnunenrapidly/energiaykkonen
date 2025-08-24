import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'E1 Calculator - Energiaykkönen',
  description:
    'Calculate your energy savings and payback period for heat pump installation',
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
      </div>
    </div>
  );
}
