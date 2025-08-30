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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Type,
  Layout,
  Save,
  Plus,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import {
  GlobalTheme,
  GlobalThemeCore,
  DEFAULT_THEME_CORE,
} from '@/lib/types/theme';
import {
  getThemes,
  getActiveTheme,
  createTheme,
  updateTheme,
  activateTheme,
  deleteTheme,
} from '@/lib/theme-service';

export default function AppearancePage() {
  const [themes, setThemes] = useState<GlobalTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<GlobalTheme | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state for creating/editing themes
  const [editingTheme, setEditingTheme] = useState<GlobalTheme | null>(null);
  const [themeForm, setThemeForm] = useState<GlobalThemeCore>(DEFAULT_THEME_CORE);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load themes on component mount
  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const [themesData, activeThemeData] = await Promise.all([
        getThemes(),
        getActiveTheme(),
      ]);
      setThemes(themesData);
      setActiveTheme(activeThemeData);
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTheme = async () => {
    try {
      await createTheme(themeForm, themeName, themeDescription);
      await loadThemes();
      
      // Reset form
      setThemeForm(DEFAULT_THEME_CORE);
      setThemeName('');
      setThemeDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating theme:', error);
    }
  };

  const handleUpdateTheme = async () => {
    if (!editingTheme) return;

    try {
      await updateTheme(editingTheme.id, {
        ...themeForm,
        name: themeName,
        description: themeDescription,
      });
      await loadThemes();
      
      // Reset form
      setEditingTheme(null);
      setThemeForm(DEFAULT_THEME_CORE);
      setThemeName('');
      setThemeDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    try {
      await activateTheme(themeId);
      await loadThemes();
    } catch (error) {
      console.error('Error activating theme:', error);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;

    try {
      await deleteTheme(themeId);
      await loadThemes();
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  };

  const startEditTheme = (theme: GlobalTheme) => {
    setEditingTheme(theme);
    setThemeForm({
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      fontFamily: theme.fontFamily,
      headingFontFamily: theme.headingFontFamily,
      fieldSettings: theme.fieldSettings,
    });
    setThemeName(theme.name);
    setThemeDescription(theme.description || '');
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setEditingTheme(null);
    setThemeForm(DEFAULT_THEME_CORE);
    setThemeName('');
    setThemeDescription('');
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Palette className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading themes...</p>
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
              Appearance & Branding
            </h1>
            <p className="text-muted-foreground mt-1">
              Customize the visual appearance of your calculator
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Theme
          </Button>
        </div>

        <Tabs defaultValue="global" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global">Global Theme</TabsTrigger>
            <TabsTrigger value="themes">Manage Themes</TabsTrigger>
            <TabsTrigger value="cards">Card Overrides</TabsTrigger>
          </TabsList>

          {/* Create/Edit Theme Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingTheme ? 'Edit Theme' : 'Create New Theme'}
                </CardTitle>
                <CardDescription>
                  {editingTheme 
                    ? 'Update the theme settings' 
                    : 'Create a new appearance theme for your calculator'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="themeName">Theme Name</Label>
                    <Input
                      id="themeName"
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      placeholder="e.g., Corporate Blue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="themeDescription">Description (Optional)</Label>
                    <Input
                      id="themeDescription"
                      value={themeDescription}
                      onChange={(e) => setThemeDescription(e.target.value)}
                      placeholder="Brief description of this theme"
                    />
                  </div>
                </div>

                {/* Core Settings */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Colors */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Brand Colors
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={themeForm.primaryColor}
                            onChange={(e) => setThemeForm(prev => ({
                              ...prev,
                              primaryColor: e.target.value
                            }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={themeForm.primaryColor}
                            onChange={(e) => setThemeForm(prev => ({
                              ...prev,
                              primaryColor: e.target.value
                            }))}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Used for main CTAs, active states, and brand emphasis
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={themeForm.secondaryColor}
                            onChange={(e) => setThemeForm(prev => ({
                              ...prev,
                              secondaryColor: e.target.value
                            }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={themeForm.secondaryColor}
                            onChange={(e) => setThemeForm(prev => ({
                              ...prev,
                              secondaryColor: e.target.value
                            }))}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Used for supporting elements, success states, and accents
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Typography
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="fontFamily">Body Font Family</Label>
                        <Input
                          id="fontFamily"
                          value={themeForm.fontFamily}
                          onChange={(e) => setThemeForm(prev => ({
                            ...prev,
                            fontFamily: e.target.value
                          }))}
                          placeholder="Inter, system-ui, sans-serif"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Base typography for all text content
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="headingFontFamily">Heading Font Family (Optional)</Label>
                        <Input
                          id="headingFontFamily"
                          value={themeForm.headingFontFamily || ''}
                          onChange={(e) => setThemeForm(prev => ({
                            ...prev,
                            headingFontFamily: e.target.value || undefined
                          }))}
                          placeholder="Same as body font"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Distinct typography for titles and headers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Field Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="borderRadius">Border Radius</Label>
                      <Select
                        value={themeForm.fieldSettings.borderRadius}
                        onValueChange={(value: any) => setThemeForm(prev => ({
                          ...prev,
                          fieldSettings: {
                            ...prev.fieldSettings,
                            borderRadius: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sharp (none)</SelectItem>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                          <SelectItem value="full">Rounded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fieldStyle">Field Style</Label>
                      <Select
                        value={themeForm.fieldSettings.fieldStyle}
                        onValueChange={(value: any) => setThemeForm(prev => ({
                          ...prev,
                          fieldSettings: {
                            ...prev.fieldSettings,
                            fieldStyle: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outlined">Outlined</SelectItem>
                          <SelectItem value="filled">Filled</SelectItem>
                          <SelectItem value="underlined">Underlined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="buttonStyle">Button Style</Label>
                      <Select
                        value={themeForm.fieldSettings.buttonStyle}
                        onValueChange={(value: any) => setThemeForm(prev => ({
                          ...prev,
                          fieldSettings: {
                            ...prev.fieldSettings,
                            buttonStyle: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="outlined">Outlined</SelectItem>
                          <SelectItem value="ghost">Ghost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fieldSpacing">Field Spacing</Label>
                      <Select
                        value={themeForm.fieldSettings.fieldSpacing}
                        onValueChange={(value: any) => setThemeForm(prev => ({
                          ...prev,
                          fieldSettings: {
                            ...prev.fieldSettings,
                            fieldSpacing: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={editingTheme ? handleUpdateTheme : handleCreateTheme}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingTheme ? 'Update Theme' : 'Create Theme'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value="global" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Active Theme</CardTitle>
                <CardDescription>
                  This theme is currently being used across the entire calculator
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTheme && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{activeTheme.name}</h3>
                        {activeTheme.description && (
                          <p className="text-sm text-muted-foreground">
                            {activeTheme.description}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => startEditTheme(activeTheme)}
                      >
                        Edit Theme
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: activeTheme.primaryColor }}
                        />
                        <span className="text-sm">Primary: {activeTheme.primaryColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: activeTheme.secondaryColor }}
                        />
                        <span className="text-sm">Secondary: {activeTheme.secondaryColor}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Font:</span> {activeTheme.fontFamily}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Style:</span> {activeTheme.fieldSettings.fieldStyle}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="themes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Themes</CardTitle>
                <CardDescription>
                  Manage all available themes for your calculator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theme</TableHead>
                      <TableHead>Colors</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {themes.map((theme) => (
                      <TableRow key={theme.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{theme.name}</div>
                            {theme.description && (
                              <div className="text-sm text-muted-foreground">
                                {theme.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: theme.primaryColor }}
                            />
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: theme.secondaryColor }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {theme.isActive && (
                              <Badge variant="default">Active</Badge>
                            )}
                            {theme.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!theme.isActive && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivateTheme(theme.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditTheme(theme)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!theme.isActive && !theme.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTheme(theme.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Card-Specific Overrides</CardTitle>
                <CardDescription>
                  Customize individual cards to highlight important sections or create unique styling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Card-specific override functionality will be implemented next. 
                  This will allow you to customize individual cards with different colors, 
                  spacing, and layout variants.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}