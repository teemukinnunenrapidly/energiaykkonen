import React, { useState, useEffect } from 'react';
import { Plus, GripVertical, Edit2, Trash2, Copy, Image } from 'lucide-react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardTemplate, CardField } from '@/lib/supabase';
import { FieldModal } from './FieldModal';
import { RichTextEditor } from './RichTextEditor';
import {
  getVisualObjects,
  getVisualObjectById,
  type VisualObject,
  type VisualObjectWithDetails,
  getSafeImageUrl,
} from '@/lib/visual-assets-service';
import {
  getEmailTemplates,
  type EmailTemplate,
} from '@/lib/email-templates-service';

// Validation function for reveal conditions - preserved for future use
// const validateRevealConditions = (
//   conditions: any[],
//   allCards: CardTemplate[]
// ) => {
//   if (!conditions || !Array.isArray(conditions)) {
//     return conditions;
//   }

//   return conditions.map(condition => {
//     if (condition.type === 'card_complete' && condition.target) {
//       // Filter out non-existent card references
//       const validTargets = condition.target.filter((targetName: string) =>
//         allCards.some(c => c.name === targetName)
//       );

//       return { ...condition, target: validTargets };
//     }
//     return condition;
//   });
// };

interface CardEditorProps {
  card: CardTemplate;
  allCards: CardTemplate[]; // All cards for validation
  onUpdateCard: (updates: Partial<CardTemplate>) => void;
  onSelectField: (fieldId: string | null) => void;
  selectedFieldId: string | null;
  onDuplicateField: (cardId: string, fieldToDuplicate: CardField) => void;
}

