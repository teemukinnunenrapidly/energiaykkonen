'use client';

import { useState, useCallback } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Image,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Save,
  RotateCcw,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { FormSchema, FormPage, FormSection, FormField } from '@/types/form';

// Create a compatible mock structure for now
const INITIAL_FORM_STRUCTURE: FormSchema = {
  id: 'energy-calculator',
  name: 'Energy Calculator Form',
  description: 'Multi-step form for calculating energy savings',
  pages: [
    {
      id: 'main',
      title: 'Energy Calculator',
      sections: [
        {
          id: 'property',
          title: 'Property Information',
          description: 'Basic details about your property',
          enabled: true,
          collapsible: false,
          imageUrl: '/house.svg',
          fields: [
            {
              id: 'property-type',
              type: 'select',
              label: 'Property Type',
              placeholder: 'Select property type',
              helpText: 'Choose the type of property you own',
              required: true,
              enabled: true,
              options: [
                'Detached House',
                'Row House',
                'Semi-Detached',
                'Apartment',
              ],
              validation: { required: true },
            },
            {
              id: 'square-meters',
              type: 'number',
              label: 'Square Meters',
              required: true,
              enabled: true,
              validation: { required: true, min: 10, max: 10000 },
            },
            {
              id: 'construction-year',
              type: 'number',
              label: 'Construction Year',
              required: true,
              enabled: true,
              validation: {
                required: true,
                min: 1900,
                max: new Date().getFullYear(),
              },
            },
          ],
        },
      ],
    },
  ],
};

