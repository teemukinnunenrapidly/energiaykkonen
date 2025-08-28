export interface Formula {
  id: string;
  name: string;
  description?: string;
  formula_text: string;
  formula_type: 'energy_calculation' | 'custom' | 'template';
  variables: Record<string, any>;
  unit?: string; // The unit for the calculation result (e.g., "kWh", "€", "%", "km", etc.)
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
  tags: string[];
}

export interface CreateFormulaRequest {
  name: string;
  description?: string;
  formula_text: string;
  formula_type?: 'energy_calculation' | 'custom' | 'template';
  variables?: Record<string, any>;
  unit?: string; // The unit for the calculation result
  tags?: string[];
}

export interface UpdateFormulaRequest extends Partial<CreateFormulaRequest> {
  id: string;
  is_active?: boolean;
}

export interface FormulaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormulaExecutionResult {
  success: boolean;
  result?: number;
  error?: string;
  executionTime?: number;
}

export interface FormulaVariable {
  name: string;
  type: 'number' | 'string' | 'boolean';
  description?: string;
  defaultValue?: any;
  required: boolean;
  unit?: string;
}

export interface FormulaTemplate {
  id: string;
  name: string;
  description: string;
  formula_text: string;
  variables: FormulaVariable[];
  category: string;
  tags: string[];
}
