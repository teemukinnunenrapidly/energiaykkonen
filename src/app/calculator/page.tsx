'use client';

import Link from 'next/link';
import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';

export default function EmbeddedCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mock Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-tight">Energiaykkönen</div>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">Etusivu</Link>
            <Link href="/calculator" className="text-emerald-600 font-medium">Säästölaskuri</Link>
            <Link href="/admin" className="hover:text-gray-900">Admin</Link>
          </nav>
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


