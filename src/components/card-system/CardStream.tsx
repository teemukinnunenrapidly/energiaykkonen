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
  const { cardStates, checkRevealConditions, activateCard, setCardOrderAndInitialize } = useCardContext();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getActiveCards();
      setCards(data || []);
      
      if (data && data.length > 0) {
        // Initialize card order and states
        const cardIds = data.map(card => card.id);
        setCardOrderAndInitialize(cardIds);
        
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
          const state = cardStates[card.id]?.status || 'locked';
          
          // Only show the active card
          if (state !== 'active') return null;
          
          // Check reveal conditions for this card
          const shouldShow = checkRevealConditions(card.id, card.reveal_conditions || []);
          
          if (!shouldShow) return null;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                scale: 1.02,
              }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="mb-6 rounded-xl shadow-lg overflow-hidden ring-2 ring-green-500 ring-offset-2"
            >
              <CardRenderer 
                card={card} 
                onFieldFocus={onFieldFocus}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Show progress indicator */}
      <div className="text-center py-8">
        <div className="flex justify-center items-center space-x-2 mb-4">
          {cards.map((card, index) => {
            const state = cardStates[card.id]?.status || 'locked';
            return (
              <div
                key={card.id}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${state === 'active' ? 'bg-green-500 scale-125' : ''}
                  ${state === 'complete' ? 'bg-green-400' : ''}
                  ${state === 'locked' ? 'bg-gray-300' : ''}
                `}
                title={`${card.title} - ${state}`}
              />
            );
          })}
        </div>
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
