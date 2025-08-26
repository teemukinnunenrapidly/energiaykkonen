import React, { useState } from 'react';
import { useCardContext } from '../CardContext';
import type { CardTemplate } from '@/lib/supabase';

interface SubmitCardProps {
  card: CardTemplate;
}

export function SubmitCard({ card }: SubmitCardProps) {
  const { formData, cardStates } = useCardContext();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const isEnabled = cardStates[card.id]?.status === 'active' || 
                    cardStates[card.id]?.status === 'unlocked';

  const handleSubmit = async () => {
    if (!isEnabled || submitted) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
      <button
        onClick={handleSubmit}
        disabled={!isEnabled || loading || submitted}
        className={`
          w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all
          ${submitted 
            ? 'bg-green-500 text-white cursor-default' 
            : isEnabled 
              ? 'bg-white text-purple-600 hover:scale-105 hover:shadow-xl' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'}
        `}
      >
        {submitted ? '✓ Successfully Sent!' : loading ? 'Sending...' : card.config.buttonText || 'Submit'}
      </button>
      {card.config.description && (
        <p className="text-white/90 text-sm mt-4">{card.config.description}</p>
      )}
    </div>
  );
}
