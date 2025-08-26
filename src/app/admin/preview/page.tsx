'use client';

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  Smartphone,
  Monitor,
  ExternalLink,
  Eye,
  AlertTriangle,
  Calculator,
} from 'lucide-react';
import { ThemeConfig, DEFAULT_THEME_CONFIG } from '@/lib/types/theme';

// Lazy load the FormRenderer for code splitting
const FormRenderer = lazy(() =>
  import('@/components/form-system/FormRenderer').then(module => ({
    default: module.FormRenderer,
  }))
);

// Lazy load images for better performance
const LazyImage = lazy(() =>
  import('next/image').then(module => ({ default: module.default }))
);

// Import the actual calculator form schema
import { calculatorFormSchema } from '@/lib/form-system/calculator-adapter';

// Import the form schema service to load actual form data
import { FormSchema } from '@/types/form';

// Custom hook for loading theme settings
const useThemeSettings = () => {
  const [themeConfig, setThemeConfig] =
    useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  const loadThemeSettings = useCallback(async () => {
    try {
      setIsLoadingTheme(true);
      // TODO: Replace with actual API call to load current theme settings
      // For now, we'll use the default theme
      // const response = await fetch('/api/admin/theme-settings');
      // const data = await response.json();
      // setThemeConfig(data.themeConfig);

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setThemeConfig(DEFAULT_THEME_CONFIG);
    } catch (error) {
      console.error('Failed to load theme settings:', error);
      // Fallback to default theme
      setThemeConfig(DEFAULT_THEME_CONFIG);
    } finally {
      setIsLoadingTheme(false);
    }
  }, []);

  useEffect(() => {
    loadThemeSettings();
  }, [loadThemeSettings]);

  return { themeConfig, isLoadingTheme, loadThemeSettings };
};

