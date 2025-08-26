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
