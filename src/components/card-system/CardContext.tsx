import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

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

  const unlockCard = useCallback((cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], status: 'unlocked' },
    }));
  }, []);

  const unlockNextCards = useCallback(
    (cardId: string) => {
      const cardIndex = cardOrder.indexOf(cardId);

      // Based on card position in order, unlock the appropriate next cards
      // This matches the HTML demo's behavior

      if (cardIndex === 0) {
        // First form card (Property Details)
        // Immediately unlock next card (should be calculation)
        if (cardOrder[1]) unlockCard(cardOrder[1]);
        // After delay, unlock third card (next form)
        if (cardOrder[2]) setTimeout(() => unlockCard(cardOrder[2]), 1000);
      } else if (cardIndex === 2) {
        // Second form card (Heating)
        // Immediately unlock info card
        if (cardOrder[3]) unlockCard(cardOrder[3]);
        // After 800ms, unlock savings calculation
        if (cardOrder[4]) setTimeout(() => unlockCard(cardOrder[4]), 800);
        // After 1600ms, unlock contact form
        if (cardOrder[5]) setTimeout(() => unlockCard(cardOrder[5]), 1600);
      } else if (cardIndex === 5) {
        // Contact form
        // After 500ms, unlock submit button
        if (cardOrder[6]) setTimeout(() => unlockCard(cardOrder[6]), 500);
      }
    },
    [cardOrder, unlockCard]
  );

  const completeCard = useCallback(
    (cardId: string) => {
      setCardStates(prev => {
        const newStates = { ...prev };

        // Mark current card as complete
        newStates[cardId] = { ...newStates[cardId], status: 'complete' };

        // Trigger the unlock cascade
        unlockNextCards(cardId);

        return newStates;
      });
    },
    [unlockNextCards]
  );

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

  const checkRevealConditions = useCallback(
    (cardId: string, conditions: any[]) => {
      if (!conditions || conditions.length === 0) {
        return true; // No conditions means always show
      }

      return conditions.every(condition => {
        switch (condition.type) {
          case 'fields_complete':
            return (
              condition.target?.every(
                (fieldName: string) =>
                  formData[fieldName] !== undefined &&
                  formData[fieldName] !== '' &&
                  formData[fieldName] !== null
              ) ?? true
            );

          case 'card_complete':
            return (
              condition.target?.every(
                (targetCardId: string) =>
                  cardStates[targetCardId]?.status === 'complete'
              ) ?? true
            );

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
                return (
                  fieldValue !== undefined &&
                  fieldValue !== '' &&
                  fieldValue !== null
                );
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
    },
    [formData, cardStates]
  );

  return (
    <CardContext.Provider
      value={{
        formData,
        cardStates,
        updateField,
        completeCard,
        activateCard,
        setCardOrderAndInitialize,
        checkRevealConditions,
      }}
    >
      {children}
    </CardContext.Provider>
  );
}

export const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context)
    throw new Error('useCardContext must be used within CardProvider');
  return context;
};