function SortableField({
  field,
  isSelected,
  onEdit,
  onDuplicate,
  onDelete,
  onSelect,
}: {
  field: CardField;
  isSelected: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border rounded p-3 mb-2 cursor-pointer
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {field.icon && (
              <span className="material-icons text-gray-600 text-sm">
                {field.icon}
              </span>
            )}
            <span className="font-medium text-sm">{field.label}</span>
            <span className="text-xs text-gray-500">({field.field_type})</span>
            {field.required && <span className="text-xs text-red-500">*</span>}
          </div>
          <div className="text-xs text-gray-500">{field.field_name}</div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Edit field"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-blue-50 rounded"
            title="Duplicate field"
          >
            <Copy className="w-3 h-3 text-blue-500" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-50 rounded"
            title="Delete field"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardEditor({
  card,
  allCards: _allCards, // eslint-disable-line @typescript-eslint/no-unused-vars
  onUpdateCard,
  onSelectField,
  selectedFieldId,
  onDuplicateField,
}: CardEditorProps) {
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CardField | null>(null);
  const [visualObjects, setVisualObjects] = useState<VisualObject[]>([]);
  const [loadingVisualObjects, setLoadingVisualObjects] = useState(false);
  const [linkedVisualObject, setLinkedVisualObject] =
    useState<VisualObjectWithDetails | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const fields = card.card_fields || [];

  // Load visual objects for linking
  useEffect(() => {
    const loadVisualObjects = async () => {
      setLoadingVisualObjects(true);
      try {
        const objects = await getVisualObjects();
        setVisualObjects(objects);
      } catch (error) {
        console.error('Failed to load visual objects:', error);
      } finally {
        setLoadingVisualObjects(false);
      }
    };

    loadVisualObjects();
  }, []);

  // Load email templates when submit button is enabled
  useEffect(() => {
    const loadEmailTemplates = async () => {
      if (card.config?.has_submit_button || card.type === 'submit') {
        setLoadingTemplates(true);
        try {
          const templates = await getEmailTemplates();
          setEmailTemplates(templates);
        } catch (error) {
          console.error('Error loading email templates:', error);
        } finally {
          setLoadingTemplates(false);
        }
      }
    };
    loadEmailTemplates();
  }, [card.config?.has_submit_button, card.type]);

  // Load linked visual object details when card changes
  useEffect(() => {
    const loadLinkedVisualObject = async () => {
      if (card.config?.linked_visual_object_id) {
        try {
          const visualObject = await getVisualObjectById(
            card.config.linked_visual_object_id
          );
          setLinkedVisualObject(visualObject);
        } catch (error) {
          console.error('Failed to load linked visual object:', error);
          setLinkedVisualObject(null);
        }
      } else {
        setLinkedVisualObject(null);
      }
    };

    loadLinkedVisualObject();
  }, [card.config?.linked_visual_object_id]);

  // Wrapper function to validate reveal conditions before updating
  // Preserved for future use when reveal condition validation is needed
  // const _handleUpdateCard = (updates: Partial<CardTemplate>) => {
  //   if (updates.reveal_next_conditions) {
  //     // Validate reveal conditions if they're being updated
  //     const validatedConditions = validateRevealConditions(
  //       [updates.reveal_next_conditions],
  //       allCards
  //     );
  //     updates.reveal_next_conditions = validatedConditions[0];
  //   }
  //   onUpdateCard(updates);
  // };

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    const reorderedFields = arrayMove(fields, oldIndex, newIndex).map(
      (f, i) => ({
        ...f,
        display_order: i,
      })
    );

    onUpdateCard({ card_fields: reorderedFields });
  };

  const handleAddField = () => {
    setEditingField(null);
    setFieldModalOpen(true);
  };

  const handleEditField = (field: CardField) => {
    setEditingField(field);
    setFieldModalOpen(true);
  };

  const handleSaveField = (fieldData: Partial<CardField>) => {
    if (editingField) {
      // Update existing field
      const updatedFields = fields.map(f =>
        f.id === editingField.id ? { ...f, ...fieldData } : f
      );
      onUpdateCard({ card_fields: updatedFields });
    } else {
      // Add new field
      const newField: CardField = {
        id: `temp-field-${Date.now()}`,
        card_id: card.id,
        display_order: fields.length,
        ...fieldData,
      } as CardField;
      onUpdateCard({ card_fields: [...fields, newField] });
    }
    setFieldModalOpen(false);
  };

  const handleDuplicateField = (field: CardField) => {
    // Use the onDuplicateField prop to handle field duplication
    onDuplicateField(card.id, field);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('Delete this field?')) {
      onUpdateCard({ card_fields: fields.filter(f => f.id !== fieldId) });
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <input
          type="text"
          value={card.title || ''}
          onChange={e => onUpdateCard({ title: e.target.value })}
          className="text-2xl font-bold w-full border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none px-2 py-1"
          placeholder="Enter card title (supports shortcodes like [calc:savings])"
        />
        <p className="text-xs text-gray-500 mt-1">
          You can use shortcodes from the Calculations page in the title, e.g.,
          [calc:annual-savings]
        </p>
      </div>

      {/* Card Type Specific Content */}
      {card.type === 'form' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Fields</h3>
            <button
              onClick={handleAddField}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>

          <DndContext onDragEnd={handleFieldDragEnd}>
            <SortableContext
              items={fields}
              strategy={verticalListSortingStrategy}
            >
              {fields.map(field => (
                <SortableField
                  key={field.id}
                  field={field}
                  isSelected={field.id === selectedFieldId}
                  onEdit={() => handleEditField(field)}
                  onDuplicate={() => handleDuplicateField(field)}
                  onDelete={() => handleDeleteField(field.id)}
                  onSelect={() => onSelectField(field.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {card.type === 'info' && (
        <div>
          <h3 className="font-semibold mb-4">Content</h3>
          <RichTextEditor
            content={card.config?.content || ''}
            onChange={content =>
              onUpdateCard({
                config: { ...card.config, content },
              })
            }
          />
        </div>
      )}

      {card.type === 'calculation' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-4">Display Template</h3>
            <p className="text-xs text-gray-500 mb-2">
              Use shortcodes from the Calculations page to display calculation
              results
            </p>
            <textarea
              value={card.config?.display_template || ''}
              onChange={e =>
                onUpdateCard({
                  config: { ...card.config, display_template: e.target.value },
                })
              }
              className="w-full p-3 border rounded"
              rows={4}
              placeholder="Your savings will be [calc:energy-savings] per year"
            />
            <p className="text-xs text-gray-500 mt-2">
              Use shortcodes like [calc:formula-name] to insert calculated
              values
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Calculation Configuration</h3>
            
            {/* Database Field Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Database Field Name
              </label>
              <p className="text-xs text-gray-500 mb-2">
                The field name to store this calculation result in the database
              </p>
              <input
                type="text"
                value={card.config?.field_name || ''}
                onChange={e => {
                  // Sanitize field name for database compatibility
                  const sanitized = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, '_')
                    .replace(/^_+|_+$/g, '')
                    .replace(/_+/g, '_');
                  
                  onUpdateCard({
                    config: { ...card.config, field_name: sanitized },
                  });
                }}
                className="w-full p-2 border rounded font-mono text-sm"
                placeholder="e.g., annual_energy_consumption"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use lowercase, underscores, no spaces or special characters
              </p>
            </div>

            {/* Calculation Result Shortcode */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Calculation Result Shortcode
              </label>
              <p className="text-xs text-gray-500 mb-2">
                The shortcode that will display the actual calculation result with
                units
              </p>
              <input
                type="text"
                value={card.config?.main_result || ''}
                onChange={e =>
                  onUpdateCard({
                    config: { ...card.config, main_result: e.target.value },
                  })
                }
                className="w-full p-3 border rounded font-mono"
                placeholder="[calc:energy-consumption-kwh] or [calc:annual-savings-eur]"
              />
              <p className="text-xs text-gray-500 mt-2">
                Include units in the shortcode name (e.g., kwh, eur, %) - the
                shortcode will be replaced with the actual calculated value
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">User Edit Mode</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={card.config?.enable_edit_mode || false}
                  onChange={e =>
                    onUpdateCard({
                      config: {
                        ...card.config,
                        enable_edit_mode: e.target.checked,
                      },
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">
                  Allow users to edit the calculated value
                </span>
              </label>

              {card.config?.enable_edit_mode && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Edit Button Text
                    </label>
                    <input
                      type="text"
                      value={card.config?.edit_button_text || 'Korjaa lukemaa'}
                      onChange={e =>
                        onUpdateCard({
                          config: {
                            ...card.config,
                            edit_button_text: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Korjaa lukemaa"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Text shown on the button to enter edit mode
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Validation Range (optional)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={card.config?.validation_min || ''}
                        onChange={e =>
                          onUpdateCard({
                            config: {
                              ...card.config,
                              validation_min: e.target.value,
                            },
                          })
                        }
                        className="flex-1 p-2 border rounded"
                        placeholder="Min (e.g., 0)"
                      />
                      <span className="text-gray-500">–</span>
                      <input
                        type="number"
                        value={card.config?.validation_max || ''}
                        onChange={e =>
                          onUpdateCard({
                            config: {
                              ...card.config,
                              validation_max: e.target.value,
                            },
                          })
                        }
                        className="flex-1 p-2 border rounded"
                        placeholder="Max (e.g., 100000)"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Reasonable min/max limits for user input validation
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Edit Prompt (optional)
                    </label>
                    <input
                      type="text"
                      value={card.config?.edit_prompt || ''}
                      onChange={e =>
                        onUpdateCard({
                          config: {
                            ...card.config,
                            edit_prompt: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Syötä todellinen kulutuksesi laskustasi"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Help text shown when editing the value
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button Configuration - Available for all card types */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold mb-3 text-green-800">Submit Button</h3>

        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={card.config?.has_submit_button || false}
              onChange={e =>
                onUpdateCard({
                  config: {
                    ...card.config,
                    has_submit_button: e.target.checked,
                  },
                })
              }
            />
            <span>Add submit button to this card</span>
          </label>
          <p className="text-xs text-gray-600 ml-6">
            When enabled, this card will automatically be considered complete
            when the submit button is clicked.
          </p>

          {card.config?.has_submit_button && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={card.config?.submit_button_text || 'Submit'}
                  onChange={e =>
                    onUpdateCard({
                      config: {
                        ...card.config,
                        submit_button_text: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Submit"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Text shown on the submit button
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Success Message
                </label>
                <input
                  type="text"
                  value={card.config?.submit_success_message || ''}
                  onChange={e =>
                    onUpdateCard({
                      config: {
                        ...card.config,
                        submit_success_message: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Thank you! Your submission has been received."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Message shown after successful submission
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Template
                </label>
                {loadingTemplates ? (
                  <div className="w-full p-2 border rounded bg-gray-50 text-gray-500">
                    Loading templates...
                  </div>
                ) : (
                  <select
                    value={card.config?.submit_email_template || ''}
                    onChange={e =>
                      onUpdateCard({
                        config: {
                          ...card.config,
                          submit_email_template: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="">No email</option>
                    {emailTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Email template to send when form is submitted
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-Phase Reveal System */}
      {
        <div className="mt-6 space-y-6">
          {/* FORM CARDS: Show both Card Completion and Reveal Timing sections */}
          {card.type === 'form' && (
            <>
              {/* Card Completion Section */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-800">
                  Card Completion
                </h3>
                <p className="text-sm text-blue-600 mb-3">
                  When is this card considered complete?
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="completion_rule"
                      value="required_complete"
                      checked={
                        card.completion_rules?.form_completion?.type ===
                          'required_fields' ||
                        card.reveal_next_conditions?.type ===
                          'required_complete' ||
                        (!card.completion_rules?.form_completion &&
                          !card.reveal_next_conditions)
                      }
                      onChange={() =>
                        onUpdateCard({
                          completion_rules: {
                            form_completion: { type: 'required_fields' },
                          },
                        })
                      }
                    />
                    <span>After all required fields are complete</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="completion_rule"
                      value="all_complete"
                      checked={
                        card.completion_rules?.form_completion?.type ===
                          'all_fields' ||
                        card.reveal_next_conditions?.type === 'all_complete'
                      }
                      onChange={() =>
                        onUpdateCard({
                          completion_rules: {
                            form_completion: { type: 'all_fields' },
                          },
                        })
                      }
                    />
                    <span>After all fields are complete</span>
                  </label>
                </div>
              </div>

              {/* Reveal Timing Section for Form Cards */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800">
                  Reveal Timing
                </h3>
                <p className="text-sm text-green-600 mb-3">
                  When should the next card be revealed after this card is
                  completed?
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="reveal_timing"
                      value="immediately"
                      checked={
                        card.reveal_timing?.timing === 'immediately' ||
                        (!card.reveal_timing &&
                          (!card.reveal_next_conditions ||
                            card.reveal_next_conditions.type ===
                              'immediately' ||
                            card.reveal_next_conditions.type ===
                              'required_complete' ||
                            card.reveal_next_conditions.type ===
                              'all_complete'))
                      }
                      onChange={() =>
                        onUpdateCard({
                          reveal_timing: { timing: 'immediately' },
                        })
                      }
                    />
                    <span>Immediately when this card is completed</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="reveal_timing"
                      value="after_delay"
                      checked={
                        card.reveal_timing?.timing === 'after_delay' ||
                        card.reveal_next_conditions?.type === 'after_delay'
                      }
                      onChange={() =>
                        onUpdateCard({
                          reveal_timing: {
                            timing: 'after_delay',
                            delay_seconds: 3,
                          },
                        })
                      }
                    />
                    <span>After</span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={
                        card.reveal_timing?.delay_seconds ||
                        card.reveal_next_conditions?.delay_seconds ||
                        3
                      }
                      onChange={e =>
                        onUpdateCard({
                          reveal_timing: {
                            timing: 'after_delay',
                            delay_seconds: parseInt(e.target.value) || 3,
                          },
                        })
                      }
                      disabled={
                        card.reveal_timing?.timing !== 'after_delay' &&
                        card.reveal_next_conditions?.type !== 'after_delay'
                      }
                      className="w-16 px-2 py-1 mx-2 border rounded text-sm disabled:opacity-50"
                    />
                    <span>seconds</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* INFO/VISUAL/CALCULATION CARDS: Show only Reveal Timing section */}
          {(card.type === 'info' ||
            card.type === 'visual' ||
            card.type === 'calculation') && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-3 text-yellow-800">
                Reveal Timing
              </h3>
              <p className="text-sm text-yellow-600 mb-3">
                When should the next card be revealed?
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reveal_timing"
                    value="immediately"
                    checked={
                      card.reveal_timing?.timing === 'immediately' ||
                      card.reveal_next_conditions?.type === 'immediately' ||
                      (!card.reveal_timing && !card.reveal_next_conditions)
                    }
                    onChange={() =>
                      onUpdateCard({
                        reveal_timing: { timing: 'immediately' },
                      })
                    }
                  />
                  <span>Immediately when this card is revealed</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reveal_timing"
                    value="after_delay"
                    checked={
                      card.reveal_timing?.timing === 'after_delay' ||
                      card.reveal_next_conditions?.type === 'after_delay'
                    }
                    onChange={() =>
                      onUpdateCard({
                        reveal_timing: {
                          timing: 'after_delay',
                          delay_seconds: 3,
                        },
                      })
                    }
                  />
                  <span>After</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={
                      card.reveal_timing?.delay_seconds ||
                      card.reveal_next_conditions?.delay_seconds ||
                      3
                    }
                    onChange={e =>
                      onUpdateCard({
                        reveal_timing: {
                          timing: 'after_delay',
                          delay_seconds: parseInt(e.target.value) || 3,
                        },
                      })
                    }
                    disabled={
                      card.reveal_timing?.timing !== 'after_delay' &&
                      card.reveal_next_conditions?.type !== 'after_delay'
                    }
                    className="w-16 px-2 py-1 mx-2 border rounded text-sm disabled:opacity-50"
                  />
                  <span>seconds</span>
                </label>
              </div>
            </div>
          )}
        </div>
      }

      {/* Visual Object Linking */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Image className="w-5 h-5 text-blue-600" />
          Linked Visual Object
        </h3>
        <div className="space-y-3">
          {loadingVisualObjects ? (
            <div className="text-sm text-gray-600">
              Loading visual objects...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <select
                  value={card.config?.linked_visual_object_id || ''}
                  onChange={e =>
                    onUpdateCard({
                      config: {
                        ...card.config,
                        linked_visual_object_id: e.target.value || undefined,
                      },
                    })
                  }
                  className="flex-1 p-2 border rounded text-sm"
                >
                  <option value="">No visual object linked</option>
                  {visualObjects.map(obj => (
                    <option key={obj.id} value={obj.id}>
                      {obj.title} ({obj.name})
                    </option>
                  ))}
                </select>
              </div>

              {card.config?.linked_visual_object_id && linkedVisualObject && (
                <div className="space-y-3">
                  <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                    <strong>Linked:</strong> This card will display the selected
                    visual object in the Visual Support panel when active.
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="border border-blue-200 rounded-lg p-3 bg-white">
                    <div className="flex items-start gap-3">
                      {linkedVisualObject.images &&
                        linkedVisualObject.images.length > 0 && (
                          <div className="flex-shrink-0 relative">
                            <img
                              src={getSafeImageUrl(
                                linkedVisualObject.images[0]
                                  .cloudflare_image_id,
                                'public'
                              )}
                              alt={linkedVisualObject.title}
                              className="w-16 h-16 object-cover rounded border border-gray-200"
                            />
                            {/* Show +X more images indicator if there are multiple images */}
                            {linkedVisualObject.images.length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                                +{linkedVisualObject.images.length - 1}
                              </div>
                            )}
                          </div>
                        )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {linkedVisualObject.title}
                        </h4>
                        {linkedVisualObject.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {linkedVisualObject.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {linkedVisualObject.images?.length || 0} image
                            {(linkedVisualObject.images?.length || 0) !== 1
                              ? 's'
                              : ''}
                          </span>
                          <span className="text-xs text-blue-600 font-medium">
                            {linkedVisualObject.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-600">
                Link a visual object to show relevant images, diagrams, or
                content in the Visual Support panel when this card is active.
              </div>
            </>
          )}
        </div>
      </div>

      {fieldModalOpen && (
        <FieldModal
          field={editingField}
          existingFields={fields}
          onSave={handleSaveField}
          onClose={() => setFieldModalOpen(false)}
        />
      )}
    </div>
  );
}

export default CardEditor;
