import { useState, useEffect, useCallback } from 'react';
import { Formula } from '@/lib/types/formula';

interface UseFormulasReturn {
  formulas: Formula[];
  isLoading: boolean;
  error: string | null;
  refreshFormulas: () => Promise<void>;
  getFormulaById: (id: string) => Formula | undefined;
}

export function useFormulas(): UseFormulasReturn {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFormulas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/formulas');
      if (!response.ok) {
        throw new Error('Failed to fetch formulas');
      }

      const data = await response.json();
      setFormulas(data.formulas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch formulas');
      console.error('Error fetching formulas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFormulas = useCallback(async () => {
    await fetchFormulas();
  }, [fetchFormulas]);

  const getFormulaById = useCallback(
    (id: string): Formula | undefined => {
      return formulas.find(formula => formula.id === id);
    },
    [formulas]
  );

  useEffect(() => {
    fetchFormulas();
  }, [fetchFormulas]);

  return {
    formulas,
    isLoading,
    error,
    refreshFormulas,
    getFormulaById,
  };
}
