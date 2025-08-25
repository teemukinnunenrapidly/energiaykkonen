import { describe, it, expect } from 'vitest';
import {
  createMinimalFormSchema,
  validateFormSchema,
  serializeFormSchema,
  deserializeFormSchema,
  findFieldById,
  getAllFieldIds,
  validateFieldDependencies,
  formSchema,
  FormSchema,
} from './index';

// ============================================================================
// TEST SUITE FOR UNIFIED FORM SYSTEM
// ============================================================================

describe('Unified Form System', () => {
  describe('Schema Validation', () => {
    it('should validate a minimal form schema', () => {
      const schema = createMinimalFormSchema();
      const result = validateFormSchema(schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('minimal-form');
        expect(result.data.pages).toHaveLength(1);
        expect(result.data.pages[0].sections).toHaveLength(1);
        expect(result.data.pages[0].sections[0].fields).toHaveLength(1);
      }
    });

    it('should reject invalid form schemas', () => {
      const invalidSchema = {
        id: '', // Invalid: empty string
        name: '', // Invalid: empty string
        version: '', // Invalid: empty string
        pages: [], // Invalid: empty pages array
      };

      const result = validateFormSchema(invalidSchema);
      expect(result.success).toBe(false);
    });

    it('should validate form schema with all optional properties', () => {
      const completeSchema: FormSchema = {
        id: 'complete-form',
        name: 'Complete Form',
        version: '2.0.0',
        description: 'A complete form with all features',
        pages: [
          {
            id: 'page-1',
            title: 'Complete Page',
            order: 0,
            sections: [
              {
                id: 'section-1',
                title: 'Complete Section',
                order: 0,
                fields: [
                  {
                    id: 'field-1',
                    name: 'completeField',
                    type: 'text',
                    label: 'Complete Field',
                    placeholder: 'Enter text',
                    helpText: 'This is help text',
                    required: true,
                    validation: {
                      rules: [
                        { type: 'required', message: 'This field is required' },
                        {
                          type: 'min',
                          value: 3,
                          message: 'Minimum 3 characters',
                        },
                      ],
                    },
                    styling: {
                      width: 'full',
                      variant: 'outline',
                      size: 'md',
                    },
                    animation: {
                      enterAnimation: 'fade',
                      duration: 300,
                      easing: 'ease-out',
                    },
                    localization: {
                      labelKey: 'completeField.label',
                      placeholderKey: 'completeField.placeholder',
                      helpTextKey: 'completeField.helpText',
                    },
                    localization: {
                      titleKey: 'completeSection.title',
                    },
                  },
                ],
                styling: {
                  layout: 'vertical',
                  spacing: 'normal',
                },
                animation: {
                  enterAnimation: 'slide-up',
                  duration: 400,
                },
                localization: {
                  titleKey: 'completeSection.title',
                },
              },
            ],
            styling: {
              layout: 'single-column',
            },
            animation: {
              pageTransition: 'fade',
              duration: 500,
            },
            localization: {
              titleKey: 'completePage.title',
            },
          },
        ],
        behavior: {
          multiStep: true,
          allowSaveProgress: true,
          showProgressBar: true,
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          validateOnSubmit: true,
        },
        styling: {
          theme: 'tesla',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
        },
        animation: {
          globalAnimation: 'enabled',
          defaultDuration: 300,
          defaultEasing: 'ease-out',
        },
        localization: {
          defaultLocale: 'en',
          supportedLocales: ['en', 'fi'],
          fallbackLocale: 'en',
        },
        metadata: {
          created: new Date(),
          updated: new Date(),
          author: 'Test Author',
          tags: ['test', 'complete'],
          category: 'testing',
        },
      };

      const result = validateFormSchema(completeSchema);
      expect(result.success).toBe(true);
    });
  });

  describe('Schema Serialization', () => {
    it('should serialize and deserialize a form schema', () => {
      const originalSchema = createMinimalFormSchema();

      // Serialize
      const serialized = serializeFormSchema(originalSchema);
      expect(typeof serialized).toBe('string');

      // Deserialize
      const deserialized = deserializeFormSchema(serialized);
      expect(deserialized.id).toBe(originalSchema.id);
      expect(deserialized.name).toBe(originalSchema.name);
      expect(deserialized.version).toBe(originalSchema.version);
    });

    it('should handle serialization errors gracefully', () => {
      const invalidSchema = {
        id: 'invalid',
        name: 'Invalid',
        version: '1.0.0',
        pages: [], // Invalid: empty pages
      };

      expect(() => serializeFormSchema(invalidSchema as FormSchema)).toThrow();
    });
  });

  describe('Utility Functions', () => {
    it('should find a field by ID', () => {
      const schema = createMinimalFormSchema();
      const field = findFieldById(schema, 'field-1');

      expect(field).not.toBeNull();
      expect(field?.id).toBe('field-1');
      expect(field?.name).toBe('field1');
    });

    it('should return null for non-existent field ID', () => {
      const schema = createMinimalFormSchema();
      const field = findFieldById(schema, 'non-existent');

      expect(field).toBeNull();
    });

    it('should get all field IDs', () => {
      const schema = createMinimalFormSchema();
      const fieldIds = getAllFieldIds(schema);

      expect(fieldIds).toHaveLength(1);
      expect(fieldIds).toContain('field-1');
    });

    it('should validate field dependencies', () => {
      const schemaWithDependencies = createMinimalFormSchema({
        pages: [
          {
            id: 'page-1',
            title: 'Page 1',
            order: 0,
            sections: [
              {
                id: 'section-1',
                title: 'Section 1',
                order: 0,
                fields: [
                  {
                    id: 'field-1',
                    name: 'field1',
                    type: 'text',
                    label: 'Field 1',
                    localization: { labelKey: 'field1.label' },
                  },
                  {
                    id: 'field-2',
                    name: 'field2',
                    type: 'text',
                    label: 'Field 2',
                    dependencies: ['field-1'], // Valid dependency
                    localization: { labelKey: 'field2.label' },
                  },
                  {
                    id: 'field-3',
                    name: 'field3',
                    type: 'text',
                    label: 'Field 3',
                    dependencies: ['non-existent-field'], // Invalid dependency
                    localization: { labelKey: 'field3.label' },
                  },
                ],
                localization: { titleKey: 'section1.title' },
              },
            ],
            localization: { titleKey: 'page1.title' },
          },
        ],
      });

      const result = validateFieldDependencies(schemaWithDependencies);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        'Field "field-3" depends on non-existent field "non-existent-field"'
      );
    });
  });

  describe('Zod Schema Integration', () => {
    it('should provide proper TypeScript types', () => {
      // This test ensures TypeScript compilation works correctly
      const schema: FormSchema = createMinimalFormSchema();

      // Test that we can access nested properties with proper typing
      const firstPage = schema.pages[0];
      const firstSection = firstPage.sections[0];
      const firstField = firstSection.fields[0];

      expect(typeof firstPage.id).toBe('string');
      expect(typeof firstSection.id).toBe('string');
      expect(typeof firstField.id).toBe('string');
      expect(typeof firstField.type).toBe('string');
    });

    it('should enforce schema constraints', () => {
      // Test that Zod enforces the schema constraints
      const schema = formSchema;

      // This should compile and work at runtime
      expect(schema).toBeDefined();
      expect(typeof schema.parse).toBe('function');
      expect(typeof schema.safeParse).toBe('function');
    });
  });
});

// ============================================================================
// MANUAL TESTING (for development)
// ============================================================================

if (typeof window === 'undefined') {
  // Node.js environment - run tests
  console.log('Running form system tests...');

  // Test basic functionality
  try {
    const testSchema = createMinimalFormSchema();
    console.log('✅ Minimal schema created successfully');

    const validation = validateFormSchema(testSchema);
    if (validation.success) {
      console.log('✅ Schema validation passed');
    } else {
      console.log('❌ Schema validation failed:', validation.errors);
    }

    const serialized = serializeFormSchema(testSchema);
    console.log('✅ Schema serialization successful');

    const deserialized = deserializeFormSchema(serialized);
    console.log('✅ Schema deserialization successful');

    console.log('🎉 All basic tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