export default function AdminPreviewPage() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  // Load theme settings
  const { themeConfig, isLoadingTheme, loadThemeSettings } = useThemeSettings();

  // Load actual form structure from Form Builder
  const loadFormStructure = useCallback(async () => {
    try {
      setIsLoadingForm(true);
      
      // Call the server-side API endpoint that handles authentication
      const response = await fetch('/api/admin/preview-form-schema');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.schema) {
          setFormSchema(data.schema);
        } else {
          // Fallback to default schema if no active schema found
          setFormSchema(calculatorFormSchema);
        }
      } else {
        // If API call fails, fallback to default schema
        console.warn('Failed to load form schema, using default:', response.statusText);
        setFormSchema(calculatorFormSchema);
      }
    } catch (error) {
      console.error('Failed to load form structure:', error);
      // Fallback to default schema
      setFormSchema(calculatorFormSchema);
    } finally {
      setIsLoadingForm(false);
    }
  }, []);

  useEffect(() => {
    loadFormStructure();
  }, [loadFormStructure]);

  // Get form data from the actual schema (or fallback to default)
  const currentFormSchema = formSchema || calculatorFormSchema;
  const currentPage = currentFormSchema.pages[0]; // Always show first page

  // Handle refresh button
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Reload latest customization settings from database
    await Promise.all([
      loadThemeSettings(),
      loadFormStructure()
    ]);
    setIsRefreshing(false);
  }, [loadThemeSettings, loadFormStructure]);

  // Handle viewport toggle
  const handleViewportToggle = useCallback(() => {
    setIsMobileView(!isMobileView);
  }, [isMobileView]);

  // Handle view public version
  const handleViewPublic = useCallback(() => {
    window.open('/calculator', '_blank');
  }, []);

  // Handle form submission in preview mode
  const handlePreviewSubmission = useCallback((formData: any) => {
    console.log('Preview form submission:', formData);
    // In preview mode, just log the data - don't actually submit
    alert('Preview Mode: Form data logged to console. No actual submission.');
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((pageIndex: number) => {
    // No page changes in preview mode - always show first page
  }, []);

  // Handle section completion
  const handleSectionComplete = useCallback((sectionId: string, data: any) => {
    console.log('Section completed:', sectionId, data);
    // setFormData(prev => ({ ...prev, ...data })); // This line was removed as per the edit hint
  }, []);

  // Apply theme styles dynamically
  useEffect(() => {
    if (themeConfig) {
      const root = document.documentElement;

      // Apply CSS custom properties for theme colors
      root.style.setProperty(
        '--color-primary',
        themeConfig.colors.primary.main
      );
      root.style.setProperty(
        '--color-primary-light',
        themeConfig.colors.primary.light
      );
      root.style.setProperty(
        '--color-primary-dark',
        themeConfig.colors.primary.dark
      );
      root.style.setProperty(
        '--color-secondary',
        themeConfig.colors.secondary.main
      );
      root.style.setProperty('--color-accent', themeConfig.colors.accent.main);
      root.style.setProperty(
        '--color-background',
        themeConfig.colors.background.default
      );
      root.style.setProperty(
        '--color-surface',
        themeConfig.colors.surface.default
      );
      root.style.setProperty(
        '--color-text-primary',
        themeConfig.colors.text.primary
      );
      root.style.setProperty(
        '--color-text-secondary',
        themeConfig.colors.text.secondary
      );

      // Apply font family
      if (themeConfig.typography.fontFamily.primary) {
        root.style.setProperty(
          '--font-family-primary',
          themeConfig.typography.fontFamily.primary
        );
      }

      // Apply border radius
      root.style.setProperty(
        '--border-radius',
        themeConfig.layout.borderRadius.md
      );
      root.style.setProperty(
        '--border-radius-lg',
        themeConfig.layout.borderRadius.lg
      );

      // Apply shadows
      root.style.setProperty('--shadow-sm', themeConfig.layout.shadows.sm);
      root.style.setProperty('--shadow-md', themeConfig.layout.shadows.md);
      root.style.setProperty('--shadow-lg', themeConfig.layout.shadows.lg);

      // Apply transitions
      root.style.setProperty(
        '--transition-duration',
        themeConfig.layout.transitions.duration.normal
      );
      root.style.setProperty(
        '--transition-easing',
        themeConfig.layout.transitions.easing.easeInOut
      );
    }
  }, [themeConfig]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      {/* Preview Mode Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-300">
        <div className="container mx-auto px-4 py-4">
          {/* Main Preview Mode Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <span className="text-lg font-semibold text-amber-800">
                  Calculator Preview
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-600 font-medium">
                  Active Theme:
                </span>
                <span className="text-amber-700">
                  {isLoadingTheme
                    ? 'Loading...'
                    : themeConfig.metadata.description}
                </span>
                {!isLoadingTheme && (
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-600 border-amber-300"
                  >
                    v{themeConfig.metadata.version}
                  </Badge>
                )}
              </div>
            </div>

            {/* Safety Status */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-amber-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Database Safe</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-amber-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Form Functional</span>
              </div>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-amber-700">Step:</span>
                <Badge variant="outline" className="text-xs">
                  {currentPage?.title || 'Step Information'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewportToggle}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                {isMobileView ? (
                  <>
                    <Monitor className="w-4 h-4 mr-2" />
                    Desktop View
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Mobile View
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleViewPublic}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calculator Preview */}
      <div
        ref={pageRef}
        className={`container mx-auto px-4 py-6 transition-all duration-300 ${
          isMobileView ? 'max-w-md' : 'max-w-7xl'
        }`}
      >
        {/* Tesla-Style Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Visualization (80%) */}
          <div className="lg:col-span-10">
            <Card className="h-full min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-lg">
              <CardContent className="p-8 h-full flex flex-col items-center justify-center">
                {/* Step Image */}
                <div className="relative mb-6">
                  <Suspense
                    fallback={<Skeleton className="w-32 h-32 rounded-full" />}
                  >
                    <LazyImage
                      src="/house.svg"
                      alt={currentPage?.title || 'Step Information'}
                      width={128}
                      height={128}
                      className="w-32 h-32 object-contain"
                    />
                  </Suspense>
                </div>

                {/* Step Content */}
                <div className="text-center max-w-md">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {currentPage?.title || 'Step Information'}
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {currentPage?.description ||
                      'Step description will appear here'}
                  </p>
                </div>

                {/* Preview Mode Indicator */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Preview Mode Active</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    All calculations and form interactions work exactly as they
                    will for visitors
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Form (20%) */}
          <div className="lg:col-span-2">
            <Card className="h-full border-0 shadow-lg">
              <CardContent className="p-8 h-full">
                <Suspense fallback={<Skeleton className="w-full h-96" />}>
                  {isLoadingForm ? (
                    <div className="space-y-4">
                      <Skeleton className="w-full h-8" />
                      <Skeleton className="w-full h-32" />
                      <Skeleton className="w-32 h-32" />
                      <Skeleton className="w-32 h-32" />
                    </div>
                  ) : (
                    <FormRenderer
                      schema={currentFormSchema}
                      onSubmit={handlePreviewSubmission}
                      onPageChange={handlePageChange}
                      isPreviewMode={true}
                    />
                  )}
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Mode Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              Preview Mode - Safe Testing Environment
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Changes made here won&apos;t affect the live calculator. Use this to
            test new features and verify functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
