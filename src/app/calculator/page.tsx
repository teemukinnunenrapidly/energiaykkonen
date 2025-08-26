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
