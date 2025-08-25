'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { type CalculatorFormData } from '@/lib/validation';

interface PropertyDetailsStepProps {
  form: UseFormReturn<CalculatorFormData>;
}

export function PropertyDetailsStep({ form }: PropertyDetailsStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Kiinteistösi tiedot
        </h3>
        <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-0">
          Nämä tiedot auttavat laskemaan energiantarpeesi ja potentiaaliset
          säästösi
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Square Meters Field */}
        <div className="space-y-2">
          <Label
            htmlFor="squareMeters"
            className="text-sm font-medium text-gray-700"
          >
            Asuintila (m²) *
          </Label>
          <Input
            id="squareMeters"
            type="number"
            min="20"
            max="1000"
            step="1"
            placeholder="esim. 120"
            {...register('squareMeters', { valueAsNumber: true })}
            className={`w-full ${errors.squareMeters ? 'border-red-500' : ''}`}
          />
          {errors.squareMeters && (
            <p className="text-sm text-red-600">
              {errors.squareMeters.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Kokonaislämmitetty asuintila neliömetreissä
          </p>
        </div>

        {/* Ceiling Height Field */}
        <div className="space-y-2">
          <Label
            htmlFor="ceilingHeight"
            className="text-sm font-medium text-gray-700"
          >
            Katokorkeus (m) *
          </Label>
          <Input
            id="ceilingHeight"
            type="number"
            min="2.0"
            max="4.0"
            step="0.1"
            placeholder="esim. 2.7"
            {...register('ceilingHeight', { valueAsNumber: true })}
            className={`w-full ${errors.ceilingHeight ? 'border-red-500' : ''}`}
          />
          {errors.ceilingHeight && (
            <p className="text-sm text-red-600">
              {errors.ceilingHeight.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Keskimääräinen katokorkeus metreissä (tyypillisesti 2.4-3.0m)
          </p>
        </div>

        {/* Residents Field */}
        <div className="space-y-2">
          <Label
            htmlFor="residents"
            className="text-sm font-medium text-gray-700"
          >
            Asukkaiden määrä *
          </Label>
          <Input
            id="residents"
            type="number"
            min="1"
            max="20"
            step="1"
            placeholder="esim. 4"
            {...register('residents', { valueAsNumber: true })}
            className={`w-full ${errors.residents ? 'border-red-500' : ''}`}
          />
          {errors.residents && (
            <p className="text-sm text-red-600">{errors.residents.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Kiinteistössä asuvien henkilöiden kokonaismäärä
          </p>
        </div>
      </div>

      {/* Help Text */}
      <Card className="bg-green-50 border-green-200 mx-2 sm:mx-0">
        <CardContent className="pt-4 px-4 sm:px-6">
          <p className="text-sm text-green-800">
            <strong>Miten tämä vaikuttaa laskelmaasi:</strong> Suuremmat
            kiinteistöt ja enemmän asukkaita tarkoittavat tyypillisesti
            korkeampaa energiankulutusta, mutta myös suurempia potentiaalisia
            säästöjä lämpöpumpulla.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
