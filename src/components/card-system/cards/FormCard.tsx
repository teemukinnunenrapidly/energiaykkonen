import React, { useEffect, useState } from 'react';
import { useCardContext } from '../CardContext';
import { supabase, type CardTemplate, type CardField } from '@/lib/supabase';

interface FormCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
}

export function FormCard({ card, onFieldFocus }: FormCardProps) {
  const [fields, setFields] = useState<CardField[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { formData, updateField, completeCard, submitData } = useCardContext();

  useEffect(() => {
    loadFields();
  }, [card.id]);

  // Database-driven completion - no longer need to check on every formData change
  // Completion is now handled in CardContext.updateField()

  const loadFields = async () => {
    const { data } = await supabase
      .from('card_fields')
      .select('*')
      .eq('card_id', card.id)
      .order('display_order');

    setFields(data || []);

    // Initialize formData with any existing values from the database
    // This ensures that pre-filled values are properly stored in formData
    if (data && data.length > 0) {
      const initialFormData: Record<string, any> = {};

      data.forEach(field => {
        // Check if there's a default value or if the field already has a value
        if (field.default_value) {
          initialFormData[field.field_name] = field.default_value;
        } else if (
          field.field_type === 'radio' &&
          field.options &&
          field.options.length > 0
        ) {
          // For radio buttons, set the first option as default if no default is specified
          initialFormData[field.field_name] = field.options[0].value;
        }
      });

      // Update formData with initial values
      if (Object.keys(initialFormData).length > 0) {
        Object.entries(initialFormData).forEach(([fieldName, value]) => {
          updateField(fieldName, value);
        });
      }
    }
  };

  const validateField = (field: CardField, value: any): boolean => {
    const rules = field.validation_rules;

    // Required field validation
    if (field.required && (!value || value.toString().trim() === '')) {
      return false;
    }

    // Skip further validation if no value and not required
    if (!value || value.toString().trim() === '') {
      return true;
    }

    // Email validation
    if (field.field_type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return false;
      }
    }

    // Number validation for numeric fields
    if (field.field_type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return false;
      }

      if (rules?.min !== undefined && numValue < rules.min) {
        return false;
      }
      if (rules?.max !== undefined && numValue > rules.max) {
        return false;
      }
    }

    // Text length validation
    if (
      rules?.minLength !== undefined &&
      value.toString().length < rules.minLength
    ) {
      return false;
    }
    if (
      rules?.maxLength !== undefined &&
      value.toString().length > rules.maxLength
    ) {
      return false;
    }

    // Pattern validation
    if (rules?.pattern && !new RegExp(rules.pattern).test(value)) {
      return false;
    }

    return true;
  };

  const getFieldError = (field: CardField, value: any): string | null => {
    const rules = field.validation_rules;

    // Required field error
    if (field.required && (!value || value.toString().trim() === '')) {
      return 'This field is required';
    }

    // Skip further validation if no value and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Email validation error
    if (field.field_type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Number validation errors
    if (field.field_type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return 'Please enter a valid number';
      }

      if (rules?.min !== undefined && numValue < rules.min) {
        return `Value must be at least ${rules.min}`;
      }
      if (rules?.max !== undefined && numValue > rules.max) {
        return `Value must be no more than ${rules.max}`;
      }
    }

    // Text length validation errors
    if (
      rules?.minLength !== undefined &&
      value.toString().length < rules.minLength
    ) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (
      rules?.maxLength !== undefined &&
      value.toString().length > rules.maxLength
    ) {
      return `Must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation error
    if (rules?.pattern && !new RegExp(rules.pattern).test(value)) {
      return 'Please enter a valid value';
    }

    return null;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    updateField(fieldName, value); // This now handles completion in database

    // Clear error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleFieldBlur = (field: CardField) => {
    const value = formData[field.field_name];
    const error = getFieldError(field, value);

    if (error) {
      setFieldErrors(prev => ({ ...prev, [field.field_name]: error }));
    } else {
      setFieldErrors(prev => ({ ...prev, [field.field_name]: '' }));
    }
    // No need to check completion here - handled in updateField
  };

  const handleFieldFocus = (field: CardField) => {
    if (onFieldFocus) {
      onFieldFocus(card.id, field.field_name, formData[field.field_name]);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    // Validate all required fields before submission
    const validationErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !formData[field.field_name]) {
        validationErrors[field.field_name] = 'This field is required';
      } else {
        const error = getFieldError(field, formData[field.field_name]);
        if (error) {
          validationErrors[field.field_name] = error;
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit the form data using the CardContext submit functionality
      if (submitData) {
        await submitData(card.config?.submit_email_template);
      }

      // Mark this card as complete when submit button is clicked
      completeCard(card.id);

      // Show success message
      setSubmitSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Submission failed:', error);
      // Could add error state here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  // checkCompletion function removed - now handled by database-driven system in CardContext

  const isFieldCompleted = (field: CardField, value: any): boolean => {
    // Only show completion indicators for fields where users type something
    const typingFields = ['text', 'email', 'number', 'textarea'];
    if (!typingFields.includes(field.field_type)) {
      return false;
    }

    // Field is completed if it has a valid value and passes validation
    if (
      !value ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return false;
    }
    return validateField(field, value);
  };

  const renderField = (field: CardField) => {
    const value = formData[field.field_name] || '';
    const error = fieldErrors[field.field_name];
    const isCompleted = isFieldCompleted(field, value);

    // Always allow editing - completion is just for navigation tracking
    const isFieldEditable = true;

    const inputClasses = `
      w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors
      ${
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : isCompleted
            ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
      }
      ${!isFieldEditable ? 'bg-gray-100 cursor-not-allowed' : ''}
    `;

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div>
            <input
              type={field.field_type}
              value={value}
              onChange={e =>
                handleFieldChange(field.field_name, e.target.value)
              }
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
              disabled={!isFieldEditable}
              className={inputClasses}
              min={
                field.field_type === 'number'
                  ? field.validation_rules?.min
                  : undefined
              }
              max={
                field.field_type === 'number'
                  ? field.validation_rules?.max
                  : undefined
              }
              minLength={field.validation_rules?.minLength}
              maxLength={field.validation_rules?.maxLength}
            />
            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>
        );
      case 'select':
        return (
          <div>
            <select
              value={value}
              onChange={e =>
                handleFieldChange(field.field_name, e.target.value)
              }
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              disabled={!isFieldEditable}
              className={inputClasses}
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>
        );
      case 'radio':
        return (
          <div>
            <div className="space-y-2">
              {field.options?.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={field.field_name}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={e =>
                      handleFieldChange(field.field_name, e.target.value)
                    }
                    onFocus={() => handleFieldFocus(field)}
                    onBlur={() => handleFieldBlur(field)}
                    disabled={!isFieldEditable}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>
        );
      case 'buttons':
        const selectOnlyOne = field.validation_rules?.selectOnlyOne || false;
        const selectedValues = selectOnlyOne
          ? value
            ? [value]
            : []
          : Array.isArray(value)
            ? value
            : value
              ? [value]
              : [];

        return (
          <div>
            <div className="space-y-2">
              {field.options?.map(opt => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (selectOnlyOne) {
                        // Single selection mode - set just this value
                        handleFieldChange(
                          field.field_name,
                          isSelected ? null : opt.value
                        );
                      } else {
                        // Multiple selection mode - toggle this value in array
                        if (isSelected) {
                          const newValues = selectedValues.filter(
                            v => v !== opt.value
                          );
                          handleFieldChange(
                            field.field_name,
                            newValues.length > 0 ? newValues : null
                          );
                        } else {
                          const newValues = [...selectedValues, opt.value];
                          handleFieldChange(field.field_name, newValues);
                        }
                      }
                    }}
                    onFocus={() => handleFieldFocus(field)}
                    onBlur={() => handleFieldBlur(field)}
                    disabled={!isFieldEditable}
                    className={`
                      w-full px-4 py-3 text-center border rounded-lg transition-all duration-200 font-medium
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[0.98]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }
                      ${!isFieldEditable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value === true || value === 'true'}
                onChange={e =>
                  handleFieldChange(field.field_name, e.target.checked)
                }
                onFocus={() => handleFieldFocus(field)}
                onBlur={() => handleFieldBlur(field)}
                disabled={!isFieldEditable}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{field.label}</span>
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div>
            <textarea
              value={value}
              onChange={e =>
                handleFieldChange(field.field_name, e.target.value)
              }
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
              disabled={!isFieldEditable}
              rows={4}
              className={inputClasses}
              minLength={field.validation_rules?.minLength}
              maxLength={field.validation_rules?.maxLength}
            />
            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{card.title}</h2>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {fields.map(field => (
          <div
            key={field.id}
            className={`
              ${field.width === 'full' ? 'col-span-12' : ''}
              ${field.width === 'half' ? 'col-span-6' : ''}
              ${field.width === 'third' ? 'col-span-4' : ''}
            `}
          >
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              {field.icon && (
                <span className="material-icons text-gray-600 text-lg">
                  {field.icon}
                </span>
              )}
              <span>{field.label}</span>
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {isFieldCompleted(field, formData[field.field_name]) && (
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Submit Button Section */}
      {card.config?.has_submit_button && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          {submitSuccess ? (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <svg
                className="w-8 h-8 text-green-600 mx-auto mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-800 font-medium">
                {card.config?.submit_success_message ||
                  'Thank you! Your submission has been received.'}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`
                  inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg
                  ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }
                  transition-colors duration-200
                `}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  card.config?.submit_button_text || 'Submit'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
