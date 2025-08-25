import { z } from 'zod';
import {
  sanitizers,
  detectSuspiciousPatterns,
  securityLogger,
} from './input-sanitizer';

// Finnish phone number validation regex
const FINNISH_PHONE_REGEX = /^(\+358|0)[1-9]\d{7,9}$/;

// Security-enhanced string validation helper
function createSecureStringSchema(
  baseSchema: z.ZodString,
  sanitizer: (input: string) => { value: string; wasModified: boolean },
  fieldName: string = 'field'
) {
  return baseSchema.transform((val, ctx) => {
    // Check for suspicious patterns first
    const suspiciousCheck = detectSuspiciousPatterns(val);

    if (suspiciousCheck.isSuspicious) {
      // Log security event
      securityLogger.log({
        type: 'suspicious_input',
        severity: suspiciousCheck.severity,
        ip: 'unknown', // Will be filled in by API handler
        details: {
          field: fieldName,
          patterns: suspiciousCheck.patterns,
          originalValue: val.substring(0, 100), // Truncate for logging
        },
      });

      // Reject high-severity suspicious input
      if (suspiciousCheck.severity === 'high') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} contains potentially dangerous content`,
        });
        return val;
      }
    }

    // Sanitize the input
    const sanitized = sanitizer(val);

    // Warn if content was modified during sanitization
    if (sanitized.wasModified && process.env.NODE_ENV === 'development') {
      console.warn(`Input sanitized for ${fieldName}:`, {
        original: val,
        sanitized: sanitized.value,
      });
    }

    return sanitized.value;
  });
}

// Step 1: House Information
export const houseInfoSchema = z.object({
  squareMeters: z
    .number()
    .min(10, 'Property must be at least 10 m²')
    .max(1000, 'Property must be less than 1000 m²'),
  ceilingHeight: z.enum(['2.5', '3.0', '3.5'], {
    message: 'Please select a valid ceiling height',
  }),
  constructionYear: z.enum(['<1970', '1970-1990', '1991-2010', '>2010'], {
    message: 'Please select a construction year',
  }),
  floors: z.enum(['1', '2', '3+'], {
    message: 'Please select number of floors',
  }),
});

// Step 2: Current Heating
export const currentHeatingSchema = z.object({
  heatingType: z.enum(['oil', 'electric', 'district', 'other'], {
    message: 'Please select your current heating type',
  }),
  annualHeatingCost: z
    .number()
    .min(100, 'Annual heating cost must be at least €100')
    .max(20000, 'Annual heating cost must be less than €20,000'),
  currentEnergyConsumption: z
    .number()
    .min(0, 'Energy consumption cannot be negative')
    .max(50000, 'Energy consumption seems too high')
    .optional(),
});

// Step 3: Household
export const householdSchema = z.object({
  residents: z.enum(['1', '2', '3', '4', '5', '6', '7', '8+'], {
    message: 'Please select number of residents',
  }),
  hotWaterUsage: z.enum(['low', 'normal', 'high'], {
    message: 'Please select hot water usage level',
  }),
});

// Step 4: Contact Information with Enhanced Security
export const contactInfoSchema = z.object({
  firstName: createSecureStringSchema(
    z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .regex(
        /^[a-zA-ZäöåÄÖÅ\s\-']+$/,
        'First name contains invalid characters'
      ),
    sanitizers.name,
    'firstName'
  ),
  lastName: createSecureStringSchema(
    z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-ZäöåÄÖÅ\s\-']+$/, 'Last name contains invalid characters'),
    sanitizers.name,
    'lastName'
  ),
  email: createSecureStringSchema(
    z
      .string()
      .email('Please enter a valid email address')
      .max(255, 'Email address is too long'),
    sanitizers.email,
    'email'
  ),
  phone: createSecureStringSchema(
    z
      .string()
      .regex(
        FINNISH_PHONE_REGEX,
        'Please enter a valid Finnish phone number (e.g., +358401234567 or 0401234567)'
      ),
    sanitizers.phone,
    'phone'
  ),
  streetAddress: z
    .string()
    .max(255, 'Street address is too long')
    .optional()
    .transform(val => (val ? sanitizers.address(val).value : val)),
  city: z
    .string()
    .max(100, 'City name is too long')
    .optional()
    .transform(val => (val ? sanitizers.text(val).value : val)),
  contactPreference: z.enum(['email', 'phone', 'both'], {
    message: 'Please select your preferred contact method',
  }),
  message: z
    .string()
    .max(1000, 'Message must be less than 1000 characters')
    .optional()
    .transform(val => (val ? sanitizers.message(val).value : val)),

  // GDPR Compliance
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the privacy policy to continue',
  }),
  marketingConsent: z.boolean().optional(),
});

// Combined form schema for complete form validation
export const calculatorFormSchema = houseInfoSchema
  .merge(currentHeatingSchema)
  .merge(householdSchema)
  .merge(contactInfoSchema);

// Type inference from schemas
export type HouseInfo = z.infer<typeof houseInfoSchema>;
export type CurrentHeating = z.infer<typeof currentHeatingSchema>;
export type Household = z.infer<typeof householdSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Step-by-step validation schemas mapped to step numbers
export const stepSchemas = {
  1: houseInfoSchema,
  2: currentHeatingSchema,
  3: householdSchema,
  4: contactInfoSchema,
} as const;

// Type for step numbers
export type StepNumber = keyof typeof stepSchemas;

// Validation function for each step
export function validateStep(
  step: StepNumber,
  data: Partial<CalculatorFormData>
) {
  const schema = stepSchemas[step];
  if (!schema) {
    throw new Error(`Invalid step: ${step}`);
  }

  return schema.safeParse(data);
}

// Helper function to check if a step is complete
export function isStepComplete(
  step: StepNumber,
  data: Partial<CalculatorFormData>
): boolean {
  try {
    const result = validateStep(step, data);
    return result.success;
  } catch {
    return false;
  }
}

// Helper function to get step names for UI
export function getStepName(step: StepNumber): string {
  const stepNames: Record<StepNumber, string> = {
    1: 'House Information',
    2: 'Current Heating',
    3: 'Household',
    4: 'Contact Information',
  };
  return stepNames[step];
}

// Helper function to validate the entire form
export function validateCompleteForm(data: Partial<CalculatorFormData>) {
  return calculatorFormSchema.safeParse(data);
}

// Helper function to get all validation errors for a specific step
export function getStepErrors(
  step: StepNumber,
  data: Partial<CalculatorFormData>
): Record<string, string[]> | null {
  const result = validateStep(step, data);
  if (result.success) {
    return null;
  }

  const errors: Record<string, string[]> = {};
  result.error.issues.forEach(issue => {
    const path = issue.path.map(p => String(p)).join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return errors;
}

// Helper function to transform enum values to display labels
export const fieldLabels = {
  ceilingHeight: {
    '2.5': '2.5 meters',
    '3.0': '3.0 meters',
    '3.5': '3.5 meters',
  },
  constructionYear: {
    '<1970': 'Before 1970',
    '1970-1990': '1970-1990',
    '1991-2010': '1991-2010',
    '>2010': 'After 2010',
  },
  floors: {
    '1': '1 floor',
    '2': '2 floors',
    '3+': '3 or more floors',
  },
  heatingType: {
    oil: 'Oil heating',
    electric: 'Electric heating',
    district: 'District heating',
    other: 'Other heating type',
  },
  residents: {
    '1': '1 person',
    '2': '2 people',
    '3': '3 people',
    '4': '4 people',
    '5': '5 people',
    '6': '6 people',
    '7': '7 people',
    '8+': '8 or more people',
  },
  hotWaterUsage: {
    low: 'Low usage',
    normal: 'Normal usage',
    high: 'High usage',
  },
  contactPreference: {
    email: 'Email only',
    phone: 'Phone only',
    both: 'Both email and phone',
  },
} as const;
