'use client';

import { useState, useCallback, useEffect } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Save,
  RotateCcw,
  X,
  AlertTriangle,
} from 'lucide-react';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { FormSchema, FormSection, FormField } from '@/types/form';
import {
  getActiveFormSchema,
  createFormSchema,
  updateFormSchema,
} from '@/lib/form-schema-service';

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
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  // New section creation state
  const [isNewSectionDialogOpen, setIsNewSectionDialogOpen] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    description: '',
    enabled: true,
    collapsible: false,
    imageUrl: '',
  });

  // New field creation state
  const [isNewFieldDialogOpen, setIsNewFieldDialogOpen] = useState(false);
  const [newFieldSectionId, setNewFieldSectionId] = useState<string>('');
  const [newFieldData, setNewFieldData] = useState({
    type: 'text' as
      | 'text'
      | 'number'
      | 'email'
      | 'select'
      | 'radio'
      | 'checkbox'
      | 'display',
    label: '',
    placeholder: '',
    helpText: '',
    required: false,
    enabled: true,
    imageUrl: '',
    options: [] as string[],
    // Display field specific properties
    displayContent: '',
    displayStyle: {
      backgroundColor: '',
      textAlign: 'left' as 'left' | 'center' | 'right',
      fontSize: '',
      fontWeight: '',
    },
    validation: {
      required: false,
      min: undefined as number | undefined,
      max: undefined as number | undefined,
      minLength: undefined as number | undefined,
      maxLength: undefined as number | undefined,
      pattern: '',
    },
  });

  // Load existing schema on component mount
  useEffect(() => {
    const loadExistingSchema = async () => {
      try {
        const existingSchema = await getActiveFormSchema(
          'Energy Calculator Form'
        );
        if (existingSchema) {
          setFormStructure(existingSchema.schema_data);
          setCurrentSchemaId(existingSchema.id);
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Error loading existing schema:', error);
        // If no existing schema, we'll start with the default one
      }
    };

    loadExistingSchema();
  }, []);

  // Save form changes to Supabase
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      if (currentSchemaId) {
        // Update existing schema
        await updateFormSchema(currentSchemaId, {
          name: formStructure.name,
          description: formStructure.description,
          schema_data: formStructure,
        });
      } else {
        // Create new schema
        const newSchema = await createFormSchema({
          name: formStructure.name,
          description: formStructure.description,
          schema_data: formStructure,
        });
        setCurrentSchemaId(newSchema.id);
      }

      setHasUnsavedChanges(false);
      setSaveStatus('success');
      console.log('Form changes saved successfully!');

      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving form changes:', error);
      setSaveStatus('error');
      // Clear error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
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
        setSelectedSection(prev => (prev ? { ...prev, imageUrl: imageUrl || undefined } : null));
      }

      setHasUnsavedChanges(true);
    },
    [selectedSection]
  );

  // Handle section properties update (title, description, enabled, collapsible)
  const handleSectionPropertiesUpdate = useCallback(
    (sectionId: string, updates: Partial<FormSection>) => {
      setFormStructure(prev => ({
        ...prev,
        pages: prev.pages.map(page => ({
          ...page,
          sections: page.sections.map(section =>
            section.id === sectionId ? { ...section, ...updates } : section
          ),
        })),
      }));
      if (selectedSection?.id === sectionId) {
        setSelectedSection(prev =>
          prev ? { ...prev, ...updates } : null
        );
      }
      setHasUnsavedChanges(true);
    },
    [selectedSection]
  );

  // Handle new section creation
  const handleCreateNewSection = () => {
    if (!newSectionData.title.trim()) {
      return; // Don't create section without title
    }

    const newSection: FormSection = {
      id: `section-${Date.now()}`, // Generate unique ID
      title: newSectionData.title,
      description: newSectionData.description,
      enabled: newSectionData.enabled,
      collapsible: newSectionData.collapsible,
      imageUrl: newSectionData.imageUrl || undefined,
      fields: [], // Start with no fields
    };

    setFormStructure(prev => ({
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        sections: [...page.sections, newSection],
      })),
    }));

    // Reset form and close dialog
    setNewSectionData({
      title: '',
      description: '',
      enabled: true,
      collapsible: false,
      imageUrl: '',
    });
    setIsNewSectionDialogOpen(false);
    setHasUnsavedChanges(true);

    // Select the new section
    handleSectionSelect(newSection);
  };

  // Handle new field creation
  const handleCreateNewField = () => {
    if (!newFieldData.label.trim()) {
      return; // Don't create field without label
    }

    const newField: FormField = {
      id: `field-${Date.now()}`, // Generate unique ID
      type: newFieldData.type,
      label: newFieldData.label,
      placeholder: newFieldData.placeholder,
      helpText: newFieldData.helpText,
      required: newFieldData.required,
      enabled: newFieldData.enabled,
      imageUrl: newFieldData.imageUrl || undefined,
      options:
        newFieldData.type === 'select' ||
        newFieldData.type === 'radio' ||
        newFieldData.type === 'checkbox'
          ? newFieldData.options
          : undefined,
      // Display field specific properties
      displayContent:
        newFieldData.type === 'display'
          ? newFieldData.displayContent
          : undefined,
      displayStyle:
        newFieldData.type === 'display' ? newFieldData.displayStyle : undefined,
      validation: {
        required: newFieldData.validation.required,
        min: newFieldData.validation.min,
        max: newFieldData.validation.max,
        minLength: newFieldData.validation.minLength,
        maxLength: newFieldData.validation.maxLength,
        pattern: newFieldData.validation.pattern,
      },
    };

    setFormStructure(prev => ({
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(section =>
          section.id === newFieldSectionId
            ? { ...section, fields: [...section.fields, newField] }
            : section
        ),
      })),
    }));

    // Reset form and close dialog
    setNewFieldData({
      type: 'text',
      label: '',
      placeholder: '',
      helpText: '',
      required: false,
      enabled: true,
      imageUrl: '',
      options: [],
      // Display field specific properties
      displayContent: '',
      displayStyle: {
        backgroundColor: '',
        textAlign: 'left',
        fontSize: '',
        fontWeight: '',
      },
      validation: {
        required: false,
        min: undefined,
        max: undefined,
        minLength: undefined,
        maxLength: undefined,
        pattern: '',
      },
    });
    setIsNewFieldDialogOpen(false);
    setNewFieldSectionId('');
    setHasUnsavedChanges(true);

    // Select the new field
    handleFieldSelect(newField);
  };

  // Open new field dialog
  const openNewFieldDialog = (sectionId: string) => {
    setNewFieldSectionId(sectionId);
    setIsNewFieldDialogOpen(true);
  };

  // Add field option
  const addFieldOption = () => {
    setNewFieldData(prev => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  // Update field option
  const updateFieldOption = (index: number, value: string) => {
    setNewFieldData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

  // Remove field option
  const removeFieldOption = (index: number) => {
    setNewFieldData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

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
      case 'display':
        return '📊';
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

              {/* Save Status Indicator */}
              {saveStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>Changes saved successfully!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span>Error saving changes</span>
                </div>
              )}

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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Form Structure</span>
                  </div>

                  {/* New Section Button */}
                  <Dialog
                    open={isNewSectionDialogOpen}
                    onOpenChange={setIsNewSectionDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>New Section</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New Section</DialogTitle>
                        <DialogDescription>
                          Add a new section to your form. You can configure the
                          section properties and add fields later.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
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
                            value={newSectionData.title}
                            onChange={e =>
                              setNewSectionData(prev => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Enter section title"
                          />
                          <p className="text-xs text-muted-foreground">
                            The title that users will see for this section
                          </p>
                        </div>

                        {/* Section Description */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="section-description"
                            className="text-sm font-medium"
                          >
                            Description
                          </Label>
                          <Textarea
                            id="section-description"
                            value={newSectionData.description}
                            onChange={e =>
                              setNewSectionData(prev => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Enter section description"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional description to help users understand this
                            section
                          </p>
                        </div>

                        {/* Section Settings */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">
                                Visible by default
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Show this section when the form loads
                              </p>
                            </div>
                            <Switch
                              checked={newSectionData.enabled}
                              onCheckedChange={checked =>
                                setNewSectionData(prev => ({
                                  ...prev,
                                  enabled: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">
                                Collapsible
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Allow users to collapse this section
                              </p>
                            </div>
                            <Switch
                              checked={newSectionData.collapsible}
                              onCheckedChange={checked =>
                                setNewSectionData(prev => ({
                                  ...prev,
                                  collapsible: checked,
                                }))
                              }
                            />
                          </div>
                        </div>

                        {/* Section Image */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Section Image
                          </Label>
                          <ImagePicker
                            value={newSectionData.imageUrl}
                            onChange={imageUrl =>
                              setNewSectionData(prev => ({
                                ...prev,
                                imageUrl: imageUrl || '',
                              }))
                            }
                            placeholder="Select an image for this section"
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional image to display with this section
                          </p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsNewSectionDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateNewSection}
                          disabled={!newSectionData.title.trim()}
                        >
                          Create Section
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                                        {section.title || 'Untitled Section'}
                                      </h3>
                                      <p className="text-xs text-muted-foreground">
                                        {section.description || 'No description'}
                                      </p>
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
                                {section.fields.map(field => (
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

                                {/* Add New Field Button */}
                                <div className="pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-muted-foreground hover:text-foreground"
                                    onClick={() =>
                                      openNewFieldDialog(section.id)
                                    }
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Field
                                  </Button>
                                </div>
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
                          onChange={() => {
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
                            handleSectionPropertiesUpdate(
                              selectedSection.id,
                              { title: e.target.value }
                            );
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
                            handleSectionPropertiesUpdate(
                              selectedSection.id,
                              { description: e.target.value }
                            );
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

      {/* New Field Dialog */}
      <Dialog
        open={isNewFieldDialogOpen}
        onOpenChange={setIsNewFieldDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Field</DialogTitle>
            <DialogDescription>
              Add a new field to the selected section. Choose its type and
              configure its properties.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Field Properties */}
            <div className="space-y-4">
              {/* Field Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="field-type" className="text-sm font-medium">
                  Field Type *
                </Label>
                <select
                  id="field-type"
                  value={newFieldData.type}
                  onChange={e =>
                    setNewFieldData(prev => ({
                      ...prev,
                      type: e.target.value as
                        | 'text'
                        | 'number'
                        | 'email'
                        | 'select'
                        | 'radio'
                        | 'checkbox'
                        | 'display',
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="select">Select</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="display">Display Field</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose the type of input you want for this field.
                </p>
              </div>

              {/* Field Label */}
              <div className="space-y-2">
                <Label htmlFor="field-label" className="text-sm font-medium">
                  Field Label *
                </Label>
                <Input
                  id="field-label"
                  value={newFieldData.label}
                  onChange={e =>
                    setNewFieldData(prev => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="Enter field label"
                />
                <p className="text-xs text-muted-foreground">
                  The label that users will see above this field.
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
                  value={newFieldData.placeholder}
                  onChange={e =>
                    setNewFieldData(prev => ({
                      ...prev,
                      placeholder: e.target.value,
                    }))
                  }
                  placeholder="Enter placeholder text"
                />
                <p className="text-xs text-muted-foreground">
                  Hint text shown inside the field before user input.
                </p>
              </div>

              {/* Field Help Text */}
              <div className="space-y-2">
                <Label htmlFor="field-help" className="text-sm font-medium">
                  Help Text
                </Label>
                <Textarea
                  id="field-help"
                  value={newFieldData.helpText}
                  onChange={e =>
                    setNewFieldData(prev => ({
                      ...prev,
                      helpText: e.target.value,
                    }))
                  }
                  placeholder="Enter help text"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Additional guidance for users filling out this field.
                </p>
              </div>

              {/* Field Toggles */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="field-required"
                    checked={newFieldData.required}
                    onCheckedChange={checked =>
                      setNewFieldData(prev => ({ ...prev, required: checked }))
                    }
                  />
                  <Label htmlFor="field-required" className="text-sm font-medium">
                    Required Field
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="field-enabled"
                    checked={newFieldData.enabled}
                    onCheckedChange={checked =>
                      setNewFieldData(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="field-enabled" className="text-sm font-medium">
                    Field Visible
                  </Label>
                </div>
              </div>

              {/* Field Image */}
              <div className="space-y-2">
                <Label htmlFor="field-image" className="text-sm font-medium">
                  Field Image
                </Label>
                <ImagePicker
                  value={newFieldData.imageUrl}
                  onChange={imageUrl =>
                    setNewFieldData(prev => ({
                      ...prev,
                      imageUrl: imageUrl || '',
                    }))
                  }
                  placeholder="Select an image for this field..."
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Optional image to display with this field.
                </p>
              </div>
            </div>

            {/* Right Column - Advanced Properties & Validation */}
            <div className="space-y-4">
              {/* Display Field Specific Properties */}
              {newFieldData.type === 'display' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="display-content"
                      className="text-sm font-medium"
                    >
                      Display Content *
                    </Label>
                    <Textarea
                      id="display-content"
                      value={newFieldData.displayContent}
                      onChange={e =>
                        setNewFieldData(prev => ({
                          ...prev,
                          displayContent: e.target.value,
                        }))
                      }
                      placeholder="Enter content with shortcodes, e.g., 'Your savings: [calc:annual-savings] €'"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Content to display. You can use shortcodes like
                      [calc:annual-savings] for dynamic values.
                    </p>
                  </div>

                  {/* Shortcode Preview Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Available Shortcodes
                    </Label>
                    <div className="bg-gray-50 p-3 rounded-md border">
                      <p className="text-xs text-gray-600 mb-2">
                        Available calculation shortcodes you can use:
                      </p>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <code className="bg-gray-200 px-1 py-0.5 rounded">
                            [calc:annual-savings]
                          </code>
                          <span className="ml-2 text-gray-500">
                            - Annual energy savings
                          </span>
                        </div>
                        <div className="text-xs">
                          <code className="bg-gray-200 px-1 py-0.5 rounded">
                            [calc:payback-period]
                          </code>
                          <span className="ml-2 text-gray-500">
                            - Investment payback period
                          </span>
                        </div>
                        <div className="text-xs">
                          <code className="bg-gray-200 px-1 py-0.5 rounded">
                            [calc:efficiency-rating]
                          </code>
                          <span className="ml-2 text-gray-500">
                            - System efficiency percentage
                          </span>
                        </div>
                        <div className="text-xs">
                          <code className="bg-gray-200 px-1 py-0.5 rounded">
                            [calc:current-cost]
                          </code>
                          <span className="ml-2 text-gray-500">
                            - Current heating cost
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Tip: Use these shortcodes in your display content to
                        show real-time calculation results.
                      </p>
                    </div>
                  </div>

                  {/* Real-time Preview Section */}
                  {newFieldData.displayContent && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Live Preview</Label>
                      <div className="bg-white p-3 rounded-md border border-dashed border-gray-300">
                        <div className="text-xs text-gray-500 mb-2">
                          Preview with sample data:
                        </div>
                        <div
                          className="text-sm p-2 bg-gray-50 rounded"
                          style={{
                            backgroundColor:
                              newFieldData.displayStyle.backgroundColor ||
                              'transparent',
                            textAlign:
                              newFieldData.displayStyle.textAlign || 'left',
                            fontSize:
                              newFieldData.displayStyle.fontSize || 'inherit',
                            fontWeight:
                              newFieldData.displayStyle.fontWeight || 'normal',
                          }}
                        >
                          {newFieldData.displayContent.replace(
                            /\[calc:([^\]]+)\]/g,
                            (match, formulaName) => {
                              // Show sample calculation results for preview
                              const sampleResults: Record<string, string> = {
                                'annual-savings': '€1,250',
                                'payback-period': '3.2 years',
                                'efficiency-rating': '85%',
                                'current-cost': '€2,400',
                                'monthly-savings': '€104',
                                'total-investment': '€8,500',
                              };

                              const key = formulaName
                                .toLowerCase()
                                .replace(/\s+/g, '-');
                              return (
                                sampleResults[key] || `[${formulaName} result]`
                              );
                            }
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 This preview shows how your display field will look
                          with sample calculation results.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Display Styling</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label
                          htmlFor="display-bg-color"
                          className="text-xs text-muted-foreground"
                        >
                          Background Color
                        </Label>
                        <Input
                          id="display-bg-color"
                          type="color"
                          value={newFieldData.displayStyle.backgroundColor}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              displayStyle: {
                                ...prev.displayStyle,
                                backgroundColor: e.target.value,
                              },
                            }))
                          }
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="display-text-align"
                          className="text-xs text-muted-foreground"
                        >
                          Text Alignment
                        </Label>
                        <select
                          id="display-text-align"
                          value={newFieldData.displayStyle.textAlign}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              displayStyle: {
                                ...prev.displayStyle,
                                textAlign: e.target.value as
                                  | 'left'
                                  | 'center'
                                  | 'right',
                              },
                            }))
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label
                          htmlFor="display-font-size"
                          className="text-xs text-muted-foreground"
                        >
                          Font Size
                        </Label>
                        <Input
                          id="display-font-size"
                          value={newFieldData.displayStyle.fontSize}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              displayStyle: {
                                ...prev.displayStyle,
                                fontSize: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g., 16px, 1.2rem"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="display-font-weight"
                          className="text-xs text-muted-foreground"
                        >
                          Font Weight
                        </Label>
                        <select
                          id="display-font-weight"
                          value={newFieldData.displayStyle.fontWeight}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              displayStyle: {
                                ...prev.displayStyle,
                                fontWeight: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="600">Semi-Bold</option>
                          <option value="300">Light</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Field Options (for select, radio, checkbox) */}
              {newFieldData.type === 'select' ||
              newFieldData.type === 'radio' ||
              newFieldData.type === 'checkbox' ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Field Options</Label>
                  <div className="space-y-1">
                    {newFieldData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={e => updateFieldOption(index, e.target.value)}
                          onBlur={() => updateFieldOption(index, option)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFieldOption(index)}
                          className="h-6 w-6 p-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addFieldOption}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For select, radio, and checkbox fields, you can add multiple
                    options.
                  </p>
                </div>
              ) : null}

              {/* Field Validation */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Field Validation</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="validation-required"
                      checked={newFieldData.validation.required}
                      onCheckedChange={checked =>
                        setNewFieldData(prev => ({
                          ...prev,
                          validation: { ...prev.validation, required: checked },
                        }))
                      }
                    />
                    <Label
                      htmlFor="validation-required"
                      className="text-sm font-medium"
                    >
                      Required
                    </Label>
                  </div>
                  
                  {newFieldData.type === 'number' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="validation-min"
                            checked={newFieldData.validation.min !== undefined}
                            onCheckedChange={checked =>
                              setNewFieldData(prev => ({
                                ...prev,
                                validation: {
                                  ...prev.validation,
                                  min: checked ? 0 : undefined,
                                },
                              }))
                            }
                          />
                          <Label
                            htmlFor="validation-min"
                            className="text-xs font-medium"
                          >
                            Min Value
                          </Label>
                        </div>
                        <Input
                          id="validation-min-value"
                          type="number"
                          value={newFieldData.validation.min || ''}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              validation: {
                                ...prev.validation,
                                min: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              },
                            }))
                          }
                          placeholder="Min value"
                          className="w-full h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="validation-max"
                            checked={newFieldData.validation.max !== undefined}
                            onCheckedChange={checked =>
                              setNewFieldData(prev => ({
                                ...prev,
                                validation: {
                                  ...prev.validation,
                                  max: checked ? 100 : undefined,
                                },
                              }))
                            }
                          />
                          <Label
                            id="validation-max"
                            className="text-xs font-medium"
                          >
                            Max Value
                          </Label>
                        </div>
                        <Input
                          id="validation-max-value"
                          type="number"
                          value={newFieldData.validation.max || ''}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              validation: {
                                ...prev.validation,
                                max: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              },
                            }))
                          }
                          placeholder="Max value"
                          className="w-full h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                  
                  {newFieldData.type === 'text' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="validation-min-length"
                            checked={
                              newFieldData.validation.minLength !== undefined
                            }
                            onCheckedChange={checked =>
                              setNewFieldData(prev => ({
                                ...prev,
                                validation: {
                                  ...prev.validation,
                                  minLength: checked ? 0 : undefined,
                                },
                              }))
                            }
                          />
                          <Label
                            htmlFor="validation-min-length"
                            className="text-xs font-medium"
                          >
                            Min Length
                          </Label>
                        </div>
                        <Input
                          id="validation-min-length-value"
                          type="number"
                          value={newFieldData.validation.minLength || ''}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              validation: {
                                ...prev.validation,
                                minLength: e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined,
                              },
                            }))
                          }
                          placeholder="Min length"
                          className="w-full h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="validation-max-length"
                            checked={
                              newFieldData.validation.maxLength !== undefined
                            }
                            onCheckedChange={checked =>
                              setNewFieldData(prev => ({
                                ...prev,
                                validation: {
                                  ...prev.validation,
                                  maxLength: checked ? 100 : undefined,
                                },
                              }))
                            }
                          />
                          <Label
                            htmlFor="validation-max-length"
                            className="text-xs font-medium"
                          >
                            Max Length
                          </Label>
                        </div>
                        <Input
                          id="validation-max-length-value"
                          type="number"
                          value={newFieldData.validation.maxLength || ''}
                          onChange={e =>
                            setNewFieldData(prev => ({
                              ...prev,
                              validation: {
                                ...prev.validation,
                                maxLength: e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined,
                              },
                            }))
                          }
                          placeholder="Max length"
                          className="w-full h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                  
                  {newFieldData.type === 'text' && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="validation-pattern"
                          checked={newFieldData.validation.pattern !== ''}
                          onCheckedChange={checked =>
                            setNewFieldData(prev => ({
                              ...prev,
                              validation: {
                                ...prev.validation,
                                pattern: checked ? '.*' : '',
                              },
                            }))
                          }
                        />
                        <Label
                          htmlFor="validation-pattern"
                          className="text-sm font-medium"
                        >
                          Pattern (Regex)
                        </Label>
                      </div>
                      <Input
                        id="validation-pattern-value"
                        type="text"
                        value={newFieldData.validation.pattern}
                        onChange={e =>
                          setNewFieldData(prev => ({
                            ...prev,
                            validation: {
                              ...prev.validation,
                              pattern: e.target.value,
                            },
                          }))
                        }
                        placeholder="Enter regex pattern"
                        className="w-full h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewFieldDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewField}
              disabled={
                !newFieldData.label.trim() ||
                ((newFieldData.type === 'select' ||
                  newFieldData.type === 'radio' ||
                  newFieldData.type === 'checkbox') &&
                  newFieldData.options.length === 0) ||
                (newFieldData.type === 'display' &&
                  !newFieldData.displayContent.trim())
              }
            >
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
