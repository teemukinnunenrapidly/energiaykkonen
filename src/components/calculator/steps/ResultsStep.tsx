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
          ceilingHeight: parseFloat(formData.ceilingHeight),
          residents: parseInt(formData.residents),
          currentHeatingCost: formData.annualHeatingCost,
          currentHeatingType: formData.heatingType,
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
        <p className="text-gray-600">Lasketaan potentiaalisia säästöjäsi...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Tuloksia ei voitu laskea. Tarkista syöttämäsi arvot.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Lämpöpumpun säästölaskelma
        </h3>
        <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-0">
          Kiinteistösi tietojen perusteella tässä on mitä voit odottaa
        </p>
      </div>

      {/* Key Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Annual Savings */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg text-green-800">
              Vuosittaiset säästöt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-green-700">
              €{results.annualSavings.toFixed(0)}
            </p>
            <p className="text-xs sm:text-sm text-green-600">
              Vuodessa lämpöpumpulla
            </p>
          </CardContent>
        </Card>

        {/* Payback Period */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg text-blue-800">
              Takaisinmaksuaika
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">
              {results.paybackPeriod.toFixed(1)} vuotta
            </p>
            <p className="text-xs sm:text-sm text-blue-600">
              Sijoituksesi takaisinmaksuun
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card className="mx-2 sm:mx-0">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Yksityiskohtainen analyysi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700">
                Nykyiset vuosikustannukset
              </p>
              <p className="text-base sm:text-lg font-semibold">
                €{formData.annualHeatingCost}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700">
                Lämpöpumpun vuosikustannukset
              </p>
              <p className="text-base sm:text-lg font-semibold">
                €{results.heatPumpCostAnnual.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700">
                5 vuoden säästöt
              </p>
              <p className="text-base sm:text-lg font-semibold text-green-600">
                €{results.fiveYearSavings.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700">
                10 vuoden säästöt
              </p>
              <p className="text-base sm:text-lg font-semibold text-green-600">
                €{results.tenYearSavings.toFixed(0)}
              </p>
            </div>
          </div>

          {/* CO2 Reduction */}
          <div className="pt-3 sm:pt-4 border-t">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Ympäristövaikutus
            </p>
            <p className="text-base sm:text-lg font-semibold text-green-600">
              {results.co2Reduction.toFixed(0)} kg CO2 vähennys vuodessa
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Vastaa {Math.round(results.co2Reduction / 22)} puun istutusta
              vuodessa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-amber-50 border-amber-200 mx-2 sm:mx-0">
        <CardContent className="pt-4 px-4 sm:px-6">
          <h4 className="font-semibold text-amber-800 mb-2 text-sm sm:text-base">
            Mitä tapahtuu seuraavaksi?
          </h4>
          <ul className="text-xs sm:text-sm text-amber-800 space-y-1">
            <li>• Saat yksityiskohtaisen raportin sähköpostilla</li>
            <li>• Myyntitiimimme ottaa sinuun yhteyttä 24 tunnin sisällä</li>
            <li>• Sovimme ilmaisen neuvonnan kiinteistölläsi</li>
            <li>• Saat henkilökohtaisen tarjouksen lämpöpumpusta</li>
          </ul>
        </CardContent>
      </Card>

      {/* Form Summary */}
      <Card className="bg-gray-50 border-gray-200 mx-2 sm:mx-0">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Tietojesi yhteenveto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p>
                <span className="font-medium">Nimi:</span> {formData.firstName}{' '}
                {formData.lastName}
              </p>
              <p>
                <span className="font-medium">Sähköposti:</span>{' '}
                {formData.email}
              </p>
              <p>
                <span className="font-medium">Puhelin:</span> {formData.phone}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Kiinteistö:</span>{' '}
                {formData.squareMeters}m², {formData.ceilingHeight}m korkeus
              </p>
              <p>
                <span className="font-medium">Asukkaat:</span>{' '}
                {formData.residents}
              </p>
              <p>
                <span className="font-medium">Nykyinen lämmitys:</span>{' '}
                {formData.heatingType}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
