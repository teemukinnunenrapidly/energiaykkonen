import {
  useForm,
  UseFormReturn,
  FieldValues,
  SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormSchema, FormPage, FormSection, FormField } from './types';
import { validateFormSchema, createDefaultCalculatorSchema } from './utils';
import React from 'react'; // Added missing import for React

// Hook for managing form state with Zod validation
export function useFormWithSchema<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  defaultValues?: Partial<T>
) {
  return useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
    mode: 'onChange', // Validate on change for better UX
  });
}

// Hook for managing form schema state
export function useFormSchema(initialSchema?: FormSchema): {
  schema: FormSchema;
  updateSchema: (updates: Partial<FormSchema>) => void;
  resetSchema: () => void;
} {
  const [schema, setSchema] = React.useState<FormSchema>(
    initialSchema || createDefaultCalculatorSchema()
  );

  const updateSchema = React.useCallback((updates: Partial<FormSchema>) => {
    setSchema(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSchema = React.useCallback(() => {
    if (initialSchema) {
      setSchema(initialSchema);
    }
  }, [initialSchema]);

  return { schema, updateSchema, resetSchema };
}

// Hook for managing form page navigation
export function useFormNavigation(pages: FormPage[]): {
  currentPageIndex: number;
  currentPage: FormPage;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToNext: () => void;
  goToPrevious: () => void;
  goToPage: (index: number) => void;
  isLastPage: boolean;
  isFirstPage: boolean;
} {
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0);

  const currentPage = pages[currentPageIndex] || pages[0];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === pages.length - 1;
  const canGoPrevious = !isFirstPage;
  const canGoNext = !isLastPage;

  const goToNext = React.useCallback(() => {
    if (canGoNext) {
      setCurrentPageIndex(prev => prev + 1);
    }
  }, [canGoNext]);

  const goToPrevious = React.useCallback(() => {
    if (canGoPrevious) {
      setCurrentPageIndex(prev => prev - 1);
    }
  }, [canGoPrevious]);

  const goToPage = React.useCallback(
    (index: number) => {
      if (index >= 0 && index < pages.length) {
        setCurrentPageIndex(index);
      }
    },
    [pages.length]
  );

  return {
    currentPageIndex,
    currentPage,
    canGoNext,
    canGoPrevious,
    goToNext,
    goToPrevious,
    goToPage,
    isLastPage,
    isFirstPage,
  };
}

// Hook for managing form section completion
export function useSectionCompletion(sections: FormSection[]): {
  completedSections: Set<string>;
  activeSection: string | null;
  markSectionComplete: (sectionId: string) => void;
  markSectionIncomplete: (sectionId: string) => void;
  isSectionComplete: (sectionId: string) => boolean;
  getCompletionProgress: () => number;
  resetCompletion: () => void;
} {
  const [completedSections, setCompletedSections] = React.useState<Set<string>>(
    new Set()
  );
  const [activeSection, setActiveSection] = React.useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );

  const markSectionComplete = React.useCallback((sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  }, []);

  const markSectionIncomplete = React.useCallback((sectionId: string) => {
    setCompletedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  }, []);

  const isSectionComplete = React.useCallback(
    (sectionId: string) => {
      return completedSections.has(sectionId);
    },
    [completedSections]
  );

  const getCompletionProgress = React.useCallback(() => {
    if (sections.length === 0) {
      return 0;
    }
    return (completedSections.size / sections.length) * 100;
  }, [sections.length, completedSections.size]);

  const resetCompletion = React.useCallback(() => {
    setCompletedSections(new Set());
    setActiveSection(sections.length > 0 ? sections[0].id : null);
  }, [sections.length]);

  return {
    completedSections,
    activeSection,
    markSectionComplete,
    markSectionIncomplete,
    isSectionComplete,
    getCompletionProgress,
    resetCompletion,
  };
}

// Hook for managing form field validation state
export function useFieldValidation(fields: FormField[]): {
  fieldErrors: Record<string, string[]>;
  fieldTouched: Set<string>;
  markFieldTouched: (fieldId: string) => void;
  markFieldUntouched: (fieldId: string) => void;
  setFieldErrors: (fieldId: string, errors: string[]) => void;
  clearFieldErrors: (fieldId: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  getFieldError: (fieldId: string) => string | null;
} {
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});
  const [fieldTouched, setFieldTouched] = React.useState<Set<string>>(
    new Set()
  );

  const markFieldTouched = React.useCallback((fieldId: string) => {
    setFieldTouched(prev => new Set([...prev, fieldId]));
  }, []);

  const markFieldUntouched = React.useCallback((fieldId: string) => {
    setFieldTouched(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldId);
      return newSet;
    });
  }, []);

  const updateFieldErrors = React.useCallback(
    (fieldId: string, errors: string[]) => {
      setFieldErrors(prev => ({
        ...prev,
        [fieldId]: errors,
      }));
    },
    []
  );

  const clearFieldErrors = React.useCallback((fieldId: string) => {
    setFieldErrors(prev => {
      const { [fieldId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setFieldErrors({});
    setFieldTouched(new Set());
  }, []);

  const hasErrors = React.useMemo(() => {
    return Object.values(fieldErrors).some(errors => errors.length > 0);
  }, [fieldErrors]);

  const getFieldError = React.useCallback(
    (fieldId: string) => {
      const errors = fieldErrors[fieldId];
      return errors && errors.length > 0 ? errors[0] : null;
    },
    [fieldErrors]
  );

  return {
    fieldErrors,
    fieldTouched,
    markFieldTouched,
    markFieldUntouched,
    setFieldErrors: updateFieldErrors,
    clearFieldErrors,
    clearAllErrors,
    hasErrors,
    getFieldError,
  };
}

// Hook for managing form submission state
export function useFormSubmission<T extends FieldValues>(): {
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  submitForm: (data: T) => Promise<void>;
  resetSubmissionState: () => void;
} {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const submitForm = React.useCallback(async (data: T) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      // Here you would typically send the data to your API
      // For now, we'll simulate a submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Submission failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetSubmissionState = React.useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    submitForm,
    resetSubmissionState,
  };
}

// Hook for managing form data persistence
export function useFormPersistence<T extends FieldValues>(
  formKey: string,
  defaultValues?: Partial<T>
): {
  savedData: Partial<T>;
  saveFormData: (data: Partial<T>) => void;
  loadFormData: () => Partial<T>;
  clearSavedData: () => void;
  hasSavedData: boolean;
} {
  const storageKey = `form-data-${formKey}`;

  const [savedData, setSavedData] = React.useState<Partial<T>>(() => {
    if (typeof window === 'undefined') {
      return defaultValues || {};
    }

    try {
      const stored = localStorage.getItem(storageKey);
      return stored
        ? { ...defaultValues, ...JSON.parse(stored) }
        : defaultValues || {};
    } catch {
      return defaultValues || {};
    }
  });

  const saveFormData = React.useCallback(
    (data: Partial<T>) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const dataToStore = { ...savedData, ...data };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        setSavedData(dataToStore);
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    },
    [savedData, storageKey]
  );

  const loadFormData = React.useCallback(() => {
    return savedData;
  }, [savedData]);

  const clearSavedData = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
      setSavedData({});
    } catch (error) {
      console.warn('Failed to clear form data:', error);
    }
  }, [storageKey]);

  const hasSavedData = React.useMemo(() => {
    return Object.keys(savedData).length > 0;
  }, [savedData]);

  return {
    savedData,
    saveFormData,
    loadFormData,
    clearSavedData,
    hasSavedData,
  };
}

