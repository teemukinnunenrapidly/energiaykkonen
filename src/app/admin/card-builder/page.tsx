'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CardTemplate } from '@/lib/supabase';

export default function CardBuilderPage() {
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null);

  // Card list sidebar
  // Card editor panel
  // Preview panel
  // Reveal conditions builder

  return (
    <div className="flex h-screen">
      {/* Left: Card List */}
      <div className="w-64 bg-gray-50 border-r p-4">
        <button className="w-full bg-blue-600 text-white py-2 rounded mb-4">
          Add New Card
        </button>
        {/* Card list */}
      </div>
      
      {/* Center: Card Editor */}
      <div className="flex-1 p-6">
        {/* Card properties form */}
      </div>
      
      {/* Right: Preview */}
      <div className="w-96 bg-gray-50 border-l p-4">
        {/* Live preview */}
      </div>
    </div>
  );
}
