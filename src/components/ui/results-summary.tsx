import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalculationResults,
  formatCurrency,
  formatNumber,
} from '@/lib/calculations';

interface ResultsSummaryProps {
  results: CalculationResults;
  className?: string;
}

interface SummaryItemProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

function SummaryItem({
  title,
  value,
  subtitle,
  icon,
  className,
}: SummaryItemProps) {
  return (
    <Card className={cn('text-center', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-center mb-2">
          {icon && <div className="text-2xl text-blue-600 mb-2">{icon}</div>}
        </div>
        <CardTitle className="text-lg font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
          {value}
        </div>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function ResultsSummary({ results, className }: ResultsSummaryProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your Savings Summary
        </h2>
        <p className="text-lg text-gray-600">
          Here&apos;s how much you could save with a heat pump installation
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <SummaryItem
          title="Annual Savings"
          value={formatCurrency(results.annualSavings)}
          subtitle="per year"
          icon="💰"
          className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
        />

        <SummaryItem
          title="Payback Period"
          value={`${formatNumber(results.paybackPeriod)} years`}
          subtitle="until break-even"
          icon="⏱️"
          className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200"
        />

        <SummaryItem
          title="CO₂ Reduction"
          value={`${formatNumber(results.co2Reduction, 0)} kg`}
          subtitle="per year"
          icon="🌱"
          className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-700">
              5-Year Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-blue-700">
              {formatCurrency(results.fiveYearSavings)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Total savings over 5 years
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-700">
              10-Year Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-purple-700">
              {formatCurrency(results.tenYearSavings)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Total savings over 10 years
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Calculation Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Annual Energy Need</p>
            <p className="font-medium">
              {formatNumber(results.annualEnergyNeed, 0)} kWh
            </p>
          </div>
          <div>
            <p className="text-gray-600">Heat Pump Consumption</p>
            <p className="font-medium">
              {formatNumber(results.heatPumpConsumption, 0)} kWh
            </p>
          </div>
          <div>
            <p className="text-gray-600">Heat Pump Annual Cost</p>
            <p className="font-medium">
              {formatCurrency(results.heatPumpCostAnnual)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Investment Cost</p>
            <p className="font-medium">€15,000</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsSummary;
