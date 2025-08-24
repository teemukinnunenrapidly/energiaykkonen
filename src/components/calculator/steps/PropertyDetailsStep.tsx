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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          About your property
        </h3>
        <p className="text-gray-600">
          These details help us calculate your energy needs and potential
          savings
        </p>
      </div>

      <div className="space-y-4">
        {/* Square Meters Field */}
        <div className="space-y-2">
          <Label
            htmlFor="squareMeters"
            className="text-sm font-medium text-gray-700"
          >
            Living Area (m²) *
          </Label>
          <Input
            id="squareMeters"
            type="number"
            min="20"
            max="1000"
            step="1"
            placeholder="e.g., 120"
            {...register('squareMeters', { valueAsNumber: true })}
            className={errors.squareMeters ? 'border-red-500' : ''}
          />
          {errors.squareMeters && (
            <p className="text-sm text-red-600">
              {errors.squareMeters.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Total heated living area in square meters
          </p>
        </div>

        {/* Ceiling Height Field */}
        <div className="space-y-2">
          <Label
            htmlFor="ceilingHeight"
            className="text-sm font-medium text-gray-700"
          >
            Ceiling Height (m) *
          </Label>
          <Input
            id="ceilingHeight"
            type="number"
            min="2.0"
            max="4.0"
            step="0.1"
            placeholder="e.g., 2.7"
            {...register('ceilingHeight', { valueAsNumber: true })}
            className={errors.ceilingHeight ? 'border-red-500' : ''}
          />
          {errors.ceilingHeight && (
            <p className="text-sm text-red-600">
              {errors.ceilingHeight.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Average ceiling height in meters (typically 2.4-3.0m)
          </p>
        </div>

        {/* Residents Field */}
        <div className="space-y-2">
          <Label
            htmlFor="residents"
            className="text-sm font-medium text-gray-700"
          >
            Number of Residents *
          </Label>
          <Input
            id="residents"
            type="number"
            min="1"
            max="20"
            step="1"
            placeholder="e.g., 4"
            {...register('residents', { valueAsNumber: true })}
            className={errors.residents ? 'border-red-500' : ''}
          />
          {errors.residents && (
            <p className="text-sm text-red-600">{errors.residents.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Total number of people living in the property
          </p>
        </div>
      </div>

      {/* Help Text */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-4">
          <p className="text-sm text-green-800">
            <strong>How this affects your calculation:</strong> Larger
            properties and more residents typically mean higher energy
            consumption, but also greater potential savings with a heat pump
            system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
