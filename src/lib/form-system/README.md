# Unified Form System

A robust, extensible form schema management system built with TypeScript and Zod for runtime validation. This system provides the foundation for both the end-user calculator interface and the admin form builder.

## Features

- **Type-Safe**: Full TypeScript support with comprehensive interfaces
- **Runtime Validation**: Zod-based schema validation for all form components
- **Extensible**: Support for schema extensions and composition
- **Localization Ready**: Built-in support for multi-language forms
- **Animation Support**: Configurable animations and transitions
- **Styling System**: Flexible styling with theme support
- **Conditional Logic**: Field dependencies and conditional display
- **Serialization**: JSON serialization/deserialization with validation

## Architecture

The system is organized into three main layers:

1. **Types** (`types.ts`) - TypeScript interfaces and type definitions
2. **Schemas** (`schemas.ts`) - Zod schemas for runtime validation
3. **Utilities** (`utils.ts`) - Helper functions for schema manipulation

## Quick Start

### Basic Usage

```typescript
import { createMinimalFormSchema, validateFormSchema } from '@/lib/form-system';

// Create a minimal form schema
const form = createMinimalFormSchema({
  id: 'my-form',
  name: 'My Custom Form',
  version: '1.0.0'
});

// Validate the schema
const result = validateFormSchema(form);
if (result.success) {
  console.log('Form is valid:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}
```

### Creating a Custom Form

```typescript
import { FormSchema, FormPage, FormSection, FormField } from '@/lib/form-system';

const customForm: FormSchema = {
  id: 'energy-calculator',
  name: 'Energy Calculator',
  version: '1.0.0',
  description: 'Calculate your energy savings',
  
  pages: [
    {
      id: 'property-details',
      title: 'Property Details',
      order: 0,
      sections: [
        {
          id: 'basic-info',
          title: 'Basic Information',
          order: 0,
          fields: [
            {
              id: 'square-meters',
              name: 'squareMeters',
              type: 'number',
              label: 'Square Meters',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Square meters is required' },
                  { type: 'min', value: 10, message: 'Minimum 10 m²' }
                ]
              },
              styling: {
                width: 'half',
                variant: 'outline'
              },
              localization: {
                labelKey: 'property.squareMeters.label'
              }
            }
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
    defaultLocale: 'en',
    supportedLocales: ['en', 'fi']
  },
  
  metadata: {
    created: new Date(),
    updated: new Date(),
    author: 'Your Name'
  }
};
```

### Schema Validation

```typescript
import { validateFormSchema, validateFormField } from '@/lib/form-system';

// Validate entire form
const formValidation = validateFormSchema(customForm);
if (!formValidation.success) {
  console.error('Form validation failed:', formValidation.errors);
}

// Validate individual field
const fieldValidation = validateFormField({
  id: 'test-field',
  name: 'testField',
  type: 'text',
  label: 'Test Field',
  localization: { labelKey: 'test.label' }
});

if (!fieldValidation.success) {
  console.error('Field validation failed:', fieldValidation.errors);
}
```

### Schema Manipulation

```typescript
import { 
  findFieldById, 
  getAllFieldIds, 
  cloneFormSchema,
  mergeFormSchemas 
} from '@/lib/form-system';

// Find a specific field
const field = findFieldById(customForm, 'square-meters');
if (field) {
  console.log('Found field:', field.label);
}

// Get all field IDs
const fieldIds = getAllFieldIds(customForm);
console.log('All field IDs:', fieldIds);

// Clone a form schema
const clonedForm = cloneFormSchema(customForm);

// Merge schemas
const extendedForm = mergeFormSchemas(customForm, {
  description: 'Updated description',
  styling: {
    theme: 'minimal'
  }
});
```

### Serialization

```typescript
import { serializeFormSchema, deserializeFormSchema } from '@/lib/form-system';

// Save to localStorage
const serialized = serializeFormSchema(customForm);
localStorage.setItem('saved-form', serialized);

// Load from localStorage
const savedFormJson = localStorage.getItem('saved-form');
if (savedFormJson) {
  try {
    const loadedForm = deserializeFormSchema(savedFormJson);
    console.log('Loaded form:', loadedForm.name);
  } catch (error) {
    console.error('Failed to load form:', error);
  }
}
```

## Schema Extension System

The system supports extending existing schemas with new functionality:

