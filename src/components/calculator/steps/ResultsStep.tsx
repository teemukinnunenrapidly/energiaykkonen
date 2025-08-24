'use client';

import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type CalculatorFormData } from '@/lib/validation';
import {
  calculateHeatPumpSavings,
  type CalculationResults,
} from '@/lib/calculations';

interface ResultsStepProps {
  form: UseFormReturn<CalculatorFormData>;
}

export function ResultsStep({ form }: ResultsStepProps) {
  const { watch } = form;
  const formData = watch();
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // Calculate results when component mounts
    const calculateResults = () => {
      try {
        const calculatedResults = calculateHeatPumpSavings({
          squareMeters: formData.squareMeters,
          ceilingHeight: formData.ceilingHeight,
          residents: formData.residents,
          currentHeatingCost: formData.currentHeatingCost,
          currentHeatingType: formData.currentHeatingType,
        });
        setResults(calculatedResults);
      } catch {
        // Handle calculation error silently
      } finally {
        setIsCalculating(false);
      }
    };

    // Small delay to show loading state
    const timer = setTimeout(calculateResults, 500);
    return () => clearTimeout(timer);
  }, [formData]);

  if (isCalculating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Calculating your potential savings...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Unable to calculate results. Please check your input values.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your Heat Pump Savings Calculation
        </h3>
        <p className="text-gray-600">
          Based on your property details, here&apos;s what you can expect
        </p>
      </div>

      {/* Key Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Annual Savings */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-800">
              Annual Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">
              €{results.annualSavings.toFixed(0)}
            </p>
            <p className="text-sm text-green-600">
              Per year with a heat pump system
            </p>
          </CardContent>
        </Card>

        {/* Payback Period */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800">
              Payback Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">
              {results.paybackPeriod.toFixed(1)} years
            </p>
            <p className="text-sm text-blue-600">To recover your investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Current Annual Cost
              </p>
              <p className="text-lg font-semibold">
                €{formData.currentHeatingCost}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Heat Pump Annual Cost
              </p>
              <p className="text-lg font-semibold">
                €{results.heatPumpCostAnnual.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                5-Year Savings
              </p>
              <p className="text-lg font-semibold text-green-600">
                €{results.fiveYearSavings.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                10-Year Savings
              </p>
              <p className="text-lg font-semibold text-green-600">
                €{results.tenYearSavings.toFixed(0)}
              </p>
            </div>
          </div>

          {/* CO2 Reduction */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Environmental Impact
            </p>
            <p className="text-lg font-semibold text-green-600">
              {results.co2Reduction.toFixed(0)} kg CO2 reduction per year
            </p>
            <p className="text-sm text-gray-600">
              Equivalent to planting {Math.round(results.co2Reduction / 22)}{' '}
              trees annually
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <h4 className="font-semibold text-amber-800 mb-2">
            What happens next?
          </h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• You&apos;ll receive a detailed report via email</li>
            <li>• Our sales team will contact you within 24 hours</li>
            <li>• We&apos;ll schedule a free consultation at your property</li>
            <li>• Get a personalized quote for your heat pump system</li>
          </ul>
        </CardContent>
      </Card>

      {/* Form Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Your Information Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="font-medium">Name:</span> {formData.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {formData.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {formData.phone}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Property:</span>{' '}
                {formData.squareMeters}m², {formData.ceilingHeight}m height
              </p>
              <p>
                <span className="font-medium">Residents:</span>{' '}
                {formData.residents}
              </p>
              <p>
                <span className="font-medium">Current Heating:</span>{' '}
                {formData.currentHeatingType}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
