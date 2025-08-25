'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Palette,
  Download,
  Upload,
  Send,
  Eye,
  Save,
} from 'lucide-react';
import { getEmailTemplates, createEmailTemplate, updateEmailTemplate, type EmailTemplate } from '@/lib/email-templates-service';
import { getShortcodes, type Shortcode } from '@/lib/shortcodes-service';

// Use the imported types from the services

export default function EmailBuilderPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    content: '',
    category: 'results',
    version: 1,
  });
  const [selectedShortcode, setSelectedShortcode] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedTemplates, fetchedShortcodes] = await Promise.all([
          getEmailTemplates(),
          getShortcodes()
        ]);
        setTemplates(fetchedTemplates);
        setShortcodes(fetchedShortcodes);
      } catch (error) {
        console.error('Error fetching data:', error);
        // TODO: Show error message to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sample data for preview
  useEffect(() => {
    setPreviewData({
      customer: {
        name: 'Matti Meikäläinen',
        email: 'matti@example.com',
        phone: '+358 40 123 4567',
      },
      results: {
        savings: '€1,450',
        payback: '3.2 years',
        investment: '€4,650',
        co2: '2.8 tons/year',
      },
      company: {
        name: 'Energia Ykkönen',
        phone: '+358 20 123 4567',
        email: 'info@energiaykkonen.fi',
        website: 'www.energiaykkonen.fi',
      },
    });
  }, []);

  const insertShortcode = () => {
    if (selectedShortcode) {
      const shortcode = `{{${selectedShortcode}}}`;
      setCurrentTemplate(prev => ({
        ...prev,
        content: prev.content + shortcode,
      }));
      setSelectedShortcode('');
    }
  };

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = document.getElementById(
      'email-content'
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);

      let formattedText = '';
      switch (format) {
        case 'bold':
          formattedText = `<strong>${selectedText}</strong>`;
          break;
        case 'italic':
          formattedText = `<em>${selectedText}</em>`;
          break;
        case 'underline':
          formattedText = `<u>${selectedText}</u>`;
          break;
      }

      const newContent =
        textarea.value.substring(0, start) +
        formattedText +
        textarea.value.substring(end);

      setCurrentTemplate(prev => ({ ...prev, content: newContent }));

      // Set cursor position after the formatted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + formattedText.length,
          start + formattedText.length
        );
      }, 0);
    }
  };

  const renderPreview = (content: string) => {
    let renderedContent = content;

    // Replace shortcodes with sample data
    shortcodes.forEach(shortcode => {
      const value = shortcode.name
        .split('.')
        .reduce((obj, key) => obj?.[key], previewData);
      if (value) {
        renderedContent = renderedContent.replace(
          new RegExp(`{{${shortcode.name}}}`, 'g'),
          value
        );
      }
    });

    // Convert basic HTML tags
    renderedContent = renderedContent
      .replace(
        /<strong>(.*?)<\/strong>/g,
        '<span style="font-weight: bold;">$1</span>'
      )
      .replace(
        /<em>(.*?)<\/em>/g,
        '<span style="font-style: italic;">$1</span>'
      )
      .replace(
        /<u>(.*?)<\/u>/g,
        '<span style="text-decoration: underline;">$1</span>'
      );

    return renderedContent;
  };

  const saveTemplate = async () => {
    if (
      !currentTemplate.name ||
      !currentTemplate.subject ||
      !currentTemplate.content
    ) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      let savedTemplate: EmailTemplate;
      
      if (currentTemplate.id) {
        // Update existing template
        savedTemplate = await updateEmailTemplate(currentTemplate.id, {
          name: currentTemplate.name,
          subject: currentTemplate.subject,
          content: currentTemplate.content,
          category: currentTemplate.category || 'results',
        });
        
        // Update local state
        setTemplates(prev => prev.map(t => 
          t.id === currentTemplate.id ? savedTemplate : t
        ));
      } else {
        // Create new template
        savedTemplate = await createEmailTemplate({
          name: currentTemplate.name || '',
          subject: currentTemplate.subject || '',
          content: currentTemplate.content || '',
          category: currentTemplate.category || 'results',
        });
        
        // Add to local state
        setTemplates(prev => [savedTemplate, ...prev]);
      }

      // Reset form
      setCurrentTemplate({
        name: '',
        subject: '',
        content: '',
        category: 'results',
        version: 1,
      });

      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      // TODO: Implement actual test email sending
      alert('Test email sent! Check your inbox.');
    } catch (error) {
      alert('Failed to send test email');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Template Editor</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button onClick={saveTemplate} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Template Editor</TabsTrigger>
          <TabsTrigger value="shortcodes">Shortcodes</TabsTrigger>
          <TabsTrigger value="templates">Saved Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={currentTemplate.name}
                      onChange={e =>
                        setCurrentTemplate(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Customer Results Email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select
                      value={currentTemplate.category}
                      onValueChange={(
                        value: 'results' | 'sales-notification'
                      ) =>
                        setCurrentTemplate(prev => ({
                          ...prev,
                          category: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="results">
                          Customer Results
                        </SelectItem>
                        <SelectItem value="sales-notification">
                          Sales Notification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="template-subject">Email Subject</Label>
                    <Input
                      id="template-subject"
                      value={currentTemplate.subject}
                      onChange={e =>
                        setCurrentTemplate(prev => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      placeholder="e.g., Your Energy Savings Results"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('bold')}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('italic')}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('underline')}
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="email-content">Email Content</Label>
                    <Textarea
                      id="email-content"
                      value={currentTemplate.content}
                      onChange={e =>
                        setCurrentTemplate(prev => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Write your email content here... Use shortcodes for dynamic content."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="mb-4">
                      <strong>Subject:</strong>{' '}
                      {currentTemplate.subject || 'No subject'}
                    </div>
                    <Separator className="mb-4" />
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderPreview(
                          currentTemplate.content ||
                            'Start writing your email content...'
                        ),
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={sendTestEmail}
                    className="w-full"
                    variant="outline"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Template
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shortcodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Shortcodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shortcodes.map(shortcode => (
                  <div
                    key={shortcode.name}
                    className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedShortcode(shortcode.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {shortcode.category}
                      </Badge>
                    </div>
                    <div className="font-mono text-sm mb-1">
                      {`{{${shortcode.name}}}`}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {shortcode.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Example: {shortcode.example}
                    </div>
                  </div>
                ))}
              </div>

              {selectedShortcode && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Selected Shortcode:</strong>{' '}
                      {`{{${selectedShortcode}}}`}
                    </div>
                    <Button onClick={insertShortcode} size="sm">
                      Insert into Content
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <span className="text-muted-foreground">Loading templates...</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates saved yet. Create your first template above!
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setCurrentTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.subject}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{template.category}</Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            v{template.version}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
