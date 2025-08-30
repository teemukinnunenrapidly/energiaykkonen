'use client';

import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <ThemeProvider>
        <CardSystemContainer
          maxWidth={1200}
          showVisualSupport={true}
          visualWidth="50%"
        />
      </ThemeProvider>
    </div>
  );
}
