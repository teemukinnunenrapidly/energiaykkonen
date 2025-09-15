'use client';

import Link from 'next/link';
import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';

export default function EmbeddedCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header with Centered Logo */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-center">
          <Link 
            href="https://energiaykkonen.fi" 
            className="text-xl font-semibold tracking-tight text-gray-900 hover:text-gray-700 transition-colors"
          >
            Energiaykkönen
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Säästölaskuri</h1>
        <p className="text-gray-600 mb-8">
          Tässä näkymässä korttijärjestelmä on upotettu suoraan sivuun ilman
          WordPress-widgetiä. Layout seuraa samoja design-tokeneita.
        </p>

        {/* Card System */}
        <CardSystemContainer showVisualSupport={true} />
      </main>
    </div>
  );
}


