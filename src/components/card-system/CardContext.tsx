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
      
      // Implement specific card completion logic based on card type
      const currentIndex = cardOrder.indexOf(cardId);
      
      if (cardId === '00000000-0000-0000-0000-000000000001') {
        // Card 1 (Property Details) completion
        // Immediately unlock calculation card (calc-1)
        newStates['00000000-0000-0000-0000-000000000002'] = { status: 'unlocked' };
        
        // After 1 second delay, unlock Card 2 (Heating Info)
        setTimeout(() => {
          setCardStates(prev => ({
            ...prev,
            '00000000-0000-0000-0000-000000000003': { status: 'unlocked' }
          }));
        }, 1000);
        
      } else if (cardId === '00000000-0000-0000-0000-000000000003') {
        // Card 2 (Heating Info) completion
        // Immediately unlock info card
        newStates['00000000-0000-0000-0000-000000000004'] = { status: 'unlocked' };
        
        // After 800ms, unlock calc-2 (savings calculation)
        setTimeout(() => {
          setCardStates(prev => ({
            ...prev,
            '00000000-0000-0000-0000-000000000005': { status: 'unlocked' }
          }));
        }, 800);
        
        // After 1600ms, unlock Card 3 (Contact)
        setTimeout(() => {
          setCardStates(prev => ({
            ...prev,
            '00000000-0000-0000-0000-000000000006': { status: 'unlocked' }
          }));
        }, 1600);
        
      } else if (cardId === '00000000-0000-0000-0000-000000000006') {
        // Card 3 (Contact) completion
        // After 500ms, unlock submit card
        setTimeout(() => {
          setCardStates(prev => ({
            ...prev,
            '00000000-0000-0000-0000-000000000007': { status: 'unlocked' }
          }));
        }, 500);
      }
      
      return newStates;
    });
  }, [cardOrder]);

  const activateCard = useCallback((cardId: string) => {
    setCardStates(prev => {
      const newStates = { ...prev };
      
      // Deactivate all other cards (set them to 'unlocked' if they were 'active')
      Object.keys(newStates).forEach(key => {
        if (newStates[key].status === 'active') {
          newStates[key] = { ...newStates[key], status: 'unlocked' };
        }
      });
      
      // Activate selected card
      newStates[cardId] = { ...newStates[cardId], status: 'active' };
      
      return newStates;
    });
  }, []);

  const setCardOrderAndInitialize = useCallback((orderedCardIds: string[]) => {
    setCardOrder(orderedCardIds);
    
    // Initialize card states according to the specified flow
    setCardStates(prev => {
      const newStates = { ...prev };
      
      orderedCardIds.forEach((cardId, index) => {
        if (index === 0) {
          // First card (Property Details) starts as active
          newStates[cardId] = { status: 'active' };
        } else {
          // All other cards start as locked
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
