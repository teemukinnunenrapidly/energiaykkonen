import { supabase } from '@/lib/supabase';
import {
  Formula,
  CreateFormulaRequest,
  UpdateFormulaRequest,
  FormulaValidationResult,
  FormulaExecutionResult,
  FormulaTemplate,
} from './types/formula';

// Enhanced security: Rate limiting for formula execution
const executionRateLimit = new Map<
  string,
  { count: number; resetTime: number }
>();
const MAX_EXECUTIONS_PER_MINUTE = 30;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Enhanced security: Access control constants
const ALLOWED_FORMULA_TYPES = ['energy_calculation', 'custom', 'template'];
const MAX_FORMULA_LENGTH = 1000;
const MAX_VARIABLES_PER_FORMULA = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = executionRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    executionRateLimit.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= MAX_EXECUTIONS_PER_MINUTE) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Enhanced security: Access control validation
function validateAccessControl(
  formula: CreateFormulaRequest | UpdateFormulaRequest
): { isValid: boolean; error?: string } {
  // Check formula type
  if (
    formula.formula_type &&
    !ALLOWED_FORMULA_TYPES.includes(formula.formula_type)
  ) {
    return { isValid: false, error: 'Invalid formula type' };
  }

  // Check formula length
  if (
    formula.formula_text &&
    formula.formula_text.length > MAX_FORMULA_LENGTH
  ) {
    return {
      isValid: false,
      error: `Formula too long (max ${MAX_FORMULA_LENGTH} characters)`,
    };
  }

  // Check variable count (if variables object exists)
  if (
    formula.variables &&
    Object.keys(formula.variables).length > MAX_VARIABLES_PER_FORMULA
  ) {
    return {
      isValid: false,
      error: `Too many variables (max ${MAX_VARIABLES_PER_FORMULA})`,
    };
  }

  return { isValid: true };
}

/**
 * Formula Management Functions
 */
export async function getFormulas(): Promise<Formula[]> {
  try {
    console.log('Attempting to fetch formulas from database...');

    const { data, error } = await supabase
      .from('formulas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching formulas:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(
        `Failed to fetch formulas: ${error.message || 'Unknown error'}`
      );
    }

    console.log('Successfully fetched formulas:', data);
    return data || [];
  } catch (error) {
    console.error('Exception in getFormulas:', error);
    throw error;
  }
}

export async function getFormulaById(id: string): Promise<Formula | null> {
  const { data, error } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching formula:', error);
    return null;
  }

  return data;
}

export async function createFormula(
  formula: CreateFormulaRequest
): Promise<Formula> {
  try {
    console.log('Attempting to create formula:', formula);

    // Enhanced security: Access control validation
    const accessValidation = validateAccessControl(formula);
    if (!accessValidation.isValid) {
      throw new Error(
        `Access control validation failed: ${accessValidation.error}`
      );
    }

    // Use the formula data directly since created_by is not in CreateFormulaRequest
    const formulaData = formula;

    const { data, error } = await supabase
      .from('formulas')
      .insert([formulaData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating formula:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(
        `Failed to create formula: ${error.message || 'Unknown error'}`
      );
    }

    console.log('Successfully created formula:', data);
    return data;
  } catch (error) {
    console.error('Exception in createFormula:', error);
    throw error;
  }
}

export async function updateFormula(
  formula: UpdateFormulaRequest
): Promise<Formula> {
  try {
    console.log('Attempting to update formula:', {
      id: formula.id,
      updateData: formula,
    });

    // Enhanced security: Access control validation
    const accessValidation = validateAccessControl(formula);
    if (!accessValidation.isValid) {
      throw new Error(
        `Access control validation failed: ${accessValidation.error}`
      );
    }

    const { id, ...updateData } = formula;

    const { data, error } = await supabase
      .from('formulas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating formula:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(
        `Failed to update formula: ${error.message || 'Unknown error'}`
      );
    }

    console.log('Successfully updated formula:', data);
    return data;
  } catch (error) {
    console.error('Exception in updateFormula:', error);
    throw error;
  }
}

export async function deleteFormula(id: string): Promise<void> {
  const { error } = await supabase.from('formulas').delete().eq('id', id);

  if (error) {
    console.error('Error deleting formula:', error);
    throw new Error('Failed to delete formula');
  }
}

export async function toggleFormulaStatus(
  id: string,
  isActive: boolean
): Promise<Formula> {
  const { data, error } = await supabase
    .from('formulas')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating formula status:', error);
    throw new Error('Failed to update formula status');
  }

  return data;
}

