// ============================================================================
// CALCULATOR FORM ADAPTER
// ============================================================================
//
// This adapter simplifies the unified form system for calculator-specific use cases.
// It provides pre-configured schemas and simplified hooks for the energy calculator.
//
// ============================================================================


import {
  FormPage,
  FormSection,
  FormField,
  useFormSystem,
  formSchemaToZod,
  createDefaultValues,
  finnishLanguage,
} from './index';
import { calculatorFormSchema } from './calculator-schema';

// Re-export the calculator form schema
export { calculatorFormSchema };

// Simplified calculator form data type
export interface CalculatorFormData {
  // Property details
  squareMeters: number;
  constructionYear: number;

  // Heating information
  heatingType: 'electric' | 'oil' | 'district' | 'wood';
  heatingCost: number;

  // Contact information
  firstName: string;
  lastName: string;
  email: string;
}

// Simplified calculator form hook
export function useCalculatorForm(defaultValues?: Partial<CalculatorFormData>) {
  // Convert schema to Zod
  const zodSchema = formSchemaToZod(calculatorFormSchema);

  // Create default values
  const initialDefaults = createDefaultValues(calculatorFormSchema);
  const mergedDefaults = { ...initialDefaults, ...defaultValues };

  // Use the full form system
  const formSystem = useFormSystem<CalculatorFormData>(
    calculatorFormSchema,
    zodSchema,
    mergedDefaults
  );

  // Extract commonly used properties
  const {
    form,
    currentPage,
    currentPageIndex,
    canGoNext,
    canGoPrevious,
    goToNext,
    goToPrevious,
    goToPage,
    isLastPage,
    isFirstPage,
    isSectionComplete,
    markSectionComplete,
    getCompletionProgress,
    submitForm,
    isSubmitting,
    submitError,
    submitSuccess,
    resetForm,
  } = formSystem;

  // Simplified navigation helpers
  const nextPage = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      // Mark current section as complete
      currentPage.sections.forEach(section => {
        if (
          section.fields.every(
            field =>
              !form.formState.errors[
                field.name as keyof typeof form.formState.errors
              ]
          )
        ) {
          markSectionComplete(section.id);
        }
      });

      if (canGoNext) {
        goToNext();
      }
    }
  };

  const previousPage = () => {
    if (canGoPrevious) {
      goToPrevious();
    }
  };

  const jumpToPage = (pageIndex: number) => {
    goToPage(pageIndex);
  };

  // Simplified form submission
  const handleSubmit = async (data: CalculatorFormData) => {
    await submitForm(data);
  };

  // Form state helpers
  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const isFormValid = form.formState.isValid;
  const isDirty = form.formState.isDirty;

  return {
    // Form instance
    form,

    // Navigation
    currentPage,
    currentPageIndex,
    canGoNext,
    canGoPrevious,
    nextPage,
    previousPage,
    jumpToPage,
    isLastPage,
    isFirstPage,

    // Progress
    isSectionComplete,
    markSectionComplete,
    getCompletionProgress,

    // Submission
    handleSubmit,
    isSubmitting,
    submitError,
    submitSuccess,

    // Form state
    hasErrors,
    isFormValid,
    isDirty,

    // Actions
    resetForm,

    // Schema
    schema: calculatorFormSchema,
  };
}

// Simplified field renderer for calculator forms
export function renderCalculatorField(field: FormField, form: any) {
  const {
    register,
    formState: { errors },
  } = form;
  const error = errors[field.name];

  return (
    <div key={field.id} className="field-container">
      <label className="field-label">
        {finnishLanguage.getLabel(field.localization?.labelKey || field.name)}
        {field.required && <span className="required">*</span>}
      </label>

      {/* Field Input */}
      {field.type === 'text' || field.type === 'email' ? (
        <input
          type={field.type}
          {...register(field.name)}
          className="field-input"
          placeholder={finnishLanguage.getLabel(
            field.localization?.labelKey || field.name
          )}
        />
      ) : field.type === 'number' ? (
        <input
          type="number"
          {...register(field.name, { valueAsNumber: true })}
          className="field-input"
          placeholder={finnishLanguage.getLabel(
            field.localization?.labelKey || field.name
          )}
        />
      ) : field.type === 'select' ? (
        <select {...register(field.name)} className="field-input">
          <option value="">Valitse...</option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {/* Help Text */}
      {field.localization?.helpTextKey && (
        <p className="field-help">
          {finnishLanguage.getHelpText(field.localization.helpTextKey)}
        </p>
      )}

      {/* Error Message */}
      {error && <p className="field-error">{error.message}</p>}
    </div>
  );
}

// Simplified section renderer for calculator forms
export function renderCalculatorSection(section: FormSection, form: any) {
  return (
    <div key={section.id} className="section-container">
      <h3 className="section-title">
        {section.title}
        {/* Section completion indicator */}
        {form.isSectionComplete && form.isSectionComplete(section.id) && (
          <span className="section-complete">✓ Valmis</span>
        )}
      </h3>

      <div className="section-fields">
        {section.fields.map(field => renderCalculatorField(field, form))}
      </div>
    </div>
  );
}

// Simplified page renderer for calculator forms
export function renderCalculatorPage(page: FormPage, form: any) {
  return (
    <div key={page.id} className="page-container">
      <h2 className="page-title">{page.title}</h2>

      {page.sections.map(section => renderCalculatorSection(section, form))}
    </div>
  );
}

// Export the schema for external use
export { calculatorFormSchema as default };
