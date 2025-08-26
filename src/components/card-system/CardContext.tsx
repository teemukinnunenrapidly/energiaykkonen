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
  checkRevealConditions: (cardId: string) => boolean;
}

const CardContext = createContext<CardContextValue | null>(null);

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const completeCard = useCallback((cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], status: 'complete' }
    }));
  }, []);

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

  const checkRevealConditions = useCallback((cardId: string) => {
    // Implement reveal logic based on conditions
    return true; // Placeholder
  }, [formData, cardStates]);

  return (
    <CardContext.Provider value={{
      formData,
      cardStates,
      updateField,
      completeCard,
      activateCard,
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
