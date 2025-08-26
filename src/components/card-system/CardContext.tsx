import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface CardState {
  status: 'hidden' | 'locked' | 'unlocked' | 'active' | 'complete';
  data?: Record<string, any>;
}

interface CardContextValue {
  formData: Record<string, any>;
  cardStates: Record<string, CardState>;
  updateField: (fieldName: string, value: any) => void;
  completeCard: (cardId: string) => void;
  activateCard: (cardId: string) => void;
  setCardOrderAndInitialize: (orderedCardIds: string[]) => void;
  checkRevealConditions: (cardId: string, conditions: any[]) => boolean;
}

const CardContext = createContext<CardContextValue | null>(null);

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [cardOrder, setCardOrder] = useState<string[]>([]);

  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const completeCard = useCallback((cardId: string) => {
    setCardStates(prev => {
      const newStates = { ...prev };
      
      // Mark current card as complete
      newStates[cardId] = { ...newStates[cardId], status: 'complete' };
      
      // Find the next card in order and unlock it
      const currentIndex = cardOrder.indexOf(cardId);
      if (currentIndex !== -1 && currentIndex < cardOrder.length - 1) {
        const nextCardId = cardOrder[currentIndex + 1];
        if (newStates[nextCardId]) {
          newStates[nextCardId] = { ...newStates[nextCardId], status: 'active' };
        }
      }
      
      return newStates;
    }, [cardOrder]);
  }, [cardOrder]);

  const activateCard = useCallback((cardId: string) => {
    setCardStates(prev => {
      const newStates = { ...prev };
      
      // Deactivate all other cards
      Object.keys(newStates).forEach(key => {
        if (newStates[key].status === 'active') {
          newStates[key] = { ...newStates[key], status: 'complete' };
        }
      });
      
      // Activate selected card
      newStates[cardId] = { ...newStates[cardId], status: 'active' };
      
      return newStates;
    });
  }, []);

  const setCardOrderAndInitialize = useCallback((orderedCardIds: string[]) => {
    setCardOrder(orderedCardIds);
    
    // Initialize card states
    setCardStates(prev => {
      const newStates = { ...prev };
      
      orderedCardIds.forEach((cardId, index) => {
        if (index === 0) {
          // First card is active
          newStates[cardId] = { status: 'active' };
        } else {
          // Other cards start as locked
          newStates[cardId] = { status: 'locked' };
        }
      });
      
      return newStates;
    });
  }, []);

  const checkRevealConditions = useCallback((cardId: string, conditions: any[]) => {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means always show
    }

    return conditions.every(condition => {
      switch (condition.type) {
        case 'fields_complete':
          return condition.target?.every((fieldName: string) => 
            formData[fieldName] !== undefined && 
            formData[fieldName] !== '' && 
            formData[fieldName] !== null
          ) ?? true;
          
        case 'card_complete':
          return condition.target?.every((targetCardId: string) => 
            cardStates[targetCardId]?.status === 'complete'
          ) ?? true;
          
        case 'value_check':
          const fieldValue = formData[condition.target?.[0] ?? ''];
          switch (condition.operator) {
            case '=': 
              return fieldValue === condition.value;
            case '>': 
              return parseFloat(fieldValue) > parseFloat(condition.value);
            case '<': 
              return parseFloat(fieldValue) < parseFloat(condition.value);
            case 'exists': 
              return fieldValue !== undefined && fieldValue !== '' && fieldValue !== null;
            case 'not_empty': 
              return fieldValue !== '' && fieldValue !== null;
            default: 
              return false;
          }
          
        case 'always':
          return true;
          
        default:
          return false;
      }
    });
  }, [formData, cardStates]);

  return (
    <CardContext.Provider value={{
      formData,
      cardStates,
      updateField,
      completeCard,
      activateCard,
      setCardOrderAndInitialize,
      checkRevealConditions
    }}>
      {children}
    </CardContext.Provider>
  );
}

export const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) throw new Error('useCardContext must be used within CardProvider');
  return context;
};
