'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculatorFormSchema } from '@/lib/validation';
import {
  BasicInfoStep,
  PropertyDetailsStep,
  CurrentHeatingStep,
  ResultsStep,
} from './steps';
import {
  trackFormStart,
  trackFormSubmitted,
  trackFormAbandoned,
  trackCalculationCompleted,
} from '@/lib/analytics';

// Form steps configuration
const FORM_STEPS = [
  {
    id: 1,
    title: 'Kiinteistön tiedot',
    description: 'Anna kiinteistösi perustiedot laskelmaa varten',
    fields: [
      'squareMeters',
      'ceilingHeight',
      'constructionYear',
      'floors',
      'residents',
    ],
  },
  {
    id: 2,
    title: 'Nykyinen lämmitys',
    description: 'Mitä lämmitystapaa käytät tällä hetkellä?',
    fields: ['heatingType', 'hotWaterUsage'],
  },
  {
    id: 3,
    title: 'Lämmityskustannukset',
    description: 'Paljonko maksat lämmityksestä vuosittain?',
    fields: ['annualHeatingCost'],
  },
  {
    id: 4,
    title: 'Säästölaskelma',
    description: 'Katso potentiaaliset säästösi lämpöpumpulla',
    fields: [],
  },
  {
    id: 5,
    title: 'Yhteystiedot',
    description: 'Anna yhteystiedot laskelmaan',
    fields: [
      'firstName',
      'lastName',
      'email',
      'phone',
      'streetAddress',
      'city',
      'gdprConsent',
      'marketingConsent',
    ],
  },
];

interface MultiStepFormProps {
  onComplete?: (results: unknown) => void;
  onStepChange?: (step: number) => void;
}

