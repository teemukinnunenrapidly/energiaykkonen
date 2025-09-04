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
  const [originalFields, setOriginalFields] = useState<
    Record<string, CardField>
  >({});
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
        .select(
          `
          *,
          card_fields(*),
          visual_objects(*)
        `
        )
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

        // Store original field values for tracking changes
        const fieldsMap: Record<string, CardField> = {};
        validCards.forEach(card => {
          if (card.card_fields) {
            card.card_fields.forEach((field: CardField) => {
              fieldsMap[field.id] = { ...field };
            });
          }
        });
        setOriginalFields(fieldsMap);

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
    // Load available shortcodes from calculations and enhanced lookups
    const { data: formulas } = await supabase
      .from('formulas')
      .select('name')
      .eq('is_active', true);

    const { data: lookups } = await supabase
      .from('enhanced_lookups')
      .select('name')
      .eq('is_active', true);

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
      console.log('🚀 Starting optimized save...');

      // 1. Update display_order for all cards
      const orderedCards = cards.map((card, index) => ({
        ...card,
        display_order: index + 1,
      }));

      // 2. Separate temp cards from existing cards
      const tempCards = orderedCards.filter(c => c.id.startsWith('temp-'));
      const existingCards = orderedCards.filter(
        c => !c.id.startsWith('temp-') && !c.id.startsWith('00000000-')
      );

      let cardsToProcess = orderedCards;

      // 3. BATCH INSERT: Create all new cards at once
      if (tempCards.length > 0) {
        console.log(`📦 Batch creating ${tempCards.length} cards...`);

        const cardsToInsert = tempCards.map(tempCard => {
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

        // Update local state with real IDs
        const updatedCards = orderedCards.map(card => {
          if (card.id.startsWith('temp-')) {
            const newCard = newCards?.find(nc => nc.name === card.name);
            return newCard ? { ...card, id: newCard.id } : card;
          }
          return card;
        });

        cardsToProcess = updatedCards;
        setCards(updatedCards);
      }

      // 4. BATCH UPDATE: Update all existing cards at once
      if (existingCards.length > 0) {
        console.log(`📦 Batch updating ${existingCards.length} cards...`);

        for (const card of existingCards) {
          // Remove fields that don't exist in database
          const { card_fields, visual_objects, visual_object_id, ...cardData } =
            card;
          const { error } = await supabase
            .from('card_templates')
            .update({
              ...cardData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', card.id);

          if (error) {
            console.error(`❌ Error updating card ${card.name}:`, error);
            console.error('Card data being sent:', cardData);
          }
        }
      }

      // 5. BATCH FIELD OPERATIONS: Process all fields efficiently
      await batchProcessFields(cardsToProcess);

      console.log('✅ Optimized save completed!');
      setHasUnsavedChanges(false);
      setNotification({
        type: 'success',
        message: 'All changes saved successfully! 🎉',
      });

      // Auto-hide success notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);

      // Reload cards to update originalFields with the new database state
      await loadCards();
    } catch (error) {
      console.error('❌ Save failed:', error);
      setNotification({
        type: 'error',
        message: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const batchProcessFields = async (cards: CardTemplate[]) => {
    console.log('📦 Starting optimized batch field operations...');

    // Collect all operations
    const fieldsToCreate: any[] = [];
    const fieldsToUpdate: any[] = [];
    const fieldIdsToDelete: string[] = [];

    // Get all existing fields in ONE query instead of per-card queries
    const cardIds = cards.filter(c => !c.id.startsWith('temp-')).map(c => c.id);

    const existingFieldMap = new Map();
    if (cardIds.length > 0) {
      const { data: existingFields, error: fetchError } = await supabase
        .from('card_fields')
        .select('id, card_id')
        .in('card_id', cardIds);

      if (fetchError) {
        throw new Error(
          `Failed to fetch existing fields: ${fetchError.message}`
        );
      }

      // Group existing fields by card_id
      existingFields?.forEach(field => {
        if (!existingFieldMap.has(field.card_id)) {
          existingFieldMap.set(field.card_id, []);
        }
        existingFieldMap.get(field.card_id).push(field.id);
      });
    }

    // Process each card's fields
    for (const card of cards) {
      if (card.id.startsWith('00000000-')) {
        continue;
      }

      const currentFieldIds = card.card_fields?.map(f => f.id) || [];
      const existingFieldIds = existingFieldMap.get(card.id) || [];

      // Find fields to delete (exist in DB but not in current state)
      const toDelete = existingFieldIds.filter(
        (dbFieldId: string) =>
          !dbFieldId.startsWith('temp-field-') &&
          !currentFieldIds.includes(dbFieldId)
      );
      fieldIdsToDelete.push(...toDelete);

      // Process fields for create/update
      if (card.card_fields) {
        for (const field of card.card_fields) {
          if (field.id.startsWith('temp-field-')) {
            // New field - add to create batch
            const { id, ...fieldData } = field;
            const completeFieldData = {
              ...fieldData,
              card_id: card.id,
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
            fieldsToCreate.push(completeFieldData);
          } else {
            // Existing field - add to update batch
            const { id, card_id, ...fieldData } = field;

            // Check if field_name has changed
            const originalField = originalFields[field.id];
            const oldFieldName = originalField?.field_name;
            const newFieldName = field.field_name;

            if (oldFieldName && newFieldName && oldFieldName !== newFieldName) {
              // Track field name change for leads table sync
              console.log(
                `🔄 Field name change detected: ${oldFieldName} → ${newFieldName}`
              );

              // Sync leads table column
              fetch('/api/admin/sync-lead-columns', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Admin-Password':
                    localStorage.getItem('adminPassword') || '',
                },
                body: JSON.stringify({
                  oldFieldName,
                  newFieldName,
                }),
              })
                .then(res => res.json())
                .then(result => {
                  if (result.success) {
                    console.log(
                      `✅ Leads table column synced: ${oldFieldName} → ${newFieldName}`
                    );
                  } else if (result.warning) {
                    console.warn(`⚠️ ${result.warning}`);
                  } else if (result.error) {
                    console.error(
                      `❌ Failed to sync leads column: ${result.error}`
                    );
                  }
                })
                .catch(err => {
                  console.error('Error syncing leads column:', err);
                });
            }

            const completeFieldData = {
              ...fieldData,
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
            fieldsToUpdate.push({ id: field.id, ...completeFieldData });
          }
        }
      }
    }

    // Execute batch operations
    const totalOps =
      fieldsToCreate.length + fieldsToUpdate.length + fieldIdsToDelete.length;
    console.log(
      `📦 Executing ${totalOps} field operations: ${fieldsToCreate.length} creates, ${fieldsToUpdate.length} updates, ${fieldIdsToDelete.length} deletes`
    );

    // 1. Batch delete - Single query
    if (fieldIdsToDelete.length > 0) {
      console.log(`🗑️ Batch deleting ${fieldIdsToDelete.length} fields...`);
      const { error: deleteError } = await supabase
        .from('card_fields')
        .delete()
        .in('id', fieldIdsToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete fields: ${deleteError.message}`);
      }
    }

    // 2. Batch create - Single query
    if (fieldsToCreate.length > 0) {
      console.log(`✨ Batch creating ${fieldsToCreate.length} fields...`);
      const { error: createError } = await supabase
        .from('card_fields')
        .insert(fieldsToCreate);

      if (createError) {
        console.error('Create error details:', createError);
        console.error('Fields being created:', fieldsToCreate);
        throw new Error(`Failed to create fields: ${createError.message}`);
      }
    }

    // 3. Parallel updates - Much faster than sequential
    if (fieldsToUpdate.length > 0) {
      console.log(`🔄 Parallel updating ${fieldsToUpdate.length} fields...`);
      const updatePromises = fieldsToUpdate.map(field => {
        const { id, ...updateData } = field;
        return supabase.from('card_fields').update(updateData).eq('id', id);
      });

      const updateResults = await Promise.all(updatePromises);
      const updateErrors = updateResults.filter(result => result.error);

      if (updateErrors.length > 0) {
        console.error('Update errors:', updateErrors);
        throw new Error(`Failed to update ${updateErrors.length} fields`);
      }
    }

    console.log('✅ Batch field operations completed successfully!');
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
