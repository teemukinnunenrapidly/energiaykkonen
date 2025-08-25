'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load step components for better performance
const PropertyDetailsStep = React.lazy(() =>
  import('./steps/PropertyDetailsStep').then(module => ({
    default: module.PropertyDetailsStep,
  }))
);
const CurrentHeatingStep = React.lazy(() =>
  import('./steps/CurrentHeatingStep').then(module => ({
    default: module.CurrentHeatingStep,
  }))
);
const BasicInfoStep = React.lazy(() =>
  import('./steps/BasicInfoStep').then(module => ({
    default: module.BasicInfoStep,
  }))
);
const ResultsStep = React.lazy(() =>
  import('./steps/ResultsStep').then(module => ({
    default: module.ResultsStep,
  }))
);

// Memoized form steps configuration
const FORM_STEPS = [
  {
    id: 'property-details',
    title: 'Kiinteistön tiedot',
    description: 'Anna kiinteistösi perustiedot laskelmaa varten',
    order: 0,
  },
  {
    id: 'current-heating',
    title: 'Nykyinen lämmitys',
    description: 'Mitä lämmitystapaa käytät tällä hetkellä?',
    order: 1,
  },
  {
    id: 'heating-costs',
    title: 'Lämmityskustannukset',
    description: 'Paljonko maksat lämmityksestä vuosittain?',
    order: 2,
  },
  {
    id: 'savings-calculation',
    title: 'Säästölaskelma',
    description: 'Katso potentiaaliset säästösi lämpöpumpulla',
    order: 3,
  },
  {
    id: 'contact-information',
    title: 'Yhteystiedot',
    description: 'Anna yhteystiedot laskelmaan',
    order: 4,
  },
] as const;

interface MultiStepFormProps {
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onSubmit?: (formData: any) => void;
  onComplete?: (results: any) => void;
  isPreviewMode?: boolean;
}

