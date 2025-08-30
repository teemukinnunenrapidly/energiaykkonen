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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calculator,
  FileText,
  Shield,
  Copy,
  Edit2,
  Trash2,
  Plus,
  Search,
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
} from '@/lib/formula-service';
import { EnhancedLookupManager } from '@/components/admin/EnhancedLookupManager';
import AdminNavigation from '@/components/admin/AdminNavigation';
// import { supabase } from '@/lib/supabase'; // Currently unused

export default function AdminCalculationsPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('formulas');
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    loadFormulas();
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

  // loadAvailableFields function removed - not currently used

  // Lookup functions removed - using EnhancedLookupManager component instead

  const handleDuplicateFormula = (formula: Formula) => {
    const duplicatedName = `${formula.name} (Copy)`;
    setFormulaForm({
      name: duplicatedName,
      description: formula.description || '',
      formula_text: formula.formula_text,
      formula_type: formula.formula_type,
      unit: formula.unit || '',
    });
    setEditingFormula(null);
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
      console.error('Failed to create formula:', error);
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
      console.error('Failed to update formula:', error);
    }
  };

  const handleDeleteFormula = async (id: string) => {
    if (!confirm('Are you sure you want to delete this formula?')) {
      return;
    }

    try {
      await deleteFormula(id);
      setFormulas(formulas.filter(f => f.id !== id));
    } catch (error) {
      console.error('Failed to delete formula:', error);
    }
  };

  // Helper functions for future use
  // const copyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text);
  // };

  // const insertFieldReference = (fieldName: string) => {
  //   const fieldRef = `[field:${fieldName}]`;
  //   setFormulaForm(prev => ({
  //     ...prev,
  //     formula_text: prev.formula_text + fieldRef,
  //   }));
  // };

  // Filter formulas based on search query
  const filteredFormulas = formulas.filter(formula => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    return (
      formula.name.toLowerCase().includes(query) ||
      (formula.description &&
        formula.description.toLowerCase().includes(query)) ||
      formula.formula_text.toLowerCase().includes(query) ||
      (formula.unit && formula.unit.toLowerCase().includes(query))
    );
  });

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
            <TabsTrigger value="lookups">Enhanced Lookups</TabsTrigger>
          </TabsList>

          {/* Create/Edit Formula Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingFormula ? 'Edit Formula' : 'Create New Formula'}
                </CardTitle>
                <CardDescription>
                  {editingFormula
                    ? 'Update the formula details'
                    : 'Create a new calculation formula'}
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
                    placeholder="e.g., data.currentHeatingCost - data.newHeatingCost"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use JavaScript syntax. Access form data with
                    &quot;data.fieldName&quot;
                  </p>
                </div>

                <div>
                  <Label htmlFor="unit">Unit (Optional)</Label>
                  <Input
                    id="unit"
                    value={formulaForm.unit}
                    onChange={e =>
                      setFormulaForm({ ...formulaForm, unit: e.target.value })
                    }
                    placeholder="e.g., €, kWh, %"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={
                      editingFormula ? handleUpdateFormula : handleCreateFormula
                    }
                  >
                    {editingFormula ? 'Update' : 'Create'} Formula
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
                        unit: '',
                      });
                      setValidationResult(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {validationResult && !validationResult.isValid && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      Validation Errors:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationResult.errors?.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Formulas Tab */}
          <TabsContent value="formulas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Formulas</CardTitle>
                    <CardDescription>
                      Create and manage calculation formulas
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Formula
                  </Button>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search formulas by name, description, formula text, or unit..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {formulas.length === 0 ? (
                  <div className="text-center py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Formulas Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first formula to start building calculations
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      Create Your First Formula
                    </Button>
                  </div>
                ) : filteredFormulas.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Formulas Found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      No formulas match your search query &quot;{searchQuery}
                      &quot;
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shortcode</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFormulas.map(formula => (
                        <TableRow key={formula.id}>
                          <TableCell className="font-mono text-sm">
                            [calc:{formula.name}]
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formula.name}</div>
                              {formula.description && (
                                <div className="text-sm text-muted-foreground">
                                  {formula.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-xs">
                            <div
                              className="truncate"
                              title={formula.formula_text}
                            >
                              {formula.formula_text}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formula.unit && (
                              <Badge variant="outline">{formula.unit}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFormulaForm({
                                    name: formula.name,
                                    description: formula.description || '',
                                    formula_text: formula.formula_text,
                                    formula_type: formula.formula_type,
                                    unit: formula.unit || '',
                                  });
                                  setEditingFormula(formula);
                                  setShowCreateForm(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `[calc:${formula.name}]`
                                  );
                                }}
                                title="Copy shortcode"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDuplicateFormula(formula)}
                                title="Duplicate formula"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteFormula(formula.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Lookups Tab */}
          <TabsContent value="lookups" className="space-y-4">
            <EnhancedLookupManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
