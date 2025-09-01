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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Save, X, Settings, Copy, TestTube } from 'lucide-react';
import {
  getEnhancedLookups,
  createEnhancedLookup,
  deleteEnhancedLookup,
  getLookupRules,
  createLookupRule,
  createLookupDefault,
  testLookup,
} from '@/lib/enhanced-lookup-service';
import type {
  EnhancedLookup,
  LookupRule,
  ConditionLogic,
  ActionConfig,
} from '@/lib/enhanced-lookup-engine';
import { supabase, type CardField } from '@/lib/supabase';
import { getFormulas } from '@/lib/formula-service';
import type { Formula } from '@/lib/types/formula';

// Visual condition builder interface
interface VisualCondition {
  field: string;
  operator: string;
  value: string;
  formula: string;
  description: string;
}

export function SimplifiedLookupManager() {
  const [lookups, setLookups] = useState<EnhancedLookup[]>([]);
  const [selectedLookup, setSelectedLookup] = useState<EnhancedLookup | null>(
    null
  );
  const [rules, setRules] = useState<LookupRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Available data for dropdowns
  const [availableFields, setAvailableFields] = useState<CardField[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  // Form states
  const [showCreateLookup, setShowCreateLookup] = useState(false);
  const [lookupForm, setLookupForm] = useState({
    name: '',
    title: '',
    description: '',
  });

  // Visual condition builder
  const [visualConditions, setVisualConditions] = useState<VisualCondition[]>([
    { field: '', operator: 'equals', value: '', formula: '', description: '' },
  ]);

  // Load data on mount
  useEffect(() => {
    loadLookups();
    loadAvailableFields();
    loadFormulas();
  }, []);

  // Load rules when lookup is selected
  useEffect(() => {
    if (selectedLookup) {
      loadRules(selectedLookup.id);
    }
  }, [selectedLookup]);

  const loadLookups = async () => {
    try {
      const data = await getEnhancedLookups();
      setLookups(data);
    } catch (error) {
      console.error('Failed to load lookups:', error);
    }
  };

  const loadRules = async (lookupId: string) => {
    try {
      const data = await getLookupRules(lookupId);
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const loadAvailableFields = async () => {
    try {
      setFieldsLoading(true);
      const { data, error } = await supabase
        .from('card_fields')
        .select(
          `
          id,
          field_name,
          label,
          field_type,
          options,
          card_templates!inner (
            id,
            title
          )
        `
        )
        .eq('card_templates.is_active', true)
        .order('card_templates.title');

      if (error) {
        throw error;
      }
      setAvailableFields((data || []) as unknown as CardField[]);
    } catch (error) {
      console.error('Failed to load fields:', error);
    } finally {
      setFieldsLoading(false);
    }
  };

  const loadFormulas = async () => {
    try {
      const data = await getFormulas();
      setFormulas(data.filter(f => f.is_active));
    } catch (error) {
      console.error('Failed to load formulas:', error);
    }
  };

  const handleCreateLookup = async () => {
    if (!lookupForm.name || !lookupForm.title) {
      return;
    }

    try {
      setLoading(true);

      // Create the lookup
      const newLookup = await createEnhancedLookup({
        name: lookupForm.name,
        title: lookupForm.title,
        description: lookupForm.description,
        is_active: true,
      });

      // Convert visual conditions to rules
      let orderIndex = 1;
      for (const condition of visualConditions) {
        if (!condition.field || !condition.value || !condition.formula) {
          continue;
        }

        // Create condition logic
        const conditionLogic: ConditionLogic = {
          type: 'AND',
          conditions: [
            {
              field: condition.field,
              operator: condition.operator as any,
              value: condition.value,
            },
          ],
        };

        // Create action config
        const actionConfig: ActionConfig = {
          formula_text: `[calc:${condition.formula}]`,
        };

        await createLookupRule({
          lookup_id: newLookup.id,
          name: condition.description || `Rule ${orderIndex}`,
          description: condition.description,
          order_index: orderIndex,
          condition_logic: conditionLogic,
          action_type: 'formula',
          action_config: actionConfig,
          is_active: true,
        });

        orderIndex++;
      }

      // Create default action (error message)
      await createLookupDefault({
        lookup_id: newLookup.id,
        action_type: 'error',
        action_config: {
          message: `No matching condition found for lookup '${lookupForm.name}'`,
        },
      });

      // Reset form and reload
      setLookupForm({ name: '', title: '', description: '' });
      setVisualConditions([
        {
          field: '',
          operator: 'equals',
          value: '',
          formula: '',
          description: '',
        },
      ]);
      setShowCreateLookup(false);
      await loadLookups();
      setSelectedLookup(newLookup);
    } catch (error) {
      console.error('Failed to create lookup:', error);
      alert('Failed to create lookup: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLookup = async (id: string) => {
    if (
      !confirm('Are you sure you want to delete this lookup and all its rules?')
    ) {
      return;
    }

    try {
      await deleteEnhancedLookup(id);
      await loadLookups();
      if (selectedLookup?.id === id) {
        setSelectedLookup(null);
      }
    } catch (error) {
      console.error('Failed to delete lookup:', error);
      alert('Failed to delete lookup');
    }
  };

  const handleTestLookup = async () => {
    if (!selectedLookup) {
      return;
    }

    const testDataStr = prompt(
      'Enter test data as JSON:\n\nExample:\n{\n  "building_type": "residential",\n  "square_feet": 1500\n}'
    );

    if (!testDataStr) {
      return;
    }

    try {
      const testData = JSON.parse(testDataStr);
      const result = await testLookup({
        lookup_name: selectedLookup.name,
        test_data: testData,
      });

      alert(
        `Test Result:\n\nSuccess: ${result.success}\nValue: ${result.value}\nError: ${result.error || 'None'}`
      );
    } catch (error) {
      alert('Test failed: ' + (error as Error).message);
    }
  };

  const addVisualCondition = () => {
    setVisualConditions([
      ...visualConditions,
      {
        field: '',
        operator: 'equals',
        value: '',
        formula: '',
        description: '',
      },
    ]);
  };

  const removeVisualCondition = (index: number) => {
    setVisualConditions(visualConditions.filter((_, i) => i !== index));
  };

  const updateVisualCondition = (
    index: number,
    updates: Partial<VisualCondition>
  ) => {
    setVisualConditions(
      visualConditions.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Lookup List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Enhanced Lookups</CardTitle>
              <CardDescription>
                Create conditional lookups that automatically select the right
                formula based on user input
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateLookup(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Lookup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {lookups.map(lookup => (
              <Card
                key={lookup.id}
                className={
                  selectedLookup?.id === lookup.id ? 'ring-2 ring-blue-500' : ''
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{lookup.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          [lookup:{lookup.name}]
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ← Use this shortcode
                        </span>
                      </div>
                      {lookup.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {lookup.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLookup(lookup)}
                      >
                        <Settings className="w-4 h-4" />
                        {selectedLookup?.id === lookup.id
                          ? 'Selected'
                          : 'Select'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `[lookup:${lookup.name}]`
                          );
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLookup(lookup.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {lookups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No enhanced lookups yet. Create your first one!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Lookup Rules */}
      {selectedLookup && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedLookup.title} - Rules</CardTitle>
                <CardDescription>
                  {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </div>
              <Button onClick={handleTestLookup} variant="outline">
                <TestTube className="w-4 h-4 mr-2" />
                Test Lookup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">
                      #{index + 1}: {rule.name}
                    </h4>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Condition:</span>{' '}
                      {JSON.stringify(rule.condition_logic, null, 0)}
                    </div>
                    <div>
                      <span className="font-medium">Action:</span>{' '}
                      {rule.action_type} -{' '}
                      {JSON.stringify(rule.action_config, null, 0)}
                    </div>
                    {rule.description && (
                      <div>
                        <span className="font-medium">Description:</span>{' '}
                        {rule.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {rules.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No rules configured for this lookup
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Lookup Form */}
      {showCreateLookup && (
        <Card>
          <CardHeader>
            <CardTitle>Create Enhanced Lookup</CardTitle>
            <CardDescription>
              Build a lookup with visual condition builder - much easier than
              JSON!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lookup-name">Lookup Name (shortcode)</Label>
                <Input
                  id="lookup-name"
                  value={lookupForm.name}
                  onChange={e =>
                    setLookupForm({ ...lookupForm, name: e.target.value })
                  }
                  placeholder="energy-rate-calculator"
                  pattern="[a-z0-9-]+"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div>
                <Label htmlFor="lookup-title">Display Title</Label>
                <Input
                  id="lookup-title"
                  value={lookupForm.title}
                  onChange={e =>
                    setLookupForm({ ...lookupForm, title: e.target.value })
                  }
                  placeholder="Energy Rate Calculator"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lookup-description">Description (Optional)</Label>
              <Textarea
                id="lookup-description"
                value={lookupForm.description}
                onChange={e =>
                  setLookupForm({ ...lookupForm, description: e.target.value })
                }
                placeholder="Describe what this lookup does..."
                rows={2}
              />
            </div>

            {/* Available Fields Reference */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm font-medium text-blue-800">
                    Available Fields
                  </Label>
                  {fieldsLoading && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                  {availableFields.map(field => (
                    <div key={field.id} className="text-xs">
                      <Badge variant="outline" className="font-mono text-xs">
                        {field.field_name}
                      </Badge>
                      <span className="ml-2 text-muted-foreground">
                        {field.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <Label className="text-sm font-medium text-green-800 mb-2 block">
                  Available Formulas
                </Label>
                <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                  {formulas.map(formula => (
                    <div key={formula.id} className="text-xs">
                      <Badge variant="outline" className="font-mono text-xs">
                        {formula.name}
                      </Badge>
                      <span className="ml-2 text-muted-foreground">
                        {formula.description || 'No description'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Condition Builder */}
            <div>
              <Label className="text-base font-medium">
                Conditions & Actions
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Define conditions and which formulas to use. Rules are evaluated
                in order - first match wins.
              </p>

              {visualConditions.map((condition, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="font-medium">
                        Condition #{index + 1}
                      </Label>
                      {visualConditions.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeVisualCondition(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Field Selection */}
                      <div>
                        <Label>Field</Label>
                        <Select
                          value={condition.field}
                          onValueChange={value =>
                            updateVisualCondition(index, { field: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map(field => (
                              <SelectItem
                                key={field.id}
                                value={field.field_name}
                              >
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator Selection */}
                      <div>
                        <Label>Is</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={value =>
                            updateVisualCondition(index, { operator: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equal to</SelectItem>
                            <SelectItem value="not_equals">
                              Not equal to
                            </SelectItem>
                            <SelectItem value="greater_than">
                              Greater than
                            </SelectItem>
                            <SelectItem value="less_than">Less than</SelectItem>
                            <SelectItem value="greater_than_or_equal">
                              Greater or equal
                            </SelectItem>
                            <SelectItem value="less_than_or_equal">
                              Less or equal
                            </SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value Input */}
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={condition.value}
                          onChange={e =>
                            updateVisualCondition(index, {
                              value: e.target.value,
                            })
                          }
                          placeholder="e.g., residential"
                        />
                      </div>

                      {/* Formula Selection */}
                      <div>
                        <Label>Then use formula</Label>
                        <Select
                          value={condition.formula}
                          onValueChange={value =>
                            updateVisualCondition(index, { formula: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select formula" />
                          </SelectTrigger>
                          <SelectContent>
                            {formulas.map(formula => (
                              <SelectItem key={formula.id} value={formula.name}>
                                {formula.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-3">
                      <Label>Description (Optional)</Label>
                      <Input
                        value={condition.description}
                        onChange={e =>
                          updateVisualCondition(index, {
                            description: e.target.value,
                          })
                        }
                        placeholder="e.g., Small residential buildings"
                      />
                    </div>

                    {/* Preview */}
                    {condition.field &&
                      condition.value &&
                      condition.formula && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
                          Preview: If {condition.field} {condition.operator}{' '}
                          &quot;
                          {condition.value}&quot; → Use formula &quot;
                          {condition.formula}&quot;
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addVisualCondition}>
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateLookup} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Lookup'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateLookup(false);
                  setLookupForm({ name: '', title: '', description: '' });
                  setVisualConditions([
                    {
                      field: '',
                      operator: 'equals',
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
    </div>
  );
}
