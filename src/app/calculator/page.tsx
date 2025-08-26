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

  const handleFieldFocus = (cardId: string, fieldId: string, value: any) => {
    setActiveContext({ cardId, fieldId, value: value?.toString() || '' });
  };

  const handleCardChange = (cardId: string, status: string) => {
    // Update context when card changes, clearing field-specific context
    setActiveContext({ cardId, fieldId: undefined, value: undefined });
  };

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
        <CardStream 
          onFieldFocus={handleFieldFocus}
          onCardChange={handleCardChange}
        />
      </div>
    </div>
  );
}
