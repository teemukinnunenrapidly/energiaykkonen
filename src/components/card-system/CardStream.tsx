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

  const handleCardClick = (card: CardTemplate) => {
    const state = cardStates[card.id]?.status || 'locked';
    
    if (state === 'unlocked') {
      // User clicked on an unlocked card - activate it
      handleCardActivation(card.id);
    }
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
          const isVisible = state !== 'hidden';
          const isLocked = state === 'locked';
          
          // Check reveal conditions for this card
          const shouldShow = checkRevealConditions(card.id, card.reveal_conditions || []);
          
          if (!shouldShow) return null;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: isLocked ? 0.6 : 1,
                y: 0,
                filter: isLocked ? 'blur(8px)' : 'blur(0px)',
                scale: state === 'active' ? 1.02 : (isLocked ? 0.98 : 1),
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`
                mb-6 rounded-xl shadow-lg overflow-hidden transition-all
                ${state === 'active' ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                ${state === 'complete' ? 'border-l-4 border-green-500' : ''}
                ${state === 'locked' ? 'pointer-events-none' : 'cursor-pointer'}
                ${state === 'unlocked' ? 'hover:shadow-xl' : ''}
              `}
              onClick={() => handleCardClick(card)}
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
