import { z } from 'zod';
import { FormSchema, FormField, FormSection } from './types';

/**
 * Basic utility functions for the simplified form system
 * Focused on calculator needs rather than complex enterprise features
 */

/**
 * Validate a form schema against basic requirements
 */
export function validateFormSchema(schema: FormSchema): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!schema.id || !schema.name) {
    errors.push('Schema must have an id and name');
  }

  if (!schema.pages || schema.pages.length === 0) {
    errors.push('Schema must have at least one page');
  }

  // Validate pages
  schema.pages.forEach((page, pageIndex) => {
    if (!page.id || !page.title) {
      errors.push(`Page ${pageIndex + 1} must have an id and title`);
    }

    if (!page.sections || page.sections.length === 0) {
      errors.push(`Page ${pageIndex + 1} must have at least one section`);
    }

    // Validate sections
    page.sections.forEach((section, sectionIndex) => {
      if (!section.id || !section.title) {
        errors.push(
          `Section ${sectionIndex + 1} in page ${pageIndex + 1} must have an id and title`
        );
      }

      if (!section.fields || section.fields.length === 0) {
        errors.push(
          `Section ${sectionIndex + 1} in page ${pageIndex + 1} must have at least one field`
        );
      }

      // Validate fields
      section.fields.forEach((field, fieldIndex) => {
        if (!field.id || !field.type || !field.label) {
          errors.push(
            `Field ${fieldIndex + 1} in section ${sectionIndex + 1} of page ${pageIndex + 1} must have id, type, and label`
          );
        }

        // Validate field-specific requirements
        if (
          field.type === 'select' &&
          (!field.options || field.options.length === 0)
        ) {
          errors.push(`Select field ${field.id} must have options`);
        }

        if (field.validation?.rules) {
          const minRule = field.validation.rules.find(
            rule => rule.type === 'min'
          );
          const maxRule = field.validation.rules.find(
            rule => rule.type === 'max'
          );

          if (
            minRule?.value !== undefined &&
            maxRule?.value !== undefined &&
            minRule.value > maxRule.value
          ) {
            errors.push(`Field ${field.id} has invalid range constraints`);
          }
        }
      });
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Transform form schema to Zod schema for validation
 */
export function schemaToZod(schema: FormSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  schema.pages.forEach(page => {
    page.sections.forEach(section => {
      section.fields.forEach(field => {
        let fieldSchema:
          | z.ZodString
          | z.ZodNumber
          | z.ZodBoolean
          | z.ZodEnum<any>
          | z.ZodOptional<z.ZodString>
          | z.ZodOptional<z.ZodNumber>
          | z.ZodOptional<z.ZodBoolean>
          | z.ZodOptional<z.ZodEnum<any>>;

        switch (field.type) {
          case 'text':
          case 'textarea':
            fieldSchema = z.string();
            const minLengthRule = field.validation?.rules?.find(
              rule => rule.type === 'min'
            );
            const maxLengthRule = field.validation?.rules?.find(
              rule => rule.type === 'max'
            );
            const patternRule = field.validation?.rules?.find(
              rule => rule.type === 'pattern'
            );

            if (minLengthRule?.value !== undefined) {
              fieldSchema = fieldSchema.min(minLengthRule.value);
            }
            if (maxLengthRule?.value !== undefined) {
              fieldSchema = fieldSchema.max(maxLengthRule.value);
            }
            if (patternRule?.value) {
              fieldSchema = fieldSchema.regex(new RegExp(patternRule.value));
            }
            break;

          case 'email':
            fieldSchema = z.string().email();
            const emailMinLengthRule = field.validation?.rules?.find(
              rule => rule.type === 'min'
            );
            const emailMaxLengthRule = field.validation?.rules?.find(
              rule => rule.type === 'max'
            );

            if (emailMinLengthRule?.value !== undefined) {
              fieldSchema = fieldSchema.min(emailMinLengthRule.value);
            }
            if (emailMaxLengthRule?.value !== undefined) {
              fieldSchema = fieldSchema.max(emailMaxLengthRule.value);
            }
            break;

          case 'number':
            fieldSchema = z.number();
            const numberMinRule = field.validation?.rules?.find(
              rule => rule.type === 'min'
            );
            const numberMaxRule = field.validation?.rules?.find(
              rule => rule.type === 'max'
            );

            if (numberMinRule?.value !== undefined) {
              fieldSchema = fieldSchema.min(numberMinRule.value);
            }
            if (numberMaxRule?.value !== undefined) {
              fieldSchema = fieldSchema.max(numberMaxRule.value);
            }
            break;

          case 'select':
            if (field.options) {
              const values = field.options.map(opt => opt.value);
              fieldSchema = z.enum(values as [string, ...string[]]);
            } else {
              fieldSchema = z.string();
            }
            break;

          case 'checkbox':
            fieldSchema = z.boolean();
            break;

          case 'radio':
            if (field.options) {
              const values = field.options.map(opt => opt.value);
              fieldSchema = z.enum(values as [string, ...string[]]);
            } else {
              fieldSchema = z.string();
            }
            break;

          default:
            fieldSchema = z.string();
        }

        // Make field optional if not required
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }

        shape[field.id] = fieldSchema;
      });
    });
  });

  return z.object(shape);
}

/**
 * Serialize form schema to JSON string
 */
export function serializeSchema(schema: FormSchema): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Deserialize form schema from JSON string
 */
export function deserializeSchema(json: string): FormSchema {
  try {
    const schema = JSON.parse(json);
    const validation = validateFormSchema(schema);

    if (!validation.isValid) {
      throw new Error(`Invalid schema: ${validation.errors.join(', ')}`);
    }

    return schema;
  } catch (error) {
    throw new Error(
      `Failed to deserialize schema: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get field by ID from schema
 */
export function getFieldById(
  schema: FormSchema,
  fieldId: string
): FormField | null {
  for (const page of schema.pages) {
    for (const section of page.sections) {
      const field = section.fields.find(f => f.id === fieldId);
      if (field) {
        return field;
      }
    }
  }
  return null;
}

/**
 * Get section by ID from schema
 */
export function getSectionById(
  schema: FormSchema,
  sectionId: string
): FormSection | null {
  for (const page of schema.pages) {
    const section = page.sections.find(s => s.id === sectionId);
    if (section) {
      return section;
    }
  }
  return null;
}

/**
 * Check if a field is required
 */
export function isFieldRequired(schema: FormSchema, fieldId: string): boolean {
  const field = getFieldById(schema, fieldId);
  return field?.required || false;
}

/**
 * Get all required fields from schema
 */
export function getRequiredFields(schema: FormSchema): string[] {
  const requiredFields: string[] = [];

  schema.pages.forEach(page => {
    page.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          requiredFields.push(field.id);
        }
      });
    });
  });

  return requiredFields;
}

/**
 * Validate form data against schema
 */
export function validateFormData(
  schema: FormSchema,
  data: Record<string, any>
): { isValid: boolean; errors: Record<string, string[]> } {
  try {
    const zodSchema = schemaToZod(schema);
    zodSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};

      error.issues.forEach(err => {
        const fieldPath = err.path.join('.');
        if (!errors[fieldPath]) {
          errors[fieldPath] = [];
        }
        errors[fieldPath].push(err.message);
      });

      return { isValid: false, errors };
    }

    return { isValid: false, errors: { _general: ['Validation failed'] } };
  }
}

/**
 * Create a default form schema for the energy calculator
 */
export function createDefaultCalculatorSchema(): FormSchema {
  return {
    id: 'energy-calculator-default',
    name: 'Energia Laskuri',
    description: 'Default energy calculator form schema',
    version: '1.0.0',
    pages: [
      {
        id: 'property-details',
        title: 'Kiinteistön tiedot',
        order: 0,
        sections: [
          {
            id: 'basic-info',
            title: 'Perustiedot',
            order: 0,
            fields: [
              {
                id: 'squareMeters',
                name: 'squareMeters',
                type: 'number',
                label: 'Asuinpinta-ala (m²)',
                placeholder: '150',
                required: true,
                validation: {
                  rules: [
                    { type: 'min', value: 1, message: 'Vähintään 1 m²' },
                    { type: 'max', value: 10000, message: 'Enintään 10000 m²' },
                  ],
                },
              },
              {
                id: 'ceilingHeight',
                name: 'ceilingHeight',
                type: 'select',
                label: 'Kattokorkeus',
                required: true,
                options: [
                  { value: '2.4', label: '2.4 m' },
                  { value: '2.7', label: '2.7 m' },
                  { value: '3.0', label: '3.0 m' },
                  { value: '3.3', label: '3.3 m' },
                ],
              },
              {
                id: 'constructionYear',
                name: 'constructionYear',
                type: 'select',
                label: 'Rakennusvuosi',
                required: true,
                options: [
                  { value: 'before-1990', label: 'Ennen 1990' },
                  { value: '1991-2010', label: '1991-2010' },
                  { value: '2011-2020', label: '2011-2020' },
                  { value: 'after-2020', label: '2020 jälkeen' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'heating-system',
        title: 'Nykyinen lämmitys',
        order: 1,
        sections: [
          {
            id: 'heating-details',
            title: 'Lämmitystiedot',
            order: 0,
            fields: [
              {
                id: 'heatingType',
                name: 'heatingType',
                type: 'select',
                label: 'Lämmitystapa',
                required: true,
                options: [
                  { value: 'electric', label: 'Sähkö' },
                  { value: 'oil', label: 'Öljy' },
                  { value: 'gas', label: 'Kaasu' },
                  { value: 'wood', label: 'Puu' },
                  { value: 'district', label: 'Kaukolämpö' },
                ],
              },
              {
                id: 'annualHeatingCost',
                name: 'annualHeatingCost',
                type: 'number',
                label: 'Vuosittaiset lämmityskustannukset (€)',
                placeholder: '2000',
                required: true,
                validation: {
                  rules: [
                    { type: 'min', value: 0, message: 'Vähintään 0 €' },
                    { type: 'max', value: 50000, message: 'Enintään 50000 €' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        id: 'contact-info',
        title: 'Yhteystiedot',
        order: 2,
        sections: [
          {
            id: 'contact-details',
            title: 'Yhteystiedot',
            order: 0,
            fields: [
              {
                id: 'firstName',
                name: 'firstName',
                type: 'text',
                label: 'Etunimi',
                placeholder: 'Matti',
                required: true,
                validation: {
                  rules: [
                    {
                      type: 'min',
                      value: 2,
                      message: 'Vähintään 2 merkkiä',
                    },
                    {
                      type: 'max',
                      value: 50,
                      message: 'Enintään 50 merkkiä',
                    },
                  ],
                },
              },
              {
                id: 'lastName',
                name: 'lastName',
                type: 'text',
                label: 'Sukunimi',
                placeholder: 'Meikäläinen',
                required: true,
                validation: {
                  rules: [
                    {
                      type: 'min',
                      value: 2,
                      message: 'Vähintään 2 merkkiä',
                    },
                    {
                      type: 'max',
                      value: 50,
                      message: 'Enintään 50 merkkiä',
                    },
                  ],
                },
              },
              {
                id: 'email',
                name: 'email',
                type: 'email',
                label: 'Sähköposti',
                placeholder: 'matti@esimerkki.fi',
                required: true,
                validation: {
                  rules: [
                    { type: 'required', message: 'Sähköposti on pakollinen' },
                    { type: 'email', message: 'Virheellinen sähköpostiosoite' },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
    localization: {
      defaultLocale: 'fi',
      supportedLocales: ['fi', 'en'],
      fallbackLocale: 'fi',
    },
  };
}
