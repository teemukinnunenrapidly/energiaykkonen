import React, { useEffect, useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate, CardField } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface FormCardProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
}

export function FormCard({ card, onFieldFocus }: FormCardProps) {
  const [fields, setFields] = useState<CardField[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { formData, updateField, cardStates, completeCard } = useCardContext();
  
  // Remove isActive dependency - allow editing at any time
  // const isActive = cardStates[card.id]?.status === 'active';

  useEffect(() => {
    loadFields();
  }, [card.id]);

  const loadFields = async () => {
    const { data } = await supabase
      .from('card_fields')
      .select('*')
      .eq('card_id', card.id)
      .order('display_order');
    
    setFields(data || []);
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
      if (!emailRegex.test(value)) return false;
    }

    // Number validation for numeric fields
    if (field.field_type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return false;
      
      if (rules?.min !== undefined && numValue < rules.min) return false;
      if (rules?.max !== undefined && numValue > rules.max) return false;
    }

    // Text length validation
    if (rules?.minLength !== undefined && value.toString().length < rules.minLength) return false;
    if (rules?.maxLength !== undefined && value.toString().length > rules.maxLength) return false;

    // Pattern validation
    if (rules?.pattern && !new RegExp(rules.pattern).test(value)) return false;

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
    if (rules?.minLength !== undefined && value.toString().length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (rules?.maxLength !== undefined && value.toString().length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation error
    if (rules?.pattern && !new RegExp(rules.pattern).test(value)) {
      return 'Please enter a valid value';
    }

    return null;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    updateField(fieldName, value);
    
    // Clear error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
    
    // Validate and check completion
    setTimeout(() => checkCompletion(), 100);
  };

  const handleFieldBlur = (field: CardField) => {
    const value = formData[field.field_name];
    const error = getFieldError(field, value);
    
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field.field_name]: error }));
    } else {
      setFieldErrors(prev => ({ ...prev, [field.field_name]: '' }));
    }
  };

  const handleFieldFocus = (field: CardField) => {
    if (onFieldFocus) {
      onFieldFocus(card.id, field.field_name, formData[field.field_name]);
    }
  };

  const checkCompletion = () => {
    const allRequired = fields.filter(f => f.required);
    const allValid = allRequired.every(field => {
      const value = formData[field.field_name];
      return validateField(field, value);
    });
    
    if (allValid) {
      completeCard(card.id);
    }
  };

  const renderField = (field: CardField) => {
    const value = formData[field.field_name] || '';
    const error = fieldErrors[field.field_name];
    
    // Always allow editing - completion is just for navigation tracking
    const isFieldEditable = true;
    
    const inputClasses = `
      w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors
      ${error 
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
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
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
              disabled={!isFieldEditable}
              className={inputClasses}
              min={field.field_type === 'number' ? field.validation_rules?.min : undefined}
              max={field.field_type === 'number' ? field.validation_rules?.max : undefined}
              minLength={field.validation_rules?.minLength}
              maxLength={field.validation_rules?.maxLength}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            {field.help_text && !error && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
          </div>
        );
      case 'select':
        return (
          <div>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              onFocus={() => handleFieldFocus(field)}
              onBlur={() => handleFieldBlur(field)}
              disabled={!isFieldEditable}
              className={inputClasses}
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            {field.help_text && !error && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{card.title}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Step {card.display_order}
        </span>
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
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
}
