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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
  Copy,
  TestTube,
  Eye,
  EyeOff,
  Minus,
} from 'lucide-react';
import {
  getEnhancedLookups,
  createEnhancedLookup,
  updateEnhancedLookup,
  deleteEnhancedLookup,
  getLookupRules,
  createLookupRule,
  updateLookupRule,
  deleteLookupRule,
  reorderLookupRules,
  getLookupDefault,
  createLookupDefault,
  updateLookupDefault,
  testLookup,
  ConditionTemplates,
  ActionTemplates,
} from '@/lib/enhanced-lookup-service';
import type {
  EnhancedLookup,
  LookupRule,
  LookupDefault,
  ConditionLogic,
  ActionConfig,
} from '@/lib/enhanced-lookup-engine';
import { supabase } from '@/lib/supabase';

export function EnhancedLookupManager() {
  const [lookups, setLookups] = useState<EnhancedLookup[]>([]);
  const [selectedLookup, setSelectedLookup] = useState<EnhancedLookup | null>(
    null
  );
  const [rules, setRules] = useState<LookupRule[]>([]);
  const [defaultAction, setDefaultAction] = useState<LookupDefault | null>(
    null
  );
  const [formulas, setFormulas] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Form states
  const [showCreateLookup, setShowCreateLookup] = useState(false);
  const [editingLookup, setEditingLookup] = useState<EnhancedLookup | null>(
    null
  );
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [editingRule, setEditingRule] = useState<LookupRule | null>(null);
  const [editSelectedFormula, setEditSelectedFormula] = useState<string>('');

  // Simple conditions state
  const [createConditions, setCreateConditions] = useState<
    Array<{ field: string; value: string }>
  >([{ field: '', value: '' }]);
  const [editConditions, setEditConditions] = useState<
    Array<{ field: string; value: string }>
  >([{ field: '', value: '' }]);

  // Load lookups and formulas on mount
  useEffect(() => {
    loadLookups();
    loadFormulas();
  }, []);

  // Load rules when lookup is selected
  useEffect(() => {
    if (selectedLookup) {
      loadRules(selectedLookup.id);
      loadDefault(selectedLookup.id);
    }
  }, [selectedLookup]);

  // Debug effect to track formula dropdown state
  useEffect(() => {
    if (editingRule) {
      console.log('Edit form rendering with:', {
        formulas: formulas.length,
        selectedFormula: editSelectedFormula,
        actionConfig: editingRule.action_config,
      });
    }
  }, [editingRule, formulas, editSelectedFormula]);

  const loadLookups = async () => {
    try {
      const data = await getEnhancedLookups();
      setLookups(data);
    } catch (error) {
      console.error('Failed to load lookups:', error);
    }
  };

  const loadFormulas = async () => {
    try {
      const { data, error } = await supabase
        .from('formulas')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }
      console.log(
        'Enhanced Lookup Manager - Loaded formulas:',
        data?.length,
        'formulas'
      );
      setFormulas(data || []);
    } catch (error) {
      console.error('Failed to load formulas:', error);
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

  const loadDefault = async (lookupId: string) => {
    try {
      const data = await getLookupDefault(lookupId);
      setDefaultAction(data);
    } catch (error) {
      console.error('Failed to load default:', error);
    }
  };

  const handleCreateLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const newLookup = await createEnhancedLookup({
        name: formData.get('name') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        is_active: true,
      });

      await loadLookups();
      setShowCreateLookup(false);
      setSelectedLookup(newLookup);
    } catch (error) {
      console.error('Failed to create lookup:', error);
      alert('Failed to create lookup');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLookup) {
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Build condition logic from simple conditions
      const conditionLogic: ConditionLogic =
        buildConditionLogic(createConditions);

      // Always use formula action type - build formula action config
      const formulaName = formData.get('formula_name') as string;
      const multiplier = formData.get('multiplier') as string;

      // Build formula_text in the format expected by the system
      let formulaText = `[calc:${formulaName}]`;
      if (multiplier && parseFloat(multiplier) !== 1) {
        const mult = parseFloat(multiplier);
        if (mult < 1) {
          // If multiplier is less than 1, express as division
          formulaText += `/${(1 / mult).toString()}`;
        } else {
          // If multiplier is greater than 1, express as multiplication
          formulaText += `*${mult}`;
        }
      }

      const actionConfig: ActionConfig = {
        formula_text: formulaText,
      };

      await createLookupRule({
        lookup_id: selectedLookup.id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        order_index: rules.length + 1,
        condition_logic: conditionLogic,
        action_type: 'formula',
        action_config: actionConfig,
        is_active: true,
      });

      await loadRules(selectedLookup.id);
      setShowCreateRule(false);
      setCreateConditions([{ field: '', value: '' }]);
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Failed to create rule. Check your JSON syntax.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await deleteLookupRule(ruleId);
      if (selectedLookup) {
        await loadRules(selectedLookup.id);
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRule || !selectedLookup) {
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Build condition logic from simple conditions
      const conditionLogic: ConditionLogic =
        buildConditionLogic(editConditions);

      // Always use formula action type - build formula action config
      const formulaName = editSelectedFormula; // Use controlled state instead of form data
      const multiplier = formData.get('multiplier') as string;

      // Build formula_text in the format expected by the system
      let formulaText = `[calc:${formulaName}]`;
      if (multiplier && parseFloat(multiplier) !== 1) {
        const mult = parseFloat(multiplier);
        if (mult < 1) {
          // If multiplier is less than 1, express as division
          formulaText += `/${(1 / mult).toString()}`;
        } else {
          // If multiplier is greater than 1, express as multiplication
          formulaText += `*${mult}`;
        }
      }

      const actionConfig: ActionConfig = {
        formula_text: formulaText,
      };

      // Keep the unit from the original config if it exists
      if (editingRule.action_config?.unit) {
        actionConfig.unit = editingRule.action_config.unit;
      }

      await updateLookupRule({
        id: editingRule.id,
        lookup_id: editingRule.lookup_id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        order_index: editingRule.order_index,
        condition_logic: conditionLogic,
        action_type: 'formula',
        action_config: actionConfig,
        is_active: formData.get('is_active') === 'on',
      });

      await loadRules(selectedLookup.id);
      setEditingRule(null);
      setEditSelectedFormula('');
      setEditConditions([{ field: '', value: '' }]);
    } catch (error) {
      console.error('Failed to update rule:', error);
      alert('Failed to update rule. Check your JSON syntax.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLookup = async (lookupId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this enhanced lookup? This will also delete all its rules and cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await deleteEnhancedLookup(lookupId);
      await loadLookups();
      if (selectedLookup?.id === lookupId) {
        setSelectedLookup(null);
        setRules([]);
        setDefaultAction(null);
      }
    } catch (error) {
      console.error('Failed to delete lookup:', error);
      alert('Failed to delete lookup. Please try again.');
    }
  };

  const handleTestLookup = async () => {
    if (!selectedLookup) {
      return;
    }

    const testDataStr = prompt(
      'Enter test data as JSON (e.g., {"building_type": "residential", "square_feet": 1500}):'
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
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
      alert('Test failed. Check your JSON syntax.');
    }
  };

  // Helper functions for managing simple conditions
  const addCreateCondition = () => {
    setCreateConditions([...createConditions, { field: '', value: '' }]);
  };

  const removeCreateCondition = (index: number) => {
    if (createConditions.length > 1) {
      setCreateConditions(createConditions.filter((_, i) => i !== index));
    }
  };

  const updateCreateCondition = (
    index: number,
    field: 'field' | 'value',
    newValue: string
  ) => {
    const updated = [...createConditions];
    updated[index][field] = newValue;
    setCreateConditions(updated);
  };

  const addEditCondition = () => {
    setEditConditions([...editConditions, { field: '', value: '' }]);
  };

  const removeEditCondition = (index: number) => {
    if (editConditions.length > 1) {
      setEditConditions(editConditions.filter((_, i) => i !== index));
    }
  };

  const updateEditCondition = (
    index: number,
    field: 'field' | 'value',
    newValue: string
  ) => {
    const updated = [...editConditions];
    updated[index][field] = newValue;
    setEditConditions(updated);
  };

  // Convert simple conditions to condition logic format
  const buildConditionLogic = (
    conditions: Array<{ field: string; value: string }>
  ): ConditionLogic => {
    const validConditions = conditions.filter(c => c.field && c.value);
    if (validConditions.length === 0) {
      return { type: 'AND' as const, conditions: [] };
    }
    return {
      type: 'AND' as const,
      conditions: validConditions.map(c => ({
        field: c.field,
        operator: 'equals' as const,
        value: c.value,
      })),
    };
  };

  // Convert condition logic back to simple conditions
  const parseConditionLogic = (conditionLogic: any) => {
    if (
      !conditionLogic?.conditions ||
      !Array.isArray(conditionLogic.conditions)
    ) {
      return [{ field: '', value: '' }];
    }
    const parsed = conditionLogic.conditions.map((c: any) => ({
      field: c.field || '',
      value: c.value || '',
    }));
    return parsed.length > 0 ? parsed : [{ field: '', value: '' }];
  };

  const moveRule = async (ruleId: string, direction: 'up' | 'down') => {
    if (!selectedLookup) {
      return;
    }

    const currentIndex = rules.findIndex(r => r.id === ruleId);
    if (currentIndex === -1) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= rules.length) {
      return;
    }

    const newRuleIds = [...rules];
    [newRuleIds[currentIndex], newRuleIds[newIndex]] = [
      newRuleIds[newIndex],
      newRuleIds[currentIndex],
    ];

    try {
      await reorderLookupRules(
        selectedLookup.id,
        newRuleIds.map(r => r.id)
      );
      await loadRules(selectedLookup.id);
    } catch (error) {
      console.error('Failed to reorder rules:', error);
    }
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
                Conditional formula selection based on rules
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateLookup(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Lookup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lookups.map(lookup => (
                <TableRow
                  key={lookup.id}
                  className={selectedLookup?.id === lookup.id ? 'bg-muted' : ''}
                >
                  <TableCell className="font-mono text-sm">
                    [lookup:{lookup.name}]
                  </TableCell>
                  <TableCell>{lookup.title}</TableCell>
                  <TableCell>
                    <Badge variant={lookup.is_active ? 'default' : 'secondary'}>
                      {lookup.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLookup(lookup)}
                      >
                        <Settings className="w-4 h-4" />
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
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Lookup Form */}
      {showCreateLookup && (
        <Card>
          <CardHeader>
            <CardTitle>Create Enhanced Lookup</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLookup} className="space-y-4">
              <div>
                <Label htmlFor="name">Lookup Name (shortcode)</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="energy-rate-calculator"
                  pattern="[a-z0-9-]+"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div>
                <Label htmlFor="title">Display Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Energy Rate Calculator"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Calculates energy rates based on building type and size"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Create Lookup
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateLookup(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Selected Lookup Rules */}
      {selectedLookup && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedLookup.title} Rules</CardTitle>
                <CardDescription>
                  Rules are evaluated in order - first match wins
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTestLookup} variant="outline">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </Button>
                <Button onClick={() => setShowCreateRule(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.map((rule, index) => (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{rule.name}</h4>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveRule(rule.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveRule(rule.id, 'down')}
                        disabled={index === rules.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRule(rule);

                          // Initialize selected formula
                          let selectedFormula = '';
                          if ((rule.action_config as any)?.formula_name) {
                            selectedFormula = (rule.action_config as any)
                              .formula_name;
                          } else if (rule.action_config?.formula_text) {
                            const match =
                              rule.action_config.formula_text.match(
                                /\[calc:([^\]]+)\]/
                              );
                            selectedFormula = match ? match[1] : '';
                          }
                          setEditSelectedFormula(selectedFormula);

                          // Initialize simple conditions
                          setEditConditions(
                            parseConditionLogic(rule.condition_logic)
                          );
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Condition:</span>
                    <pre className="text-xs bg-muted p-2 rounded mt-1">
                      {JSON.stringify(rule.condition_logic, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      Action ({rule.action_type}):
                    </span>
                    <pre className="text-xs bg-muted p-2 rounded mt-1">
                      {JSON.stringify(rule.action_config, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Default Action */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <h4 className="font-semibold">Default Action</h4>
                <p className="text-sm text-muted-foreground">
                  Used when no rules match
                </p>
              </CardHeader>
              <CardContent>
                {defaultAction ? (
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(
                      {
                        type: defaultAction.action_type,
                        config: defaultAction.action_config,
                      },
                      null,
                      2
                    )}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No default action configured
                  </p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Create Rule Form */}
      {showCreateRule && selectedLookup && (
        <Card>
          <CardHeader>
            <CardTitle>Add Rule to {selectedLookup.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  name="name"
                  placeholder="Small Residential Buildings"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rule-description">Description</Label>
                <Input
                  id="rule-description"
                  name="description"
                  placeholder="For residential buildings under 2000 sq ft"
                />
              </div>

              {/* Conditions Section */}
              <div>
                <Label>Conditions (all must be true)</Label>
                <div className="space-y-2">
                  {createConditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label
                          htmlFor={`create-field-${index}`}
                          className="text-sm"
                        >
                          Field Name
                        </Label>
                        <Input
                          id={`create-field-${index}`}
                          placeholder="e.g. building_type"
                          value={condition.field}
                          onChange={e =>
                            updateCreateCondition(
                              index,
                              'field',
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor={`create-value-${index}`}
                          className="text-sm"
                        >
                          Value
                        </Label>
                        <Input
                          id={`create-value-${index}`}
                          placeholder="e.g. residential"
                          value={condition.value}
                          onChange={e =>
                            updateCreateCondition(
                              index,
                              'value',
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCreateCondition(index)}
                        disabled={createConditions.length <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCreateCondition}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              </div>

              {/* Formula Selection */}
              <div>
                <Label htmlFor="create-rule-formula">
                  Select Formula to Execute
                </Label>
                {formulas.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Loading formulas...
                  </div>
                ) : (
                  <Select name="formula_name" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a formula..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formulas.map(formula => (
                        <SelectItem key={formula.id} value={formula.name}>
                          {formula.description || formula.name} ({formula.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="create-rule-multiplier">
                  Multiplier (optional)
                </Label>
                <Input
                  id="create-rule-multiplier"
                  name="multiplier"
                  type="number"
                  step="any"
                  placeholder="1.0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The formula result will be multiplied by this value (default:
                  1.0)
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateRule(false);
                    setCreateConditions([{ field: '', value: '' }]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Rule Form */}
      {editingRule && selectedLookup && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Rule: {editingRule.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateRule} className="space-y-4">
              <div>
                <Label htmlFor="edit-rule-name">Rule Name</Label>
                <Input
                  id="edit-rule-name"
                  name="name"
                  defaultValue={editingRule.name}
                  placeholder="Small Residential Buildings"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-rule-description">Description</Label>
                <Textarea
                  id="edit-rule-description"
                  name="description"
                  defaultValue={editingRule.description || ''}
                  placeholder="Optional description of when this rule applies"
                />
              </div>

              {/* Conditions Section */}
              <div>
                <Label>Conditions (all must be true)</Label>
                <div className="space-y-2">
                  {editConditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label
                          htmlFor={`edit-field-${index}`}
                          className="text-sm"
                        >
                          Field Name
                        </Label>
                        <Input
                          id={`edit-field-${index}`}
                          placeholder="e.g. building_type"
                          value={condition.field}
                          onChange={e =>
                            updateEditCondition(index, 'field', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor={`edit-value-${index}`}
                          className="text-sm"
                        >
                          Value
                        </Label>
                        <Input
                          id={`edit-value-${index}`}
                          placeholder="e.g. residential"
                          value={condition.value}
                          onChange={e =>
                            updateEditCondition(index, 'value', e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEditCondition(index)}
                        disabled={editConditions.length <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEditCondition}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              </div>

              {/* Formula Selection */}
              <div>
                <Label htmlFor="edit-rule-formula">
                  Select Formula to Execute
                </Label>
                {formulas.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Loading formulas...
                  </div>
                ) : (
                  <Select
                    key={editingRule?.id}
                    name="formula_name"
                    value={editSelectedFormula}
                    onValueChange={setEditSelectedFormula}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a formula..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formulas.map(formula => (
                        <SelectItem key={formula.id} value={formula.name}>
                          {formula.description || formula.name} ({formula.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="edit-rule-multiplier">
                  Multiplier (optional)
                </Label>
                <Input
                  id="edit-rule-multiplier"
                  name="multiplier"
                  type="number"
                  step="any"
                  defaultValue={(() => {
                    // Extract multiplier from formula_text like [calc:energiantarve]/10 -> 0.1 (1/10)
                    if ((editingRule.action_config as any)?.multiplier) {
                      return (editingRule.action_config as any).multiplier;
                    }
                    if (editingRule.action_config?.formula_text) {
                      const match =
                        editingRule.action_config.formula_text.match(
                          /\/(\d+(?:\.\d+)?)/
                        );
                      if (match) {
                        return (1 / parseFloat(match[1])).toString();
                      }
                      const multMatch =
                        editingRule.action_config.formula_text.match(
                          /\*(\d+(?:\.\d+)?)/
                        );
                      if (multMatch) {
                        return multMatch[1];
                      }
                    }
                    return '';
                  })()}
                  placeholder="1.0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The formula result will be multiplied by this value (default:
                  1.0)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-rule-active"
                  name="is_active"
                  defaultChecked={editingRule.is_active}
                  className="rounded"
                />
                <Label htmlFor="edit-rule-active">Rule is active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Rule
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingRule(null);
                    setEditSelectedFormula('');
                    setEditConditions([{ field: '', value: '' }]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setTestResult(null)}
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
