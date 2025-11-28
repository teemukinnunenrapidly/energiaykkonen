import React from 'react';
import { FormCard } from './cards/FormCard';
import { CalculationCard } from './cards/CalculationCard';
import { InfoCard } from './cards/InfoCard';
import type { CardTemplate } from '@/lib/supabase';

interface CardRendererProps {
  card: CardTemplate;
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
  isLastCard?: boolean;
}

export function CardRenderer({
  card,
  onFieldFocus,
  isLastCard = false,
}: CardRendererProps) {
  switch (card.type) {
    case 'form':
      return (
        <FormCard
          card={card}
          onFieldFocus={onFieldFocus}
          isLastCard={isLastCard}
        />
      );
    case 'calculation':
      return (
        <CalculationCard
          card={card}
          onFieldFocus={onFieldFocus}
          isLastCard={isLastCard}
        />
      );
    case 'info':
      return <InfoCard card={card} isLastCard={isLastCard} />;
    default:
      return null;
  }
}
