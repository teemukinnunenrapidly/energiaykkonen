/**
 * Form Components with CardStream Design System
 * Implements borderless inputs with bottom borders only, uppercase labels
 * All styles reference design tokens
 */

import React from 'react';

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return (
    <div className={`cs-form-group ${className}`}>
      {children}
    </div>
  );
}

interface FieldRowProps {
  children: React.ReactNode;
  className?: string;
}

export function FieldRow({ children, className = '' }: FieldRowProps) {
  return (
    <div className={`cs-field-row ${className}`}>
      {children}
    </div>
  );
}

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function Label({ children, htmlFor, className = '' }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`cs-label ${className}`}>
      {children}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  className?: string;
}

export function Input({ error = false, className = '', ...props }: InputProps) {
  const errorClass = error ? 'cs-input--error' : '';
  
  return (
    <input 
      className={`cs-input ${errorClass} ${className}`}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Select({ error = false, className = '', children, ...props }: SelectProps) {
  const errorClass = error ? 'cs-input--error' : '';
  
  return (
    <select 
      className={`cs-input cs-select ${errorClass} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  className?: string;
}

export function Textarea({ error = false, className = '', ...props }: TextareaProps) {
  const errorClass = error ? 'cs-input--error' : '';
  
  return (
    <textarea 
      className={`cs-input ${errorClass} ${className}`}
      {...props}
    />
  );
}

// Complete form field component with label and input
interface FieldProps {
  label: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'password' | 'select' | 'textarea';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  id?: string;
}

export function Field({ 
  label, 
  type = 'text', 
  placeholder, 
  value = '', 
  onChange, 
  error = false, 
  disabled = false, 
  required = false, 
  options = [],
  id 
}: FieldProps) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <FormGroup>
      <Label htmlFor={fieldId}>
        {label} {required && '*'}
      </Label>
      
      {type === 'select' ? (
        <Select 
          id={fieldId}
          value={value}
          onChange={handleChange}
          error={error}
          disabled={disabled}
          required={required}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : type === 'textarea' ? (
        <Textarea
          id={fieldId}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          error={error}
          disabled={disabled}
          required={required}
        />
      ) : (
        <Input
          id={fieldId}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          error={error}
          disabled={disabled}
          required={required}
        />
      )}
    </FormGroup>
  );
}