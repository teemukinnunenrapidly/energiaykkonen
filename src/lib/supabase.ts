import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for our leads table
export interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  square_meters: number;
  ceiling_height: number;
  residents: number;
  current_heating_cost: number;
  current_heating_type: string;
  annual_energy_need: number;
  heat_pump_consumption: number;
  heat_pump_cost_annual: number;
  annual_savings: number;
  five_year_savings: number;
  ten_year_savings: number;
  payback_period: number;
  co2_reduction: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  notes?: string;
}

// Helper function to insert a new lead
export async function insertLead(leadData: Omit<Lead, 'id' | 'created_at'>) {
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
