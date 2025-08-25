import { supabase } from '@/lib/supabase';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category:
    | 'results'
    | 'sales-notification'
    | 'welcome'
    | 'follow-up'
    | 'other';
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateData {
  name: string;
  subject: string;
  content: string;
  category: EmailTemplate['category'];
}

export interface UpdateEmailTemplateData {
  name?: string;
  subject?: string;
  content?: string;
  category?: EmailTemplate['category'];
  is_active?: boolean;
}

// Get all email templates
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching email templates:', error);
    throw new Error(`Failed to fetch email templates: ${error.message}`);
  }

  return data || [];
}

// Get email template by ID
export async function getEmailTemplate(
  id: string
): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching email template:', error);
    throw new Error(`Failed to fetch email template: ${error.message}`);
  }

  return data;
}

// Create a new email template
export async function createEmailTemplate(
  data: CreateEmailTemplateData
): Promise<EmailTemplate> {
  const { data: result, error } = await supabase
    .from('email_templates')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating email template:', error);
    throw new Error(`Failed to create email template: ${error.message}`);
  }

  return result;
}

// Update an existing email template
export async function updateEmailTemplate(
  id: string,
  data: UpdateEmailTemplateData
): Promise<EmailTemplate> {
  const { data: result, error } = await supabase
    .from('email_templates')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating email template:', error);
    throw new Error(`Failed to update email template: ${error.message}`);
  }

  return result;
}

// Delete an email template (soft delete)
export async function deleteEmailTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('email_templates')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting email template:', error);
    throw new Error(`Failed to delete email template: ${error.message}`);
  }
}

// Get templates by category
export async function getEmailTemplatesByCategory(
  category: EmailTemplate['category']
): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching email templates by category:', error);
    throw new Error(
      `Failed to fetch email templates by category: ${error.message}`
    );
  }

  return data || [];
}
