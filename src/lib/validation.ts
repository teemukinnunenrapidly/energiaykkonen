import { z } from 'zod';

// Step 1: Basic Information
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits'),
});

// Step 2: Property Details
export const propertyDetailsSchema = z.object({
  squareMeters: z
    .number()
    .min(20, 'Property must be at least 20 m²')
    .max(1000, 'Property must be less than 1000 m²'),
  ceilingHeight: z
    .number()
    .min(2, 'Ceiling height must be at least 2 meters')
    .max(5, 'Ceiling height must be less than 5 meters'),
  residents: z
    .number()
    .min(1, 'Must have at least 1 resident')
    .max(20, 'Cannot have more than 20 residents'),
});

// Step 3: Current Heating
export const currentHeatingSchema = z.object({
  currentHeatingType: z.enum([
    'electric',
    'oil',
    'gas',
    'district',
    'wood',
    'other',
  ]),
  currentHeatingCost: z
    .number()
    .min(100, 'Annual heating cost must be at least €100')
    .max(10000, 'Annual heating cost must be less than €10,000'),
});

// Combined form schema
export const calculatorFormSchema = basicInfoSchema
  .merge(propertyDetailsSchema)
  .merge(currentHeatingSchema);

// Type inference
export type BasicInfo = z.infer<typeof basicInfoSchema>;
export type PropertyDetails = z.infer<typeof propertyDetailsSchema>;
export type CurrentHeating = z.infer<typeof currentHeatingSchema>;
export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Step-by-step validation schemas
export const stepSchemas = {
  1: basicInfoSchema,
  2: propertyDetailsSchema,
  3: currentHeatingSchema,
} as const;

// Validation function for each step
export function validateStep(step: number, data: Partial<CalculatorFormData>) {
  const schema = stepSchemas[step as keyof typeof stepSchemas];
  if (!schema) {
    throw new Error(`Invalid step: ${step}`);
  }

  return schema.safeParse(data);
}

// Helper function to check if a step is complete
export function isStepComplete(
  step: number,
  data: Partial<CalculatorFormData>
): boolean {
  try {
    const result = validateStep(step, data);
    return result.success;
  } catch {
    return false;
  }
}
