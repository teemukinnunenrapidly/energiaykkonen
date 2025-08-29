'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  FileText,
  Download,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
} from 'lucide-react';
import {
  Formula,
  CreateFormulaRequest,
  FormulaValidationResult,
} from '@/lib/types/formula';
import {
  getFormulas,
  createFormula,
  updateFormula,
  deleteFormula,
  validateFormula,
  generateFormulaShortcode,
  generateFormulaShortcodeWithVariables,
  generateFormulaShortcodeWithDefaults,
} from '@/lib/formula-service';
import {
  FormulaLookup,
  CreateFormulaLookupRequest,
  getFormulaLookups,
  createFormulaLookup,
  updateFormulaLookup,
  deleteFormulaLookup,
  generateLookupShortcode,
} from '@/lib/formula-lookup-service';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { supabase, type CardField } from '@/lib/supabase';

export default function AdminCalculationsPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('formulas');

  // Formula form state
  const [formulaForm, setFormulaForm] = useState<CreateFormulaRequest>({
    name: '',
    description: '',
    formula_text: '',
    formula_type: 'energy_calculation',
    unit: '',
  });

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [validationResult, setValidationResult] =
    useState<FormulaValidationResult | null>(null);

  // Available fields from Card Builder
  const [availableFields, setAvailableFields] = useState<CardField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  // Formula Lookup state
  const [lookups, setLookups] = useState<FormulaLookup[]>([]);
  const [showCreateLookupForm, setShowCreateLookupForm] = useState(false);
  const [editingLookup, setEditingLookup] = useState<FormulaLookup | null>(
    null
  );
  const [lookupForm, setLookupForm] = useState<CreateFormulaLookupRequest>({
    name: '',
    description: '',
    conditions: [{ condition_rule: '', target_shortcode: '', description: '' }],
  });

  // Visual condition builder state
  interface VisualCondition {
    field: string;
    operator: string;
    value: string;
    formula: string;
    description: string;
  }

  const [visualConditions, setVisualConditions] = useState<VisualCondition[]>([
    { field: '', operator: '==', value: '', formula: '', description: '' },
  ]);

  useEffect(() => {
    loadFormulas();
    loadAvailableFields();
    loadLookups();
  }, []);

  const loadFormulas = async () => {
    try {
      setLoading(true);
      const data = await getFormulas();
      setFormulas(data);
    } catch (error) {
      console.error('Error loading formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFields = async () => {
    try {
      setFieldsLoading(true);
      const { data, error } = await supabase
        .from('card_fields')
        .select(
          `
          *,
          card_templates!card_fields_card_id_fkey (
            id,
            name,
            title
          )
        `
        )
        .order('display_order');

      if (error) {
        console.error('Error loading available fields:', error);
        return;
      }

      if (data) {
        setAvailableFields(data);
        console.log(`Loaded ${data.length} available fields from Card Builder`);
        console.log('Sample field with card info:', data[0]); // Debug log
      }
    } catch (error) {
      console.error('Failed to load available fields:', error);
    } finally {
      setFieldsLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      setLoading(true);
      const data = await getFormulaLookups();
      setLookups(data);
      console.log(`Loaded ${data.length} formula lookups`);
    } catch (error) {
      console.error('Failed to load formula lookups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLookup = async () => {
    try {
      if (editingLookup) {
        // Update existing lookup
        const updatedLookup = await updateFormulaLookup(
          editingLookup.id,
          lookupForm
        );
        setLookups(
          lookups.map(l => (l.id === editingLookup.id ? updatedLookup : l))
        );
        setEditingLookup(null);
      } else {
        // Create new lookup
        const newLookup = await createFormulaLookup(lookupForm);
        setLookups([newLookup, ...lookups]);
      }

      setLookupForm({
        name: '',
        description: '',
        conditions: [
          { condition_rule: '', target_shortcode: '', description: '' },
        ],
      });
      setVisualConditions([
        { field: '', operator: '==', value: '', formula: '', description: '' },
      ]);
      setShowCreateLookupForm(false);
    } catch (error) {
      console.error('Error saving formula lookup:', error);
    }
  };

  const handleDeleteLookup = async (id: string) => {
    try {
      await deleteFormulaLookup(id);
      setLookups(lookups.filter(lookup => lookup.id !== id));
    } catch (error) {
      console.error('Error deleting lookup:', error);
    }
  };

  const handleEditLookup = (lookup: FormulaLookup) => {
    setEditingLookup(lookup);
    setLookupForm({
      name: lookup.name,
      description: lookup.description || '',
      conditions: lookup.conditions?.map(c => ({
        condition_rule: c.condition_rule,
        target_shortcode: c.target_shortcode,
        description: c.description || '',
      })) || [{ condition_rule: '', target_shortcode: '', description: '' }],
    });

    // Parse existing conditions back to visual conditions format
    const parsedVisualConditions = lookup.conditions?.map(condition => {
      // Try to parse the condition_rule back to visual format
      // Example: "[field:valitse] == \"Öljylämmitys\"" -> field="valitse", operator="==", value="Öljylämmitys"
      const match = condition.condition_rule.match(
        /\[field:([^\]]+)\]\s*(==|!=|<=|>=|<|>)\s*['"]?([^'"]*)['"]?/
      );
      const formulaMatch =
        condition.target_shortcode.match(/\[calc:([^\]]+)\]/);

      console.log(`🔍 [EDIT DEBUG] Parsing condition:`, {
        condition_rule: condition.condition_rule,
        target_shortcode: condition.target_shortcode,
        match: match,
        formulaMatch: formulaMatch,
      });

      if (match && formulaMatch) {
        const parsed = {
          field: match[1].trim(),
          operator: match[2].trim(),
          value: match[3].trim(),
          formula: formulaMatch[1].trim(),
          description: condition.description || '',
        };
        console.log(`✅ [EDIT DEBUG] Successfully parsed:`, parsed);
        return parsed;
      } else {
        console.error(
          `❌ [EDIT DEBUG] Failed to parse condition, using fallback:`,
          {
            condition_rule: condition.condition_rule,
            target_shortcode: condition.target_shortcode,
          }
        );
        // Fallback to empty condition if parsing fails
        return {
          field: '',
          operator: '==',
          value: '',
          formula: '',
          description: condition.description || '',
        };
      }
    }) || [
      { field: '', operator: '==', value: '', formula: '', description: '' },
    ];

    setVisualConditions(parsedVisualConditions);
    setShowCreateLookupForm(true);
  };

  const handleDuplicateLookup = (lookup: FormulaLookup) => {
    const duplicatedName = `${lookup.name} (Copy)`;
    setEditingLookup(null); // Make sure we're in create mode
    setLookupForm({
      name: duplicatedName,
      description: lookup.description || '',
      conditions: lookup.conditions?.map(c => ({
        condition_rule: c.condition_rule,
        target_shortcode: c.target_shortcode,
        description: c.description || '',
      })) || [{ condition_rule: '', target_shortcode: '', description: '' }],
    });

    // Parse existing conditions back to visual conditions format for duplicate
    const parsedVisualConditions = lookup.conditions?.map(condition => {
      // Try to parse the condition_rule back to visual format
      const match = condition.condition_rule.match(
        /\[field:([^\]]+)\]\s*(==|!=|<=|>=|<|>)\s*['"]?([^'"]*)['"]?/
      );
      const formulaMatch =
        condition.target_shortcode.match(/\[calc:([^\]]+)\]/);

      if (match && formulaMatch) {
        return {
          field: match[1].trim(),
          operator: match[2].trim(),
          value: match[3].trim(),
          formula: formulaMatch[1].trim(),
          description: condition.description || '',
        };
      } else {
        return {
          field: '',
          operator: '==',
          value: '',
          formula: '',
          description: condition.description || '',
        };
      }
    }) || [
      { field: '', operator: '==', value: '', formula: '', description: '' },
    ];

    setVisualConditions(parsedVisualConditions);
    setShowCreateLookupForm(true);
  };

  // Convert visual conditions to syntax
  const convertVisualConditionsToSyntax = () => {
    const syntaxConditions = visualConditions.map(vc => ({
      condition_rule:
        vc.field && vc.value
          ? `[field:${vc.field}] ${vc.operator} "${vc.value}"`
          : '',
      target_shortcode: vc.formula ? `[calc:${vc.formula}]` : '',
      description: vc.description || '',
    }));

    setLookupForm({
      ...lookupForm,
      conditions: syntaxConditions,
    });
  };

  const addVisualCondition = () => {
    setVisualConditions([
      ...visualConditions,
      { field: '', operator: '==', value: '', formula: '', description: '' },
    ]);
  };

  const removeVisualCondition = (index: number) => {
    setVisualConditions(visualConditions.filter((_, i) => i !== index));
  };

  const updateVisualCondition = (
    index: number,
    updates: Partial<VisualCondition>
  ) => {
    const newConditions = [...visualConditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setVisualConditions(newConditions);
  };

  // Update syntax whenever visual conditions change
  useEffect(() => {
    convertVisualConditionsToSyntax();
  }, [visualConditions]);

  // These functions are preserved for future use when lookup condition editing is re-enabled
  // const _addLookupCondition = () => {
  //   setLookupForm({
  //     ...lookupForm,
  //     conditions: [
  //       ...lookupForm.conditions,
  //       { condition_rule: '', target_shortcode: '', description: '' },
  //     ],
  //   });
  // };

  // const _removeLookupCondition = (index: number) => {
  //   setLookupForm({
  //     ...lookupForm,
  //     conditions: lookupForm.conditions.filter((_, i) => i !== index),
  //   });
  // };

  const handleDuplicateFormula = (formula: Formula) => {
    const duplicatedName = `${formula.name} (Copy)`;
    setFormulaForm({
      name: duplicatedName,
      description: formula.description || '',
      formula_text: formula.formula_text,
      formula_type: formula.formula_type,
      unit: formula.unit || '',
    });
    setEditingFormula(null); // Make sure we're in create mode, not edit mode
    setShowCreateForm(true);
  };

  const handleCreateFormula = async () => {
    try {
      const validation = validateFormula(formulaForm.formula_text);
      setValidationResult(validation);

      if (!validation.isValid) {
        return;
      }

      const newFormula = await createFormula(formulaForm);
      setFormulas([newFormula, ...formulas]);
      setFormulaForm({
        name: '',
        description: '',
        formula_text: '',
        formula_type: 'energy_calculation',
        unit: '',
      });
      setShowCreateForm(false);
      setValidationResult(null);
    } catch (error) {
      console.error('Error creating formula:', error);
    }
  };

  const handleUpdateFormula = async () => {
    if (!editingFormula) {
      return;
    }

    try {
      const validation = validateFormula(formulaForm.formula_text);
      setValidationResult(validation);

      if (!validation.isValid) {
        return;
      }

      const updatedFormula = await updateFormula({
        id: editingFormula.id,
        ...formulaForm,
      });
      setFormulas(
        formulas.map(f => (f.id === editingFormula.id ? updatedFormula : f))
      );
      setShowCreateForm(false);
      setEditingFormula(null);
      setFormulaForm({
        name: '',
        description: '',
        formula_text: '',
        formula_type: 'energy_calculation',
        unit: '',
      });
      setValidationResult(null);
    } catch (error) {
      console.error('Error updating formula:', error);
    }
  };

  const handleDeleteFormula = async (id: string) => {
    if (confirm('Are you sure you want to delete this formula?')) {
      try {
        await deleteFormula(id);
        setFormulas(formulas.filter(f => f.id !== id));
      } catch (error) {
        console.error('Error deleting formula:', error);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const insertFieldReference = (fieldName: string) => {
    const fieldRef = `[field:${fieldName}]`;
    setFormulaForm(prev => ({
      ...prev,
      formula_text: prev.formula_text + fieldRef,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Calculator className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading formulas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Calculations Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage calculation formulas for the energy calculator
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            New Formula
          </Button>
        </div>

        {/* Enhanced Security Status Section */}
        <Card className="bg-muted/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-medium text-foreground">
                    Security Status
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enhanced security measures are active for formula execution
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-muted-foreground">
                  Rate Limit: 30/min
                </div>
                <div className="text-xs text-muted-foreground">Timeout: 5s</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formulas">Formulas</TabsTrigger>
            <TabsTrigger value="lookups">Formula Lookups</TabsTrigger>
          </TabsList>

          {/* Formulas Tab */}
          <TabsContent value="formulas" className="space-y-4">
            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingFormula ? 'Edit Formula' : 'Create New Formula'}
                  </CardTitle>
                  <CardDescription>
                    {editingFormula
                      ? 'Modify the existing formula'
                      : 'Create a new calculation formula for the energy calculator'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Formula Name</Label>
                    <Input
                      id="name"
                      value={formulaForm.name}
                      onChange={e =>
                        setFormulaForm({ ...formulaForm, name: e.target.value })
                      }
                      placeholder="e.g., Annual Energy Savings"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formulaForm.description}
                      onChange={e =>
                        setFormulaForm({
                          ...formulaForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what this formula calculates..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="formula">Formula</Label>
                    <Textarea
                      id="formula"
                      value={formulaForm.formula_text}
                      onChange={e =>
                        setFormulaForm({
                          ...formulaForm,
                          formula_text: e.target.value,
                        })
                      }
                      placeholder="e.g., (current_consumption - new_consumption) * energy_price"
                      rows={3}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Result Unit</Label>
                    <Input
                      id="unit"
                      value={formulaForm.unit || ''}
                      onChange={e =>
                        setFormulaForm({
                          ...formulaForm,
                          unit: e.target.value,
                        })
                      }
                      placeholder="e.g., kWh, €, %, km, m², kg, l"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The unit that will be displayed with the calculation
                      result (optional)
                    </p>
                  </div>

                  <div>
                    {/* Helpful Examples Section */}
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">
                        Formula Examples:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Basic Operations:</strong>
                          <div className="font-mono text-muted-foreground">
                            a + b * c
                          </div>
                          <div className="font-mono text-muted-foreground">
                            (x - y) / z
                          </div>
                        </div>
                        <div>
                          <strong>Math Functions:</strong>
                          <div className="font-mono text-muted-foreground">
                            Math.round(value)
                          </div>
                          <div className="font-mono text-muted-foreground">
                            Math.sqrt(area)
                          </div>
                        </div>
                        <div>
                          <strong>Energy Calculations:</strong>
                          <div className="font-mono text-muted-foreground">
                            consumption * price
                          </div>
                          <div className="font-mono text-muted-foreground">
                            savings / investment
                          </div>
                        </div>
                        <div>
                          <strong>Complex Formulas:</strong>
                          <div className="font-mono text-muted-foreground">
                            Math.max(0, income - expenses)
                          </div>
                          <div className="font-mono text-muted-foreground">
                            Math.round(efficiency * 100)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Available Fields from Card Builder */}
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-medium mb-2 text-blue-800">
                        Available Form Fields:
                      </p>
                      <p className="text-xs text-blue-600 mb-3">
                        Click any field to insert its reference into your
                        formula
                      </p>

                      {fieldsLoading ? (
                        <div className="text-xs text-blue-600">
                          Loading fields...
                        </div>
                      ) : availableFields.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {availableFields.map(field => (
                            <button
                              key={field.id}
                              type="button"
                              onClick={() =>
                                insertFieldReference(field.field_name)
                              }
                              className="text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs"
                            >
                              <div className="font-medium text-blue-800">
                                {field.label}
                              </div>
                              <div className="text-blue-600 font-mono">
                                [field:{field.field_name}]
                              </div>
                              <div className="text-blue-500 text-xs">
                                {field.field_type} •{' '}
                                {field.required ? 'Required' : 'Optional'}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-blue-600">
                          No form fields found. Create fields in Card Builder
                          first.
                        </div>
                      )}
                    </div>

                    {validationResult && (
                      <div className="mt-2">
                        {validationResult.errors.length > 0 && (
                          <div className="text-red-600 text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {validationResult.errors.join(', ')}
                          </div>
                        )}
                        {validationResult.warnings.length > 0 && (
                          <div className="text-yellow-600 text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {validationResult.warnings.join(', ')}
                          </div>
                        )}
                        {validationResult.isValid && (
                          <div className="text-green-600 text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Formula is valid
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={
                        editingFormula
                          ? handleUpdateFormula
                          : handleCreateFormula
                      }
                    >
                      {editingFormula ? 'Update Formula' : 'Create Formula'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingFormula(null);
                        setFormulaForm({
                          name: '',
                          description: '',
                          formula_text: '',
                          formula_type: 'energy_calculation',
                        });
                        setValidationResult(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Shortcode Generation Section - Only show when editing */}
                  {editingFormula && (
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <h4 className="font-medium mb-3">Generated Shortcodes</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Use these shortcodes to embed this formula in forms or
                        content
                      </p>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Basic Shortcode
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono bg-background px-3 py-2 rounded border flex-1">
                              {generateFormulaShortcode(editingFormula)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  generateFormulaShortcode(editingFormula)
                                )
                              }
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Simple shortcode with formula ID and name
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Shortcode with Variables
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono bg-background px-3 py-2 rounded border flex-1">
                              {generateFormulaShortcodeWithVariables(
                                editingFormula
                              )}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  generateFormulaShortcodeWithVariables(
                                    editingFormula
                                  )
                                )
                              }
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Shows available variables for the formula
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Shortcode with Default Values
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono bg-background px-3 py-2 rounded border flex-1">
                              {generateFormulaShortcodeWithDefaults(
                                editingFormula
                              )}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  generateFormulaShortcodeWithDefaults(
                                    editingFormula
                                  )
                                )
                              }
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Includes default values for all variables
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formulas.map(formula => (
                <Card key={formula.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            {formula.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {formula.description || 'No description provided'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingFormula(formula);
                            setFormulaForm({
                              name: formula.name,
                              description: formula.description || '',
                              formula_text: formula.formula_text,
                              formula_type: formula.formula_type,
                              unit: formula.unit || '',
                            });
                            setShowCreateForm(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateFormula(formula)}
                          title="Duplicate this formula"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFormula(formula.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm font-mono">
                        {formula.formula_text}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(formula.formula_text)}
                        className="ml-2 h-6 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <span>Type: {formula.formula_type}</span>
                      <span>•</span>
                      <span>
                        Created:{' '}
                        {new Date(formula.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Version: {formula.version}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formulas.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No formulas yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first calculation formula to get started
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Formula
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Formula Lookups Tab */}
          <TabsContent value="lookups" className="space-y-4">
            {showCreateLookupForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingLookup
                      ? 'Edit Formula Lookup'
                      : 'Create New Formula Lookup'}
                  </CardTitle>
                  <CardDescription>
                    Create conditional lookup tables that return different
                    formulas based on field values
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="lookup-name">Lookup Name</Label>
                    <Input
                      id="lookup-name"
                      value={lookupForm.name}
                      onChange={e =>
                        setLookupForm({ ...lookupForm, name: e.target.value })
                      }
                      placeholder="e.g., heating-calculation"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use kebab-case for consistency (no spaces, use hyphens)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="lookup-description">Description</Label>
                    <Textarea
                      id="lookup-description"
                      value={lookupForm.description}
                      onChange={e =>
                        setLookupForm({
                          ...lookupForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what this lookup table does..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Conditions & Actions</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Define conditions and which formulas to use. Conditions
                      are evaluated in order - first match wins.
                    </p>

                    {/* Available Fields Reference */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <Label className="text-sm font-medium text-blue-800">
                          Available Fields
                        </Label>
                        {fieldsLoading && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availableFields.length > 0 ? (
                          availableFields.map(field => (
                            <div key={field.id} className="text-xs">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                [field:{field.field_name}]
                              </Badge>
                              <div className="text-muted-foreground text-xs mt-1">
                                <div className="font-medium">{field.label}</div>
                                {field.card_templates && (
                                  <div className="italic text-muted-foreground/70">
                                    from: {field.card_templates.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground col-span-full">
                            {fieldsLoading
                              ? 'Loading fields...'
                              : 'No fields found. Create cards in Card Builder first.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Available Formulas Reference */}
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <Label className="text-sm font-medium text-green-800">
                          Available Formulas
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {formulas.length > 0 ? (
                          formulas
                            .filter(f => f.is_active)
                            .map(formula => (
                              <div key={formula.id} className="text-xs">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  [calc:{formula.name}]
                                </Badge>
                                <div className="text-muted-foreground text-xs mt-1">
                                  {formula.description || formula.name}
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground col-span-full">
                            No formulas found. Create formulas in the Formulas
                            tab first.
                          </p>
                        )}
                      </div>
                    </div>

                    {visualConditions.map((condition, index) => (
                      <Card key={index} className="p-4 mb-3">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>Condition #{index + 1}</Label>
                            {visualConditions.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeVisualCondition(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            {/* Field Selection */}
                            <div>
                              <Label htmlFor={`condition-field-${index}`}>
                                Field
                              </Label>
                              <Select
                                value={condition.field}
                                onValueChange={value =>
                                  updateVisualCondition(index, {
                                    field: value,
                                    value: '',
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableFields
                                    .sort((a, b) => {
                                      // Sort by card title first, then by field label
                                      const cardA =
                                        a.card_templates?.title || '';
                                      const cardB =
                                        b.card_templates?.title || '';
                                      if (cardA !== cardB) {
                                        return cardA.localeCompare(cardB);
                                      }
                                      return a.label.localeCompare(b.label);
                                    })
                                    .map(field => (
                                      <SelectItem
                                        key={field.id}
                                        value={field.field_name}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {field.label}
                                          </span>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>({field.field_name})</span>
                                            {field.card_templates ? (
                                              <>
                                                <span>•</span>
                                                <span className="italic">
                                                  {field.card_templates.title}
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <span>•</span>
                                                <span className="italic text-red-400">
                                                  Card info missing
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Operator Selection */}
                            <div>
                              <Label htmlFor={`condition-operator-${index}`}>
                                Is
                              </Label>
                              <Select
                                value={condition.operator}
                                onValueChange={value =>
                                  updateVisualCondition(index, {
                                    operator: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="==">Equal to</SelectItem>
                                  <SelectItem value="!=">
                                    Not equal to
                                  </SelectItem>
                                  <SelectItem value=">">
                                    Greater than
                                  </SelectItem>
                                  <SelectItem value="<">Less than</SelectItem>
                                  <SelectItem value=">=">
                                    Greater or equal
                                  </SelectItem>
                                  <SelectItem value="<=">
                                    Less or equal
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Value Input */}
                            <div>
                              <Label htmlFor={`condition-value-${index}`}>
                                Value
                              </Label>
                              {(() => {
                                const selectedField = availableFields.find(
                                  f => f.field_name === condition.field
                                );
                                const isButtonField =
                                  selectedField?.field_type === 'buttons';
                                const fieldOptions =
                                  selectedField?.options || [];

                                if (isButtonField && fieldOptions.length > 0) {
                                  return (
                                    <Select
                                      value={condition.value}
                                      onValueChange={value =>
                                        updateVisualCondition(index, { value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select option">
                                          {condition.value ? (
                                            <div className="flex items-center gap-2">
                                              <span>
                                                {fieldOptions.find(
                                                  opt =>
                                                    opt.value ===
                                                    condition.value
                                                )?.label || condition.value}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                ({condition.value})
                                              </span>
                                            </div>
                                          ) : (
                                            'Select option'
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fieldOptions.map(option => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            <div className="flex flex-col">
                                              <span className="font-medium">
                                                {option.label}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                value: {option.value}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  );
                                } else {
                                  return (
                                    <Input
                                      id={`condition-value-${index}`}
                                      value={condition.value}
                                      onChange={e =>
                                        updateVisualCondition(index, {
                                          value: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., oil"
                                    />
                                  );
                                }
                              })()}
                            </div>

                            {/* Formula Selection */}
                            <div>
                              <Label htmlFor={`condition-formula-${index}`}>
                                Then use formula
                              </Label>
                              <Select
                                value={condition.formula}
                                onValueChange={value =>
                                  updateVisualCondition(index, {
                                    formula: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select formula" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formulas
                                    .filter(f => f.is_active)
                                    .map(formula => (
                                      <SelectItem
                                        key={formula.id}
                                        value={formula.name}
                                      >
                                        {formula.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <Label htmlFor={`condition-desc-${index}`}>
                              Description (Optional)
                            </Label>
                            <Input
                              id={`condition-desc-${index}`}
                              value={condition.description}
                              onChange={e =>
                                updateVisualCondition(index, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="e.g., Oil heating calculation"
                            />
                          </div>

                          {/* Preview of generated rule */}
                          {condition.field &&
                            condition.value &&
                            condition.formula && (
                              <div className="p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
                                Preview: [field:{condition.field}]{' '}
                                {condition.operator} &quot;{condition.value}
                                &quot; → [calc:{condition.formula}]
                              </div>
                            )}
                        </div>
                      </Card>
                    ))}

                    <Button variant="outline" onClick={addVisualCondition}>
                      Add Condition
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateLookup}>
                      {editingLookup ? 'Update' : 'Create'} Lookup
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateLookupForm(false);
                        setEditingLookup(null);
                        setLookupForm({
                          name: '',
                          description: '',
                          conditions: [
                            {
                              condition_rule: '',
                              target_shortcode: '',
                              description: '',
                            },
                          ],
                        });
                        setVisualConditions([
                          {
                            field: '',
                            operator: '==',
                            value: '',
                            formula: '',
                            description: '',
                          },
                        ]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Formula Lookup Tables</h2>
              <Button onClick={() => setShowCreateLookupForm(true)}>
                Create Formula Lookup
              </Button>
            </div>

            <div className="grid gap-4">
              {lookups.map(lookup => (
                <Card key={lookup.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{lookup.name}</CardTitle>
                        {lookup.description && (
                          <CardDescription>
                            {lookup.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLookup(lookup)}
                        >
                          <Settings className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateLookup(lookup)}
                          title="Duplicate this lookup"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLookup(lookup.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="font-mono">
                          {generateLookupShortcode(lookup.name || 'unnamed')}
                        </Badge>
                        <span>← Use this shortcode in calculation cards</span>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Conditions:
                        </Label>
                        <div className="mt-1 space-y-1">
                          {lookup.conditions?.map((condition, index) => (
                            <div
                              key={condition.id}
                              className="text-sm bg-muted p-2 rounded"
                            >
                              <span className="font-mono text-xs">
                                {index + 1}. {condition.condition_rule} →{' '}
                                {condition.target_shortcode}
                              </span>
                              {condition.description && (
                                <div className="text-muted-foreground text-xs mt-1">
                                  {condition.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {lookups.length === 0 && !loading && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Formula Lookups Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create conditional lookup tables to make calculation cards
                      smarter
                    </p>
                    <Button onClick={() => setShowCreateLookupForm(true)}>
                      Create Your First Lookup
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
