'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { type CalculatorFormData } from '@/lib/validation';
import { getHeatingTypeLabel } from '@/lib/calculations';

interface CurrentHeatingStepProps {
  form: UseFormReturn<CalculatorFormData>;
}

export function CurrentHeatingStep({ form }: CurrentHeatingStepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const currentHeatingType = watch('heatingType');

  const heatingTypes = [
    { value: 'electric', label: 'Electric Heating' },
    { value: 'oil', label: 'Oil Heating' },
    { value: 'district', label: 'District Heating' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Your current heating system
        </h3>
        <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-0">
          This helps us compare your current costs with potential heat pump
          savings
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Heating Type Field */}
        <div className="space-y-2">
          <Label
            htmlFor="currentHeatingType"
            className="text-sm font-medium text-gray-700"
          >
            Current Heating Type *
          </Label>
          <Select
            value={currentHeatingType}
            onValueChange={value =>
              setValue(
                'heatingType',
                value as 'electric' | 'oil' | 'district' | 'other'
              )
            }
          >
            <SelectTrigger
              className={`w-full ${errors.heatingType ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select your heating type" />
            </SelectTrigger>
            <SelectContent>
              {heatingTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.heatingType && (
            <p className="text-sm text-red-600">{errors.heatingType.message}</p>
          )}
        </div>

        {/* Annual Heating Cost Field */}
        <div className="space-y-2">
          <Label
            htmlFor="currentHeatingCost"
            className="text-sm font-medium text-gray-700"
          >
            Annual Heating Cost (€) *
          </Label>
          <Input
            id="currentHeatingCost"
            type="number"
            min="100"
            max="10000"
            step="50"
            placeholder="e.g., 2500"
            {...register('annualHeatingCost', { valueAsNumber: true })}
            className={`w-full ${errors.annualHeatingCost ? 'border-red-500' : ''}`}
          />
          {errors.annualHeatingCost && (
            <p className="text-sm text-red-600">
              {errors.annualHeatingCost.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Your total annual heating costs in euros
          </p>
        </div>
      </div>

      {/* Dynamic Help Text Based on Heating Type */}
      {currentHeatingType && currentHeatingType !== 'other' && (
        <Card className="bg-amber-50 border-amber-200 mx-2 sm:mx-0">
          <CardContent className="pt-4 px-4 sm:px-6">
            <p className="text-sm text-amber-800">
              <strong>About {getHeatingTypeLabel(currentHeatingType)}:</strong>{' '}
              {currentHeatingType === 'electric' &&
                'Electric heating is typically the most expensive option. A heat pump could reduce your costs by 60-80%.'}
              {currentHeatingType === 'oil' &&
                'Oil heating costs fluctuate with market prices. A heat pump provides stable, predictable costs.'}
              {currentHeatingType === 'district' &&
                'District heating is convenient but you have limited control. A heat pump gives you independence.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* General Help Text */}
      <Card className="bg-blue-50 border-blue-200 mx-2 sm:mx-0">
        <CardContent className="pt-4 px-4 sm:px-6">
          <p className="text-sm text-blue-800">
            <strong>Why this matters:</strong> Your current heating costs are
            the baseline for calculating potential savings. The higher your
            current costs, the more you can potentially save with a heat pump
            system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
