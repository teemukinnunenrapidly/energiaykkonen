import { z } from 'zod';

// ============================================================================
// CORE FORM FIELD TYPES
// ============================================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'phone'
  | 'currency'
  | 'percentage'
  | 'file'
  | 'custom';

export type FieldValidationRule =
  | 'required'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

// ============================================================================
// FIELD METADATA INTERFACES
// ============================================================================

export interface FieldStylingMetadata {
  width?: 'full' | 'half' | 'third' | 'quarter';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customCSS?: Record<string, string>;
}

export interface FieldAnimationMetadata {
  enterAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';
  exitAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';
  duration?: number; // milliseconds
  delay?: number; // milliseconds
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

export interface FieldLocalizationMetadata {
  labelKey: string;
  placeholderKey?: string;
  helpTextKey?: string;
  errorMessageKey?: string;
  locale?: string;
}

export interface FieldConditionalMetadata {
  showWhen?: string; // Field ID or condition expression
  hideWhen?: string; // Field ID or condition expression
  enableWhen?: string; // Field ID or condition expression
  disableWhen?: string; // Field ID or condition expression
}

// ============================================================================
// CORE FIELD INTERFACE
// ============================================================================

export interface FormField {
  id: string;
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  required?: boolean;

  // Validation
  validation?: {
    rules: Array<{
      type: FieldValidationRule;
      value?: any;
      message?: string;
    }>;
    customValidator?: string; // Function name or expression
  };

  // Options for select/radio/checkbox
  options?: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;

  // Metadata
  styling?: FieldStylingMetadata;
  animation?: FieldAnimationMetadata;
  localization?: FieldLocalizationMetadata;
  conditional?: FieldConditionalMetadata;

  // Advanced features
  dependencies?: string[]; // Other field IDs this field depends on
  computedValue?: string; // Expression for computed values
  transform?: string; // Transformation function name

  // UI behavior
  disabled?: boolean;
  hidden?: boolean;
  readonly?: boolean;

  // Custom properties
  customProps?: Record<string, any>;
}

// ============================================================================
// FORM SECTION INTERFACE
// ============================================================================

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormField[];

  // Section behavior
  collapsible?: boolean;
  collapsed?: boolean;
  required?: boolean;

  // Styling
  styling?: {
    layout?: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
    spacing?: 'tight' | 'normal' | 'loose';
    className?: string;
  };

  // Animation
  animation?: {
    enterAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';
    exitAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';
    duration?: number;
    delay?: number;
  };

  // Conditional display
  conditional?: {
    showWhen?: string;
    hideWhen?: string;
  };

  // Localization
  localization?: {
    titleKey: string;
    descriptionKey?: string;
  };
}

// ============================================================================
// FORM PAGE INTERFACE
// ============================================================================

export interface FormPage {
  id: string;
  title: string;
  description?: string;
  order: number;
  sections: FormSection[];

  // Page behavior
  required?: boolean;
  skipable?: boolean;
  showProgress?: boolean;

  // Navigation
  navigation?: {
    showBackButton?: boolean;
    showNextButton?: boolean;
    nextButtonText?: string;
    backButtonText?: string;
    nextPageId?: string;
    previousPageId?: string;
  };

  // Styling
  styling?: {
    layout?: 'single-column' | 'two-column' | 'full-width';
    className?: string;
  };

  // Animation
  animation?: {
    pageTransition?: 'slide' | 'fade' | 'scale' | 'none';
    duration?: number;
  };

  // Localization
  localization?: {
    titleKey: string;
    descriptionKey?: string;
    nextButtonTextKey?: string;
    backButtonTextKey?: string;
  };
}

// ============================================================================
// COMPLETE FORM INTERFACE
// ============================================================================

export interface FormSchema {
  id: string;
  name: string;
  version: string;
  description?: string;

  // Structure
  pages: FormPage[];

  // Behavior
  behavior?: {
    multiStep?: boolean;
    allowSaveProgress?: boolean;
    allowDraft?: boolean;
    requireCompletion?: boolean;
    showProgressBar?: boolean;
    autoSave?: boolean;
    autoSaveInterval?: number; // seconds
  };

  // Validation
  validation?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    validateOnSubmit?: boolean;
    stopOnFirstError?: boolean;
    customValidation?: string; // Function name or expression
  };

  // Styling
  styling?: {
    theme?: 'default' | 'tesla' | 'minimal' | 'corporate' | 'custom';
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    className?: string;
  };

  // Animation
  animation?: {
    globalAnimation?: 'enabled' | 'disabled' | 'reduced';
    defaultDuration?: number;
    defaultEasing?: string;
  };

  // Localization
  localization?: {
    defaultLocale: string;
    supportedLocales: string[];
    fallbackLocale?: string;
  };

  // Metadata
  metadata?: {
    created: Date;
    updated: Date;
    author?: string;
    tags?: string[];
    category?: string;
  };

  // Custom properties
  customProps?: Record<string, any>;
}

// ============================================================================
// SCHEMA EXTENSION INTERFACES
// ============================================================================

export interface SchemaExtension {
  id: string;
  name: string;
  description?: string;
  targetSchema: string; // Schema ID to extend
  extensions: {
    fields?: Partial<FormField>[];
    sections?: Partial<FormSection>[];
    pages?: Partial<FormPage>[];
    validation?: any;
    styling?: any;
    animation?: any;
  };
  conditions?: {
    applyWhen?: string; // Condition expression
    priority?: number; // Higher priority extensions are applied first
  };
}

// ============================================================================
// SCHEMA COMPOSITION INTERFACES
// ============================================================================

export interface SchemaComposition {
  id: string;
  name: string;
  description?: string;
  baseSchemas: string[]; // Array of base schema IDs
  composition: {
    mergeStrategy: 'union' | 'intersection' | 'custom';
    fieldResolution: 'first' | 'last' | 'merge' | 'custom';
    conflictResolution: 'base' | 'extension' | 'custom';
  };
  customLogic?: string; // Custom composition function
}
