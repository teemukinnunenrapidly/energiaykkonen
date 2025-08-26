import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardProvider, useCardContext } from './CardContext';
import { CardRenderer } from './CardRenderer';
import { getActiveCards, type CardTemplate } from '@/lib/supabase';
import { ChevronDown } from 'lucide-react';

interface CardStreamProps {
  onFieldFocus?: (cardId: string, fieldId: string, value: any) => void;
  onCardChange?: (cardId: string, status: string) => void;
}

function CardStreamContent({ onFieldFocus, onCardChange }: CardStreamProps) {
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { cardStates, checkRevealConditions, activateCard } = useCardContext();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getActiveCards();
      setCards(data || []);
      
      // Initialize first card as active
      if (data && data.length > 0) {
        activateCard(data[0].id);
        // Notify parent of initial card change
        onCardChange?.(data[0].id, 'active');
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardActivation = (cardId: string) => {
    activateCard(cardId);
    onCardChange?.(cardId, 'active');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <AnimatePresence>
        {cards.map((card, index) => {
          const state = cardStates[card.id]?.status || (index === 0 ? 'active' : 'locked');
          const isVisible = state !== 'hidden' && state !== 'locked';
          
          // Check reveal conditions for this card
          const shouldShow = checkRevealConditions(card.id, card.reveal_conditions || []);
          
          if (!shouldShow) return null;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: isVisible ? 1 : 0.3,
                y: isVisible ? 0 : 20,
                filter: isVisible ? 'blur(0px)' : 'blur(8px)',
                scale: state === 'active' ? 1.02 : 1,
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`
                mb-6 rounded-xl shadow-lg overflow-hidden cursor-pointer
                ${state === 'active' ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                ${state === 'complete' ? 'border-l-4 border-green-500' : ''}
                ${!isVisible ? 'pointer-events-none' : ''}
              `}
              onClick={() => {
                if (state === 'unlocked') {
                  handleCardActivation(card.id);
                }
              }}
            >
              <CardRenderer 
                card={card} 
                onFieldFocus={onFieldFocus}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      <div className="text-center py-8">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-8 h-8 text-gray-400 mx-auto" />
        </motion.div>
        <p className="text-gray-500 mt-2">Fill the form to reveal more</p>
      </div>
    </div>
  );
}

export function CardStream({ onFieldFocus, onCardChange }: CardStreamProps) {
  return (
    <CardProvider>
      <CardStreamContent 
        onFieldFocus={onFieldFocus}
        onCardChange={onCardChange}
      />
    </CardProvider>
  );
}
