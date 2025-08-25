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
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Calculator,
  Play,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Edit,
} from 'lucide-react';
import {
  Formula,
  CreateFormulaRequest,
  FormulaValidationResult,
  FormulaExecutionResult,
} from '@/lib/types/formula';
import {
  getFormulas,
  createFormula,
  updateFormula,
  deleteFormula,
  toggleFormulaStatus,
  validateFormula,
  executeFormula,
  generateFormulaShortcode,
  generateFormulaShortcodeWithVariables,
  generateFormulaShortcodeWithDefaults,
  logSecurityEvent,
  getSecurityStats,
} from '@/lib/formula-service';
import AdminNavigation from '@/components/admin/AdminNavigation';

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
  });

  // Formula testing state
  const [testVariables, setTestVariables] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<FormulaExecutionResult | null>(
    null
  );
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [validationResult, setValidationResult] =
    useState<FormulaValidationResult | null>(null);

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
        ...formulaForm
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

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleFormulaStatus(id, !currentStatus);
      setFormulas(
        formulas.map(f =>
          f.id === id ? { ...f, is_active: !currentStatus } : f
        )
      );
    } catch (error) {
      console.error('Error toggling formula status:', error);
    }
  };

  const handleTestFormula = (formula: Formula) => {
    setSelectedFormula(formula);
    setTestVariables({});
    setTestResult(null);
    setActiveTab('testing');
  };

  const executeTest = async () => {
    if (!selectedFormula) {
      return;
    }

    // Enhanced security: Log formula execution attempt
    logSecurityEvent('formula_execution_attempt', {
      formulaId: selectedFormula.id,
      formulaName: selectedFormula.name,
      variables: testVariables,
    });

    const result = await executeFormula(
      selectedFormula.formula_text,
      testVariables
    );

    // Enhanced security: Log execution result
    if (result.success) {
      logSecurityEvent('formula_execution_success', {
        formulaId: selectedFormula.id,
        executionTime: result.executionTime,
      });
    } else {
      logSecurityEvent('formula_execution_failure', {
        formulaId: selectedFormula.id,
        error: result.error,
      });
    }

    setTestResult(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <Plus className="h-4 w-4" />
            New Formula
          </Button>
        </div>

        {/* Enhanced Security Status Section */}
        <Card className="bg-muted/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
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
            <TabsTrigger value="testing">Testing</TabsTrigger>
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

                    {validationResult && (
                      <div className="mt-2">
                        {validationResult.errors.length > 0 && (
                          <div className="text-red-600 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {validationResult.errors.join(', ')}
                          </div>
                        )}
                        {validationResult.warnings.length > 0 && (
                          <div className="text-yellow-600 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
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
                              <Copy className="h-3 w-3" />
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
                              <Copy className="h-3 w-3" />
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
                              <Copy className="h-3 w-3" />
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
                        <Badge
                          variant={formula.is_active ? 'default' : 'secondary'}
                        >
                          {formula.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestFormula(formula)}
                        >
                          <Play className="h-4 w-4" />
                          Test
                        </Button>
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
                            });
                            setShowCreateForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(formula.id, formula.is_active)
                          }
                        >
                          {formula.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFormula(formula.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
                        <Copy className="h-3 w-3" />
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
                      <Plus className="h-4 w-4 mr-2" />
                      Create Formula
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-4">
            {selectedFormula ? (
              <Card>
                <CardHeader>
                  <CardTitle>Test Formula: {selectedFormula.name}</CardTitle>
                  <CardDescription>
                    Test the formula with sample values to verify it works
                    correctly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm font-mono">
                      {selectedFormula.formula_text}
                    </code>
                  </div>

                  <div>
                    <Label>Test Variables</Label>
                    <div className="grid gap-2 mt-2">
                      {Object.keys(selectedFormula.variables || {}).map(key => (
                        <div key={key} className="flex items-center gap-2">
                          <Label htmlFor={key} className="w-24 text-sm">
                            {key}:
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            value={testVariables[key] || ''}
                            onChange={e =>
                              setTestVariables({
                                ...testVariables,
                                [key]: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Enter value"
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={executeTest} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Execute Test
                  </Button>

                  {testResult && (
                    <div
                      className={`p-4 rounded-md ${
                        testResult.success
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {testResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {testResult.success
                            ? 'Test Successful'
                            : 'Test Failed'}
                        </span>
                      </div>

                      {testResult.success ? (
                        <div>
                          <p className="text-green-800">
                            Result:{' '}
                            <span className="font-mono font-bold">
                              {testResult.result}
                            </span>
                          </p>
                          <p className="text-green-600 text-sm mt-1">
                            Execution time:{' '}
                            {testResult.executionTime?.toFixed(2)}ms
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-red-800">
                            Error: {testResult.error}
                          </p>
                          <p className="text-red-600 text-sm mt-1">
                            Execution time:{' '}
                            {testResult.executionTime?.toFixed(2)}ms
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shortcode Usage Section */}
                  {selectedFormula && (
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <h4 className="font-medium mb-3">Shortcode Usage</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Basic Shortcode
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono bg-background px-3 py-2 rounded border flex-1">
                              {generateFormulaShortcode(selectedFormula)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  generateFormulaShortcode(selectedFormula)
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use this shortcode to embed the formula in forms or
                            content
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Shortcode with Variables
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono bg-background px-3 py-2 rounded border flex-1">
                              {generateFormulaShortcodeWithVariables(
                                selectedFormula
                              )}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  generateFormulaShortcodeWithVariables(
                                    selectedFormula
                                  )
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Shows available variables for the formula
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a formula to test
                  </h3>
                  <p className="text-muted-foreground">
                    Go to the Formulas tab and click "Test" on any formula to
                    start testing
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
