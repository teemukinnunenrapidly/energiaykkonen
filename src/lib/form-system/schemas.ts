import { z } from 'zod';
import type {
  FormField,
  FormSection,
  FormPage,
  FormSchema,
  SchemaExtension,
  SchemaComposition,
  FieldType,
  FieldValidationRule,
} from './types.js';

// ============================================================================
// BASE ZOD SCHEMAS FOR FIELD METADATA
// ============================================================================

export const fieldStylingMetadataSchema = z.object({
  width: z.enum(['full', 'half', 'third', 'quarter']).optional(),
  variant: z.enum(['default', 'outline', 'ghost', 'destructive']).optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  className: z.string().optional(),
  customCSS: z.record(z.string(), z.string()).optional(),
});

export const fieldAnimationMetadataSchema = z.object({
  enterAnimation: z
    .enum(['fade', 'slide-up', 'slide-down', 'scale', 'none'])
    .optional(),
  exitAnimation: z
    .enum(['fade', 'slide-up', 'slide-down', 'scale', 'none'])
    .optional(),
  duration: z.number().positive().optional(),
  delay: z.number().min(0).optional(),
  easing: z
    .enum(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'])
    .optional(),
});

export const fieldLocalizationMetadataSchema = z.object({
  labelKey: z.string(),
  placeholderKey: z.string().optional(),
  helpTextKey: z.string().optional(),
  errorMessageKey: z.string().optional(),
  locale: z.string().optional(),
});

export const fieldConditionalMetadataSchema = z.object({
  showWhen: z.string().optional(),
  hideWhen: z.string().optional(),
  enableWhen: z.string().optional(),
  disableWhen: z.string().optional(),
});

// ============================================================================
// FIELD OPTIONS SCHEMA
// ============================================================================

export const fieldOptionSchema = z.object({
  value: z.union([z.string(), z.number()]),
  label: z.string(),
  disabled: z.boolean().optional(),
});

// ============================================================================
// FIELD VALIDATION SCHEMA
// ============================================================================

export const fieldValidationRuleSchema = z.object({
  type: z.enum(['required', 'min', 'max', 'pattern', 'email', 'url', 'custom']),
  value: z.any().optional(),
  message: z.string().optional(),
});

export const fieldValidationSchema = z.object({
  rules: z.array(fieldValidationRuleSchema),
  customValidator: z.string().optional(),
});

// ============================================================================
// CORE FORM FIELD SCHEMA
// ============================================================================

export const formFieldSchema: z.ZodType<FormField> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    'text',
    'email',
    'number',
    'select',
    'radio',
    'checkbox',
    'textarea',
    'date',
    'phone',
    'currency',
    'percentage',
    'file',
    'custom',
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional(),

  // Validation
  validation: fieldValidationSchema.optional(),

  // Options for select/radio/checkbox
  options: z.array(fieldOptionSchema).optional(),

  // Metadata
  styling: fieldStylingMetadataSchema.optional(),
  animation: fieldAnimationMetadataSchema.optional(),
  localization: fieldLocalizationMetadataSchema.optional(),
  conditional: fieldConditionalMetadataSchema.optional(),

  // Advanced features
  dependencies: z.array(z.string()).optional(),
  computedValue: z.string().optional(),
  transform: z.string().optional(),

  // UI behavior
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  readonly: z.boolean().optional(),

  // Custom properties
  customProps: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// FORM SECTION SCHEMA
// ============================================================================

export const formSectionSchema: z.ZodType<FormSection> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
  fields: z.array(formFieldSchema),

  // Section behavior
  collapsible: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  required: z.boolean().optional(),

  // Styling
  styling: z
    .object({
      layout: z.enum(['vertical', 'horizontal', 'grid']).optional(),
      columns: z.number().int().min(1).max(12).optional(),
      spacing: z.enum(['tight', 'normal', 'loose']).optional(),
      className: z.string().optional(),
    })
    .optional(),

  // Animation
  animation: z
    .object({
      enterAnimation: z
        .enum(['fade', 'slide-up', 'slide-down', 'scale', 'none'])
        .optional(),
      exitAnimation: z
        .enum(['fade', 'slide-up', 'slide-down', 'scale', 'none'])
        .optional(),
      duration: z.number().positive().optional(),
      delay: z.number().min(0).optional(),
    })
    .optional(),

  // Conditional display
  conditional: z
    .object({
      showWhen: z.string().optional(),
      hideWhen: z.string().optional(),
    })
    .optional(),

  // Localization
  localization: z
    .object({
      titleKey: z.string(),
      descriptionKey: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// FORM PAGE SCHEMA
// ============================================================================

export const formPageSchema: z.ZodType<FormPage> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
  sections: z.array(formSectionSchema),

  // Page behavior
  required: z.boolean().optional(),
  skipable: z.boolean().optional(),
  showProgress: z.boolean().optional(),

  // Navigation
  navigation: z
    .object({
      showBackButton: z.boolean().optional(),
      showNextButton: z.boolean().optional(),
      nextButtonText: z.string().optional(),
      backButtonText: z.string().optional(),
      nextPageId: z.string().optional(),
      previousPageId: z.string().optional(),
    })
    .optional(),

  // Styling
  styling: z
    .object({
      layout: z.enum(['single-column', 'two-column', 'full-width']).optional(),
      className: z.string().optional(),
    })
    .optional(),

  // Animation
  animation: z
    .object({
      pageTransition: z.enum(['slide', 'fade', 'scale', 'none']).optional(),
      duration: z.number().positive().optional(),
    })
    .optional(),

  // Localization
  localization: z
    .object({
      titleKey: z.string(),
      descriptionKey: z.string().optional(),
      nextButtonTextKey: z.string().optional(),
      backButtonTextKey: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// COMPLETE FORM SCHEMA
// ============================================================================

export const formSchema: z.ZodType<FormSchema> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),

  // Structure
  pages: z.array(formPageSchema).min(1),

  // Behavior
  behavior: z
    .object({
      multiStep: z.boolean().optional(),
      allowSaveProgress: z.boolean().optional(),
      allowDraft: z.boolean().optional(),
      requireCompletion: z.boolean().optional(),
      showProgressBar: z.boolean().optional(),
      autoSave: z.boolean().optional(),
      autoSaveInterval: z.number().positive().optional(),
    })
    .optional(),

  // Validation
  validation: z
    .object({
      validateOnChange: z.boolean().optional(),
      validateOnBlur: z.boolean().optional(),
      validateOnSubmit: z.boolean().optional(),
      stopOnFirstError: z.boolean().optional(),
      customValidation: z.string().optional(),
    })
    .optional(),

  // Styling
  styling: z
    .object({
      theme: z
        .enum(['default', 'tesla', 'minimal', 'corporate', 'custom'])
        .optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
      secondaryColor: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
      fontFamily: z.string().optional(),
      className: z.string().optional(),
    })
    .optional(),

  // Animation
  animation: z
    .object({
      globalAnimation: z.enum(['enabled', 'disabled', 'reduced']).optional(),
      defaultDuration: z.number().positive().optional(),
      defaultEasing: z.string().optional(),
    })
    .optional(),

  // Localization
  localization: z
    .object({
      defaultLocale: z.string().min(2),
      supportedLocales: z.array(z.string().min(2)).min(1),
      fallbackLocale: z.string().min(2).optional(),
    })
    .optional(),

  // Metadata
  metadata: z
    .object({
      created: z.date(),
      updated: z.date(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
    })
    .optional(),

  // Custom properties
  customProps: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// SCHEMA EXTENSION SCHEMAS
// ============================================================================

export const schemaExtensionSchema: z.ZodType<SchemaExtension> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  targetSchema: z.string().min(1),
  extensions: z.object({
    fields: z.array(z.object({}).partial()).optional(),
    sections: z.array(z.object({}).partial()).optional(),
    pages: z.array(z.object({}).partial()).optional(),
    validation: z.any().optional(),
    styling: z.any().optional(),
    animation: z.any().optional(),
  }),
  conditions: z
    .object({
      applyWhen: z.string().optional(),
      priority: z.number().int().min(0).optional(),
    })
    .optional(),
});

// ============================================================================
// SCHEMA COMPOSITION SCHEMAS
// ============================================================================

export const schemaCompositionSchema: z.ZodType<SchemaComposition> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  baseSchemas: z.array(z.string().min(1)).min(1),
  composition: z.object({
    mergeStrategy: z.enum(['union', 'intersection', 'custom']),
    fieldResolution: z.enum(['first', 'last', 'merge', 'custom']),
    conflictResolution: z.enum(['base', 'extension', 'custom']),
  }),
  customLogic: z.string().optional(),
});

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

// Schema for partial form updates
export const partialFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  pages: z.array(formPageSchema).optional(),
  version: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Schema for form field updates
export const partialFormFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  type: z
    .enum([
      'text',
      'email',
      'number',
      'select',
      'radio',
      'checkbox',
      'textarea',
      'date',
      'phone',
      'currency',
      'percentage',
      'file',
      'custom',
    ])
    .optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  validation: z
    .object({
      rules: z.array(fieldValidationRuleSchema).optional(),
      customValidator: z.string().optional(),
    })
    .optional(),
  options: z.array(fieldOptionSchema).optional(),
  defaultValue: z.any().optional(),
  helpText: z.string().optional(),
  styling: fieldStylingMetadataSchema.optional(),
  animation: fieldAnimationMetadataSchema.optional(),
  localization: fieldLocalizationMetadataSchema.optional(),
  conditional: fieldConditionalMetadataSchema.optional(),
  customProps: z.record(z.string(), z.any()).optional(),
});

