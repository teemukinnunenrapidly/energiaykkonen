'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  calculatorFormSchema,
  type CalculatorFormData,
} from '@/lib/validation';
import {
  BasicInfoStep,
  PropertyDetailsStep,
  CurrentHeatingStep,
  ResultsStep,
} from './steps';

// Form steps configuration
const FORM_STEPS = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Enter your contact details',
    fields: ['name', 'email', 'phone'],
  },
  {
    id: 2,
    title: 'Property Details',
    description: 'Tell us about your property',
    fields: ['squareMeters', 'ceilingHeight', 'residents'],
  },
  {
    id: 3,
    title: 'Current Heating',
    description: 'Information about your current heating system',
    fields: ['currentHeatingType', 'currentHeatingCost'],
  },
  {
    id: 4,
    title: 'Results & Contact',
    description: 'Review your results and submit',
    fields: [],
  },
];

interface MultiStepFormProps {
  onComplete?: (results: unknown) => void;
}

export function MultiStepForm({ onComplete }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      squareMeters: 0,
      ceilingHeight: 0,
      residents: 0,
      currentHeatingType: 'electric',
      currentHeatingCost: 0,
    },
  });

  const {
    watch,
    handleSubmit,
    formState: { isValid },
  } = form;
  const formData = watch();

  // Calculate progress percentage
  const progress = (currentStep / FORM_STEPS.length) * 100;

  // Check if current step is valid
  const isCurrentStepValid = () => {
    if (currentStep === 4) {
      return true; // Results step is always valid
    }

    const currentStepFields = FORM_STEPS[currentStep - 1]?.fields || [];
    return currentStepFields.every(field => {
      const value = formData[field as keyof CalculatorFormData];
      return value !== undefined && value !== null && value !== '';
    });
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < FORM_STEPS.length && isCurrentStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission
  const onSubmit = async (data: CalculatorFormData) => {
    setIsSubmitting(true);
    try {
      // For now, just simulate success
      // Database and email functionality will be implemented in later subtasks
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call completion callback
      onComplete?.({
        formData: data,
        message: 'Form submitted successfully!',
      });
    } catch {
      // Handle error (show toast, etc.)
      // For now, we'll just handle it silently
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the appropriate step component
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep form={form} />;
      case 2:
        return <PropertyDetailsStep form={form} />;
      case 3:
        return <CurrentHeatingStep form={form} />;
      case 4:
        return <ResultsStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {FORM_STEPS.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {FORM_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                  index + 1 <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1 < currentStep ? '✓' : step.id}
              </div>
              <span className="text-xs text-center max-w-20">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {FORM_STEPS[currentStep - 1]?.title}
          </CardTitle>
          <p className="text-gray-500 text-center">
            {FORM_STEPS[currentStep - 1]?.description}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step content */}
            <div className="min-h-[300px]">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="min-w-[100px]"
              >
                Previous
              </Button>

              {currentStep < FORM_STEPS.length ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!isCurrentStepValid()}
                  className="min-w-[100px]"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
