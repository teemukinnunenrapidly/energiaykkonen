# Card Stream System - Complete Implementation

## Phase 1: Database Setup

### 1.1 Database Migration

Run this in Supabase SQL editor:

```sql
-- Card templates table
CREATE TABLE card_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('form', 'calculation', 'info', 'visual', 'submit')),
  title VARCHAR(255),
  config JSONB NOT NULL DEFAULT '{}',
  reveal_conditions JSONB DEFAULT '[]',
  styling JSONB DEFAULT '{}',
  visual_object_id UUID REFERENCES visual_objects(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card fields for form-type cards
CREATE TABLE card_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'email', 'select', 'radio', 'checkbox', 'textarea')),
  label VARCHAR(255) NOT NULL,
  placeholder VARCHAR(255),
  help_text TEXT,
  validation_rules JSONB DEFAULT '{}',
  width VARCHAR(20) DEFAULT 'full' CHECK (width IN ('full', 'half', 'third')),
  display_order INTEGER DEFAULT 0,
  options JSONB, -- For select/radio fields
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calculations for calculation-type cards
CREATE TABLE card_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  formula TEXT NOT NULL,
  display_template TEXT,
  result_format VARCHAR(50) DEFAULT 'number', -- 'currency', 'percentage', 'number'
  depends_on JSONB, -- Field dependencies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_card_templates_order ON card_templates(display_order) WHERE is_active = true;
CREATE INDEX idx_card_fields_order ON card_fields(card_id, display_order);
CREATE INDEX idx_card_templates_type ON card_templates(type);
```

### 1.2 Supabase Type Definitions

Add to `src/lib/supabase.ts`:

```typescript
// Card system types
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
  reveal_conditions: RevealCondition[];
  styling: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    gradient?: boolean;
  };
  visual_object_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  };
  width: 'full' | 'half' | 'third';
  display_order: number;
  options?: { value: string; label: string }[];
  required: boolean;
}

export interface RevealCondition {
  type: 'fields_complete' | 'card_complete' | 'value_check' | 'always';
  target?: string[]; // Card IDs or field names
  operator?: '=' | '>' | '<' | 'exists' | 'not_empty';
  value?: any;
}

// Helper functions
export async function getActiveCards() {
  const { data, error } = await supabase
    .from('card_templates')
    .select(
      `
      *,
      card_fields (*)
    `
    )
    .eq('is_active', true)
    .order('display_order');

  if (error) throw error;
  return data;
}
```

## Phase 2: Core Components

### 2.1 CardContext Provider

Create `src/components/card-system/CardContext.tsx`:

```tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

interface CardState {
  status: 'hidden' | 'locked' | 'unlocked' | 'active' | 'complete';
  data?: Record<string, any>;
}

interface CardContextValue {
  formData: Record<string, any>;
  cardStates: Record<string, CardState>;
  updateField: (fieldName: string, value: any) => void;
  completeCard: (cardId: string) => void;
  activateCard: (cardId: string) => void;
  checkRevealConditions: (cardId: string) => boolean;
}

const CardContext = createContext<CardContextValue | null>(null);

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const completeCard = useCallback((cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], status: 'complete' },
    }));
  }, []);

  const activateCard = useCallback((cardId: string) => {
    setCardStates(prev => {
      const newStates = { ...prev };
      // Deactivate all other cards
      Object.keys(newStates).forEach(key => {
        if (newStates[key].status === 'active') {
          newStates[key] = { ...newStates[key], status: 'complete' };
        }
      });
      // Activate selected card
      newStates[cardId] = { ...newStates[cardId], status: 'active' };
      return newStates;
    });
  }, []);

  const checkRevealConditions = useCallback(
    (cardId: string) => {
      // Implement reveal logic based on conditions
      return true; // Placeholder
    },
    [formData, cardStates]
  );

  return (
    <CardContext.Provider
      value={{
        formData,
        cardStates,
        updateField,
        completeCard,
        activateCard,
        checkRevealConditions,
      }}
    >
      {children}
    </CardContext.Provider>
  );
}

export const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context)
    throw new Error('useCardContext must be used within CardProvider');
  return context;
};
```

### 2.2 CardStream Component

