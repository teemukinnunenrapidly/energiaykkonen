// ============================================================================
// UNIFIED FORM SYSTEM - MAIN EXPORT FILE
// ============================================================================
//
// This file exports all the core components of the unified form system:
// - TypeScript interfaces and types
// - Zod schemas for runtime validation
// - Utility functions for schema manipulation
// - Schema extension and composition capabilities
// - React Hook Form integration hooks and adapters
// - Finnish language support
// - Calculator-specific adapter
//
// ============================================================================

// Export all types
export type {
  FormField,
  FormSection,
  FormPage,
  FormSchema,
  SchemaExtension,
  SchemaComposition,
  FieldType,
  FieldValidationRule,
  FieldStylingMetadata,
  FieldAnimationMetadata,
  FieldLocalizationMetadata,
  FieldConditionalMetadata,
} from './types';

// Export all Zod schemas
export {
  formFieldSchema,
  formSectionSchema,
  formPageSchema,
  formSchema,
  schemaExtensionSchema,
  schemaCompositionSchema,
  partialFormSchema,
  partialFormFieldSchema,
  partialFormSectionSchema,
  partialFormPageSchema,
  fieldStylingMetadataSchema,
  fieldAnimationMetadataSchema,
  fieldLocalizationMetadataSchema,
  fieldConditionalMetadataSchema,
  fieldOptionSchema,
  fieldValidationRuleSchema,
  fieldValidationSchema,
} from './schemas';

// Export all utility functions
export {
  validateFormSchema,
  schemaToZod,
  serializeSchema,
  deserializeSchema,
  getFieldById,
  getSectionById,
  isFieldRequired,
  getRequiredFields,
  createDefaultCalculatorSchema,
} from './utils';

// Export React Hook Form integration hooks
export {
  useFormWithSchema,
  useFormSchema,
  useFormNavigation,
  useSectionCompletion,
  useFieldValidation,
  useFormSubmission,
  useFormPersistence,
  useFormSystem,
} from './hooks';

// Export React Hook Form adapters
export {
  formSchemaToZod,
  createDefaultValues,
  createFieldErrorMessages,
  createSubmissionData,
  validateFormData,
  createFieldConfig,
  createFormConfig,
} from './adapters';

// Export Finnish language support
export {
  finnishLanguage,
  getFinnishLabel,
  getFinnishHelpText,
  getFinnishErrorMessage,
  getFinnishSuccessMessage,
  getFinnishNavigationLabel,
  getFinnishProgressLabel,
  getFinnishActionLabel,
  getFinnishMetadataLabel,
} from './finnish';

// Export calculator adapter
export {
  calculatorFormSchema,
  useCalculatorForm,
  renderCalculatorField,
  renderCalculatorSection,
  renderCalculatorPage,
  type CalculatorFormData,
} from './calculator-adapter';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Import the exported items for the convenience object
import {
  formFieldSchema,
  formSectionSchema,
  formPageSchema,
  formSchema,
  schemaExtensionSchema,
  schemaCompositionSchema,
} from './schemas';

import {
  validateFormSchema,
  validateFormData,
  getFieldById,
  getSectionById,
  isFieldRequired,
  getRequiredFields,
  createDefaultCalculatorSchema,
} from './utils';

import {
  useFormWithSchema,
  useFormSchema,
  useFormNavigation,
  useSectionCompletion,
  useFieldValidation,
  useFormSubmission,
  useFormPersistence,
  useFormSystem,
} from './hooks';

import {
  formSchemaToZod,
  createDefaultValues,
  createFieldErrorMessages,
  createSubmissionData,
  createFieldConfig,
  createFormConfig,
} from './adapters';

import {
  finnishLanguage,
  getFinnishLabel,
  getFinnishHelpText,
  getFinnishErrorMessage,
  getFinnishSuccessMessage,
  getFinnishNavigationLabel,
  getFinnishProgressLabel,
  getFinnishActionLabel,
  getFinnishMetadataLabel,
} from './finnish';

import { calculatorFormSchema } from './calculator-schema';
import {
  useCalculatorForm,
  renderCalculatorField,
  renderCalculatorSection,
  renderCalculatorPage,
} from './calculator-adapter';

// Export commonly used combinations
export const formSystem = {
  // Core schemas
  schemas: {
    field: formFieldSchema,
    section: formSectionSchema,
    page: formPageSchema,
    form: formSchema,
    extension: schemaExtensionSchema,
    composition: schemaCompositionSchema,
  },

  // Validation functions
  validate: {
    schema: validateFormSchema,
    formData: validateFormData,
  },

  // Utility functions
  utils: {
    find: {
      field: getFieldById,
      section: getSectionById,
    },
    validation: {
      required: isFieldRequired,
      requiredFields: getRequiredFields,
    },
    create: {
      defaultCalculator: createDefaultCalculatorSchema,
    },
  },

  // React Hook Form integration
  react: {
    hooks: {
      useFormWithSchema,
      useFormSchema,
      useFormNavigation,
      useSectionCompletion,
      useFieldValidation,
      useFormSubmission,
      useFormPersistence,
      useFormSystem,
    },
    adapters: {
      formSchemaToZod,
      createDefaultValues,
      createFieldErrorMessages,
      createSubmissionData,
      validateFormData,
      createFieldConfig,
      createFormConfig,
    },
  },

  // Language support
  language: {
    finnish: finnishLanguage,
    getLabel: getFinnishLabel,
    getHelpText: getFinnishHelpText,
    getErrorMessage: getFinnishErrorMessage,
    getSuccessMessage: getFinnishSuccessMessage,
    getNavigationLabel: getFinnishNavigationLabel,
    getProgressLabel: getFinnishProgressLabel,
    getActionLabel: getFinnishActionLabel,
    getMetadataLabel: getFinnishMetadataLabel,
  },

  // Calculator adapter
  calculator: {
    schema: calculatorFormSchema,
    useForm: useCalculatorForm,
    renderField: renderCalculatorField,
    renderSection: renderCalculatorSection,
    renderPage: renderCalculatorPage,
  },
} as const;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

// Default export for convenience
export default formSystem;
