'use client';

import { useState, useEffect } from 'react';
import { FormRenderer } from '@/components/form-system/FormRenderer';
import { VisualSupport } from '@/components/form-system/VisualSupport';
import { FormSchema } from '@/lib/form-system/types';

export default function CalculatorPage() {
  const [activeSection, setActiveSection] = useState<string | null>('property');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFormSchema = async () => {
      try {
        const response = await fetch('/api/admin/preview-form-schema');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.schema) {
            setFormSchema(data.schema);
          }
        }
      } catch (error) {
        console.error('Failed to load form schema:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFormSchema();
  }, []);

  const handleSubmit = (formData: any) => {
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  const handlePageChange = (pageIndex: number) => {
    console.log('Page changed to:', pageIndex);
    // Handle page navigation
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calculator...</p>
        </div>
      </div>
    );
  }

  if (!formSchema) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load calculator form</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="w-2/5 border-r">
        <VisualSupport
          activeSection={activeSection}
          activeField={activeField}
          className="h-full"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <FormRenderer
          schema={formSchema}
          onSubmit={handleSubmit}
          onPageChange={handlePageChange}
          onSectionChange={setActiveSection}
          onFieldFocus={setActiveField}
        />
      </div>
    </div>
  );
}