// Main hook that combines all form functionality
export function useFormSystem<T extends FieldValues>(
  schema: FormSchema,
  zodSchema: z.ZodSchema<T>,
  defaultValues?: Partial<T>
) {
  const form = useFormWithSchema(zodSchema, defaultValues);
  const formSchema = useFormSchema(schema);
  const navigation = useFormNavigation(schema.pages);
  const sectionCompletion = useSectionCompletion(
    navigation.currentPage.sections
  );
  const fieldValidation = useFieldValidation(
    navigation.currentPage.sections.flatMap(s => s.fields)
  );
  const submission = useFormSubmission<T>();
  const persistence = useFormPersistence<T>(schema.id, defaultValues);

  // Auto-save form data on changes
  React.useEffect(() => {
    const subscription = form.watch(data => {
      persistence.saveFormData(data as Partial<T>);
    });

    return () => subscription.unsubscribe();
  }, [form, persistence]);

  return {
    // Form instance
    form,

    // Schema management
    schema: formSchema.schema,
    updateSchema: formSchema.updateSchema,
    resetSchema: formSchema.resetSchema,

    // Navigation
    ...navigation,

    // Section completion
    ...sectionCompletion,

    // Field validation
    ...fieldValidation,

    // Submission
    ...submission,

    // Persistence
    ...persistence,

    // Utility methods
    resetForm: () => {
      form.reset();
      sectionCompletion.resetCompletion();
      fieldValidation.clearAllErrors();
      submission.resetSubmissionState();
    },

    validateCurrentPage: async () => {
      const currentPageData = form.getValues();
      try {
        await form.trigger();
        return true;
      } catch {
        return false;
      }
    },
  };
}
