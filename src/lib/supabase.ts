import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with basic configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dynamic field data stored in JSONB
export interface LeadFormData {
  // Property Details
  neliot?: number;
  huonekorkeus?: number;
  rakennusvuosi?: string;
  floors?: number;
  henkilomaara?: number;
  hot_water_usage?: string;

  // Property Address
  osoite?: string;
  paikkakunta?: string;
  postcode?: string;

  // Current Heating
  lammitysmuoto?: string;
  vesikiertoinen?: number;
  current_energy_consumption?: number;

  // Heat Pump Calculations
  annual_energy_need?: number;
  heat_pump_consumption?: number;
  heat_pump_cost_annual?: number;
  payback_period?: number;
  co2_reduction?: number;

  // Contact preferences
  valittutukimuoto?: string;
  message?: string;
  consent_timestamp?: string;

  // Any other dynamic fields from Card Builder
  [key: string]: any;
}

// Calculation results stored at submission time for PDF generation
export interface CalculationResults {
  // Energy calculations
  annual_energy_need?: number;
  heat_pump_consumption?: number;
  heat_pump_cost_annual?: number;
  current_heating_cost?: number;

  // Savings calculations
  annual_savings?: number;
  five_year_savings?: number;
  ten_year_savings?: number;
  payback_period?: number;

  // Environmental impact
  co2_reduction?: number;

  // Any other calculated values from PDF template shortcodes
  [key: string]: any;
}

// Database types for leads table with JSONB support
export interface Lead {
  // Primary key
  id: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Fixed columns from Card Builder (only these 5 + status)
  nimi: string;
  sahkoposti: string;
  puhelinnumero: string;
  paikkakunta?: string;
  osoite?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';

  // Optional admin notes
  notes?: string;

  // JSONB field containing ALL form inputs and inline calculations
  form_data?: LeadFormData;

  // Optional PDF URL (for display purposes in admin)
  pdf_url?: string;

  // JSONB field containing calculated values for PDF generation
  calculation_results?: CalculationResults;

  // Tracking fields
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
export interface CardCompletionRules {
  // For form cards: how to determine completion
  form_completion?: {
    type: 'any_field' | 'required_fields' | 'all_fields';
    required_field_names?: string[]; // Only used when type is 'required_fields'
  };
  // For info cards: always auto-complete (no fields to fill)
  // For calculation cards: auto-complete when calculation runs
  // For submit cards: complete when form is submitted
}

export interface NextCardRevealTiming {
  // When should the next card get reveal permission after THIS card completes?
  timing: 'immediately' | 'after_delay';
  delay_seconds?: number; // Only used when timing is 'after_delay'
}

// Legacy interface - keeping for backwards compatibility during migration
export interface RevealNextConditions {
  type: 'immediately' | 'required_complete' | 'all_complete' | 'after_delay';
  delay_seconds?: number; // For 'after_delay' type
  custom_conditions?: Record<string, any>;
}

// New completion framework interfaces
export interface CardCompletion {
  id: string;
  card_id: string;
  session_id: string;
  is_complete: boolean;
  completed_at: string | null;
  completion_data: Record<string, any>;
  completion_trigger: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldCompletion {
  id: string;
  card_id: string;
  field_name: string;
  session_id: string;
  field_value: string | null;
  is_complete: boolean;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

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
  reveal_conditions: RevealCondition[]; // Deprecated - keeping for backwards compatibility

  // New two-phase reveal system
  completion_rules?: CardCompletionRules;
  reveal_timing?: NextCardRevealTiming;

  // Legacy - keeping for backwards compatibility during migration
  reveal_next_conditions?: RevealNextConditions;

  styling: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    gradient?: boolean;
  };
  visual_object_id?: string;
  visual_objects?: any; // Visual objects relationship data
  is_active: boolean;
  created_at: string;
  updated_at: string;
  card_fields?: CardField[]; // Fields associated with this card
}

export interface CardField {
  id: string;
  card_id: string;
  field_name: string;
  field_type:
    | 'text'
    | 'number'
    | 'email'
    | 'select'
    | 'radio'
    | 'buttons'
    | 'checkbox'
    | 'textarea';
  label: string;
  placeholder?: string;
  help_text?: string;
  validation_rules: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    selectOnlyOne?: boolean; // For buttons field type - single vs multiple selection
  };
  width: 'full' | 'half' | 'third';
  display_order: number;
  options?: { value: string; label: string }[];
  required: boolean;
  card_templates?: {
    id: string;
    name: string;
    title: string;
  };
}