export default function FormBuilderPage() {
  const [formStructure, setFormStructure] = useState<FormSchema>(
    INITIAL_FORM_STRUCTURE
  );
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Save form changes to Supabase
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement actual save to Supabase
      // For now, we'll simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHasUnsavedChanges(false);
      // Show success message
      console.log('Form changes saved successfully!');
    } catch (error) {
      console.error('Error saving form changes:', error);
      // TODO: Show error message to user
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to default values
  const handleResetToDefaults = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    setIsResetting(true);
    try {
      // TODO: Load default form structure from Supabase
      // For now, we'll reset to the mock data
      await new Promise(resolve => setTimeout(resolve, 500));

      setFormStructure(INITIAL_FORM_STRUCTURE);
      setSelectedField(null);
      setSelectedSection(null);
      setHasUnsavedChanges(false);
      setCollapsedSections(new Set());

      console.log('Form reset to defaults successfully!');
    } catch (error) {
      console.error('Error resetting form:', error);
      // TODO: Show error message to user
    } finally {
      setIsResetting(false);
    }
  };

  // Handle form structure changes
  const handleFormStructureChange = useCallback((newStructure: FormSchema) => {
    setFormStructure(newStructure);
    setHasUnsavedChanges(true);
  }, []);

  // Handle field selection
  const handleFieldSelect = useCallback((field: FormField) => {
    setSelectedField(field);
    setSelectedSection(null);
  }, []);

  // Handle section selection
  const handleSectionSelect = useCallback((section: FormSection) => {
    setSelectedSection(section);
    setSelectedField(null);
  }, []);

  // Toggle section collapse
  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Handle field image update
  const handleFieldImageUpdate = useCallback(
    (fieldId: string, imageUrl: string | null) => {
      console.log('Updating field image:', { fieldId, imageUrl });

      setFormStructure(prev => ({
        ...prev,
        pages: prev.pages.map(page => ({
          ...page,
          sections: page.sections.map(section => ({
            ...section,
            fields: section.fields.map(field =>
              field.id === fieldId
                ? { ...field, imageUrl: imageUrl || undefined }
                : field
            ),
          })),
        })),
      }));

      // Update selected field if it's the one being edited
      if (selectedField?.id === fieldId) {
        setSelectedField(prev =>
          prev ? { ...prev, imageUrl: imageUrl || undefined } : null
        );
      }

      setHasUnsavedChanges(true);
    },
    [selectedField]
  );

  // Handle section image update
  const handleSectionImageUpdate = useCallback(
    (sectionId: string, imageUrl: string | null) => {
      console.log('Updating section image:', { sectionId, imageUrl });

      setFormStructure(prev => ({
        ...prev,
        pages: prev.pages.map(page => ({
          ...page,
          sections: page.sections.map(section =>
            section.id === sectionId
              ? { ...section, imageUrl: imageUrl || undefined }
              : section
          ),
        })),
      }));

      // Update selected section if it's the one being edited
      if (selectedSection?.id === sectionId) {
        setSelectedSection(prev =>
          prev ? { ...prev, imageUrl: imageUrl || undefined } : null
        );
      }

      setHasUnsavedChanges(true);
    },
    [selectedSection]
  );

  // Get section icon
  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'property':
        return '🏠';
      case 'heating':
        return '🔥';
      case 'contact':
        return '📧';
      default:
        return '📋';
    }
  };

  // Get field type icon
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'number':
        return '🔢';
      case 'email':
        return '📧';
      case 'select':
        return '📋';
      case 'radio':
        return '🔘';
      case 'checkbox':
        return '☑️';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 py-6">
        {/* Header with Save Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Form Builder
              </h1>
              <p className="text-muted-foreground mt-2">
                Customize your energy calculator form structure and field
                properties
              </p>
            </div>

            {/* Save Controls */}
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    You have unsaved changes
                  </AlertDescription>
                </Alert>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleResetToDefaults}
                    disabled={!hasUnsavedChanges || isResetting}
                  >
                    <RotateCcw
                      className={`h-4 w-4 mr-2 ${isResetting ? 'animate-spin' : ''}`}
                    />
                    Reset to Defaults
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restore the original form structure</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={!hasUnsavedChanges || isSaving}
                  >
                    <Save
                      className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`}
                    />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save your form changes</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Editor - Left Panel (2/3) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Form Structure</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {formStructure.pages
                      .flatMap(page => page.sections)
                      .map((section, sectionIndex) => (
                        <Collapsible
                          key={section.id}
                          open={!collapsedSections.has(section.id)}
                          onOpenChange={(open: boolean) => {
                            if (!open) {
                              setCollapsedSections(prev =>
                                new Set(prev).add(section.id)
                              );
                            } else {
                              setCollapsedSections(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(section.id);
                                return newSet;
                              });
                            }
                          }}
                        >
                          <div
                            className={`border rounded-lg transition-all duration-200 ${
                              selectedSection?.id === section.id
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border hover:border-border/60 hover:shadow-sm'
                            } ${!section.enabled ? 'opacity-60' : ''}`}
                          >
                            {/* Section Header */}
                            <CollapsibleTrigger asChild>
                              <div
                                className={`p-4 cursor-pointer transition-colors ${
                                  selectedSection?.id === section.id
                                    ? 'bg-primary/10'
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => handleSectionSelect(section)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="text-2xl">
                                      {getSectionIcon(section.id)}
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="text-sm font-semibold text-foreground capitalize">
                                        {section.id.replace('-', ' ')}
                                      </h3>
                                      <p className="text-xs text-muted-foreground">
                                        {section.title || 'Untitled Section'}
                                      </p>
                                      {section.description && (
                                        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                                          {section.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {/* Section Status Badges */}
                                    <div className="flex flex-col items-end space-y-1">
                                      <Badge
                                        variant={
                                          section.enabled
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className="text-xs"
                                      >
                                        {section.enabled ? 'Visible' : 'Hidden'}
                                      </Badge>
                                      {section.collapsible && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Collapsible
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Section Controls */}
                                    <div className="flex items-center space-x-1">
                                      {/* Collapse/Expand Button */}
                                      {section.collapsible && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={e => {
                                            e.stopPropagation();
                                            toggleSectionCollapse(section.id);
                                          }}
                                          className="h-6 w-6 p-1"
                                        >
                                          {collapsedSections.has(section.id) ? (
                                            <ChevronRight className="h-3 w-3" />
                                          ) : (
                                            <ChevronDownIcon className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}

                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={e => {
                                              e.stopPropagation();
                                              // TODO: Implement section reordering
                                            }}
                                            disabled={sectionIndex === 0}
                                            className="h-6 w-6 p-1"
                                          >
                                            <ChevronUp className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Move section up</p>
                                        </TooltipContent>
                                      </Tooltip>

                                      <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-1"
                                      >
                                        {sectionIndex + 1} of{' '}
                                        {
                                          formStructure.pages.flatMap(
                                            page => page.sections
                                          ).length
                                        }
                                      </Badge>

                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={e => {
                                              e.stopPropagation();
                                              // TODO: Implement section reordering
                                            }}
                                            disabled={
                                              sectionIndex ===
                                              formStructure.pages.flatMap(
                                                page => page.sections
                                              ).length -
                                                1
                                            }
                                            className="h-6 w-6 p-1"
                                          >
                                            <ChevronDown className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Move section down</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            {/* Section Fields */}
                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-2">
                                {section.fields.map((field, fieldIndex) => (
                                  <div
                                    key={field.id}
                                    className={`flex items-center justify-between p-2 rounded border transition-all ${
                                      selectedField?.id === field.id
                                        ? 'border-primary/30 bg-primary/5'
                                        : 'border-border hover:border-border/60'
                                    } ${!field.enabled ? 'opacity-60' : ''}`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className="text-lg text-muted-foreground">
                                        {getFieldTypeIcon(field.type)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium text-foreground">
                                            {field.label || 'Unnamed Field'}
                                          </span>
                                          {field.required && (
                                            <Badge
                                              variant="destructive"
                                              className="text-xs"
                                            >
                                              Required
                                            </Badge>
                                          )}
                                          {!field.enabled && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              Hidden
                                            </Badge>
                                          )}
                                        </div>
                                        {field.placeholder && (
                                          <p className="text-xs text-muted-foreground">
                                            {field.placeholder}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleFieldSelect(field);
                                          }}
                                          className="h-6 w-6 p-1"
                                        >
                                          <Settings className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Edit field properties</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel - Right Panel (1/3) */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Properties</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {selectedField ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        Field Properties
                      </h3>

                      {/* Field Label */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="field-label"
                          className="text-sm font-medium"
                        >
                          Field Label *
                        </Label>
                        <Input
                          id="field-label"
                          value={selectedField.label || ''}
                          onChange={e => {
                            // TODO: Implement field label update
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Enter field label"
                        />
                        <p className="text-xs text-muted-foreground">
                          The label that users will see above this field
                        </p>
                      </div>

                      {/* Field Placeholder */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="field-placeholder"
                          className="text-sm font-medium"
                        >
                          Placeholder Text
                        </Label>
                        <Input
                          id="field-placeholder"
                          value={selectedField.placeholder || ''}
                          onChange={e => {
                            // TODO: Implement field placeholder update
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Enter placeholder text"
                        />
                        <p className="text-xs text-muted-foreground">
                          Hint text shown inside the field before user input
                        </p>
                      </div>

                      {/* Field Help Text */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="field-help"
                          className="text-sm font-medium"
                        >
                          Help Text
                        </Label>
                        <Textarea
                          id="field-help"
                          value={selectedField.helpText || ''}
                          onChange={e => {
                            // TODO: Implement field help text update
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Enter help text"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Additional guidance for users filling out this field
                        </p>
                      </div>

                      {/* Field Image */}
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium">
                          Field Image
                        </Label>
                        <ImagePicker
                          value={selectedField.imageUrl}
                          onChange={imageUrl => {
                            handleFieldImageUpdate(selectedField.id, imageUrl);
                          }}
                          placeholder="Select an image for this field..."
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional image to display with this field
                        </p>
                      </div>
                    </div>
                  ) : selectedSection ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        Section Properties
                      </h3>

                      {/* Section Title */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="section-title"
                          className="text-sm font-medium"
                        >
                          Section Title *
                        </Label>
                        <Input
                          id="section-title"
                          value={selectedSection.title || ''}
                          onChange={e => {
                            // TODO: Implement section title update
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Enter section title"
                        />
                        <p className="text-xs text-muted-foreground">
                          The title displayed at the top of this section
                        </p>
                      </div>

                      {/* Section Description */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="section-description"
                          className="text-sm font-medium"
                        >
                          Section Description
                        </Label>
                        <Textarea
                          id="section-description"
                          value={selectedSection.description || ''}
                          onChange={e => {
                            // TODO: Implement section description update
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Enter section description"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional description to help users understand this
                          section
                        </p>
                      </div>

                      {/* Section Settings */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-foreground">
                          Section Settings
                        </h4>

                        {/* Section Visibility Toggle */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="section-visible-switch"
                              checked={selectedSection.enabled}
                              onCheckedChange={checked => {
                                // TODO: Implement section visibility toggle
                                setHasUnsavedChanges(true);
                              }}
                            />
                            <Label
                              htmlFor="section-visible-switch"
                              className="text-sm font-medium"
                            >
                              Section Visible
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Hidden sections and their fields are not shown to
                            users
                          </p>
                        </div>

                        {/* Section Collapsible Toggle */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="collapsible-switch"
                              checked={selectedSection.collapsible}
                              onCheckedChange={checked => {
                                // TODO: Implement section collapsible toggle
                                setHasUnsavedChanges(true);
                              }}
                            />
                            <Label
                              htmlFor="collapsible-switch"
                              className="text-sm font-medium"
                            >
                              Collapsible Section
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Users can collapse/expand this section to save space
                          </p>
                        </div>
                      </div>

                      {/* Section Image */}
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium">
                          Section Image
                        </Label>
                        <ImagePicker
                          value={selectedSection.imageUrl}
                          onChange={imageUrl => {
                            handleSectionImageUpdate(
                              selectedSection.id,
                              imageUrl
                            );
                          }}
                          placeholder="Select an image for this section..."
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          This image will be displayed at the top of the section
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p>Select a field or section to edit its properties</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
