'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FormSchema, FormSection, FormField } from '@/lib/form-system/types';
import { formSchemaToZod, createDefaultValues } from '@/lib/form-system';

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (formData: any) => void;
  onPageChange: (pageIndex: number) => void;
  onSectionChange?: (sectionId: string | null) => void;
  onFieldFocus?: (fieldId: string | null) => void;
}

export default function FormRenderer({
  schema,
  onSubmit,
  onPageChange,
  onSectionChange,
  onFieldFocus,
}: FormRendererProps) {
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0);
  const [formData, setFormData] = React.useState<any>({});

  const currentPage = schema.pages[currentPageIndex];
  const totalPages = schema.pages.length;

  // Create form validation schema and default values
  const validationSchema = React.useMemo(() => {
    try {
      return formSchemaToZod(schema);
    } catch (error) {
      console.error('Failed to create validation schema:', error);
      return null;
    }
  }, [schema]);

  const defaultValues = React.useMemo(() => {
    try {
      return createDefaultValues(schema);
    } catch (error) {
      console.error('Failed to create default values:', error);
      return {};
    }
  }, [schema]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(validationSchema || {}),
    defaultValues,
    mode: 'onChange',
  });

  // Watch form data for real-time updates
  const watchedData = watch();
  React.useEffect(() => {
    setFormData(watchedData);
  }, [watchedData]);

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      onPageChange(nextIndex);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      onPageChange(prevIndex);
    }
  };

  const renderField = (field: FormField) => {
    const fieldName = field.name;
    const fieldError = errors[fieldName];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              {...register(field.id)}
              onFocus={() => onFieldFocus?.(field.id)}
              onBlur={() => onFieldFocus?.(null)}
            />
            {errors[field.id] && (
              <p className="text-sm text-red-600">{errors[field.id]?.message}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              {...register(fieldName)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              onValueChange={(value) => setValue(fieldName, value)}
              defaultValue={defaultValues[fieldName]}
            >
              <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={fieldName}
              {...register(fieldName)}
              className={fieldError ? 'border-red-500' : ''}
            />
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              {...register(fieldName)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="text-sm text-gray-500">
            Unsupported field type: {field.type}
          </div>
        );
    }
  };

  const renderSection = (section: FormSection) => {
    if (!section.enabled) return null;

    // Emit section change when this section is rendered
    React.useEffect(() => {
      onSectionChange?.(section.id);
    }, [section.id, onSectionChange]);

    return (
      <div key={section.id} className="space-y-4">
        {section.title && (
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-sm text-gray-600 mt-1">
                {section.description}
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {section.fields.map(renderField)}
        </div>
      </div>
    );
  };

  if (!currentPage) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No pages found in form schema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentPage.title}
        </h2>
        {currentPage.description && (
          <p className="text-gray-600 mt-2">{currentPage.description}</p>
        )}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {currentPage.sections.map(renderSection)}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentPageIndex < totalPages - 1 ? (
              <Button
                type="button"
                onClick={handleNextPage}
                disabled={!isValid}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={!isValid}>
                Submit
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Page Indicator */}
      <div className="text-center text-sm text-gray-500">
        Page {currentPageIndex + 1} of {totalPages}
      </div>
    </div>
  );
}
