import React, { useEffect, useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate, CardField } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface FormCardProps {
  card: CardTemplate;
}

export function FormCard({ card }: FormCardProps) {
  const [fields, setFields] = useState<CardField[]>([]);
  const { formData, updateField, cardStates, completeCard } = useCardContext();
  const isActive = cardStates[card.id]?.status === 'active';

  useEffect(() => {
    loadFields();
  }, [card.id]);

  const loadFields = async () => {
    const { data } = await supabase
      .from('card_fields')
      .select('*')
      .eq('card_id', card.id)
      .order('display_order');
    
    setFields(data || []);
  };

  const checkCompletion = () => {
    const allRequired = fields.filter(f => f.required);
    const allFilled = allRequired.every(f => formData[f.field_name]);
    if (allFilled) {
      completeCard(card.id);
    }
  };

  const renderField = (field: CardField) => {
    const value = formData[field.field_name] || '';
    
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.field_type}
            value={value}
            onChange={(e) => {
              updateField(field.field_name, e.target.value);
              checkCompletion();
            }}
            placeholder={field.placeholder}
            disabled={!isActive}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => {
              updateField(field.field_name, e.target.value);
              checkCompletion();
            }}
            disabled={!isActive}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{card.title}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Step {card.display_order}
        </span>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {fields.map(field => (
          <div
            key={field.id}
            className={`
              ${field.width === 'full' ? 'col-span-12' : ''}
              ${field.width === 'half' ? 'col-span-6' : ''}
              ${field.width === 'third' ? 'col-span-4' : ''}
            `}
          >
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