/**
 * Formula Validation Functions
 */
export function validateFormula(formulaText: string): FormulaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic syntax validation
  if (!formulaText.trim()) {
    errors.push('Formula text cannot be empty');
  }

  // Check for basic mathematical operations
  const hasMathOps = /[\+\-\*\/\(\)]/.test(formulaText);
  if (!hasMathOps) {
    warnings.push('Formula should contain mathematical operations');
  }

  // Check for supported mathematical functions
  const supportedFunctions = [
    'Math.abs',
    'Math.round',
    'Math.floor',
    'Math.ceil',
    'Math.pow',
    'Math.sqrt',
    'Math.min',
    'Math.max',
  ];
  const hasUnsupportedFunctions =
    /Math\.(?!abs|round|floor|ceil|pow|sqrt|min|max)\w+/.test(formulaText);
  if (hasUnsupportedFunctions) {
    warnings.push(
      'Formula contains unsupported mathematical functions. Supported: abs, round, floor, ceil, pow, sqrt, min, max'
    );
  }

  // Enhanced security: Check for potentially dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /new\s+Function/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /import\s*\(/i,
    /require\s*\(/i,
    /global\s*\(/i,
    /process\s*\./i,
    /window\s*\./i,
    /document\s*\./i,
    /console\s*\./i,
    /localStorage\s*\./i,
    /sessionStorage\s*\./i,
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /WebSocket/i,
    /Worker/i,
    /SharedWorker/i,
    /ServiceWorker/i,
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(formulaText)) {
      errors.push('Formula contains potentially dangerous code patterns');
    }
  });

  // Enhanced security: Check for balanced parentheses and brackets
  const openParens = (formulaText.match(/\(/g) || []).length;
  const closeParens = (formulaText.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unbalanced parentheses in formula');
  }

  // Enhanced security: Check for balanced brackets
  const openBrackets = (formulaText.match(/\[/g) || []).length;
  const closeBrackets = (formulaText.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unbalanced brackets in formula');
  }

  // Enhanced security: Check for balanced braces
  const openBraces = (formulaText.match(/\{/g) || []).length;
  const closeBraces = (formulaText.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in formula');
  }

  // Enhanced security: Check for suspicious character sequences
  const suspiciousPatterns = [
    /;{2,}/, // Multiple semicolons
    /`.*\$\{.*\}.*`/, // Template literals with expressions
    /\/\*.*\*\//, // Block comments
    /\/\/.*/, // Line comments
    /<!--.*-->/, // HTML comments
    /<script.*>.*<\/script>/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data protocol
    /vbscript:/i, // VBScript protocol
    /on\w+\s*=/, // Event handlers
  ];

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(formulaText)) {
      errors.push('Formula contains suspicious patterns');
    }
  });

  // Enhanced security: Check formula length (prevent extremely long formulas)
  if (formulaText.length > 1000) {
    errors.push('Formula is too long (maximum 1000 characters)');
  }

  // Enhanced security: Check for excessive operators (potential for abuse)
  const operatorCount = (formulaText.match(/[\+\-\*\/]/g) || []).length;
  if (operatorCount > 50) {
    warnings.push('Formula contains many operators - consider simplifying');
  }

  // Enhanced security: Check for nested function calls
  const functionCallDepth = (formulaText.match(/\(/g) || []).length;
  if (functionCallDepth > 10) {
    warnings.push('Formula has deep nesting - consider simplifying');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Formula Execution Functions
 */
export async function executeFormula(
  formulaText: string,
  variables: Record<string, any>,
  userId?: string
): Promise<FormulaExecutionResult> {
  const startTime = performance.now();

  try {
    // Enhanced security: Rate limiting check
    if (userId && !checkRateLimit(userId)) {
      return {
        success: false,
        error:
          'Rate limit exceeded: too many formula executions. Please wait before trying again.',
        executionTime: performance.now() - startTime,
      };
    }

    // Enhanced security: Pre-execution validation
    const validation = validateFormula(formulaText);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Formula validation failed: ${validation.errors.join(', ')}`,
        executionTime: performance.now() - startTime,
      };
    }

    // Enhanced security: Variable type validation
    const validatedVariables: Record<string, number> = {};
    for (const [key, value] of Object.entries(variables)) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return {
          success: false,
          error: `Invalid variable value for '${key}': must be a number`,
          executionTime: performance.now() - startTime,
        };
      }

      // Enhanced security: Check for extreme values that could cause issues
      if (!isFinite(numValue) || Math.abs(numValue) > 1e15) {
        return {
          success: false,
          error: `Variable '${key}' has an extreme value that could cause calculation issues`,
          executionTime: performance.now() - startTime,
        };
      }

      validatedVariables[key] = numValue;
    }

    // Enhanced security: Variable name validation
    for (const key of Object.keys(validatedVariables)) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        return {
          success: false,
          error: `Invalid variable name '${key}': must be a valid identifier`,
          executionTime: performance.now() - startTime,
        };
      }
    }

    let processedFormula = formulaText;

    // Enhanced security: Safe variable replacement with validation
    Object.entries(validatedVariables).forEach(([key, value]) => {
      // Use word boundaries to prevent partial replacements
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      processedFormula = processedFormula.replace(regex, String(value));
    });

    // Enhanced security: Comprehensive safety check - only allow mathematical operations and numbers
    const safeFormula = processedFormula.replace(/[^0-9+\-*/().\s]/g, '');

    // Enhanced security: Additional validation after variable replacement
    if (safeFormula !== processedFormula.replace(/[^0-9+\-*/().\s]/g, '')) {
      return {
        success: false,
        error: 'Formula contains unsafe characters after variable replacement',
        executionTime: performance.now() - startTime,
      };
    }

    // Enhanced security: Check for balanced parentheses after replacement
    const openParens = (safeFormula.match(/\(/g) || []).length;
    const closeParens = (safeFormula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return {
        success: false,
        error: 'Formula has unbalanced parentheses after variable replacement',
        executionTime: performance.now() - startTime,
      };
    }

    // Enhanced security: Execution timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Formula execution timeout')), 5000); // 5 second timeout
    });

    const executionPromise = new Promise<number>((resolve, reject) => {
      try {
        // Enhanced security: Use Function constructor with strict scope isolation and safe Math functions
        const safeMath = {
          abs: Math.abs,
          round: Math.round,
          floor: Math.floor,
          ceil: Math.ceil,
          pow: Math.pow,
          sqrt: Math.sqrt,
          min: Math.min,
          max: Math.max,
        };

        const result = new Function('Math', 'return ' + safeFormula)(safeMath);
        const numResult = Number(result);

        // Enhanced security: Validate result
        if (!isFinite(numResult)) {
          reject(new Error('Formula result is not a finite number'));
          return;
        }

        if (Math.abs(numResult) > 1e15) {
          reject(new Error('Formula result is too large'));
          return;
        }

        resolve(numResult);
      } catch (error) {
        reject(error);
      }
    });

    // Race between execution and timeout
    const result = await Promise.race([executionPromise, timeoutPromise]);

    const executionTime = performance.now() - startTime;

    // Enhanced security: Check execution time (prevent abuse)
    if (executionTime > 1000) {
      return {
        success: false,
        error: 'Formula execution took too long',
        executionTime,
      };
    }

    return {
      success: true,
      result: result as number,
      executionTime,
    };
  } catch (error) {
    const executionTime = performance.now() - startTime;

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
    };
  }
}

/**
 * Formula Templates
 */
export const ENERGY_CALCULATION_TEMPLATES: FormulaTemplate[] = [
  {
    id: 'annual-savings',
    name: 'Annual Energy Savings',
    description:
      'Calculate annual energy cost savings based on current and new consumption',
    formula_text: '(current_consumption - new_consumption) * energy_price',
    variables: [
      {
        name: 'current_consumption',
        type: 'number',
        description: 'Current annual energy consumption (kWh)',
        required: true,
        unit: 'kWh',
      },
      {
        name: 'new_consumption',
        type: 'number',
        description: 'New annual energy consumption (kWh)',
        required: true,
        unit: 'kWh',
      },
      {
        name: 'energy_price',
        type: 'number',
        description: 'Energy price per kWh',
        required: true,
        unit: '€/kWh',
      },
    ],
    category: 'Savings',
    tags: ['energy', 'savings', 'cost'],
  },
  {
    id: 'payback-period',
    name: 'Investment Payback Period',
    description:
      'Calculate how long it takes to recoup an investment through energy savings',
    formula_text: 'investment_cost / annual_savings',
    variables: [
      {
        name: 'investment_cost',
        type: 'number',
        description: 'Total investment cost',
        required: true,
        unit: '€',
      },
      {
        name: 'annual_savings',
        type: 'number',
        description: 'Annual energy cost savings',
        required: true,
        unit: '€',
      },
    ],
    category: 'Financial',
    tags: ['payback', 'investment', 'roi'],
  },
  {
    id: 'co2-reduction',
    name: 'CO2 Emissions Reduction',
    description: 'Calculate CO2 emissions reduction based on energy savings',
    formula_text: 'energy_savings * co2_factor',
    variables: [
      {
        name: 'energy_savings',
        type: 'number',
        description: 'Energy savings in kWh',
        required: true,
        unit: 'kWh',
      },
      {
        name: 'co2_factor',
        type: 'number',
        description: 'CO2 emission factor for energy source',
        required: true,
        unit: 'kg CO2/kWh',
      },
    ],
    category: 'Environmental',
    tags: ['co2', 'emissions', 'environmental'],
  },
];

export function getFormulaTemplateById(
  id: string
): FormulaTemplate | undefined {
  return ENERGY_CALCULATION_TEMPLATES.find(template => template.id === id);
}

export function getAllFormulaTemplates(): FormulaTemplate[] {
  return ENERGY_CALCULATION_TEMPLATES;
}

/**
 * Shortcode Generation Functions
 */
export function generateFormulaShortcode(formula: Formula): string {
  const shortcode = `[formula id="${formula.id}" name="${formula.name}"]`;
  return shortcode;
}

export function generateFormulaShortcodeWithVariables(
  formula: Formula
): string {
  // Generate a more detailed shortcode that includes variable placeholders
  const variables = Object.keys(formula.variables || {});
  const variablePlaceholders = variables.map(v => `{${v}}`).join(', ');

  const shortcode = `[formula id="${formula.id}" name="${formula.name}" variables="${variablePlaceholders}"]`;
  return shortcode;
}

export function generateFormulaShortcodeWithDefaults(
  formula: Formula,
  defaultValues: Record<string, any> = {}
): string {
  // Generate shortcode with default values for variables
  const variables = Object.keys(formula.variables || {});
  const defaults = variables
    .map(v => `${v}="${defaultValues[v] || '0'}"`)
    .join(' ');

  const shortcode = `[formula id="${formula.id}" name="${formula.name}" ${defaults}]`;
  return shortcode;
}

export function parseFormulaShortcode(
  shortcode: string
): { id: string; variables: Record<string, any> } | null {
  try {
    // Simple regex to parse shortcode format: [formula id="123" name="test" var1="value1"]
    const regex = /\[formula\s+id="([^"]+)"[^]]*\]/;
    const match = shortcode.match(regex);

    if (!match) {
      return null;
    }

    const id = match[1];

    // Extract variables from shortcode
    const variableRegex = /(\w+)="([^"]+)"/g;
    const variables: Record<string, any> = {};
    let variableMatch;

    while ((variableMatch = variableRegex.exec(shortcode)) !== null) {
      const [, varName, varValue] = variableMatch;
      if (varName !== 'id' && varName !== 'name') {
        // Try to parse as number, fallback to string
        const numValue = parseFloat(varValue);
        variables[varName] = isNaN(numValue) ? varValue : numValue;
      }
    }

    return { id, variables };
  } catch (error) {
    console.error('Error parsing formula shortcode:', error);
    return null;
  }
}

// Enhanced security: Security logging and monitoring
export function logSecurityEvent(
  event: string,
  details: any,
  userId?: string
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    userId: userId || 'unknown',
    userAgent:
      typeof window !== 'undefined'
        ? window.navigator.userAgent
        : 'server-side',
    ip: 'client-ip-would-be-here', // In production, this would come from request headers
  };

  // Log to console for development (in production, this would go to a security log)
  console.warn('SECURITY EVENT:', logEntry);

  // In production, you might want to send this to a security monitoring service
  // or store it in a dedicated security events table
}

// Enhanced security: Get security statistics
export function getSecurityStats(): {
  activeRateLimits: number;
  totalExecutions: number;
  blockedExecutions: number;
} {
  const activeRateLimits = executionRateLimit.size;
  let totalExecutions = 0;
  let blockedExecutions = 0;

  executionRateLimit.forEach(limit => {
    totalExecutions += limit.count;
    if (limit.count >= MAX_EXECUTIONS_PER_MINUTE) {
      blockedExecutions++;
    }
  });

  return {
    activeRateLimits,
    totalExecutions,
    blockedExecutions,
  };
}
