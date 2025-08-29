import React, { useState } from 'react';
import { Info, Code, Settings } from 'lucide-react';
import { RevealConditionsEditor } from './RevealConditionsEditor';
import type { CardTemplate } from '@/lib/supabase';
import { generateUniqueCardName } from '@/lib/id-utils';

interface PropertiesPanelProps {
  card: CardTemplate | undefined;
  selectedFieldId: string | null;
  shortcodes: string[];
  allCards: CardTemplate[]; // All cards for generating unique names
  onUpdateCard: (updates: Partial<CardTemplate>) => void;
}

export function PropertiesPanel({
  card,
  selectedFieldId: _selectedFieldId, // eslint-disable-line @typescript-eslint/no-unused-vars
  shortcodes,
  allCards,
  onUpdateCard,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'shortcodes'>(
    'properties'
  );

  // Handler to update card title and auto-generate card name
  const handleTitleChange = (title: string) => {
    if (!card) {
      return;
    }

    // Generate unique card name from title
    const existingCardNames = allCards
      .filter(c => c.id !== card.id) // Exclude current card
      .map(c => c.name);
    const generatedName = generateUniqueCardName(title, existingCardNames);

    onUpdateCard({
      title,
      name: generatedName,
    });
  };

  if (!card) {
    return (
      <div className="w-96 border-l bg-white p-4">
        <p className="text-gray-500">Select a card to view properties</p>
      </div>
    );
  }

  return (
    <div className="w-96 border-l bg-white flex flex-col">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
            activeTab === 'properties'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          <Settings className="w-4 h-4" />
          Properties
        </button>
        <button
          onClick={() => setActiveTab('shortcodes')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
            activeTab === 'shortcodes'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          <Code className="w-4 h-4" />
          Shortcodes
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Basic Properties */}
            <div>
              <h3 className="font-semibold mb-3">Card Properties</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Card Title*
                  </label>
                  <input
                    type="text"
                    value={card.title || ''}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Enter card title (e.g., Property Details)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Card name will be auto-generated:{' '}
                    <span className="font-mono text-blue-600">{card.name}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Card Type
                  </label>
                  <select
                    value={card.type}
                    onChange={e =>
                      onUpdateCard({ type: e.target.value as any })
                    }
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="form">Form</option>
                    <option value="calculation">Calculation</option>
                    <option value="info">Info</option>
                    <option value="submit">Submit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={card.config?.description || ''}
                    onChange={e =>
                      onUpdateCard({
                        config: { ...card.config, description: e.target.value },
                      })
                    }
                    className="w-full p-2 border rounded text-sm"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </div>

            {/* Reveal Conditions */}
            <div>
              <h3 className="font-semibold mb-3">Reveal Conditions</h3>
              <RevealConditionsEditor
                conditions={card.reveal_conditions || []}
                currentCardIndex={card.display_order}
                onChange={conditions =>
                  onUpdateCard({ reveal_conditions: conditions })
                }
              />
            </div>

            {/* Styling */}
            <div>
              <h3 className="font-semibold mb-3">Styling</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={card.styling?.backgroundColor || '#ffffff'}
                    onChange={e =>
                      onUpdateCard({
                        styling: {
                          ...card.styling,
                          backgroundColor: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 border rounded"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gradient"
                    checked={card.styling?.gradient || false}
                    onChange={e =>
                      onUpdateCard({
                        styling: {
                          ...card.styling,
                          gradient: e.target.checked,
                        },
                      })
                    }
                  />
                  <label htmlFor="gradient" className="text-sm">
                    Use gradient background
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shortcodes' && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                <Info className="w-4 h-4" />
                Available Shortcodes
              </h4>
              <p className="text-xs text-gray-600">
                Click to copy. Use these in calculation display templates.
              </p>
            </div>

            <div className="space-y-2">
              {shortcodes.map(shortcode => (
                <button
                  key={shortcode}
                  onClick={() => {
                    navigator.clipboard.writeText(shortcode);
                    // You could add a toast notification here
                  }}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded border text-sm font-mono"
                >
                  {shortcode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
