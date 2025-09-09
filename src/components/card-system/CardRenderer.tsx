import React from 'react';
import { FormCard } from './cards/FormCard';
import { CalculationCard } from './cards/CalculationCard';
import { InfoCard } from './cards/InfoCard';
import type { CardTemplate } from '@/lib/supabase';

interface CardRendererProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
}

export function CardRenderer({ card, onFieldFocus }: CardRendererProps) {
  // Auto-detect widget mode by checking for widget data
  const isWidgetMode = typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA;

  switch (card.type) {
    case 'form':
      return <FormCard card={card} onFieldFocus={onFieldFocus} widgetMode={isWidgetMode} />;
    case 'calculation':
      return <CalculationCard card={card} onFieldFocus={onFieldFocus} widgetMode={isWidgetMode} />;
    case 'info':
      return <InfoCard card={card} widgetMode={isWidgetMode} />;
    default:
      return null;
  }
}
