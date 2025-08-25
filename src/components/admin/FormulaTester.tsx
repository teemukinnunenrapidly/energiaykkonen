'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFormulas } from '@/hooks/useFormulas';
import { useFormulaExecution } from '@/hooks/useFormulaExecution';
import {
  Calculator,
  Play,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface FormulaTesterProps {
  className?: string;
}

export function FormulaTester({ className }: FormulaTesterProps) {
  const { formulas, isLoading, error: formulasError } = useFormulas();
  const {
    executeFormula,
    isExecuting,
    lastResult,
    error: executionError,
  } = useFormulaExecution();

  const [selectedFormula, setSelectedFormula] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [customVariables, setCustomVariables] = useState<string>('');

  const handleFormulaSelect = (formulaId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (formula) {
      setSelectedFormula(formulaId);
      // Parse variables from the formula description or set defaults
      const defaultVars: Record<string, string> = {};
      if (formula.description) {
        // Extract variable names from the formula (simple regex for demonstration)
        const varMatches =
          formula.description.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        varMatches.forEach(varName => {
          if (
            ![
              'Math',
              'abs',
              'round',
              'floor',
              'ceil',
              'pow',
              'sqrt',
              'min',
              'max',
            ].includes(varName)
          ) {
            defaultVars[varName] = '0';
          }
        });
      }
      setVariables(defaultVars);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCustomVariablesChange = (value: string) => {
    setCustomVariables(value);
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        setVariables(parsed);
      }
    } catch {
      // Invalid JSON, ignore
    }
  };

  const handleTestFormula = async () => {
    if (!selectedFormula) {
      return;
    }

    const formula = formulas.find(f => f.id === selectedFormula);
    if (!formula) {
      return;
    }

    // Convert string variables to numbers
    const numericVariables: Record<string, number> = {};
    Object.entries(variables).forEach(([key, value]) => {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        numericVariables[key] = num;
      }
    });

    await executeFormula(formula.formula_text, numericVariables);
  };

  const getFormulaById = (id: string) => formulas.find(f => f.id === id);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Formula Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading formulas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (formulasError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Formula Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading formulas: {formulasError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Formula Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formula Selection */}
        <div className="space-y-2">
          <Label htmlFor="formula-select">Select Formula</Label>
          <select
            id="formula-select"
            value={selectedFormula}
            onChange={e => handleFormulaSelect(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="">Choose a formula...</option>
            {formulas.map(formula => (
              <option key={formula.id} value={formula.id}>
                {formula.name} - {formula.description}
              </option>
            ))}
          </select>
        </div>

        {selectedFormula && (
          <>
            <Separator />

            {/* Formula Details */}
            <div className="space-y-2">
              <Label>Formula Details</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-mono text-sm">
                  {getFormulaById(selectedFormula)?.formula_text}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getFormulaById(selectedFormula)?.description}
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    ID: {getFormulaById(selectedFormula)?.id}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Variables Input */}
            <div className="space-y-3">
              <Label>Variables</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`var-${key}`} className="text-xs">
                      {key}
                    </Label>
                    <Input
                      id={`var-${key}`}
                      type="number"
                      value={value}
                      onChange={e => handleVariableChange(key, e.target.value)}
                      placeholder="0"
                      className="h-8"
                    />
                  </div>
                ))}
              </div>

              {Object.keys(variables).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No variables detected in this formula.
                </p>
              )}
            </div>

            {/* Custom Variables JSON */}
            <div className="space-y-2">
              <Label htmlFor="custom-vars">Custom Variables (JSON)</Label>
              <textarea
                id="custom-vars"
                value={customVariables}
                onChange={e => handleCustomVariablesChange(e.target.value)}
                placeholder='{{"x": 10, "y": 20}}'
                className="w-full p-2 border border-input rounded-md bg-background text-sm font-mono h-20"
              />
              <p className="text-xs text-muted-foreground">
                Enter variables as JSON object (e.g., {'{"x": 10, "y": 20}'})
              </p>
            </div>

            {/* Test Button */}
            <Button
              onClick={handleTestFormula}
              disabled={isExecuting || !selectedFormula}
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test Formula
                </>
              )}
            </Button>

            {/* Results */}
            {lastResult && (
              <div className="space-y-3">
                <Separator />
                <Label>Test Results</Label>
                <div
                  className={`p-3 rounded-md ${
                    lastResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {lastResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`font-semibold ${
                        lastResult.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {lastResult.success ? 'Success' : 'Error'}
                    </span>
                  </div>

                  {lastResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Result:</span>
                        <span className="font-mono text-lg font-bold">
                          {lastResult.result}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Execution time: {lastResult.executionTime}ms
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-700">
                      {lastResult.error || 'Unknown error occurred'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {executionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {executionError}
                </p>
              </div>
            )}
          </>
        )}

        {formulas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No formulas available for testing.</p>
            <p className="text-sm">
              Create some formulas in the Calculations page first.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