export interface RevealCondition {
  type: 'fields_complete' | 'card_complete' | 'value_check' | 'always';
  target?: string[]; // Card IDs or field names
  operator?: '=' | '>' | '<' | 'exists' | 'not_empty';
  value?: any;
}

// Helper functions
export async function getActiveCards() {
  // First get the active form stream
  const { data: streamData, error: streamError } = await supabase
    .from('form_streams')
    .select('*')
    .eq('slug', 'energy-calculator')
    .eq('is_active', true)
    .single();

  if (streamError) {
    throw streamError;
  }
  if (!streamData) {
    throw new Error('No active form stream found');
  }

  // Then get the cards for this stream in the correct order
  const { data, error } = await supabase
    .from('form_stream_cards')
    .select(
      `
      card_position,
      card_templates (
        *,
        card_fields (*)
      )
    `
    )
    .eq('stream_id', streamData.id)
    .eq('is_visible', true)
    .order('card_position');

  if (error) {
    throw error;
  }

  // Transform the data to match the expected format
  return (
    data?.map((item: any) => ({
      ...item.card_templates,
      card_fields: item.card_templates?.card_fields || [],
    })) || []
  );
}

// New function to get cards directly from card_templates (for preview/admin use)
export async function getCardsDirect() {
  try {
    const { data, error } = await supabase
      .from('card_templates')
      .select(
        `
        *,
        card_fields(*)
      `
      )
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching cards directly:', error);
      throw error;
    }

    // Filter out sample data cards with invalid UUIDs
    const validCards =
      data?.filter(card => !card.id.startsWith('00000000-0000-0000-0000-')) ||
      [];

    // Now fetch visual objects for cards that have linked_visual_object_id in config
    const cardsWithVisualObjects = await Promise.all(
      validCards.map(async card => {
        const linkedVisualObjectId = card.config?.linked_visual_object_id;
        console.log(
          `🔍 Card "${card.name}" linked_visual_object_id:`,
          linkedVisualObjectId
        );

        if (linkedVisualObjectId) {
          console.log(
            `🔎 Fetching visual object with ID: ${linkedVisualObjectId}`
          );
          const { data: visualObject, error: visualError } = await supabase
            .from('visual_objects')
            .select('*')
            .eq('id', linkedVisualObjectId)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

          if (visualObject) {
            console.log(
              `✅ Found visual object "${visualObject.title}" for card "${card.name}"`
            );
            return {
              ...card,
              visual_objects: visualObject,
            };
          } else if (visualError) {
            console.error(
              `❌ Error fetching visual object for card "${card.name}":`,
              visualError.message
            );
            console.error(
              `   - Tried to fetch visual object ID: ${linkedVisualObjectId}`
            );
          } else {
            console.warn(
              `⚠️ Visual object not found for card "${card.name}" with ID: ${linkedVisualObjectId}`
            );
            console.warn(
              `   - This visual object may have been deleted from the database`
            );
            console.warn(
              `   - Please update the card configuration in admin panel`
            );
          }
        }
        return card;
      })
    );

    console.log(
      `Loaded ${cardsWithVisualObjects.length} cards directly from card_templates`
    );
    return cardsWithVisualObjects;
  } catch (error) {
    console.error('Failed to get cards directly:', error);
    return [];
  }
}

// Completion Framework Functions
export async function updateFieldCompletion(
  cardId: string,
  fieldName: string,
  fieldValue: any,
  sessionId: string
) {
  try {
    const isComplete =
      fieldValue !== undefined && fieldValue !== null && fieldValue !== '';

    const { data, error } = await supabase
      .from('field_completions')
      .upsert(
        {
          card_id: cardId,
          field_name: fieldName,
          session_id: sessionId,
          field_value: String(fieldValue || ''),
          is_complete: isComplete,
          completed_at: isComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'card_id,field_name,session_id',
        }
      )
      .select()
      .single();

    if (error) {
      // Fail silently for authentication/permission errors
      return null;
    }

    return data;
  } catch {
    // Fail silently for any network/auth errors
    return null;
  }
}

