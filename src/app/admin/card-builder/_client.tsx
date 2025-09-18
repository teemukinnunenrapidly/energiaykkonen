'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [originalFields, setOriginalFields] = useState<Record<string, CardField>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('card_templates')
        .select(`*, card_fields(*), visual_objects(*)`)
        .order('display_order')
        .order('display_order', { foreignTable: 'card_fields' });
      if (error) {
        alert(`Failed to load cards: ${error.message}`);
        return;
      }
      if (data) {
        const validCards = data.filter(card => !card.id.startsWith('00000000-0000-0000-0000-'));
        const fieldsMap: Record<string, CardField> = {};
        validCards.forEach(card => card.card_fields?.forEach((f: CardField) => (fieldsMap[f.id] = { ...f })));
        setOriginalFields(fieldsMap);
        setCards(validCards);
        // Only set a default selection if none exists yet
        if (validCards.length > 0) {
          setSelectedCardId(prev => prev ?? validCards[0].id);
        }
      } else {
        setCards([]);
      }
    } catch {
      alert('Failed to load cards from database');
    }
  }, []);

  const loadShortcodes = useCallback(async () => {
    const { data: formulas } = await supabase.from('formulas').select('name').eq('is_active', true);
    const { data: lookups } = await supabase.from('enhanced_lookups').select('name').eq('is_active', true);
    const all: string[] = [];
    if (formulas) all.push(...formulas.map(f => `[calc:${f.name}]`));
    if (lookups) all.push(...lookups.map(l => `[lookup:${l.name}]`));
    setShortcodes(all);
  }, []);

  useEffect(() => {
    loadCards();
    loadShortcodes();
  }, [loadCards, loadShortcodes]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCards(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      return reordered.map((card, index) => ({ ...card, display_order: index + 1 }));
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
      config: {},
      reveal_conditions: [],
      reveal_next_conditions: { type: 'immediately' },
      styling: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;
    // Use functional updates to avoid stale state in React batched updates
    setCards(prev => {
      const next = [...prev, newCard];
      return next.map((c, i) => ({ ...c, display_order: i + 1 }));
    });
    // Select the newly created card immediately and on next frame to be safe
    setSelectedCardId(newCard.id);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => setSelectedCardId(newCard.id));
    }
    setHasUnsavedChanges(true);
  };

  const duplicateCard = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const originalIndex = cards.findIndex(c => c.id === cardId);
    const newCard = {
      ...card,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${card.name}_copy`,
      title: `${card.title} (Copy)`,
      display_order: card.display_order + 1,
      card_fields: card.card_fields?.map((f, i) => ({ ...f, id: `temp-field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, label: `${f.label} (Copy)`, field_name: `${f.field_name}_copy`, display_order: i })) || [],
      reveal_next_conditions: card.reveal_next_conditions || { type: 'immediately' },
    } as any;
    const newCards = [...cards];
    newCards.splice(originalIndex + 1, 0, newCard);
    const updated = newCards.map((c, i) => ({ ...c, display_order: i + 1 }));
    setCards(updated);
    setSelectedCardId(newCard.id);
    setHasUnsavedChanges(true);
  };

  const duplicateField = (cardId: string, fieldToDuplicate: CardField) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const newField: CardField = { ...fieldToDuplicate, id: `temp-field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, label: `${fieldToDuplicate.label} (Copy)`, field_name: `${fieldToDuplicate.field_name}_copy`, display_order: (card.card_fields || []).length + 1 } as any;
    const updatedCard = { ...card, card_fields: [...(card.card_fields || []), newField] } as any;
    setCards(cards.map(c => (c.id === cardId ? updatedCard : c)));
    setHasUnsavedChanges(true);
  };

  const deleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    try {
      if (!cardId.startsWith('temp-')) {
        await supabase.from('card_fields').delete().eq('card_id', cardId);
        const { error } = await supabase.from('card_templates').delete().eq('id', cardId);
        if (error) throw new Error(error.message);
      }
      const newCards = cards.filter(c => c.id !== cardId).map((c, i) => ({ ...c, display_order: i + 1 }));
      setCards(newCards);
      if (selectedCardId === cardId) setSelectedCardId(newCards[0]?.id || null);
      setHasUnsavedChanges(true);
      if (!cardId.startsWith('temp-')) await saveCardOrder(newCards);
    } catch (e) {
      alert(`Failed to delete card: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const updateCard = (cardId: string, updates: Partial<CardTemplate>) => {
    setCards(cards.map(c => (c.id === cardId ? { ...c, ...updates } : c)));
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    setLoading(true);
    try {
      const ordered = cards.map((c, i) => ({ ...c, display_order: i + 1 }));
      const tempCards = ordered.filter(c => c.id.startsWith('temp-'));
      const existing = ordered.filter(c => !c.id.startsWith('temp-') && !c.id.startsWith('00000000-'));
      let toProcess = ordered;
      if (tempCards.length > 0) {
        const { data: newCards, error } = await supabase.from('card_templates').insert(tempCards.map(tc => ({ ...tc, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))).select();
        if (error) throw new Error(`Failed to create cards: ${error.message}`);
        const updated = ordered.map(card => (card.id.startsWith('temp-') ? newCards?.find(nc => nc.name === card.name) || card : card));
        toProcess = updated as any;
        setCards(updated as any);
      }
      if (existing.length > 0) {
        for (const card of existing) {
          await supabase.from('card_templates').update({ ...card, updated_at: new Date().toISOString() }).eq('id', card.id);
        }
      }
      await batchProcessFields(toProcess as any);
      setHasUnsavedChanges(false);
      setNotification({ type: 'success', message: 'All changes saved successfully! 🎉' });
      setTimeout(() => setNotification(null), 5000);
      await loadCards();
    } catch (e) {
      setNotification({ type: 'error', message: `Save failed: ${e instanceof Error ? e.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const batchProcessFields = async (cardsToProc: CardTemplate[]) => {
    const fieldsToCreate: any[] = [];
    const fieldsToUpdate: any[] = [];
    const fieldIdsToDelete: string[] = [];
    const cardIds = cardsToProc.filter(c => !c.id.startsWith('temp-')).map(c => c.id);
    const existingFieldMap = new Map();
    if (cardIds.length > 0) {
      const { data: existingFields } = await supabase.from('card_fields').select('id, card_id').in('card_id', cardIds);
      existingFields?.forEach(f => {
        if (!existingFieldMap.has(f.card_id)) existingFieldMap.set(f.card_id, []);
        existingFieldMap.get(f.card_id).push(f.id);
      });
    }
    for (const card of cardsToProc) {
      if (card.id.startsWith('00000000-')) continue;
      const currentFieldIds = card.card_fields?.map(f => f.id) || [];
      const existingFieldIds = existingFieldMap.get(card.id) || [];
      const toDelete = existingFieldIds.filter((id: string) => !id.startsWith('temp-field-') && !currentFieldIds.includes(id));
      fieldIdsToDelete.push(...toDelete);
      if (card.card_fields) {
        for (const field of card.card_fields) {
          if (field.id.startsWith('temp-field-')) {
            fieldsToCreate.push({ ...field, card_id: card.id, placeholder: field.placeholder || '', help_text: field.help_text || '', validation_rules: field.validation_rules || {}, width: field.width || 'full', display_order: field.display_order ?? 0, options: field.options || [], required: field.required ?? false });
          } else {
            const { id: _, ...rest } = field as any;
            fieldsToUpdate.push({ id: field.id, ...rest });
          }
        }
      }
    }
    if (fieldIdsToDelete.length > 0) await supabase.from('card_fields').delete().in('id', fieldIdsToDelete);
    if (fieldsToCreate.length > 0) await supabase.from('card_fields').insert(fieldsToCreate);
    if (fieldsToUpdate.length > 0) await Promise.all(fieldsToUpdate.map(f => { const { id, ...rest } = f; return supabase.from('card_fields').update(rest).eq('id', id); }));
  };

  const saveCardOrder = async (orderedCards: CardTemplate[]) => {
    try {
      for (const card of orderedCards) {
        if (!card.id.startsWith('temp-')) {
          await supabase.from('card_templates').update({ display_order: card.display_order }).eq('id', card.id);
        }
      }
    } catch {}
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="flex h-screen bg-gray-50">
        <div className="fixed top-16 left-0 right-0 h-16 bg-white border-b z-10 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Card Builder</h1>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <span className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" /> Unsaved changes
              </span>
            )}
            <button onClick={saveAllChanges} disabled={!hasUnsavedChanges || loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> Save All Changes
            </button>
          </div>
        </div>

        <div className="flex w-full pt-32">
          <div className="flex-[3] flex">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cards} strategy={verticalListSortingStrategy}>
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

          <div className="flex-[1] min-w-[400px]">
            <PropertiesPanel
              card={selectedCard}
              selectedFieldId={selectedFieldId}
              shortcodes={shortcodes}
              allCards={cards}
              onUpdateCard={updates => selectedCard && updateCard(selectedCard.id, updates)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


