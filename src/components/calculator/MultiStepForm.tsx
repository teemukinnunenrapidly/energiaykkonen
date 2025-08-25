'use client';

import { useState, useEffect } from 'react';
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
import {
  trackFormStart,
  trackStepCompleted,
  trackStepError,
  trackFormSubmitted,
  trackFormAbandoned,
  trackCalculationCompleted,
  type FormStep,
} from '@/lib/analytics';

// Form steps configuration with analytics mapping
const FORM_STEPS = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Enter your contact details',
    fields: ['firstName', 'lastName', 'email', 'phone', 'contactPreference'],
    analyticsStep: 'basic-info' as FormStep,
  },
  {
    id: 2,
    title: 'Property Details',
    description: 'Tell us about your property',
    fields: ['squareMeters', 'ceilingHeight', 'constructionYear', 'floors'],
    analyticsStep: 'property-details' as FormStep,
  },
  {
    id: 3,
    title: 'Current Heating',
    description: 'Information about your current heating system',
    fields: ['heatingType', 'annualHeatingCost', 'residents', 'hotWaterUsage'],
    analyticsStep: 'current-heating' as FormStep,
  },
  {
    id: 4,
    title: 'Results & Contact',
    description: 'Review your results and submit',
    fields: [],
    analyticsStep: 'results' as FormStep,
  },
];

interface MultiStepFormProps {
  onComplete?: (results: unknown) => void;
}

export function MultiStepForm({ onComplete }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [formStarted, setFormStarted] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(calculatorFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      streetAddress: '',
      city: '',
      contactPreference: 'email',
      message: '',
      squareMeters: 0,
      ceilingHeight: '3.0',
      constructionYear: '1991-2010',
      floors: '2',
      heatingType: 'electric',
      annualHeatingCost: 0,
      residents: '4',
      hotWaterUsage: 'normal',
      gdprConsent: false,
      marketingConsent: false,
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

  // Get current step analytics info
  const getCurrentStepAnalytics = () => {
    return FORM_STEPS[currentStep - 1]?.analyticsStep || 'basic-info';
  };

  // Analytics tracking effects
  useEffect(() => {
    if (!formStarted) {
      trackFormStart(getCurrentStepAnalytics());
      setFormStarted(true);
    }
  }, [formStarted, getCurrentStepAnalytics]);

  useEffect(() => {
    setStepStartTime(Date.now());
  }, [currentStep]);

  // Track page unload/abandon
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - stepStartTime;
      if (timeSpent > 30000 && currentStep < FORM_STEPS.length) {
        // Only track if spent more than 30 seconds
        trackFormAbandoned(getCurrentStepAnalytics(), timeSpent);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, stepStartTime, getCurrentStepAnalytics]);

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

  // Navigation functions with analytics
  const goToNextStep = () => {
    if (currentStep < FORM_STEPS.length && isCurrentStepValid()) {
      // Track step completion
      const timeSpent = Date.now() - stepStartTime;
      trackStepCompleted(getCurrentStepAnalytics(), {
        timeSpent,
        fieldsCompleted: FORM_STEPS[currentStep - 1]?.fields.length || 0,
      });

      setCurrentStep(currentStep + 1);
    } else if (!isCurrentStepValid()) {
      // Track step error
      trackStepError(getCurrentStepAnalytics(), 'Validation failed');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission with analytics
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Track form submission attempt
      trackFormSubmitted({
        device: undefined, // Will be auto-detected
        totalSteps: FORM_STEPS.length,
        completionTime: Date.now() - stepStartTime,
      });

      // Submit form data to API
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }

      const result = await response.json();

      // Track successful calculation completion
      if (result.calculations) {
        trackCalculationCompleted({
          leadId: result.leadId,
          annualSavings: result.calculations.annual_savings,
          paybackPeriod: result.calculations.payback_period,
          heatingType: data.heatingType,
          propertySize: data.squareMeters,
          deviceType: undefined, // Will be auto-detected
        });
      }

      // Call completion callback with API response
      onComplete?.({
        formData: data,
        calculations: result.calculations,
        leadId: result.leadId,
        message: 'Form submitted successfully!',
      });
    } catch (error) {
      // Track form submission error
      trackStepError(
        'results',
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Handle error (show toast, etc.)
      // console.error('Form submission error:', error);

      // For now, call onComplete with error info
      // In a real app, you'd show a toast or error message
      onComplete?.({
        formData: data,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        message: 'Failed to submit form',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the appropriate step component
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep form={form as any} />;
      case 2:
        return <PropertyDetailsStep form={form as any} />;
      case 3:
        return <CurrentHeatingStep form={form as any} />;
      case 4:
        return <ResultsStep form={form as any} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-2 space-y-2 sm:space-y-0">
          <span className="text-sm font-medium text-gray-700 text-center sm:text-left">
            Step {currentStep} of {FORM_STEPS.length}
          </span>
          <span className="text-sm text-gray-500 text-center sm:text-right">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step Indicators */}
        <div className="flex justify-between mt-4 px-2 sm:px-0">
          {FORM_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center flex-1 ${
                index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mb-1 ${
                  index + 1 <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1 < currentStep ? '✓' : step.id}
              </div>
              <span className="text-xs text-center max-w-[60px] sm:max-w-20 leading-tight">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="mx-2 sm:mx-0">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            {FORM_STEPS[currentStep - 1]?.title}
          </CardTitle>
          <p className="text-sm sm:text-base text-gray-500 text-center px-2 sm:px-0">
            {FORM_STEPS[currentStep - 1]?.description}
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            {/* Step content */}
            <div className="min-h-[250px] sm:min-h-[300px]">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 border-t space-y-3 sm:space-y-0">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto min-w-[100px] order-2 sm:order-1"
              >
                Previous
              </Button>

              {currentStep < FORM_STEPS.length ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!isCurrentStepValid()}
                  className="w-full sm:w-auto min-w-[100px] order-1 sm:order-2"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full sm:w-auto min-w-[100px] order-1 sm:order-2"
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
