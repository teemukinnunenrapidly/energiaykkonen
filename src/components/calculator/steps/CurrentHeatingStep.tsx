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

  const currentHeatingType = watch('currentHeatingType');

  const heatingTypes = [
    { value: 'electric', label: 'Electric Heating' },
    { value: 'oil', label: 'Oil Heating' },
    { value: 'gas', label: 'Gas Heating' },
    { value: 'district', label: 'District Heating' },
    { value: 'wood', label: 'Wood Heating' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your current heating system
        </h3>
        <p className="text-gray-600">
          This helps us compare your current costs with potential heat pump
          savings
        </p>
      </div>

      <div className="space-y-4">
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
                'currentHeatingType',
                value as
                  | 'electric'
                  | 'oil'
                  | 'gas'
                  | 'district'
                  | 'wood'
                  | 'other'
              )
            }
          >
            <SelectTrigger
              className={errors.currentHeatingType ? 'border-red-500' : ''}
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
          {errors.currentHeatingType && (
            <p className="text-sm text-red-600">
              {errors.currentHeatingType.message}
            </p>
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
            {...register('currentHeatingCost', { valueAsNumber: true })}
            className={errors.currentHeatingCost ? 'border-red-500' : ''}
          />
          {errors.currentHeatingCost && (
            <p className="text-sm text-red-600">
              {errors.currentHeatingCost.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Your total annual heating costs in euros
          </p>
        </div>
      </div>

      {/* Dynamic Help Text Based on Heating Type */}
      {currentHeatingType && currentHeatingType !== 'other' && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              <strong>About {getHeatingTypeLabel(currentHeatingType)}:</strong>{' '}
              {currentHeatingType === 'electric' &&
                'Electric heating is typically the most expensive option. A heat pump could reduce your costs by 60-80%.'}
              {currentHeatingType === 'oil' &&
                'Oil heating costs fluctuate with market prices. A heat pump provides stable, predictable costs.'}
              {currentHeatingType === 'gas' &&
                'Gas heating is often cost-effective, but a heat pump can still provide 20-40% savings.'}
              {currentHeatingType === 'district' &&
                'District heating is convenient but you have limited control. A heat pump gives you independence.'}
              {currentHeatingType === 'wood' &&
                'Wood heating is renewable but labor-intensive. A heat pump offers convenience with similar environmental benefits.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* General Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
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
