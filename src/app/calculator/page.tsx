'use client';

import { useState, useEffect } from 'react';
import { FormRenderer } from '@/components/form-system/FormRenderer';
import { VisualSupport } from '@/components/form-system/VisualSupport';
import { FormSchema } from '@/lib/form-system/types';

export default function CalculatorPage() {
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState({
    sectionId: undefined as string | undefined,
    fieldId: undefined as string | undefined,
    fieldValue: undefined as any,
  });

  useEffect(() => {
    const loadFormSchema = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/preview-form-schema');
        if (!response.ok) {
          throw new Error('Failed to load form schema');
        }
        const data = await response.json();
        setFormSchema(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    loadFormSchema();
  }, []);

  const handleFormSubmit = (formData: any) => {
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  const handlePageChange = (pageIndex: number) => {
    console.log('Page changed to:', pageIndex);
    // Handle page change
  };

  const handleContextChange = (newContext: {
    sectionId?: string;
    fieldId?: string;
    fieldValue?: any;
  }) => {
    setContext(newContext);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calculator...</p>
        </div>
      </div>
    );
  }

  if (error || !formSchema) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Form schema not found'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Visual Support - 50% width with padding */}
      <div className="w-1/2 p-4">
        <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
          <VisualSupport
            sectionId={context.sectionId}
            fieldId={context.fieldId}
            fieldValue={context.fieldValue}
          />
        </div>
      </div>
      
      {/* Form Renderer - 50% width with padding */}
      <div className="w-1/2 p-4">
        <div className="h-full bg-white rounded-lg shadow-lg overflow-y-auto">
          <FormRenderer
            schema={formSchema}
            onSubmit={handleFormSubmit}
            onPageChange={handlePageChange}
            onSectionChange={(sectionId) => handleContextChange({ ...context, sectionId })}
            onFieldFocus={(fieldId) => handleContextChange({ ...context, fieldId })}
          />
        </div>
      </div>
    </div>
  );
}
