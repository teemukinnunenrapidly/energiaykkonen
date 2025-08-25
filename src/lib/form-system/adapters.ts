import { z } from 'zod';
import {
  FormSchema,
  FormPage,
  FormSection,
  FormField,
  FieldValidationRule,
} from './types';
import { validateFormSchema } from './utils';

// Convert our form schema to Zod schema
export function formSchemaToZod(schema: FormSchema): z.ZodSchema<any> {
  const fieldSchemas: Record<string, z.ZodSchema<any>> = {};

  // Process all fields across all pages and sections
  schema.pages.forEach(page => {
    page.sections.forEach(section => {
      section.fields.forEach(field => {
        fieldSchemas[field.name] = createFieldZodSchema(field);
      });
    });
  });

  // Create the main schema object
  const mainSchema = z.object(fieldSchemas);

  return mainSchema;
}

// Create Zod schema for individual fields
function createFieldZodSchema(field: FormField): z.ZodSchema<any> {
  let baseSchema: z.ZodSchema<any>;

  // Create base schema based on field type
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      baseSchema = z.string();
      break;
    case 'number':
    case 'currency':
    case 'percentage':
      baseSchema = z.number();
      break;
    case 'select':
    case 'radio':
      baseSchema = z.string();
      break;
    case 'checkbox':
      baseSchema = z.boolean();
      break;
    case 'textarea':
      baseSchema = z.string();
      break;
    case 'date':
      baseSchema = z.string().or(z.date());
      break;
    case 'file':
      baseSchema = z.instanceof(File).or(z.string());
      break;
    case 'custom':
      baseSchema = z.any();
      break;
    default:
      baseSchema = z.string();
  }

  // Apply field-specific validation rules
  if (field.validation?.rules) {
    baseSchema = applyValidationRules(baseSchema, field.validation.rules);
  }

  // Make field optional if not required
  if (!field.validation?.rules?.some(rule => rule.type === 'required')) {
    baseSchema = baseSchema.optional();
  }

  return baseSchema;
}

// Apply validation rules to a Zod schema
function applyValidationRules<T extends z.ZodSchema<any>>(
  schema: T,
  rules: Array<{
    type: FieldValidationRule;
    value?: any;
    message?: string;
  }>
): T {
  let resultSchema = schema;

  rules.forEach(rule => {
    switch (rule.type) {
      case 'required':
        if (schema instanceof z.ZodOptional) {
          resultSchema = schema.unwrap() as T;
        }
        break;
      case 'min':
        if (rule.value !== undefined) {
          if (schema instanceof z.ZodString) {
            resultSchema = schema.min(rule.value, rule.message) as T;
          } else if (schema instanceof z.ZodNumber) {
            resultSchema = schema.min(rule.value, rule.message) as T;
          }
        }
        break;
      case 'max':
        if (rule.value !== undefined) {
          if (schema instanceof z.ZodString) {
            resultSchema = schema.max(rule.value, rule.message) as T;
          } else if (schema instanceof z.ZodNumber) {
            resultSchema = schema.max(rule.value, rule.message) as T;
          }
        }
        break;
      case 'email':
        if (schema instanceof z.ZodString) {
          resultSchema = schema.email(rule.message) as T;
        }
        break;
      case 'url':
        if (schema instanceof z.ZodString) {
          resultSchema = schema.url(rule.message) as T;
        }
        break;
      case 'pattern':
        if (rule.value && schema instanceof z.ZodString) {
          resultSchema = schema.regex(
            new RegExp(rule.value),
            rule.message
          ) as T;
        }
        break;
      case 'custom':
        if (rule.value && typeof rule.value === 'function') {
          resultSchema = schema.refine(rule.value, rule.message) as T;
        }
        break;
    }
  });

  return resultSchema;
}

// Validate global rules
function validateGlobalRules(data: any, globalRules: any[]): boolean {
  // Implement global validation logic here
  // This is a placeholder for future global validation features
  return true;
}

