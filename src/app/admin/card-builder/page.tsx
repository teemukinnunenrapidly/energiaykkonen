'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CardList } from '@/components/admin/card-builder/CardList';
import { CardEditor } from '@/components/admin/card-builder/CardEditor';
import { PropertiesPanel } from '@/components/admin/card-builder/PropertiesPanel';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { supabase, type CardTemplate, type CardField } from '@/lib/supabase';
import { Save, AlertCircle } from 'lucide-react';

export default function CardBuilderPage() {
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shortcodes, setShortcodes] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load cards on mount
  useEffect(() => {
    console.log('CardBuilder component mounted, calling loadCards...');
    loadCards();
    loadShortcodes();
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadCards = async () => {
    try {
      console.log('Loading cards from database...');

      const { data, error } = await supabase
        .from('card_templates')
        .select('*, card_fields(*)')
        .order('display_order');

      if (error) {
        console.error('Error loading cards:', error);
        alert(`Failed to load cards: ${error.message}`);
        return;
      }

      if (data) {
        // Filter out sample data cards with invalid UUIDs
        const validCards = data.filter(
          card => !card.id.startsWith('00000000-0000-0000-0000-')
        );

        if (validCards.length !== data.length) {
          console.log(
            `Filtered out ${data.length - validCards.length} sample data cards`
          );
        }

        console.log(
          `Loaded ${validCards.length} valid cards:`,
          validCards.map(c => c.name)
        );
        setCards(validCards);
        if (validCards.length > 0 && !selectedCardId) {
          setSelectedCardId(validCards[0].id);
        }
      } else {
        console.log('No cards found in database');
        setCards([]);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
      alert('Failed to load cards from database');
    }
  };

  const loadShortcodes = async () => {
    // Load available shortcodes from calculations and lookups
    const { data: formulas } = await supabase.from('formulas').select('name');
    const { data: lookups } = await supabase
      .from('formula_lookups')
      .select('name');

    const allShortcodes = [];

    if (formulas) {
      allShortcodes.push(...formulas.map(f => `[calc:${f.name}]`));
    }

    if (lookups) {
      allShortcodes.push(...lookups.map(l => `[lookup:${l.name}]`));
    }

    setShortcodes(allShortcodes);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setCards(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);

      // Update display_order
      return reordered.map((card, index) => ({
        ...card,
        display_order: index + 1,
      }));
    });

    setHasUnsavedChanges(true);
  };

  const createNewCard = () => {
    const newCard: CardTemplate = {
      id: `temp-${Date.now()}`,
      name: `new_card_${cards.length + 1}`,
      display_order: cards.length + 1,
      type: 'form',
      title: 'New Card',
      config: {}, // Required, NOT NULL
      reveal_conditions: [], // Has default but let's be explicit
      reveal_next_conditions: { type: 'immediately' }, // New field with default
      styling: {}, // Has default but let's be explicit
      is_active: true, // Has default but let's be explicit
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCards([...cards, newCard]);
    setSelectedCardId(newCard.id);
    setHasUnsavedChanges(true);
  };

  const duplicateCard = (cardId: string) => {
    const cardToDuplicate = cards.find(c => c.id === cardId);
    if (!cardToDuplicate) {
      return;
    }

    // Find the index of the card to duplicate
    const originalIndex = cards.findIndex(c => c.id === cardId);

    // Create new card with duplicated fields
    const newCard = {
      ...cardToDuplicate,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${cardToDuplicate.name}_copy`,
      title: `${cardToDuplicate.title} (Copy)`,
      // Insert the duplicated card right after the original
      display_order: cardToDuplicate.display_order + 1,
      // Duplicate all fields with new temporary IDs and proper display_order
      card_fields:
        cardToDuplicate.card_fields?.map((field, index) => ({
          ...field,
          id: `temp-field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: `${field.label} (Copy)`,
          field_name: `${field.field_name}_copy`,
          display_order: index, // Ensure proper order
        })) || [],
      reveal_next_conditions: cardToDuplicate.reveal_next_conditions || {
        type: 'immediately',
      },
    };

    // Insert the new card after the original card
    const newCards = [...cards];
    newCards.splice(originalIndex + 1, 0, newCard);

    // Update display_order for all cards after the insertion point
    const updatedCards = newCards.map((card, index) => ({
      ...card,
      display_order: index + 1,
    }));

    setCards(updatedCards);
    setSelectedCardId(newCard.id);
    setHasUnsavedChanges(true);
  };

  const duplicateField = (cardId: string, fieldToDuplicate: CardField) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) {
      return;
    }

    const newField: CardField = {
      ...fieldToDuplicate,
      id: `temp-field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: `${fieldToDuplicate.label} (Copy)`,
      field_name: `${fieldToDuplicate.field_name}_copy`,
      display_order: (card.card_fields || []).length + 1,
    };

    const updatedCard = {
      ...card,
      card_fields: [...(card.card_fields || []), newField],
    };

    setCards(cards.map(c => (c.id === cardId ? updatedCard : c)));
    setHasUnsavedChanges(true);
  };

  const deleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      // If it's NOT a temporary card, delete from database first
      if (!cardId.startsWith('temp-')) {
        console.log('Deleting card from database:', cardId);

        // First delete any card_fields associated with this card
        const { error: fieldsError } = await supabase
          .from('card_fields')
          .delete()
          .eq('card_id', cardId);

        if (fieldsError) {
          console.error('Error deleting card fields:', fieldsError);
        }

        // Then delete the card itself
        const { error } = await supabase
          .from('card_templates')
          .delete()
          .eq('id', cardId);

        if (error) {
          throw new Error(`Database deletion failed: ${error.message}`);
        }

        console.log('Card deleted from database successfully');
      }

      // Remove from local state and reorder remaining cards
      const newCards = cards
        .filter(c => c.id !== cardId)
        .map((card, index) => ({
          ...card,
          display_order: index + 1,
        }));

      setCards(newCards);

      // Update selected card if needed
      if (selectedCardId === cardId) {
        setSelectedCardId(newCards[0]?.id || null);
      }

      setHasUnsavedChanges(true);

      // If we deleted a real card, save the new order immediately
      if (!cardId.startsWith('temp-')) {
        await saveCardOrder(newCards);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert(
        `Failed to delete card: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const updateCard = (cardId: string, updates: Partial<CardTemplate>) => {
    setCards(cards.map(c => (c.id === cardId ? { ...c, ...updates } : c)));
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    setLoading(true);
    try {
      console.log('Starting to save all changes...');

      // Update display_order for all cards first
      const orderedCards = cards.map((card, index) => ({
        ...card,
        display_order: index + 1,
      }));

      // Separate temp cards from existing cards
      const tempCards = orderedCards.filter(c => c.id.startsWith('temp-'));
      const existingCards = orderedCards.filter(
        c => !c.id.startsWith('temp-') && !c.id.startsWith('00000000-')
      );

      // Initialize cardsToProcess with orderedCards, will be updated if we create new cards
      let cardsToProcess = orderedCards;

      // Insert all new cards
      if (tempCards.length > 0) {
        const cardsToInsert = tempCards.map(tempCard => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, card_fields, ...card } = tempCard;
          return {
            ...card,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        const { data: newCards, error: insertError } = await supabase
          .from('card_templates')
          .insert(cardsToInsert)
          .select();

        if (insertError) {
          throw new Error(`Failed to create cards: ${insertError.message}`);
        }
        console.log(`Created ${tempCards.length} new cards`);

        // Update local state with real IDs for new cards
        const updatedCards = orderedCards.map(card => {
          if (card.id.startsWith('temp-')) {
            const newCard = newCards?.find(nc => nc.name === card.name);
            return newCard ? { ...card, id: newCard.id } : card;
          }
          return card;
        });

        // Update cardsToProcess with the real IDs
        cardsToProcess = updatedCards;
        setCards(updatedCards);
      }

      // Save/update card fields for all cards
      for (const card of cardsToProcess) {
        if (!card.id.startsWith('00000000-')) {
          console.log(
            `Processing fields for card: ${card.name} (ID: ${card.id})`
          );

          // First, get all existing fields for this card from the database to check for deletions
          const { data: existingFields, error: fetchError } = await supabase
            .from('card_fields')
            .select('id')
            .eq('card_id', card.id);

          if (fetchError) {
            console.error(
              `Failed to fetch existing fields for card ${card.name}:`,
              fetchError
            );
          } else if (existingFields) {
            // Find fields that exist in database but not in current card.card_fields (these were deleted)
            const currentFieldIds = card.card_fields?.map(f => f.id) || [];
            const fieldsToDelete = existingFields.filter(
              dbField =>
                !dbField.id.startsWith('temp-field-') &&
                !currentFieldIds.includes(dbField.id)
            );

            // Delete removed fields from database
            for (const fieldToDelete of fieldsToDelete) {
              console.log(`Deleting field ${fieldToDelete.id} from database`);
              const { error: deleteError } = await supabase
                .from('card_fields')
                .delete()
                .eq('id', fieldToDelete.id);

              if (deleteError) {
                console.error(
                  `Failed to delete field ${fieldToDelete.id}:`,
                  deleteError
                );
              } else {
                console.log(`Successfully deleted field ${fieldToDelete.id}`);
              }
            }
          }

          // Now process the remaining fields (create/update)
          if (card.card_fields && card.card_fields.length > 0) {
            for (const field of card.card_fields) {
              if (field.id.startsWith('temp-field-')) {
                // Create new field
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, ...fieldData } = field;

                // Ensure all required fields are present with defaults
                const completeFieldData = {
                  field_name: field.field_name,
                  field_type: field.field_type,
                  label: field.label,
                  placeholder: field.placeholder || '',
                  help_text: field.help_text || '',
                  validation_rules: field.validation_rules || {},
                  width: field.width || 'full',
                  display_order: field.display_order ?? 0,
                  options: field.options || [],
                  required: field.required ?? false,
                };

                // Add better validation and logging
                console.log(
                  `Creating field ${field.field_name} for card ${card.name}:`,
                  completeFieldData
                );
                console.log('Full field object:', field);

                // Validate required fields for creation
                const requiredFields = [
                  'field_name',
                  'field_type',
                  'label',
                  'width',
                  'display_order',
                  'required',
                ];
                const missingFields = requiredFields.filter(fieldName => {
                  const value =
                    completeFieldData[
                      fieldName as keyof typeof completeFieldData
                    ];
                  return (
                    value === null ||
                    value === undefined ||
                    (fieldName === 'field_name' && value === '')
                  );
                });

                if (missingFields.length > 0) {
                  console.error(
                    `Missing required fields for ${field.field_name}:`,
                    missingFields
                  );
                  console.error(
                    'Available field data:',
                    Object.keys(completeFieldData)
                  );
                  console.error('Field values:', completeFieldData);
                  continue; // Skip this field
                }

                const { error: fieldError } = await supabase
                  .from('card_fields')
                  .insert({
                    ...completeFieldData,
                    card_id: card.id,
                  });

                if (fieldError && Object.keys(fieldError).length > 0) {
                  console.error(
                    `Failed to create field ${field.field_name}:`,
                    fieldError
                  );
                  console.error(
                    'Field data being inserted:',
                    completeFieldData
                  );
                  console.error(
                    'Supabase error details:',
                    JSON.stringify(fieldError, null, 2)
                  );
                } else {
                  console.log(
                    `Created field: ${field.field_name} for card ${card.name}`
                  );
                }
              } else {
                // Update existing field
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, card_id, ...fieldData } = field;

                // Ensure all required fields are present with defaults if missing
                const completeFieldData = {
                  field_name: field.field_name,
                  field_type: field.field_type,
                  label: field.label,
                  placeholder: field.placeholder || '',
                  help_text: field.help_text || '',
                  validation_rules: field.validation_rules || {},
                  width: field.width || 'full',
                  display_order: field.display_order ?? 0,
                  options: field.options || [],
                  required: field.required ?? false,
                  // Note: removed updated_at as it doesn't exist in the card_fields table
                };

                // Add better validation and logging
                console.log(
                  `Updating field ${field.field_name} (ID: ${field.id}):`,
                  completeFieldData
                );
                console.log('Full field object:', field);

                // Check if field exists before updating
                const { data: existingField, error: checkError } =
                  await supabase
                    .from('card_fields')
                    .select('*')
                    .eq('id', field.id)
                    .single();

                if (checkError) {
                  console.error(
                    `Field ${field.field_name} (ID: ${field.id}) not found in database:`,
                    checkError
                  );
                  console.error(
                    'Check error details:',
                    JSON.stringify(checkError, null, 2)
                  );

                  // If field doesn't exist, treat it as a new field instead of skipping
                  console.log(
                    `Field ${field.field_name} not found, treating as new field`
                  );

                  // Create the field instead of updating
                  const { error: createError } = await supabase
                    .from('card_fields')
                    .insert({
                      ...completeFieldData,
                      card_id: card.id,
                    });

                  if (createError) {
                    console.error(
                      `Failed to create field ${field.field_name}:`,
                      createError
                    );
                  } else {
                    console.log(
                      `Created missing field: ${field.field_name} for card ${card.name}`
                    );
                  }
                  continue; // Skip the update logic
                }

                console.log('Existing field in database:', existingField);
                console.log('Comparing field data:');
                console.log('- Current field object:', field);
                console.log('- Database field:', existingField);

                // Validate required fields are not null/undefined
                const requiredFields = [
                  'field_name',
                  'field_type',
                  'label',
                  'width',
                  'display_order',
                  'required',
                ];
                const missingFields = requiredFields.filter(fieldName => {
                  const value =
                    completeFieldData[
                      fieldName as keyof typeof completeFieldData
                    ];
                  return (
                    value === null ||
                    value === undefined ||
                    (fieldName === 'field_name' && value === '')
                  );
                });

                if (missingFields.length > 0) {
                  console.error(
                    `Missing required fields for ${field.field_name}:`,
                    missingFields
                  );
                  console.error(
                    'Available field data:',
                    Object.keys(completeFieldData)
                  );
                  console.error('Field values:', completeFieldData);
                  continue; // Skip this field
                }

                // Additional data validation
                console.log('Data type validation:');
                console.log(
                  '- field_name type:',
                  typeof completeFieldData.field_name
                );
                console.log(
                  '- field_type type:',
                  typeof completeFieldData.field_type
                );
                console.log('- label type:', typeof completeFieldData.label);
                console.log('- width type:', typeof completeFieldData.width);
                console.log(
                  '- display_order type:',
                  typeof completeFieldData.display_order
                );
                console.log(
                  '- required type:',
                  typeof completeFieldData.required
                );
                console.log(
                  '- validation_rules type:',
                  typeof completeFieldData.validation_rules
                );
                console.log(
                  '- options type:',
                  typeof completeFieldData.options
                );

                console.log(
                  'Attempting to update field with data:',
                  completeFieldData
                );
                console.log('Update target ID:', field.id);

                const { data: updateResult, error: fieldError } = await supabase
                  .from('card_fields')
                  .update(completeFieldData)
                  .eq('id', field.id)
                  .select(); // Return the updated record

                if (fieldError && Object.keys(fieldError).length > 0) {
                  console.error(
                    `Failed to update field ${field.field_name} (ID: ${field.id}):`,
                    fieldError
                  );
                  console.error('Field data being updated:', completeFieldData);
                  console.error(
                    'Supabase error details:',
                    JSON.stringify(fieldError, null, 2)
                  );
                  // Skip this field and continue with others instead of stopping
                  continue;
                } else {
                  console.log(
                    `Updated field: ${field.field_name} (ID: ${field.id})`
                  );
                  console.log('Update result:', updateResult);
                }
              }
            }
          }
        }
      }

      // Update existing cards
      for (const card of existingCards) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { card_fields, ...updateData } = card;
        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('card_templates')
          .update(updateData)
          .eq('id', card.id);

        if (updateError) {
          throw new Error(
            `Failed to update card ${card.name}: ${updateError.message}`
          );
        }
      }

      console.log('All changes saved successfully!');
      setHasUnsavedChanges(false);
      setNotification({
        type: 'success',
        message: 'All changes saved successfully! 🎉',
      });

      // Auto-hide success notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);

      await loadCards(); // Reload to get real IDs
    } catch (error) {
      console.error('Save failed:', error);
      setNotification({
        type: 'error',
        message: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to save just the order
  const saveCardOrder = async (orderedCards: CardTemplate[]) => {
    try {
      for (const card of orderedCards) {
        if (!card.id.startsWith('temp-')) {
          const { error } = await supabase
            .from('card_templates')
            .update({ display_order: card.display_order })
            .eq('id', card.id);

          if (error) {
            console.error('Error updating card order:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update card order:', error);
    }
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="flex h-screen bg-gray-50">
        {/* Header Bar */}
        <div className="fixed top-16 left-0 right-0 h-16 bg-white border-b z-10 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Card Builder</h1>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <span className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </span>
            )}
            {/* Success/Error Notification */}
            {notification && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                  notification.type === 'success'
                    ? 'bg-green-600'
                    : 'bg-red-600'
                }`}
              >
                {notification.type === 'success' ? '✅' : '❌'}
                {notification.message}
                <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            )}
            <button
              onClick={saveAllChanges}
              disabled={!hasUnsavedChanges || loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save All Changes
            </button>
          </div>
        </div>

        <div className="flex w-full pt-32">
          {/* Left Column: Cards List + Editor */}
          <div className="flex-[3] flex">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={cards}
                strategy={verticalListSortingStrategy}
              >
                <CardList
                  cards={cards}
                  selectedCardId={selectedCardId}
                  onSelectCard={setSelectedCardId}
                  onCreateCard={createNewCard}
                  onDuplicateCard={duplicateCard}
                  onDeleteCard={deleteCard}
                />
              </SortableContext>
            </DndContext>

            {selectedCard && (
              <CardEditor
                card={selectedCard}
                onUpdateCard={updates => updateCard(selectedCard.id, updates)}
                onSelectField={setSelectedFieldId}
                selectedFieldId={selectedFieldId}
                allCards={cards}
                onDuplicateField={duplicateField}
              />
            )}
          </div>

          {/* Right Column: Properties Panel */}
          <div className="flex-[1] min-w-[400px]">
            <PropertiesPanel
              card={selectedCard}
              selectedFieldId={selectedFieldId}
              shortcodes={shortcodes}
              allCards={cards}
              onUpdateCard={updates =>
                selectedCard && updateCard(selectedCard.id, updates)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
