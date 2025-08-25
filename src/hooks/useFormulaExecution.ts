import { useState, useCallback } from 'react';

interface FormulaExecutionResult {
  result: number | null;
  executionTime: number;
  success: boolean;
  error?: string;
}

interface UseFormulaExecutionReturn {
  executeFormula: (
    formula: string,
    variables: Record<string, any>
  ) => Promise<FormulaExecutionResult>;
  isExecuting: boolean;
  lastResult: FormulaExecutionResult | null;
  error: string | null;
}

export function useFormulaExecution(): UseFormulaExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<FormulaExecutionResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const executeFormula = useCallback(
    async (
      formula: string,
      variables: Record<string, any>
    ): Promise<FormulaExecutionResult> => {
      try {
        setIsExecuting(true);
        setError(null);

        const response = await fetch('/api/formulas/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ formula, variables }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to execute formula');
        }

        const data = await response.json();
        const result: FormulaExecutionResult = {
          result: data.result,
          executionTime: data.executionTime,
          success: true,
        };

        setLastResult(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to execute formula';
        setError(errorMessage);
        console.error('Error executing formula:', err);

        const errorResult: FormulaExecutionResult = {
          result: null,
          executionTime: 0,
          success: false,
          error: errorMessage,
        };

        setLastResult(errorResult);
        return errorResult;
      } finally {
        setIsExecuting(false);
      }
    },
    []
  );

  return {
    executeFormula,
    isExecuting,
    lastResult,
    error,
  };
}
