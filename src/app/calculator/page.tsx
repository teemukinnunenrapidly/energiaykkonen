'use client';

import { MultiStepForm } from '@/components/calculator';

export default function CalculatorPage() {
  const handleFormComplete = () => {
    // This will be handled by the form component
    // For now, we'll just handle it silently
  };

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

        <MultiStepForm onComplete={handleFormComplete} />
      </div>
    </div>
  );
}
