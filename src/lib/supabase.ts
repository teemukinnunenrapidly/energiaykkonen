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
