# Unified Form System - Usage Guide

## Overview

The Unified Form System is a comprehensive, type-safe form management solution built with TypeScript and Zod. It provides a robust foundation for creating complex forms with validation, styling, localization, and React Hook Form integration.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Schema Definition](#schema-definition)
4. [React Hook Form Integration](#react-hook-form-integration)
5. [Finnish Language Support](#finnish-language-support)
6. [Styling and Theming](#styling-and-theming)
7. [Validation](#validation)
8. [Advanced Features](#advanced-features)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

## Quick Start

### Installation

The form system is already included in the project. Import it directly:

```typescript
import { formSystem } from '@/lib/form-system';
```

### Basic Usage

```typescript
import { useFormSystem, createMinimalFormSchema } from '@/lib/form-system';

// Create a simple form schema
const formSchema = createMinimalFormSchema({
  id: 'my-form',
  name: 'My Form',
  version: '1.0.0'
});

// Use the form system hook
const {
  form,
  currentPage,
  goToNext,
  goToPrevious,
  submitForm,
  isSubmitting
} = useFormSystem(formSchema, zodSchema, defaultValues);
```

## Core Concepts

### Architecture

The system is organized into several layers:

1. **Types** (`types.ts`) - TypeScript interfaces and type definitions
2. **Schemas** (`schemas.ts`) - Zod schemas for runtime validation
3. **Utilities** (`utils.ts`) - Helper functions for schema manipulation
4. **Hooks** (`hooks.ts`) - React hooks for form management
5. **Adapters** (`adapters.ts`) - React Hook Form integration
6. **Language** (`finnish.ts`) - Finnish language support
7. **Containers** (`containers.tsx`) - UI components for layout

### Key Components

- **FormSchema**: Complete form definition with pages, sections, and fields
- **FormPage**: Individual pages in a multi-page form
- **FormSection**: Logical groupings of fields within a page
- **FormField**: Individual form inputs with validation and styling
- **ValidationRule**: Field validation rules with custom messages
- **StylingMetadata**: Visual appearance configuration
- **LocalizationMetadata**: Language and translation support

## Schema Definition

### Basic Schema Structure

```typescript
import { FormSchema } from '@/lib/form-system';

const myFormSchema: FormSchema = {
  id: 'unique-form-id',
  name: 'Form Display Name',
  version: '1.0.0',
  description: 'Form description',
  
  pages: [
    {
      id: 'page-1',
      title: 'Page Title',
      order: 0,
      sections: [
        {
          id: 'section-1',
          title: 'Section Title',
          order: 0,
          fields: [
            // Field definitions here
          ]
        }
      ]
    }
  ],
  
  styling: {
    theme: 'tesla',
    primaryColor: '#3B82F6'
  },
  
  localization: {
    defaultLanguage: 'fi',
    supportedLanguages: ['fi', 'en']
  }
};
```

### Field Definition

```typescript
const field: FormField = {
  id: 'unique-field-id',
  name: 'fieldName', // Used for form data and validation
  type: 'text', // Field type
  label: 'Field Label',
  required: true,
  
  // Validation rules
  validation: {
    rules: [
      { type: 'required', message: 'This field is required' },
      { type: 'min', value: 2, message: 'Minimum 2 characters' },
      { type: 'max', value: 50, message: 'Maximum 50 characters' }
    ]
  },
  
  // Styling options
  styling: {
    width: 'half', // 'full', 'half', 'third', 'quarter'
    variant: 'outline' // 'default', 'outline', 'filled', 'ghost'
  },
  
  // Localization
  localization: {
    labelKey: 'field.label',
    helpTextKey: 'field.help',
    errorMessageKey: 'field.error'
  },
  
  // Options for select/radio fields
  options: [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]
};
```

### Supported Field Types

- `text` - Single line text input
- `email` - Email input with validation
- `number` - Numeric input
- `select` - Dropdown selection
- `checkbox` - Boolean checkbox
- `radio` - Radio button group
- `textarea` - Multi-line text input
- `date` - Date picker
- `phone` - Phone number input
- `currency` - Currency input
- `percentage` - Percentage input
- `file` - File upload
- `custom` - Custom field type

## React Hook Form Integration

### Basic Integration

```typescript
import { useFormSystem, formSchemaToZod } from '@/lib/form-system';

// Convert form schema to Zod schema
const zodSchema = formSchemaToZod(formSchema);

// Use the integrated hook
const formSystem = useFormSystem(formSchema, zodSchema, defaultValues);

// Access form instance and other features
const { form, currentPage, goToNext, submitForm } = formSystem;
```

### Form Instance Usage

```typescript
// Register fields
<input {...form.register('fieldName')} />

// Handle form submission
const onSubmit = async (data: FormData) => {
  await submitForm(data);
};

// Access form state
const { errors, isSubmitting, isValid } = form.formState;

// Trigger validation
const isValid = await form.trigger();
```

### Navigation and Progress

```typescript
const {
  currentPageIndex,
  currentPage,
  canGoNext,
  canGoPrevious,
  goToNext,
  goToPrevious,
  goToPage,
  isLastPage,
  isFirstPage
} = formSystem;

// Navigate between pages
if (canGoNext) {
  goToNext();
}

// Jump to specific page
goToPage(2);
```

### Section Completion

```typescript
const {
  completedSections,
  activeSection,
  markSectionComplete,
  isSectionComplete,
  getCompletionProgress
} = formSystem;

// Mark section as complete
markSectionComplete('section-id');

// Check completion status
const isComplete = isSectionComplete('section-id');

// Get overall progress
const progress = getCompletionProgress(); // Returns 0-100
```

## Finnish Language Support

### Basic Usage

```typescript
import { finnishLanguage } from '@/lib/form-system';

// Get Finnish labels
const label = finnishLanguage.getLabel('squareMeters'); // "Neliömetrit"
const help = finnishLanguage.getHelpText('squareMeters'); // Help text
const error = finnishLanguage.getErrorMessage('required'); // "Tämä kenttä on pakollinen"
```

### Parameter Substitution

```typescript
// Error messages with dynamic parameters
const error = finnishLanguage.getErrorMessage('minValue', { min: 10 });
// Returns: "Vähintään 10 vaaditaan"
```

### Available Language Keys

- **Field Types**: `text`, `email`, `number`, `select`, etc.
- **Validation Rules**: `required`, `min`, `max`, `email`, etc.
- **Common Labels**: `firstName`, `lastName`, `email`, `phone`, etc.
- **Form Sections**: `basicInfo`, `propertyDetails`, `contactInfo`, etc.
- **Actions**: `next`, `previous`, `submit`, `save`, etc.
- **Status**: `completed`, `inProgress`, `pending`, etc.

## Styling and Theming

### Theme Configuration

```typescript
const formSchema: FormSchema = {
  // ... other properties
  
  styling: {
    theme: 'tesla', // Predefined theme
    primaryColor: '#3B82F6', // Custom primary color
    secondaryColor: '#6B7280', // Custom secondary color
    borderRadius: 'lg', // Border radius variant
    spacing: 'comfortable' // Spacing variant
  }
};
```

### Field Styling

```typescript
const field: FormField = {
  // ... other properties
  
  styling: {
    width: 'half', // Field width
    variant: 'outline', // Visual variant
    size: 'md', // Size variant
    color: 'primary' // Color variant
  }
};
```

### Responsive Design

The system automatically handles responsive design:

- **Mobile**: Single column layout
- **Tablet**: Two-column layout where appropriate
- **Desktop**: Multi-column layout

## Validation

### Built-in Validation Rules

- `required` - Field must have a value
- `min` - Minimum value/length
- `max` - Maximum value/length
- `email` - Valid email format
- `url` - Valid URL format
- `regex` - Custom regex pattern
- `custom` - Custom validation function

### Custom Validation

```typescript
const field: FormField = {
  // ... other properties
  
  validation: {
    rules: [
      {
        type: 'custom',
        value: (value: any) => value > 0,
        message: 'Value must be positive'
      }
    ]
  }
};
```

### Validation Messages

```typescript
const field: FormField = {
  // ... other properties
  
  validation: {
    rules: [
      {
        type: 'required',
        message: 'This field is required'
      },
      {
        type: 'min',
        value: 2,
        message: 'Minimum 2 characters required'
      }
    ]
  }
};
```

## Advanced Features

### Schema Extension

```typescript
import { extendFormSchema } from '@/lib/form-system';

const extendedSchema = extendFormSchema(baseSchema, {
  // Additional properties
  newField: { /* field definition */ }
});
```

### Schema Composition

```typescript
import { composeFormSchemas } from '@/lib/form-system';

const composedSchema = composeFormSchemas([
  schema1,
  schema2,
  schema3
]);
```

### Conditional Fields

```typescript
const field: FormField = {
  // ... other properties
  
  conditional: {
    dependsOn: 'otherField',
    condition: 'equals',
    value: 'specific-value',
    show: true // Show when condition is met
  }
};
```

### Field Dependencies

```typescript
const field: FormField = {
  // ... other properties
  
  dependencies: ['field1', 'field2'], // Fields this depends on
  
  validation: {
    rules: [
      {
        type: 'custom',
        value: (value: any, formData: any) => {
          // Access other field values
          return value > formData.field1;
        },
        message: 'Must be greater than field1'
      }
    ]
  }
};
```

## Best Practices

### 1. Schema Organization

- Use descriptive IDs for all schema elements
- Group related fields into logical sections
- Maintain consistent naming conventions
- Use semantic field types

### 2. Validation Strategy

- Start with basic validation rules
- Add custom validation only when necessary
- Provide clear, user-friendly error messages
- Validate on both client and server

### 3. Performance Optimization

- Use `useCallback` for event handlers
- Implement proper memoization for expensive operations
- Avoid unnecessary re-renders
- Use efficient validation strategies

### 4. Accessibility

- Provide proper labels for all fields
- Use semantic HTML elements
- Implement keyboard navigation
- Add ARIA attributes where needed

### 5. Error Handling

- Provide clear error messages
- Handle validation errors gracefully
- Implement proper error boundaries
- Log errors for debugging

## Examples

### Complete Form Example

See `demo.tsx` for a complete working example of the energy calculator form.

### Custom Field Component

```typescript
import { FormField } from '@/lib/form-system';

interface CustomFieldProps {
  field: FormField;
  form: any;
}

export function CustomField({ field, form }: CustomFieldProps) {
  const { register, formState: { errors } } = form;
  
  return (
    <div className="field-container">
      <label className="field-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>
      
      <input
        {...register(field.name)}
        type={field.type}
        className="field-input"
        placeholder={field.placeholder}
      />
      
      {errors[field.name] && (
        <span className="field-error">
          {errors[field.name].message}
        </span>
      )}
    </div>
  );
}
```

### Form Container Usage

```typescript
import { FormContainer, SectionContainer, FieldContainer } from '@/lib/form-system';

export function MyForm() {
  return (
    <FormContainer size="lg">
      <SectionContainer isActive={true}>
        <FieldContainer isRequired={true}>
          {/* Field content */}
        </FieldContainer>
      </SectionContainer>
    </FormContainer>
  );
}
```

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all required properties are provided in schema definitions
2. **Validation Issues**: Check that Zod schemas are properly generated from form schemas
3. **Performance Issues**: Use React.memo and useCallback for expensive operations
4. **Styling Issues**: Verify that Tailwind classes are properly configured

### Debug Mode

Enable debug mode to see detailed information:

```typescript
const formSystem = useFormSystem(formSchema, zodSchema, defaultValues, {
  debug: true
});
```

## Conclusion

The Unified Form System provides a robust, type-safe foundation for building complex forms. It integrates seamlessly with React Hook Form, provides comprehensive Finnish language support, and offers extensive customization options while maintaining excellent performance and accessibility.

For more examples and advanced usage patterns, refer to the demo components and test files in the form system directory.