Create `src/components/card-system/CardStream.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardProvider, useCardContext } from './CardContext';
import { CardRenderer } from './CardRenderer';
import { getActiveCards, type CardTemplate } from '@/lib/supabase';
import { ChevronDown } from 'lucide-react';

function CardStreamContent() {
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { cardStates, checkRevealConditions, activateCard } = useCardContext();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getActiveCards();
      setCards(data || []);
      // Initialize first card as active
      if (data && data.length > 0) {
        activateCard(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <AnimatePresence>
        {cards.map((card, index) => {
          const state =
            cardStates[card.id]?.status || (index === 0 ? 'active' : 'locked');
          const isVisible = state !== 'hidden' && state !== 'locked';

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: isVisible ? 1 : 0.3,
                y: isVisible ? 0 : 20,
                filter: isVisible ? 'blur(0px)' : 'blur(8px)',
                scale: state === 'active' ? 1.02 : 1,
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`
                mb-6 rounded-xl shadow-lg overflow-hidden cursor-pointer
                ${state === 'active' ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                ${state === 'complete' ? 'border-l-4 border-green-500' : ''}
                ${!isVisible ? 'pointer-events-none' : ''}
              `}
              onClick={() => {
                if (state === 'unlocked') {
                  activateCard(card.id);
                }
              }}
            >
              <CardRenderer card={card} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="text-center py-8">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-8 h-8 text-gray-400 mx-auto" />
        </motion.div>
        <p className="text-gray-500 mt-2">Fill the form to reveal more</p>
      </div>
    </div>
  );
}

export function CardStream() {
  return (
    <CardProvider>
      <CardStreamContent />
    </CardProvider>
  );
}
```

### 2.3 CardRenderer Component

Create `src/components/card-system/CardRenderer.tsx`:

```tsx
import React from 'react';
import { FormCard } from './cards/FormCard';
import { CalculationCard } from './cards/CalculationCard';
import { InfoCard } from './cards/InfoCard';
import { SubmitCard } from './cards/SubmitCard';
import type { CardTemplate } from '@/lib/supabase';

interface CardRendererProps {
  card: CardTemplate;
}

export function CardRenderer({ card }: CardRendererProps) {
  switch (card.type) {
    case 'form':
      return <FormCard card={card} />;
    case 'calculation':
      return <CalculationCard card={card} />;
    case 'info':
      return <InfoCard card={card} />;
    case 'submit':
      return <SubmitCard card={card} />;
    default:
      return null;
  }
}
```

### 2.4 Card Type Components

Create `src/components/card-system/cards/FormCard.tsx`:

```tsx
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
            onChange={e => {
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
            onChange={e => {
              updateField(field.field_name, e.target.value);
              checkCompletion();
            }}
            disabled={!isActive}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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
```

Create `src/components/card-system/cards/CalculationCard.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate } from '@/lib/supabase';

interface CalculationCardProps {
  card: CardTemplate;
}

export function CalculationCard({ card }: CalculationCardProps) {
  const { formData } = useCardContext();
  const [result, setResult] = useState<number>(0);

  useEffect(() => {
    // Implement calculation logic based on card.config.formula
    calculateResult();
  }, [formData]);

  const calculateResult = () => {
    // Example calculation - replace with actual formula parsing
    const { formula } = card.config;
    // Parse and execute formula with formData
    // setResult(calculatedValue);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{card.title}</h3>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Calculation
        </span>
      </div>
      <div className="text-3xl font-bold text-green-600 mt-4">
        {card.config.result_format === 'currency' ? '€' : ''}
        {result.toLocaleString()}
        {card.config.result_format === 'percentage' ? '%' : ''}
      </div>
      {card.config.description && (
        <p className="text-sm text-gray-600 mt-2">{card.config.description}</p>
      )}
    </div>
  );
}
```

Create `src/components/card-system/cards/InfoCard.tsx`:

```tsx
import React from 'react';
import { Info } from 'lucide-react';
import type { CardTemplate } from '@/lib/supabase';

interface InfoCardProps {
  card: CardTemplate;
}

export function InfoCard({ card }: InfoCardProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
          <div className="text-sm text-gray-700 space-y-2">
            {card.config.content}
          </div>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/card-system/cards/SubmitCard.tsx`:

```tsx
import React, { useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate } from '@/lib/supabase';

interface SubmitCardProps {
  card: CardTemplate;
}

export function SubmitCard({ card }: SubmitCardProps) {
  const { formData, cardStates } = useCardContext();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEnabled =
    cardStates[card.id]?.status === 'active' ||
    cardStates[card.id]?.status === 'unlocked';

  const handleSubmit = async () => {
    if (!isEnabled || submitted) return;

    setLoading(true);
    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
      <button
        onClick={handleSubmit}
        disabled={!isEnabled || loading || submitted}
        className={`
          w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all
          ${
            submitted
              ? 'bg-green-500 text-white cursor-default'
              : isEnabled
                ? 'bg-white text-purple-600 hover:scale-105 hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
          }
        `}
      >
        {submitted
          ? '✓ Successfully Sent!'
          : loading
            ? 'Sending...'
            : card.config.buttonText || 'Submit'}
      </button>
      {card.config.description && (
        <p className="text-white/90 text-sm mt-4">{card.config.description}</p>
      )}
    </div>
  );
}
```

## Phase 3: Update Calculator Page

Replace `src/app/calculator/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { CardStream } from '@/components/card-system/CardStream';
import { VisualSupport } from '@/components/form-system/VisualSupport';

export default function CalculatorPage() {
  const [activeContext, setActiveContext] = useState<{
    cardId?: string;
    fieldId?: string;
    value?: string;
  }>({});

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Visual Support Panel - 50% */}
      <div className="w-1/2 bg-white shadow-lg">
        <VisualSupport
          sectionId={activeContext.cardId}
          fieldId={activeContext.fieldId}
          fieldValue={activeContext.value}
        />
      </div>

      {/* Card Stream Panel - 50% */}
      <div className="w-1/2 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
        <CardStream />
      </div>
    </div>
  );
}
```

## Phase 4: Admin Card Builder

Create `src/app/admin/card-builder/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CardTemplate } from '@/lib/supabase';

export default function CardBuilderPage() {
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null);

  // Card list sidebar
  // Card editor panel
  // Preview panel
  // Reveal conditions builder

  return (
    <div className="flex h-screen">
      {/* Left: Card List */}
      <div className="w-64 bg-gray-50 border-r p-4">
        <button className="w-full bg-blue-600 text-white py-2 rounded mb-4">
          Add New Card
        </button>
        {/* Card list */}
      </div>

      {/* Center: Card Editor */}
      <div className="flex-1 p-6">{/* Card properties form */}</div>

      {/* Right: Preview */}
      <div className="w-96 bg-gray-50 border-l p-4">{/* Live preview */}</div>
    </div>
  );
}
```

## Phase 5: Package.json Dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0"
  }
}
```

Run: `npm install framer-motion`

## Phase 6: Testing & Migration

### Sample Data for Testing

```sql
-- Insert sample cards
INSERT INTO card_templates (name, display_order, type, title, config) VALUES
('property_details', 1, 'form', 'Property Details', '{"description": "Tell us about your property"}'),
('energy_calculation', 2, 'calculation', 'Energy Volume', '{"formula": "floor_area * ceiling_height"}'),
('heating_info', 3, 'form', 'Current Heating', '{"description": "Your current heating system"}'),
('savings_info', 4, 'info', 'Heat Pump Benefits', '{"content": "Save up to 70% on heating costs"}'),
('savings_calc', 5, 'calculation', 'Your Savings', '{"formula": "heating_cost * 0.5"}'),
('contact', 6, 'form', 'Get Your Quote', '{"description": "Contact information"}'),
('submit', 7, 'submit', 'Send Quote', '{"buttonText": "Get My Personal Quote"}');
```

## Deployment Checklist

- [ ] Database migrations complete
- [ ] All components created
- [ ] Calculator page updated
- [ ] Admin builder functional
- [ ] Visual assets integrated
- [ ] API endpoints updated
- [ ] Mobile responsive
- [ ] Testing complete
- [ ] Old system backup created
- [ ] Documentation updated

## Notes

1. **Keep old system running** - Don't delete old tables until new system is stable
2. **Test with sample data first** - Use the SQL inserts above
3. **Visual assets integration** - Each card can link to visual_object_id
4. **Reveal conditions** - Start simple, add complex logic later
5. **Performance** - Add pagination if you have many cards