// Schema for form section updates
export const partialFormSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).optional(),
  order: z.number().optional(),
  required: z.boolean().optional(),
  styling: z
    .object({
      layout: z.enum(['vertical', 'horizontal', 'grid', 'custom']).optional(),
      spacing: z.enum(['compact', 'normal', 'loose']).optional(),
      className: z.string().optional(),
    })
    .optional(),
  conditional: z
    .object({
      showWhen: z.string().optional(),
      hideWhen: z.string().optional(),
    })
    .optional(),
  customProps: z.record(z.string(), z.any()).optional(),
});

// Schema for form page updates
export const partialFormPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  sections: z.array(formSectionSchema).optional(),
  order: z.number().optional(),
  required: z.boolean().optional(),
  navigation: z
    .object({
      showProgress: z.boolean().optional(),
      allowBack: z.boolean().optional(),
      allowSkip: z.boolean().optional(),
      customButtons: z.array(z.string()).optional(),
    })
    .optional(),
  styling: z
    .object({
      layout: z.enum(['single-column', 'two-column', 'custom']).optional(),
      theme: z
        .enum(['default', 'tesla', 'minimal', 'corporate', 'custom'])
        .optional(),
      className: z.string().optional(),
    })
    .optional(),
  conditional: z
    .object({
      showWhen: z.string().optional(),
      hideWhen: z.string().optional(),
    })
    .optional(),
  customProps: z.record(z.string(), z.any()).optional(),
});