export function MultiStepForm({
  onComplete,
  onStepChange,
}: MultiStepFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set()
  );
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Check if a section is complete
  const isSectionComplete = (sectionIndex: number): boolean => {
    const sectionFields = FORM_STEPS[sectionIndex]?.fields || [];
    if (sectionIndex === 3) {
      return true; // Savings calculation section is always accessible
    }

    return sectionFields.every(field => {
      const value = formData[field as keyof any];
      if (field === 'gdprConsent') {
        return value === true; // GDPR consent must be explicitly checked
      }
      return (
        value !== undefined && value !== null && value !== '' && value !== 0
      );
    });
  };

  // Check if a section is accessible (previous sections completed)
  const isSectionAccessible = (sectionIndex: number): boolean => {
    if (sectionIndex === 0) {
      return true; // First section is always accessible
    }

    // Check if all previous sections are completed
    for (let i = 0; i < sectionIndex; i++) {
      if (!isSectionComplete(i)) {
        return false;
      }
    }
    return true;
  };

  // Update completed sections when form data changes
  useEffect(() => {
    const newCompletedSections = new Set<number>();
    FORM_STEPS.forEach((_, index) => {
      if (isSectionComplete(index)) {
        newCompletedSections.add(index);
      }
    });
    setCompletedSections(newCompletedSections);
  }, [formData]);

  // Notify parent component of step changes
  useEffect(() => {
    const activeSection = Array.from(completedSections).length + 1;
    onStepChange?.(Math.min(activeSection, FORM_STEPS.length));
  }, [completedSections, onStepChange]);

  // Intersection Observer for smooth scrolling and section highlighting
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const sectionIndex = parseInt(
            entry.target.getAttribute('data-section') || '0'
          );
          setActiveSection(sectionIndex);

          // Update parent component with current step
          onStepChange?.(sectionIndex + 1);
        }
      });
    }, observerOptions);

    // Observe all section refs
    sectionRefs.current.forEach(ref => {
      if (ref) {
        sectionObserver.observe(ref);
      }
    });

    return () => {
      sectionObserver.disconnect();
    };
  }, [onStepChange]);

  // Enhanced smooth scroll to section with better configuration
  const scrollToSection = useCallback(
    (
      sectionIndex: number,
      options?: {
        behavior?: ScrollBehavior;
        block?: ScrollLogicalPosition;
        inline?: ScrollLogicalPosition;
        smooth?: boolean;
      }
    ) => {
      const targetSection = sectionRefs.current[sectionIndex];
      if (targetSection) {
        // Enhanced scroll configuration
        const scrollOptions: ScrollIntoViewOptions = {
          behavior: options?.smooth !== false ? 'smooth' : 'auto',
          block: options?.block || 'start',
          inline: options?.inline || 'nearest',
        };

        // Add visual feedback during scroll
        targetSection.classList.add('scrolling-to');

        // Perform the scroll
        targetSection.scrollIntoView(scrollOptions);

        // Remove visual feedback after scroll completes
        setTimeout(() => {
          targetSection.classList.remove('scrolling-to');
        }, 1000);
      }
    },
    []
  );

  // Enhanced auto-scroll to next section when current section is completed
  useEffect(() => {
    if (completedSections.size > 0) {
      const lastCompletedSection = Math.max(...Array.from(completedSections));
      const nextSection = lastCompletedSection + 1;

      if (nextSection < FORM_STEPS.length && isSectionAccessible(nextSection)) {
        // Enhanced delay to allow form state to update and provide better UX
        const scrollDelay = 500; // Increased from 300ms for better user experience

        setTimeout(() => {
          scrollToSection(nextSection, {
            behavior: 'smooth',
            block: 'start',
            smooth: true,
          });
        }, scrollDelay);
      }
    }
  }, [completedSections, scrollToSection]);

  // Add keyboard navigation support for smooth scrolling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard navigation when form is focused
      if (!document.activeElement?.closest('form')) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
          event.preventDefault();
          const nextSection = Math.min(
            activeSection + 1,
            FORM_STEPS.length - 1
          );
          if (isSectionAccessible(nextSection)) {
            scrollToSection(nextSection, { smooth: true });
          }
          break;

        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault();
          const prevSection = Math.max(activeSection - 1, 0);
          scrollToSection(prevSection, { smooth: true });
          break;

        case 'Home':
          event.preventDefault();
          scrollToSection(0, { smooth: true });
          break;

        case 'End':
          event.preventDefault();
          scrollToSection(FORM_STEPS.length - 1, { smooth: true });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, scrollToSection]);

  // Add touch/swipe support for mobile smooth scrolling
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (event: Event) => {
      const touchEvent = event as TouchEvent;
      touchStartY = touchEvent.touches[0].clientY;
    };

    const handleTouchEnd = (event: Event) => {
      const touchEvent = event as TouchEvent;
      touchEndY = touchEvent.changedTouches[0].clientY;
      const touchDiff = touchStartY - touchEndY;
      const minSwipeDistance = 50; // Minimum distance for swipe detection

      if (Math.abs(touchDiff) > minSwipeDistance) {
        if (touchDiff > 0) {
          // Swipe up - go to next section
          const nextSection = Math.min(
            activeSection + 1,
            FORM_STEPS.length - 1
          );
          if (isSectionAccessible(nextSection)) {
            scrollToSection(nextSection, { smooth: true });
          }
        } else {
          // Swipe down - go to previous section
          const prevSection = Math.max(activeSection - 1, 0);
          scrollToSection(prevSection, { smooth: true });
        }
      }
    };

    // Add touch event listeners to the form container
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
      formContainer.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      formContainer.addEventListener('touchend', handleTouchEnd, {
        passive: true,
      });
    }

    return () => {
      if (formContainer) {
        formContainer.removeEventListener('touchstart', handleTouchStart);
        formContainer.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [activeSection, scrollToSection]);

  // Enhanced scroll behavior configuration
  useEffect(() => {
    // Configure smooth scrolling behavior for the entire page
    const style = document.createElement('style');
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      
      .form-container {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
      }
      
      .scrolling-to {
        animation: scroll-highlight 1s ease-out;
      }
      
      @keyframes scroll-highlight {
        0% { 
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.3);
          transform: scale(1.02);
        }
        100% { 
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          transform: scale(1);
        }
      }
      
      /* Enhanced scrollbar styling for better UX */
      .form-container::-webkit-scrollbar {
        width: 8px;
      }
      
      .form-container::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      
      .form-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
        transition: background 0.2s ease;
      }
      
      .form-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Analytics tracking effects
  useEffect(() => {
    if (!formStarted) {
      trackFormStart('basic-info');
      setFormStarted(true);
    }
  }, [formStarted]);

  // Track page unload/abandon
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackFormAbandoned('basic-info', 0);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Form submission with analytics
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Track form submission attempt
      trackFormSubmitted({
        device: undefined, // Will be auto-detected
        totalSteps: FORM_STEPS.length,
        completionTime: 0,
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

  // Get section status for visual indicators
  const getSectionStatus = (sectionIndex: number) => {
    if (completedSections.has(sectionIndex)) {
      return 'completed';
    } else if (isSectionAccessible(sectionIndex)) {
      return 'active';
    } else {
      return 'locked';
    }
  };

  return (
    <div className="w-full h-full">
      {/* Form Content */}
      <Card className="h-full border-0 shadow-none rounded-none">
        <CardHeader className="pb-4 sm:pb-6 border-b bg-gray-50">
          <CardTitle className="text-lg sm:text-xl font-bold text-center">
            Lämpöpumpun laskuri
          </CardTitle>
          <p className="text-sm text-gray-500 text-center px-2 sm:px-0">
            Täytä lomake alla laskeaksesi potentiaaliset säästösi
          </p>

          {/* Section Progress Indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-3">
              {FORM_STEPS.map((step, index) => {
                const status = getSectionStatus(index);
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'active'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 text-gray-500'
                      }`}
                    >
                      {status === 'completed' ? '✓' : index + 1}
                    </div>
                    <span className="text-xs text-center mt-1 max-w-[60px] leading-tight">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-6 h-full overflow-y-auto">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 h-full form-container"
          >
            {/* Section 1: Property Questions */}
            <div className="space-y-4">
              <div
                className={`border-b border-gray-200 pb-4 ${
                  getSectionStatus(0) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {FORM_STEPS[0].title}
                  </h3>
                  {getSectionStatus(0) === 'completed' && (
                    <span className="text-green-600 text-sm">✓ Valmis</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {FORM_STEPS[0].description}
                </p>
                <PropertyDetailsStep form={form as any} />
              </div>
            </div>

            {/* Section 2: Current Heating */}
            <div className="space-y-4">
              <div
                className={`border-b border-gray-200 pb-4 ${
                  getSectionStatus(1) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {FORM_STEPS[1].title}
                  </h3>
                  {getSectionStatus(1) === 'completed' && (
                    <span className="text-green-600 text-sm">✓ Valmis</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {FORM_STEPS[1].description}
                </p>
                <CurrentHeatingStep form={form as any} />
              </div>
            </div>

            {/* Section 3: Current Heating Costs */}
            <div className="space-y-4">
              <div
                className={`border-b border-gray-200 pb-4 ${
                  getSectionStatus(2) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {FORM_STEPS[2].title}
                  </h3>
                  {getSectionStatus(2) === 'completed' && (
                    <span className="text-green-600 text-sm">✓ Valmis</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {FORM_STEPS[2].description}
                </p>
                <BasicInfoStep form={form as any} />
              </div>
            </div>

            {/* Section 4: Check How Much You'd Save */}
            <div className="space-y-4">
              <div
                className={`border-b border-gray-200 pb-4 ${
                  getSectionStatus(3) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {FORM_STEPS[3].title}
                  </h3>
                  {getSectionStatus(3) === 'completed' && (
                    <span className="text-green-600 text-sm">✓ Valmis</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {FORM_STEPS[3].description}
                </p>
                <ResultsStep form={form as any} />
              </div>
            </div>

            {/* Section 5: Contact Information */}
            <div className="space-y-4">
              <div
                className={`pb-4 ${
                  getSectionStatus(4) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {FORM_STEPS[4].title}
                  </h3>
                  {getSectionStatus(4) === 'completed' && (
                    <span className="text-green-600 text-sm">✓ Valmis</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {FORM_STEPS[4].description}
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etunimi
                      </label>
                      <input
                        type="text"
                        {...form.register('firstName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Matti"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sukunimi
                      </label>
                      <input
                        type="text"
                        {...form.register('lastName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Meikäläinen"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sähköposti
                    </label>
                    <input
                      type="email"
                      {...form.register('email')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="matti@example.fi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puhelin
                    </label>
                    <input
                      type="tel"
                      {...form.register('phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="040 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Osoite
                    </label>
                    <input
                      type="text"
                      {...form.register('streetAddress')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Esimerkkikatu 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paikkakunta
                    </label>
                    <input
                      type="text"
                      {...form.register('city')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Helsinki"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...form.register('gdprConsent')}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Hyväksyn tietosuojaselosteen ja tietojeni käsittelyn
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...form.register('marketingConsent')}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Haluan vastaanottaa tarjouksia ja uutiskirjeitä
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={
                  !isValid || isSubmitting || completedSections.size < 4
                }
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Lähetetään...' : 'Lähetä laskelma'}
              </Button>
              {completedSections.size < 4 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Täytä kaikki osiot ennen lähettämistä
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