// Create default values from form schema
export function createDefaultValues(schema: FormSchema): Record<string, any> {
  const defaults: Record<string, any> = {};

  schema.pages.forEach(page => {
    page.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        } else {
          // Set sensible defaults based on field type
          switch (field.type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'textarea':
            case 'date':
            case 'phone':
              defaults[field.name] = '';
              break;
            case 'number':
            case 'currency':
            case 'percentage':
              defaults[field.name] = 0;
              break;
            case 'select':
            case 'radio':
              defaults[field.name] = '';
              break;
            case 'checkbox':
              defaults[field.name] = false;
              break;
            case 'file':
              defaults[field.name] = null;
              break;
            case 'custom':
              defaults[field.name] = null;
              break;
            default:
              defaults[field.name] = '';
          }
        }
      });
    });
  });

  return defaults;
}

// Create field error messages from validation results
export function createFieldErrorMessages(
  field: FormField,
  errors: any
): string[] {
  const errorMessages: string[] = [];

  if (errors && typeof errors === 'object') {
    // Handle Zod validation errors
    if (errors.message) {
      errorMessages.push(errors.message);
    }

    // Handle multiple validation errors
    if (Array.isArray(errors)) {
      errors.forEach((error: any) => {
        if (error.message) {
          errorMessages.push(error.message);
        }
      });
    }
  }

  // If no specific error messages, use field validation rules
  if (errorMessages.length === 0 && field.validation?.rules) {
    field.validation.rules.forEach(rule => {
      if (rule.message) {
        errorMessages.push(rule.message);
      }
    });
  }

  return errorMessages;
}

// Create form submission data from form values
export function createSubmissionData(
  schema: FormSchema,
  formValues: Record<string, any>
): Record<string, any> {
  const submissionData: Record<string, any> = {};

  // Only include fields that have values
  Object.keys(formValues).forEach(fieldName => {
    const value = formValues[fieldName];

    // Skip empty values unless they're required
    if (value !== '' && value !== null && value !== undefined) {
      submissionData[fieldName] = value;
    }
  });

  // Add metadata
  submissionData._metadata = {
    formId: schema.id,
    formVersion: schema.version,
    submittedAt: new Date().toISOString(),
    totalPages: schema.pages.length,
    totalSections: schema.pages.reduce(
      (acc, page) => acc + page.sections.length,
      0
    ),
    totalFields: schema.pages.reduce(
      (acc, page) =>
        acc +
        page.sections.reduce(
          (acc2, section) => acc2 + section.fields.length,
          0
        ),
      0
    ),
  };

  return submissionData;
}

// Validate form data against schema
export function validateFormData(
  schema: FormSchema,
  data: Record<string, any>
): { isValid: boolean; errors: Record<string, string[]> } {
  try {
    const zodSchema = formSchemaToZod(schema);
    zodSchema.parse(data);

    return {
      isValid: true,
      errors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};

      error.issues.forEach(err => {
        const fieldName = err.path.join('.');
        if (!errors[fieldName]) {
          errors[fieldName] = [];
        }
        errors[fieldName].push(err.message);
      });

      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: false,
      errors: { _global: ['Validation failed'] },
    };
  }
}

// Create field configuration for React Hook Form
export function createFieldConfig(field: FormField) {
  return {
    name: field.name,
    rules:
      field.validation?.rules
        ?.map(rule => ({
          required: rule.type === 'required',
          min: rule.type === 'min' ? rule.value : undefined,
          max: rule.type === 'max' ? rule.value : undefined,
          pattern: rule.type === 'pattern' ? rule.value : undefined,
          validate: rule.type === 'custom' ? rule.value : undefined,
          message: rule.message,
        }))
        .filter(
          rule =>
            rule.required ||
            rule.min ||
            rule.max ||
            rule.pattern ||
            rule.validate
        ) || [],
  };
}

// Create form configuration for React Hook Form
export function createFormConfig(schema: FormSchema) {
  return {
    defaultValues: createDefaultValues(schema),
    mode: 'onChange' as const,
    reValidateMode: 'onChange' as const,
  };
}