export function MultiStepForm({
  currentStep,
  onStepChange,
  onSubmit,
  onComplete,
  isPreviewMode = false,
}: MultiStepFormProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const [debouncedActiveSection, setDebouncedActiveSection] = useState(0);

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Memoize form configuration
  const formConfig = useMemo(
    () => ({
      mode: 'onChange' as const,
      defaultValues: {
        squareMeters: '',
        constructionYear: '',
        heatingType: '',
        annualHeatingCost: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        streetAddress: '',
        city: '',
        gdprConsent: false,
        marketingConsent: false,
      },
    }),
    []
  );

  const form = useForm(formConfig);

  // Debounce active section changes for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedActiveSection(activeSection);
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [activeSection]);

  // Memoize form validation state
  const isValid = useMemo(
    () => form.formState.isValid,
    [form.formState.isValid]
  );

  // Optimized intersection observer for section tracking
  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const sectionIndex = parseInt(
                entry.target.getAttribute('data-section') || '0'
              );
              setActiveSection(sectionIndex);
            }
          });
        },
        {
          threshold: 0.3,
          rootMargin: '-10% 0px -10% 0px',
        }
      );
    }

    // Observe all sections
    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.setAttribute('data-section', index.toString());
        observerRef.current?.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Memoized section completion check
  const isSectionComplete = useCallback(
    (sectionIndex: number) => {
      return completedSections.has(sectionIndex);
    },
    [completedSections]
  );

  // Memoized section accessibility check
  const isSectionAccessible = useCallback(
    (sectionIndex: number) => {
      if (sectionIndex === 0) {
        return true;
      }
      return Array.from(completedSections).some(
        completed => completed < sectionIndex
      );
    },
    [completedSections]
  );

  // Optimized section status calculation
  const getSectionStatus = useCallback(
    (sectionIndex: number) => {
      if (completedSections.has(sectionIndex)) {
        return 'completed';
      } else if (isSectionAccessible(sectionIndex)) {
        return 'active';
      } else {
        return 'locked';
      }
    },
    [completedSections, isSectionAccessible]
  );

  // Memoized scroll function
  const scrollToSection = useCallback((sectionIndex: number) => {
    const targetSection = sectionRefs.current[sectionIndex];
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Enhanced smooth scroll to section with better configuration
  const scrollToSectionEnhanced = useCallback(
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
          scrollToSectionEnhanced(nextSection, {
            behavior: 'smooth',
            block: 'start',
            smooth: true,
          });
        }, scrollDelay);
      }
    }
  }, [completedSections, scrollToSectionEnhanced, isSectionAccessible]);

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
            scrollToSectionEnhanced(nextSection, { smooth: true });
          }
          break;

        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault();
          const prevSection = Math.max(activeSection - 1, 0);
          scrollToSectionEnhanced(prevSection, { smooth: true });
          break;

        case 'Home':
          event.preventDefault();
          scrollToSectionEnhanced(0, { smooth: true });
          break;

        case 'End':
          event.preventDefault();
          scrollToSectionEnhanced(FORM_STEPS.length - 1, { smooth: true });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, scrollToSectionEnhanced, isSectionAccessible]);

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
            scrollToSectionEnhanced(nextSection, { smooth: true });
          }
        } else {
          // Swipe down - go to previous section
          const prevSection = Math.max(activeSection - 1, 0);
          scrollToSectionEnhanced(prevSection, { smooth: true });
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
  }, [activeSection, scrollToSectionEnhanced]);

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
      // trackFormStart('basic-info');
      setFormStarted(true);
    }
  }, [formStarted]);

  // Track page unload/abandon
  useEffect(() => {
    const handleBeforeUnload = () => {
      // trackFormAbandoned('basic-info', 0);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Memoized form submission handler
  const handleFormSubmit = useCallback(
    async (data: any) => {
      setIsSubmitting(true);
      try {
        // If in preview mode, call the preview onSubmit handler instead of submitting to API
        if (isPreviewMode && onSubmit) {
          onSubmit(data);
          setIsSubmitting(false);
          return;
        }

        // Track form submission attempt
        // trackFormSubmitted({
        //   device: undefined, // Will be auto-detected
        //   totalSteps: FORM_STEPS.length,
        //   completionTime: 0,
        // });

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
          // trackCalculationCompleted({
          //   leadId: result.leadId,
          //   annualSavings: result.calculations.annual_savings,
          //   paybackPeriod: result.calculations.payback_period,
          //   heatingType: data.heatingType,
          //   propertySize: data.squareMeters,
          //   deviceType: undefined, // Will be auto-detected
          // });
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
    },
    [onComplete, isPreviewMode, onSubmit]
  );

  // Memoized section completion handler
  const handleSectionComplete = useCallback((sectionIndex: number) => {
    setCompletedSections(prev => new Set([...prev, sectionIndex]));
  }, []);

  // Notify parent component of step changes
  useEffect(() => {
    onStepChange?.(debouncedActiveSection + 1);
  }, [debouncedActiveSection, onStepChange]);

  // Memoized loading skeleton
  const loadingSkeleton = useMemo(
    () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    ),
    []
  );

  return (
    <div className="w-full h-full">
      {/* Form Content */}
      <Card className="h-full border-0 shadow-none rounded-none bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-6 sm:pb-8 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Lämpöpumpun laskuri
          </CardTitle>
          <p className="text-sm text-gray-600 text-center px-2 sm:px-0 mt-2 leading-relaxed">
            Täytä lomake alla laskeaksesi potentiaaliset säästösi
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-6 h-full overflow-y-auto">
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-8 h-full form-container"
          >
            {/* Section 1: Property Questions */}
            <div className="space-y-6">
              <div
                ref={el => {
                  sectionRefs.current[0] = el;
                }}
                className={`group transition-all duration-300 ${
                  getSectionStatus(0) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-gray-50/50 rounded-xl p-4 -m-4'
                }`}
              >
                <div className="border-b border-gray-200/50 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {FORM_STEPS[0].title}
                      </h3>
                    </div>
                    {getSectionStatus(0) === 'completed' && (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                        ✓ Valmis
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {FORM_STEPS[0].description}
                  </p>
                  <div>
                    <React.Suspense fallback={loadingSkeleton}>
                      <PropertyDetailsStep form={form as any} />
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Current Heating */}
            <div className="space-y-6">
              <div
                ref={el => {
                  sectionRefs.current[1] = el;
                }}
                className={`group transition-all duration-300 ${
                  getSectionStatus(1) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-gray-50/50 rounded-xl p-4 -m-4'
                }`}
              >
                <div className="border-b border-gray-200/50 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {FORM_STEPS[1].title}
                      </h3>
                    </div>
                    {getSectionStatus(1) === 'completed' && (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                        ✓ Valmis
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {FORM_STEPS[1].description}
                  </p>
                  <div>
                    <React.Suspense fallback={loadingSkeleton}>
                      <CurrentHeatingStep form={form as any} />
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Current Heating Costs */}
            <div className="space-y-6">
              <div
                ref={el => {
                  sectionRefs.current[2] = el;
                }}
                className={`group transition-all duration-300 ${
                  getSectionStatus(2) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-gray-50/50 rounded-xl p-4 -m-4'
                }`}
              >
                <div className="border-b border-gray-200/50 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {FORM_STEPS[2].title}
                      </h3>
                    </div>
                    {getSectionStatus(2) === 'completed' && (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                        ✓ Valmis
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {FORM_STEPS[2].description}
                  </p>
                  <div>
                    <React.Suspense fallback={loadingSkeleton}>
                      <BasicInfoStep form={form as any} />
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Check How Much You'd Save */}
            <div className="space-y-6">
              <div
                ref={el => {
                  sectionRefs.current[3] = el;
                }}
                className={`group transition-all duration-300 ${
                  getSectionStatus(3) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-gray-50/50 rounded-xl p-4 -m-4'
                }`}
              >
                <div className="border-b border-gray-200/50 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {FORM_STEPS[3].title}
                      </h3>
                    </div>
                    {getSectionStatus(3) === 'completed' && (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                        ✓ Valmis
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {FORM_STEPS[3].description}
                  </p>
                  <div>
                    <React.Suspense fallback={loadingSkeleton}>
                      <ResultsStep form={form as any} />
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Contact Information */}
            <div className="space-y-6">
              <div
                ref={el => {
                  sectionRefs.current[4] = el;
                }}
                className={`group transition-all duration-300 ${
                  getSectionStatus(4) === 'locked'
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-gray-50/50 rounded-xl p-4 -m-4'
                }`}
              >
                <div className="pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {FORM_STEPS[4].title}
                      </h3>
                    </div>
                    {getSectionStatus(4) === 'completed' && (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                        ✓ Valmis
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {FORM_STEPS[4].description}
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Etunimi
                        </label>
                        <input
                          type="text"
                          {...form.register('firstName')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          placeholder="Matti"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sukunimi
                        </label>
                        <input
                          type="text"
                          {...form.register('lastName')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          placeholder="Meikäläinen"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sähköposti
                      </label>
                      <input
                        type="email"
                        {...form.register('email')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="matti@example.fi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puhelin
                      </label>
                      <input
                        type="tel"
                        {...form.register('phone')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="040 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Osoite
                      </label>
                      <input
                        type="text"
                        {...form.register('streetAddress')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Esimerkkikatu 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paikkakunta
                      </label>
                      <input
                        type="text"
                        {...form.register('city')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Helsinki"
                      />
                    </div>
                    <div className="space-y-4 pt-2">
                      <label className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          {...form.register('gdprConsent')}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">
                          Hyväksyn tietosuojaselosteen ja tietojeni käsittelyn
                        </span>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          {...form.register('marketingConsent')}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">
                          Haluan vastaanottaa tarjouksia ja uutiskirjeitä
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="pt-8 border-t border-gray-200/50">
              <Button
                type="submit"
                disabled={
                  !isValid || isSubmitting || completedSections.size < 4
                }
                className={`w-full h-12 text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl ${
                  isPreviewMode ? 'bg-amber-600 hover:bg-amber-700' : ''
                }`}
                size="lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {isPreviewMode ? 'Testataan...' : 'Lähetetään...'}
                    </span>
                  </div>
                ) : isPreviewMode ? (
                  'Testaa Laskelma (Preview)'
                ) : (
                  'Lähetä laskelma'
                )}
              </Button>
              {completedSections.size < 4 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 text-center">
                    {isPreviewMode
                      ? `Täytä kaikki osiot testausta varten (${completedSections.size}/4)`
                      : `Täytä kaikki osiot ennen lähettämistä (${completedSections.size}/4)`}
                  </p>
                </div>
              )}
              {isPreviewMode && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 text-center">
                    🧪 Preview Mode: Tämä on turvallinen testiympäristö. Mitään
                    ei lähetetä tietokantaan.
                  </p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
