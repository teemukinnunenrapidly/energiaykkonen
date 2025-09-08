/**
 * Card types for standalone widget
 * No Supabase dependencies - pure TypeScript types
 */

export interface CardTemplate {
  id: string;
  name: string;
  title: string;
  type: 'form' | 'calculation' | 'info' | 'submit' | 'results';
  display_order: number;
  config?: any;
  visual_object_id?: string;
  visual_objects?: any;
  is_active: boolean;
  reveal_conditions?: any[];
  fields?: CardField[];
  card_fields?: CardField[];
}

export interface CardField {
  id: string;
  card_id?: string;
  field_name: string;
  field_type: 'text' | 'number' | 'email' | 'select' | 'radio' | 'buttons' | 'checkbox' | 'textarea';
  label: string;
  placeholder?: string;
  help_text?: string;
  validation_rules?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    selectOnlyOne?: boolean;
  };
  width?: 'full' | 'half' | 'third';
  display_order: number;
  options?: { value: string; label: string }[];
  required: boolean;
}

// Mock functions for widget - these don't actually call Supabase
export async function getCardsDirect(): Promise<CardTemplate[]> {
  // In widget mode, this will be replaced by data from config.json
  if (typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA?.cards) {
    return (window as any).__E1_WIDGET_DATA.cards;
  }
  return [];
}

export async function updateFieldCompletion(
  sessionId: string,
  cardId: string,
  fieldName: string,
  isComplete: boolean
): Promise<void> {
  // No-op in widget mode - we don't persist to database
  console.log('Mock updateFieldCompletion:', { sessionId, cardId, fieldName, isComplete });
}

export async function updateCardCompletion(
  sessionId: string,
  cardId: string,
  isComplete: boolean
): Promise<void> {
  // No-op in widget mode - we don't persist to database
  console.log('Mock updateCardCompletion:', { sessionId, cardId, isComplete });
}

export async function getCardCompletion(
  sessionId: string,
  cardId: string
): Promise<{ is_complete: boolean } | null> {
  // Always return not complete in widget mode
  return { is_complete: false };
}

export async function checkCardCompletion(
  sessionId: string,
  cardId: string,
  formData: Record<string, any>
): Promise<boolean> {
  // Simple check based on required fields
  return true;
}

export async function initializeCleanSession(sessionId: string): Promise<void> {
  // No-op in widget mode
  console.log('Mock initializeCleanSession:', sessionId);
}