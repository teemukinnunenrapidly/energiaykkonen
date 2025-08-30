import React from 'react';
import { FormCard } from './cards/FormCard';
import { CalculationCard } from './cards/CalculationCard';
import { InfoCard } from './cards/InfoCard';
import { SubmitCard } from './cards/SubmitCard';
import type { CardTemplate } from '@/lib/supabase';

interface CardRendererProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
  stepNumber?: number; // For form cards only
}

export function CardRenderer({ card, onFieldFocus, stepNumber }: CardRendererProps) {
  switch (card.type) {
    case 'form':
      return <FormCard card={card} onFieldFocus={onFieldFocus} stepNumber={stepNumber} />;
    case 'calculation':
      return <CalculationCard card={card} onFieldFocus={onFieldFocus} />;
    case 'info':
      return <InfoCard card={card} />;
    case 'submit':
      return <SubmitCard card={card} />;
    default:
      return null;
  }
}
