'use client';

import React from 'react';
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FormSchema,
  FormPage,
  FormSection,
  FormField,
} from '@/lib/form-system/types';
import { formSchemaToZod, createDefaultValues } from '@/lib/form-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FormRendererProps {
  schema: FormSchema;
  onSubmit?: (data: any) => void | Promise<void>;
  onPageChange?: (pageIndex: number) => void;
  onSectionComplete?: (sectionId: string, data: any) => void;
  className?: string;
  showProgress?: boolean;
  showNavigation?: boolean;
  submitButtonText?: string;
  loadingButtonText?: string;
}

interface FormRendererState {
  currentPageIndex: number;
  completedSections: Set<string>;
  formData: any;
  isSubmitting: boolean;
}

export function FormRenderer({
  schema,
  onSubmit,
  onPageChange,
  onSectionComplete,
  className = '',
  showProgress = true,
  showNavigation = true,
  submitButtonText = 'Submit',
  loadingButtonText = 'Submitting...',
}: FormRendererProps) {
  const [state, setState] = React.useState<FormRendererState>({
    currentPageIndex: 0,
    completedSections: new Set(),
    formData: {},
    isSubmitting: false,
  });

  // Create Zod schema and form instance
  const zodSchema = React.useMemo(() => formSchemaToZod(schema), [schema]);
  const defaultValues = React.useMemo(
    () => createDefaultValues(schema),
    [schema]
  );

  const form = useForm({
    resolver: zodResolver(zodSchema as any),
    defaultValues,
    mode: 'onChange',
  });

  const currentPage = schema.pages[state.currentPageIndex];
  const totalPages = schema.pages.length;
  const progressPercentage = ((state.currentPageIndex + 1) / totalPages) * 100;

  // Handle form submission
  const handleSubmit = async (data: any) => {
    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      if (onSubmit) {
        await onSubmit(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Handle page navigation
  const goToNextPage = () => {
    if (state.currentPageIndex < schema.pages.length - 1) {
      const nextIndex = state.currentPageIndex + 1;
      setState(prev => ({ ...prev, currentPageIndex: nextIndex }));
      if (onPageChange) {
        onPageChange(nextIndex);
      }
    }
  };

  const goToPreviousPage = () => {
    if (state.currentPageIndex > 0) {
      const prevIndex = state.currentPageIndex - 1;
      setState(prev => ({ ...prev, currentPageIndex: prevIndex }));
      if (onPageChange) {
        onPageChange(prevIndex);
      }
    }
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < schema.pages.length) {
      setState(prev => ({ ...prev, currentPageIndex: pageIndex }));
      if (onPageChange) {
        onPageChange(pageIndex);
      }
    }
  };

  // Handle section completion
  const handleSectionComplete = (sectionId: string, data: any) => {
    setState(prev => ({
      ...prev,
      completedSections: new Set([...prev.completedSections, sectionId]),
      formData: { ...prev.formData, ...data },
    }));

    if (onSectionComplete) {
      onSectionComplete(sectionId, data);
    }
  };

  // Check if section is accessible (all previous sections completed)
  const isSectionAccessible = (section: FormSection) => {
    if (section.order === 0) return true;
    
    const previousSections = currentPage.sections.filter(s => s.order < section.order);
    return previousSections.every(s => state.completedSections.has(s.id));
  };

  // Get section status
  const getSectionStatus = (section: FormSection) => {
    if (!isSectionAccessible(section)) return 'locked';
    if (state.completedSections.has(section.id)) return 'completed';
    return 'pending';
  };

  // Render individual form field
  const renderField = (field: FormField) => {
    const fieldValue = form.watch(field.name);
    const fieldError = form.formState.errors[field.name];
    const isRequired = field.required;

    const baseFieldProps = {
      id: field.id,
      className: `transition-all duration-200 ${
        field.styling?.className || ''
      }`,
      disabled:
        field.disabled ||
        getSectionStatus(
          currentPage.sections.find(s => s.fields.includes(field))!
        ) === 'locked',
    };

    const baseInputProps = {
      ...baseFieldProps,
      placeholder: field.placeholder,
      ...form.register(field.name),
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="mb-6">
            <Label 
              htmlFor={field.id} 
              className="block text-sm font-medium text-gray-700 mb-2 transition-colors duration-200"
            >
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                type={field.type}
                {...baseInputProps}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 focus:scale-[1.02] h-[44px] placeholder-gray-400 ${
                  fieldError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
            {fieldError && typeof fieldError.message === 'string' && (
              <p className="text-xs text-red-500 mt-1">{fieldError.message}</p>
            )}
          </div>
        );

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <div key={field.id} className="mb-6">
            <Label 
              htmlFor={field.id} 
              className="block text-sm font-medium text-gray-700 mb-2 transition-colors duration-200"
            >
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                type="number"
                {...baseInputProps}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 focus:scale-[1.02] h-[44px] placeholder-gray-400 ${
                  fieldError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
            {fieldError && typeof fieldError.message === 'string' && (
              <p className="text-xs text-red-500 mt-1">{fieldError.message}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="mb-6">
            <Label 
              htmlFor={field.id} 
              className="block text-sm font-medium text-gray-700 mb-2 transition-colors duration-200"
            >
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Textarea
                {...baseInputProps}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 focus:scale-[1.02] placeholder-gray-400 ${
                  fieldError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
            {fieldError && typeof fieldError.message === 'string' && (
              <p className="text-xs text-red-500 mt-1">{fieldError.message}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="mb-6">
            <Label 
              htmlFor={field.id} 
              className="block text-sm font-medium text-gray-700 mb-2 transition-colors duration-200"
            >
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Select
                value={fieldValue}
                onValueChange={value => form.setValue(field.name, value)}
              >
                <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 focus:scale-[1.02] h-[44px]">
                  <SelectValue
                    placeholder={field.placeholder || 'Select an option'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
            {fieldError && typeof fieldError.message === 'string' && (
              <p className="text-xs text-red-500 mt-1">{fieldError.message}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="mb-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id={field.id}
                checked={fieldValue}
                onCheckedChange={checked => form.setValue(field.name, checked)}
                disabled={baseFieldProps.disabled}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor={field.id} className="flex items-center gap-2">
                  {field.label}
                  {isRequired && <span className="text-red-500">*</span>}
                </Label>
                {field.helpText && (
                  <p className="text-sm text-gray-600">{field.helpText}</p>
                )}
              </div>
            </div>
            {fieldError && typeof fieldError.message === 'string' && (
              <p className="text-sm text-red-600">{fieldError.message}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-6">
            <Label className="flex items-center gap-2">
              {field.label}
              {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${field.id}-${option.value}`}
                    name={field.name}
                    value={option.value}
                    checked={fieldValue === option.value}
                    onChange={e => form.setValue(field.name, e.target.value)}
                    disabled={baseFieldProps.disabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <Label
                    htmlFor={`${field.id}-${option.value}`}
                    className="text-sm"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {field.helpText && (
              <p className="text-sm text-gray-600">{field.helpText}</p>
            )}
            {fieldError && typeof fieldError.message === 'string' && (
              <p className="text-sm text-red-600">{fieldError.message}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="mb-6">
            <Label 
              htmlFor={field.id} 
              className="block text-sm font-medium text-gray-700 mb-2 transition-colors duration-200"
            >
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                type="text"
                {...baseInputProps}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 focus:scale-[1.02] h-[44px] placeholder-gray-400 ${
                  fieldError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
            {fieldError && typeof fieldError.message === 'string' && (
              <p className="text-xs text-red-500 mt-1">{fieldError.message}</p>
            )}
          </div>
        );
    }
  };

  // Render form section
  const renderSection = (section: FormSection) => {
    const status = getSectionStatus(section);
    const isAccessible = status !== 'locked';
    const isCompleted = status === 'completed';

    return (
      <div
        key={section.id}
        className={`group transition-all duration-300 ${
          !isAccessible
            ? 'opacity-50 pointer-events-none'
            : ''
        }`}
      >
        <div className="pb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {isCompleted ? '✓' : section.order + 1}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h3>
            </div>
            {isCompleted && (
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-600 border-green-200"
              >
                ✓ Valmis
              </Badge>
            )}
          </div>

          {section.description && (
            <p className="text-sm text-gray-600 mb-6 leading-relaxed pl-11">
              {section.description}
            </p>
          )}

          <div className="pl-11 space-y-6 w-full">
            <div
              className={`grid gap-6 w-full ${
                section.styling?.columns === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : section.styling?.columns === 3
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
              }`}
            >
              {section.fields.map(renderField)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentPage) {
    return <div>Page not found</div>;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Enhanced Header with Progress */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 sm:px-8 py-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {schema.name}
        </h2>

        {schema.description && (
          <p className="text-sm text-gray-600 text-center px-2 sm:px-0 mt-2 leading-relaxed">
            {schema.description}
          </p>
        )}

        {/* Page Progress Indicator */}
        {showProgress && totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-4">
              {schema.pages.map((page, index) => (
                <div
                  key={page.id}
                  className="flex flex-col items-center group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 transform group-hover:scale-110 cursor-pointer ${
                      index === state.currentPageIndex
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-200'
                        : index < state.currentPageIndex
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200'
                          : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                    }`}
                    onClick={() => goToPage(index)}
                  >
                    {index < state.currentPageIndex ? (
                      <span className="text-lg">✓</span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-xs text-center mt-2 max-w-[70px] leading-tight font-medium transition-all duration-300 ${
                      index === state.currentPageIndex
                        ? 'text-blue-600'
                        : index < state.currentPageIndex
                          ? 'text-green-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {page.title}
                  </span>
                  {/* Connection line between pages */}
                  {index < schema.pages.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mt-2 transition-all duration-500 ${
                        index < state.currentPageIndex
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Page {state.currentPageIndex + 1} of {totalPages}
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2 transition-all duration-500"
            />
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="p-6 sm:p-8 h-full overflow-y-auto">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8 w-full"
        >
          {/* Page Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentPage.title}
            </h2>
            {currentPage.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {currentPage.description}
              </p>
            )}
          </div>

          {/* Render Sections */}
          <div className="space-y-8 w-full">
            {currentPage.sections.map(renderSection)}
          </div>

          {/* Navigation and Submit */}
          {showNavigation && (
            <div className="pt-8 border-t border-gray-200/50">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={state.currentPageIndex === 0}
                  className="border-2 border-gray-300 hover:border-gray-400 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edellinen
                </Button>

                {state.currentPageIndex < totalPages - 1 ? (
                  <Button
                    type="button"
                    onClick={goToNextPage}
                    disabled={!form.formState.isValid}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Seuraava
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={state.isSubmitting || !form.formState.isValid}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Lähetetään...</span>
                      </div>
                    ) : (
                      'Lähetä'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
