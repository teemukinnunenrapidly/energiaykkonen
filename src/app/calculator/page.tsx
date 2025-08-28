'use client';

import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <CardSystemContainer
        maxWidth={1200}
        showVisualSupport={true}
        visualWidth="50%"
      />
    </div>
  );
}
