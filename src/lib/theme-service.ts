import { supabase } from './supabase';
import { 
  GlobalTheme, 
  GlobalThemeCore, 
  CardStyleOverride,
  ThemeRecord,
  CardStyleOverrideRecord,
  DEFAULT_THEME_CORE,
  computeThemeColors,
} from './types/theme';

// Convert database record to theme object
function recordToTheme(record: ThemeRecord): GlobalTheme {
  const themeData = record.theme_data;
  return {
    ...themeData,
    id: record.id,
    name: record.name,
    description: record.description,
    isActive: record.is_active,
    isDefault: record.is_default,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

// Convert theme object to database record
function themeToRecord(theme: GlobalTheme): Omit<ThemeRecord, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: theme.name,
    description: theme.description,
    theme_data: theme,
    is_active: theme.isActive,
    is_default: theme.isDefault,
  };
}

// Get the currently active theme
export async function getActiveTheme(): Promise<GlobalTheme> {
  try {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn('No active theme found, using default');
      return createDefaultTheme();
    }

    return recordToTheme(data);
  } catch (error) {
    console.error('Error fetching active theme:', error);
    return createDefaultTheme();
  }
}

// Create a default theme from core settings
function createDefaultTheme(): GlobalTheme {
  return {
    ...DEFAULT_THEME_CORE,
    id: 'default',
    name: 'Default Theme',
    description: 'Clean and professional default theme',
    computed: computeThemeColors(DEFAULT_THEME_CORE),
    isActive: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Get all available themes
export async function getThemes(): Promise<GlobalTheme[]> {
  try {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch themes: ${error.message}`);
    }

    return data?.map(recordToTheme) || [];
  } catch (error) {
    console.error('Error fetching themes:', error);
    return [createDefaultTheme()];
  }
}

// Create a new theme
export async function createTheme(themeCore: GlobalThemeCore, name: string, description?: string): Promise<GlobalTheme> {
  const theme: GlobalTheme = {
    ...themeCore,
    id: '', // Will be set by database
    name,
    description,
    computed: computeThemeColors(themeCore),
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('themes')
    .insert([themeToRecord(theme)])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create theme: ${error.message}`);
  }

  return recordToTheme(data);
}

// Update an existing theme
export async function updateTheme(id: string, updates: Partial<GlobalThemeCore & { name?: string; description?: string }>): Promise<GlobalTheme> {
  // First get the existing theme
  const { data: existing, error: fetchError } = await supabase
    .from('themes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw new Error(`Theme not found: ${id}`);
  }

  const existingTheme = recordToTheme(existing);
  
  // Merge updates with existing theme
  const updatedCore: GlobalThemeCore = {
    primaryColor: updates.primaryColor || existingTheme.primaryColor,
    secondaryColor: updates.secondaryColor || existingTheme.secondaryColor,
    fontFamily: updates.fontFamily || existingTheme.fontFamily,
    headingFontFamily: updates.headingFontFamily || existingTheme.headingFontFamily,
    fieldSettings: updates.fieldSettings ? {
      ...existingTheme.fieldSettings,
      ...updates.fieldSettings,
    } : existingTheme.fieldSettings,
  };

  const updatedTheme: GlobalTheme = {
    ...existingTheme,
    ...updatedCore,
    name: updates.name || existingTheme.name,
    description: updates.description !== undefined ? updates.description : existingTheme.description,
    computed: computeThemeColors(updatedCore),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('themes')
    .update(themeToRecord(updatedTheme))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update theme: ${error.message}`);
  }

  return recordToTheme(data);
}

// Activate a theme (deactivates all others)
export async function activateTheme(id: string): Promise<void> {
  try {
    // Deactivate all themes
    await supabase
      .from('themes')
      .update({ is_active: false });

    // Activate the selected theme
    const { error } = await supabase
      .from('themes')
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to activate theme: ${error.message}`);
    }
  } catch (error) {
    console.error('Error activating theme:', error);
    throw error;
  }
}

// Delete a theme (cannot delete active or default themes)
export async function deleteTheme(id: string): Promise<void> {
  // Check if theme can be deleted
  const { data: theme, error: fetchError } = await supabase
    .from('themes')
    .select('is_active, is_default')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(`Theme not found: ${id}`);
  }

  if (theme.is_active) {
    throw new Error('Cannot delete the active theme');
  }

  if (theme.is_default) {
    throw new Error('Cannot delete the default theme');
  }

  const { error } = await supabase
    .from('themes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete theme: ${error.message}`);
  }
}

// Card override functions
export async function getCardOverrides(themeId?: string): Promise<Record<string, CardStyleOverride>> {
  try {
    let query = supabase
      .from('card_style_overrides')
      .select('*');

    if (themeId) {
      query = query.eq('theme_id', themeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch card overrides: ${error.message}`);
    }

    const overrides: Record<string, CardStyleOverride> = {};
    data?.forEach((record: CardStyleOverrideRecord) => {
      overrides[record.card_id] = record.style_overrides;
    });

    return overrides;
  } catch (error) {
    console.error('Error fetching card overrides:', error);
    return {};
  }
}

export async function setCardOverride(
  cardId: string, 
  themeId: string, 
  override: Partial<CardStyleOverride>
): Promise<void> {
  const styleOverride: CardStyleOverride = {
    cardId,
    ...override,
  };

  const { error } = await supabase
    .from('card_style_overrides')
    .upsert({
      card_id: cardId,
      theme_id: themeId,
      style_overrides: styleOverride,
    });

  if (error) {
    throw new Error(`Failed to set card override: ${error.message}`);
  }
}

export async function removeCardOverride(cardId: string, themeId: string): Promise<void> {
  const { error } = await supabase
    .from('card_style_overrides')
    .delete()
    .eq('card_id', cardId)
    .eq('theme_id', themeId);

  if (error) {
    throw new Error(`Failed to remove card override: ${error.message}`);
  }
}