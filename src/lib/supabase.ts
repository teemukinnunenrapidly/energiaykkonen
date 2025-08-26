import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with basic configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for our leads table (matches PRD schema)
export interface Lead {
  // Primary key
  id: string;

  // Form inputs: House Information (Step 1)
  square_meters: number;
  ceiling_height: number; // 2.5, 3.0, or 3.5
  construction_year: string; // '<1970' | '1970-1990' | '1991-2010' | '>2010'
  floors: number;

  // Form inputs: Current Heating (Step 2)
  heating_type: string; // 'Oil' | 'Electric' | 'District' | 'Other'
  current_heating_cost: number;
  current_energy_consumption?: number; // Optional

  // Form inputs: Household (Step 3)
  residents: number;
  hot_water_usage: string; // 'Low' | 'Normal' | 'High'

  // Contact info (Step 4)
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street_address?: string;
  city?: string;
  contact_preference: string; // 'Email' | 'Phone' | 'Both'
  message?: string;

  // Calculated values
  annual_energy_need: number;
  heat_pump_consumption: number;
  heat_pump_cost_annual: number;
  annual_savings: number;
  five_year_savings: number;
  ten_year_savings: number;
  payback_period: number;
  co2_reduction: number;

  // Lead management
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  ip_address?: string;
  user_agent?: string;
  source_page?: string;
}

// Helper function to insert a new lead
export async function insertLead(
  leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('leads')
    .insert([leadData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error inserting lead: ${error.message}`);
  }

  return data;
}

// Helper function to get all leads
export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching leads: ${error.message}`);
  }

  return data;
}

// Card system types
export interface CardTemplate {
  id: string;
  name: string;
  display_order: number;
  type: 'form' | 'calculation' | 'info' | 'visual' | 'submit';
  title: string;
  config: {
    description?: string;
    buttonText?: string;
    infoContent?: string;
    [key: string]: any;
  };
  reveal_conditions: RevealCondition[];
  styling: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    gradient?: boolean;
  };
  visual_object_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardField {
  id: string;
  card_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'email' | 'select' | 'radio' | 'checkbox' | 'textarea';
  label: string;
  placeholder?: string;
  help_text?: string;
  validation_rules: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  width: 'full' | 'half' | 'third';
  display_order: number;
  options?: { value: string; label: string; }[];
  required: boolean;
}

export interface RevealCondition {
  type: 'fields_complete' | 'card_complete' | 'value_check' | 'always';
  target?: string[]; // Card IDs or field names
  operator?: '=' | '>' | '<' | 'exists' | 'not_empty';
  value?: any;
}

// Helper functions
export async function getActiveCards() {
  const { data, error } = await supabase
    .from('card_templates')
    .select(`
      *,
      card_fields (*)
    `)
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return data;
}
