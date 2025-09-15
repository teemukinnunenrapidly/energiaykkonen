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
  switch (card.type) {
    case 'form':
      return <FormCard card={card} onFieldFocus={onFieldFocus} />;
    case 'calculation':
      return <CalculationCard card={card} onFieldFocus={onFieldFocus} />;
    case 'info':
      return <InfoCard card={card} />;
    default:
      return null;
  }
}