```typescript
import { SchemaExtension } from '@/lib/form-system';

const fieldExtension: SchemaExtension = {
  id: 'field-extension',
  name: 'Additional Fields',
  description: 'Adds extra fields to the form',
  targetSchema: 'energy-calculator',
  extensions: {
    fields: [
      {
        id: 'additional-field',
        name: 'additionalField',
        type: 'text',
        label: 'Additional Field',
        localization: { labelKey: 'additional.field.label' }
      }
    ]
  },
  conditions: {
    applyWhen: 'user.hasPremium',
    priority: 1
  }
};
```

## Schema Composition

Combine multiple base schemas into a new composite schema:

```typescript
import { SchemaComposition } from '@/lib/form-system';

const compositeSchema: SchemaComposition = {
  id: 'composite-form',
  name: 'Composite Form',
  description: 'Combines multiple form schemas',
  baseSchemas: ['energy-calculator', 'user-profile'],
  composition: {
    mergeStrategy: 'union',
    fieldResolution: 'merge',
    conflictResolution: 'extension'
  }
};
```

## Field Types

The system supports various field types:

- **Basic**: `text`, `email`, `number`, `textarea`
- **Selection**: `select`, `radio`, `checkbox`
- **Specialized**: `date`, `phone`, `currency`, `percentage`
- **Custom**: `file`, `custom`

## Styling System

Each field, section, and page can have custom styling:

```typescript
const styledField: FormField = {
  // ... other properties
  styling: {
    width: 'half',        // 'full' | 'half' | 'third' | 'quarter'
    variant: 'outline',   // 'default' | 'outline' | 'ghost' | 'destructive'
    size: 'md',           // 'sm' | 'md' | 'lg'
    className: 'custom-field',
    customCSS: {
      'border-radius': '8px',
      'box-shadow': '0 2px 4px rgba(0,0,0,0.1)'
    }
  }
};
```

## Animation System

Configure animations for fields, sections, and pages:

```typescript
const animatedField: FormField = {
  // ... other properties
  animation: {
    enterAnimation: 'fade',      // 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none'
    exitAnimation: 'slide-up',
    duration: 300,               // milliseconds
    delay: 100,                  // milliseconds
    easing: 'ease-out'          // 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  }
};
```

## Localization System

Built-in support for multi-language forms:

```typescript
const localizedField: FormField = {
  // ... other properties
  localization: {
    labelKey: 'field.label',
    placeholderKey: 'field.placeholder',
    helpTextKey: 'field.helpText',
    errorMessageKey: 'field.error',
    locale: 'en'
  }
};
```

## Conditional Logic

Fields can be conditionally displayed or enabled:

```typescript
const conditionalField: FormField = {
  // ... other properties
  conditional: {
    showWhen: 'otherField.value === "yes"',
    hideWhen: 'otherField.value === "no"',
    enableWhen: 'otherField.valid',
    disableWhen: 'otherField.invalid'
  }
};
```

## Validation Rules

Comprehensive validation system with custom rules:

```typescript
const validatedField: FormField = {
  // ... other properties
  validation: {
    rules: [
      { type: 'required', message: 'This field is required' },
      { type: 'min', value: 3, message: 'Minimum 3 characters' },
      { type: 'max', value: 100, message: 'Maximum 100 characters' },
      { type: 'pattern', value: /^[a-zA-Z]+$/, message: 'Letters only' },
      { type: 'email', message: 'Invalid email format' }
    ],
    customValidator: 'validateCustomField'
  }
};
```

## Best Practices

1. **Always validate schemas** before using them
2. **Use localization keys** instead of hardcoded text
3. **Keep field IDs unique** across the entire form
4. **Test conditional logic** thoroughly
5. **Use semantic field names** for better maintainability
6. **Document custom validators** and transformations
7. **Version your schemas** for backward compatibility

## Error Handling

The system provides comprehensive error handling:

```typescript
try {
  const result = validateFormSchema(invalidSchema);
  if (!result.success) {
    // Handle validation errors
    result.errors.errors.forEach(error => {
      console.error(`Path: ${error.path.join('.')}, Message: ${error.message}`);
    });
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

## Performance Considerations

- **Lazy load** large form schemas
- **Cache validation results** for frequently accessed schemas
- **Use partial validation** for large forms
- **Implement virtual scrolling** for forms with many fields

## Testing

The system includes comprehensive test coverage:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- form-system.test.ts
```

## Contributing

When extending the system:

1. **Update types** in `types.ts`
2. **Add schemas** in `schemas.ts`
3. **Implement utilities** in `utils.ts`
4. **Write tests** in `test.ts`
5. **Update documentation** in `README.md`

## License

This system is part of the E1 Calculator project and follows the same licensing terms.