export async function updateCardCompletion(
  cardId: string,
  sessionId: string,
  isComplete: boolean,
  completionTrigger?: string
) {
  try {
    const { data, error } = await supabase
      .from('card_completions')
      .upsert(
        {
          card_id: cardId,
          session_id: sessionId,
          is_complete: isComplete,
          completed_at: isComplete ? new Date().toISOString() : null,
          completion_trigger: completionTrigger,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'card_id,session_id',
        }
      )
      .select()
      .single();

    if (error) {
      // Fail silently for authentication/permission errors
      // This tracking is optional and shouldn't break the app
      return null;
    }

    return data;
  } catch {
    // Fail silently for any network/auth errors
    return null;
  }
}

export async function getCardCompletion(): Promise<CardCompletion | null> {
  // Temporarily disabled to avoid 406 errors - functionality works without it
  return null;
}

export async function getFieldCompletions(
  cardId: string,
  sessionId: string
): Promise<FieldCompletion[]> {
  const { data, error } = await supabase
    .from('field_completions')
    .select('*')
    .eq('card_id', cardId)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching field completions:', error);
    return [];
  }

  return data || [];
}

export async function checkCardCompletion(
  cardId: string,
  sessionId: string
): Promise<boolean> {
  try {
    // Get card template to understand completion rules
    const { data: cardData, error: cardError } = await supabase
      .from('card_templates')
      .select('*, card_fields(*)')
      .eq('id', cardId)
      .single();

    if (cardError || !cardData) {
      console.error('Error fetching card for completion check:', cardError);
      return false;
    }

    // Get field completions for this card
    const fieldCompletions = await getFieldCompletions(cardId, sessionId);
    const completedFields = fieldCompletions.filter(fc => fc.is_complete);

    // Determine completion rules
    let completionType = 'any_field'; // default
    if (cardData.completion_rules?.form_completion?.type) {
      completionType = cardData.completion_rules.form_completion.type;
    } else if (cardData.reveal_next_conditions?.type) {
      // Fallback to legacy system
      switch (cardData.reveal_next_conditions.type) {
        case 'all_complete':
          completionType = 'all_fields';
          break;
        case 'required_complete':
          completionType = 'required_fields';
          break;
        default:
          completionType = 'any_field';
      }
    }

    const totalFields = cardData.card_fields?.length || 0;
    const requiredFields =
      cardData.card_fields?.filter(
        (f: any) => f.required || f.is_completion_required
      ) || [];

    console.log(`🔍 Completion check for "${cardData.name}":`, {
      completionType,
      totalFields,
      requiredFieldCount: requiredFields.length,
      completedFieldCount: completedFields.length,
      completedFields: completedFields.map(f => f.field_name),
    });

    // Apply completion rules
    switch (completionType) {
      case 'all_fields':
        return totalFields > 0 && completedFields.length === totalFields;

      case 'required_fields':
        if (requiredFields.length === 0) {
          // No required fields specified, any field completion works
          return completedFields.length > 0;
        } else {
          // Check if all required fields are completed
          return requiredFields.every((reqField: any) =>
            completedFields.some(
              compField => compField.field_name === reqField.field_name
            )
          );
        }

      case 'any_field':
      default:
        return completedFields.length > 0;
    }
  } catch (error) {
    console.error('Error in checkCardCompletion:', error);
    return false;
  }
}

/**
 * Clear all field completions for a specific session
 * This ensures each session starts with a clean slate
 */
export async function clearSessionFieldCompletions(
  sessionId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('field_completions')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error clearing session field completions:', error);
      throw error;
    }

    console.log(`✅ Cleared field completions for session: ${sessionId}`);
  } catch (error) {
    console.error('Failed to clear session field completions:', error);
    throw error;
  }
}

/**
 * Initialize a clean session by clearing any existing field completions
 * and card completions for this session
 */
export async function initializeCleanSession(sessionId: string): Promise<void> {
  try {
    // Clear field completions
    await clearSessionFieldCompletions(sessionId);

    // Clear card completions
    const { error: cardError } = await supabase
      .from('card_completions')
      .delete()
      .eq('session_id', sessionId);

    if (cardError) {
      console.error('Error clearing session card completions:', cardError);
      throw cardError;
    }

    console.log(`🧹 Initialized clean session: ${sessionId}`);
  } catch (error) {
    console.error('Failed to initialize clean session:', error);
    throw error;
  }
}
