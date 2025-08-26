import React from 'react';
import { Info } from 'lucide-react';
import type { CardTemplate } from '@/lib/supabase';

interface InfoCardProps {
  card: CardTemplate;
}

export function InfoCard({ card }: InfoCardProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
          <div className="text-sm text-gray-700 space-y-2">
            {card.config.content}
          </div>
        </div>
      </div>
    </div>
  );
}
