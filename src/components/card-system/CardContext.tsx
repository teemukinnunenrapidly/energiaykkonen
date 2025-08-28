import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { CardTemplate } from '@/lib/supabase';
import {
  getCardsDirect,
  updateFieldCompletion,
  updateCardCompletion,
  getCardCompletion,
  checkCardCompletion,
} from '@/lib/supabase';
import { updateSessionWithFormData } from '@/lib/session-data-table';

interface CardState {
  status: 'hidden' | 'locked' | 'unlocked' | 'active' | 'complete';
  isRevealed?: boolean; // New: tracks if card has permission to be unblurred
  data?: Record<string, any>;
}

interface CardContextValue {
  formData: Record<string, any>;
  cardStates: Record<string, CardState>;
  cards: CardTemplate[];
  sessionId: string;
  updateField: (fieldName: string, value: any) => void;
  completeCard: (cardId: string) => void;
  uncompleteCard: (cardId: string) => void;
  activateCard: (cardId: string) => void;
  setCardsAndInitialize: (cards: CardTemplate[]) => void;
  checkRevealConditions: (card: CardTemplate) => boolean;
  shouldBeRevealed: (card: CardTemplate, visitedCards?: Set<string>) => boolean;
  revealCard: (cardId: string) => void; // New: grants reveal permission to a card
  isCardComplete: (card: CardTemplate) => boolean; // New: checks if card meets completion criteria
}

const CardContext = createContext<CardContextValue | null>(null);

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  let sessionId = localStorage.getItem('card_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('card_session_id', sessionId);
  }
  return sessionId;
};

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [sessionId] = useState<string>(getSessionId());

  const updateField = useCallback(
    async (fieldName: string, value: any) => {
      console.log(
        `🔄 updateField called: fieldName="${fieldName}", value="${value}", sessionId="${sessionId}"`
      );

      // Update local formData immediately for UI responsiveness
      setFormData(prev => {
        const newData = { ...prev, [fieldName]: value };
        console.log(`Updated formData for ${fieldName}:`, newData);
        
        // Also update the session data table (like a waiter writing down the order)
        updateSessionWithFormData(sessionId, newData);
        
        return newData;
      });

      // Find which card this field belongs to
      const fieldCard = cards.find(card =>
        card.card_fields?.some(field => field.field_name === fieldName)
      );

      if (fieldCard) {
        console.log(
          `🗃️ Updating field completion in database for card "${fieldCard.name}"`
        );

        // Update field completion in database
        await updateFieldCompletion(fieldCard.id, fieldName, value, sessionId);

        // Check if card should be completed based on database rules
        const shouldBeComplete = await checkCardCompletion(
          fieldCard.id,
          sessionId
        );

        console.log(
          `📋 Card "${fieldCard.name}" completion check result: ${shouldBeComplete}`
        );

        // Update card completion state
        if (shouldBeComplete) {
          await updateCardCompletion(fieldCard.id, sessionId, true, fieldName);

          // Update local state to reflect completion
          setCardStates(prev => ({
            ...prev,
            [fieldCard.id]: { ...prev[fieldCard.id], status: 'complete' },
          }));

          // Handle reveal timing for next card
          await handleCardCompleted(fieldCard);
        }
      }
    },
    [cards, sessionId]
  );

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
        if (cardOrder[1]) {
          unlockCard(cardOrder[1]);
        }
        // After delay, unlock third card (next form)
        if (cardOrder[2]) {
          setTimeout(() => unlockCard(cardOrder[2]), 1000);
        }
      } else if (cardIndex === 2) {
        // Second form card (Heating)
        // Immediately unlock info card
        if (cardOrder[3]) {
          unlockCard(cardOrder[3]);
        }
        // After 800ms, unlock savings calculation
        if (cardOrder[4]) {
          setTimeout(() => unlockCard(cardOrder[4]), 800);
        }
        // After 1600ms, unlock contact form
        if (cardOrder[5]) {
          setTimeout(() => unlockCard(cardOrder[5]), 1600);
        }
      } else if (cardIndex === 5) {
        // Contact form
        // After 500ms, unlock submit button
        if (cardOrder[6]) {
          setTimeout(() => unlockCard(cardOrder[6]), 500);
        }
      }
    },
    [cardOrder, unlockCard]
  );

  const uncompleteCard = useCallback((cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], status: 'unlocked' },
    }));
  }, []);

  const revealCard = useCallback(
    (cardId: string) => {
      const card = cards.find(c => c.id === cardId);
      console.log(
        `🎯 REVEAL: Granting reveal permission to Card "${card?.name}" (${cardId})`
      );
      setCardStates(prev => {
        const newStates = {
          ...prev,
          [cardId]: { ...prev[cardId], isRevealed: true },
        };
        console.log(`🎯 REVEAL: Updated card states:`, newStates);
        return newStates;
      });
    },
    [cards]
  );

  // Handle card completion and reveal timing logic
  const handleCardCompleted = useCallback(
    async (card: CardTemplate) => {
      console.log(
        `✅ Card "${card.name}" completed, checking reveal timing for next card`
      );

      const currentCardIndex = cards.findIndex(c => c.id === card.id);
      const nextCard = cards[currentCardIndex + 1];

      if (nextCard) {
        const revealTiming = card.reveal_timing;
        const legacyRevealConditions = card.reveal_next_conditions;

        console.log(`🕐 Reveal timing settings:`, {
          reveal_timing: revealTiming,
          legacy: legacyRevealConditions,
          nextCard: nextCard.name,
        });

        // Use new reveal_timing if available, otherwise fall back to legacy system
        if (revealTiming) {
          if (revealTiming.timing === 'immediately') {
            console.log(
              `⚡ Granting immediate reveal permission to "${nextCard.name}"`
            );
            revealCard(nextCard.id);
          } else if (revealTiming.timing === 'after_delay') {
            const delayMs = (revealTiming.delay_seconds || 3) * 1000;
            console.log(
              `⏱️ Will grant reveal permission to "${nextCard.name}" after ${delayMs}ms`
            );
            setTimeout(() => {
              console.log(
                `⚡ Granting delayed reveal permission to "${nextCard.name}"`
              );
              revealCard(nextCard.id);
            }, delayMs);
          }
        } else if (legacyRevealConditions) {
          // Fall back to legacy system
          if (
            legacyRevealConditions.type === 'immediately' ||
            legacyRevealConditions.type === 'required_complete' ||
            legacyRevealConditions.type === 'all_complete'
          ) {
            console.log(
              `⚡ Granting immediate reveal permission to "${nextCard.name}" (legacy)`
            );
            revealCard(nextCard.id);
          } else if (legacyRevealConditions.type === 'after_delay') {
            const delayMs = (legacyRevealConditions.delay_seconds || 3) * 1000;
            console.log(
              `⏱️ Will grant reveal permission to "${nextCard.name}" after ${delayMs}ms (legacy)`
            );
            setTimeout(() => {
              console.log(
                `⚡ Granting delayed reveal permission to "${nextCard.name}" (legacy)`
              );
              revealCard(nextCard.id);
            }, delayMs);
          }
        } else {
          // Default behavior: immediate reveal
          console.log(
            `⚡ No reveal timing specified, defaulting to immediate reveal for "${nextCard.name}"`
          );
          revealCard(nextCard.id);
        }
      }
    },
    [cards, revealCard]
  );

  // New function to check if a card is complete based on its type and completion rules
  const isCardComplete = useCallback(
    (card: CardTemplate): boolean => {
      switch (card.type) {
        case 'info':
        case 'visual':
        case 'calculation':
          // These cards complete automatically when revealed
          return true;

        case 'form': {
          const fields = card.card_fields || [];
          if (fields.length === 0) {
            return true;
          } // No fields = complete

          // Use new completion_rules if available, otherwise fall back to legacy system
          const completionRules = card.completion_rules;

          if (completionRules?.form_completion) {
            const formCompletion = completionRules.form_completion;

            switch (formCompletion.type) {
              case 'any_field':
                // Any field filled = complete
                return fields.some(field => {
                  const value = formData[field.field_name];
                  return value !== undefined && value !== null && value !== '';
                });

              case 'all_fields':
                // All fields must be filled
                return fields.every(field => {
                  const value = formData[field.field_name];
                  return value !== undefined && value !== null && value !== '';
                });

              case 'required_fields':
                // Only specified required fields need to be filled
                const requiredFieldNames =
                  formCompletion.required_field_names || [];
                if (requiredFieldNames.length === 0) {
                  // No specific fields specified, check is_required flag
                  const requiredFields = fields.filter(field => field.required);
                  if (requiredFields.length === 0) {
                    // No required fields at all, any field completion works
                    return fields.some(field => {
                      const value = formData[field.field_name];
                      return (
                        value !== undefined && value !== null && value !== ''
                      );
                    });
                  } else {
                    return requiredFields.every(field => {
                      const value = formData[field.field_name];
                      return (
                        value !== undefined && value !== null && value !== ''
                      );
                    });
                  }
                } else {
                  // Check specific required field names
                  return requiredFieldNames.every(fieldName => {
                    const value = formData[fieldName];
                    return (
                      value !== undefined && value !== null && value !== ''
                    );
                  });
                }

              default:
                return false;
            }
          } else {
            // Fall back to legacy system
            const revealConditions = card.reveal_next_conditions;

            if (!revealConditions || revealConditions.type === 'immediately') {
              // No specific completion requirements - any field fills completes it
              return fields.some(field => {
                const value = formData[field.field_name];
                return value !== undefined && value !== null && value !== '';
              });
            } else if (revealConditions.type === 'all_complete') {
              // All fields must be filled
              return fields.every(field => {
                const value = formData[field.field_name];
                return value !== undefined && value !== null && value !== '';
              });
            } else if (revealConditions.type === 'required_complete') {
              // Required fields must be filled (or any field if no required fields specified)
              const requiredFields = fields.filter(field => field.required);
              if (requiredFields.length === 0) {
                // No required fields specified, any field completion works
                return fields.some(field => {
                  const value = formData[field.field_name];
                  return value !== undefined && value !== null && value !== '';
                });
              } else {
                // Check if all required fields are filled
                return requiredFields.every(field => {
                  const value = formData[field.field_name];
                  return value !== undefined && value !== null && value !== '';
                });
              }
            }
            return false;
          }
        }

        case 'submit':
          // Submit cards complete when form is submitted (handled elsewhere)
          return cardStates[card.id]?.status === 'complete';

        default:
          return false;
      }
    },
    [formData, cardStates]
  );

  const completeCard = useCallback(
    (cardId: string) => {
      console.log(`completeCard called for: ${cardId}`);
      setCardStates(prev => {
        const newStates = { ...prev };

        // Mark current card as complete
        newStates[cardId] = { ...newStates[cardId], status: 'complete' };

        console.log('Updated card states after completion:', newStates);
        return newStates;
      });

      // Handle granting reveal permission to next card based on reveal timing
      const currentCardIndex = cards.findIndex(c => c.id === cardId);
      const nextCard = cards[currentCardIndex + 1];

      if (nextCard) {
        const currentCard = cards[currentCardIndex];
        const revealTiming = currentCard.reveal_timing;
        const legacyRevealConditions = currentCard.reveal_next_conditions;

        console.log(
          `Card ${currentCard.name} completed, checking reveal timing for next card ${nextCard.name}:`,
          { reveal_timing: revealTiming, legacy: legacyRevealConditions }
        );

        // Use new reveal_timing if available, otherwise fall back to legacy system
        if (revealTiming) {
          if (revealTiming.timing === 'immediately') {
            // Grant reveal permission immediately when current card completes
            console.log(
              `Granting immediate reveal permission to ${nextCard.name}`
            );
            revealCard(nextCard.id);
          } else if (revealTiming.timing === 'after_delay') {
            // Grant reveal permission after delay when current card completes
            const delayMs = (revealTiming.delay_seconds || 3) * 1000;
            console.log(
              `Will grant reveal permission to ${nextCard.name} after ${delayMs}ms`
            );
            setTimeout(() => {
              console.log(
                `Granting delayed reveal permission to ${nextCard.name}`
              );
              revealCard(nextCard.id);
            }, delayMs);
          }
        } else if (legacyRevealConditions) {
          // Fall back to legacy system
          if (
            legacyRevealConditions.type === 'immediately' ||
            legacyRevealConditions.type === 'required_complete' ||
            legacyRevealConditions.type === 'all_complete'
          ) {
            // Grant reveal permission immediately when current card completes
            console.log(
              `Granting immediate reveal permission to ${nextCard.name} (legacy)`
            );
            revealCard(nextCard.id);
          } else if (legacyRevealConditions.type === 'after_delay') {
            // Grant reveal permission after delay when current card completes
            const delayMs = (legacyRevealConditions.delay_seconds || 3) * 1000;
            console.log(
              `Will grant reveal permission to ${nextCard.name} after ${delayMs}ms (legacy)`
            );
            setTimeout(() => {
              console.log(
                `Granting delayed reveal permission to ${nextCard.name} (legacy)`
              );
              revealCard(nextCard.id);
            }, delayMs);
          }
        } else {
          // Default behavior: immediate reveal
          console.log(
            `No reveal timing specified, defaulting to immediate reveal for ${nextCard.name}`
          );
          revealCard(nextCard.id);
        }
      }
    },
    [cards, revealCard]
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

  const setCardsAndInitialize = useCallback(
    async (cardsData: CardTemplate[]) => {
      console.log('🚀 setCardsAndInitialize called with:', cardsData);
      setCards(cardsData);
      const orderedCardIds = cardsData.map(card => card.id);
      setCardOrder(orderedCardIds);

      // Initialize card states and load completion data from database
      const newStates: Record<string, CardState> = {};

      for (let index = 0; index < orderedCardIds.length; index++) {
        const cardId = orderedCardIds[index];
        const card = cardsData.find(c => c.id === cardId);

        if (index === 0) {
          // First card starts as active and revealed
          newStates[cardId] = { status: 'active', isRevealed: true };
          console.log(
            `🟢 INIT: Card ${index} "${card?.name}" set to ACTIVE and REVEALED`
          );
        } else {
          // Check if this card was previously completed
          const completionState = await getCardCompletion(cardId, sessionId);
          const isComplete = completionState?.is_complete || false;

          newStates[cardId] = {
            status: isComplete ? 'complete' : 'hidden',
            isRevealed: false, // All cards start not revealed except first
          };

          console.log(
            `🔴 INIT: Card ${index} "${card?.name}" set to ${isComplete ? 'COMPLETE' : 'HIDDEN'} and NOT REVEALED`
          );
        }
      }

      console.log('🔄 INIT: Final initial card states:', newStates);
      setCardStates(newStates);
    },
    [sessionId]
  );

  const checkRevealConditions = useCallback(
    (card: CardTemplate): boolean => {
      // No conditions = always show
      if (!card.reveal_conditions || card.reveal_conditions.length === 0) {
        return true;
      }

      return card.reveal_conditions.every(condition => {
        if (condition.type === 'card_complete') {
          const targetCardNames = condition.target || [];

          return targetCardNames.every(targetName => {
            const targetCard = cards.find(c => c.name === targetName);

            if (!targetCard) {
              console.warn(
                `Reveal condition references non-existent card: ${targetName}`
              );
              // Don't block if target doesn't exist
              return true;
            }

            // For info cards, always complete
            if (targetCard.type === 'info') {
              return true;
            }

            // Check if card has any filled fields (since all your fields are non-required)
            const fields = targetCard.card_fields || [];
            if (fields.length === 0) {
              return true;
            }

            // At least one field should have a value
            return fields.some(field => {
              const value = formData[field.field_name];
              return value !== undefined && value !== null && value !== '';
            });
          });
        }

        return true; // Unknown condition types don't block
      });
    },
    [formData, cards]
  );

  const shouldBeRevealed = useCallback(
    (card: CardTemplate, visitedCards = new Set<string>()) => {
      // Prevent infinite recursion
      if (visitedCards.has(card.id)) {
        console.warn(`Circular dependency detected for card: ${card.name}`);
        return false;
      }

      console.log(
        `shouldBeRevealed called for card: ${card.name} (${card.id}) - index: ${cards.findIndex(c => c.id === card.id)}`
      );

      // Find the card state
      const cardState = cardStates[card.id];
      console.log(`Card state for ${card.name}:`, cardState);

      // Check if this card has been explicitly revealed (has permission)
      if (cardState?.isRevealed === true) {
        console.log(
          `Card ${card.name} has reveal permission - should be revealed`
        );
        return true;
      }

      if (cardState?.isRevealed === false) {
        console.log(
          `Card ${card.name} does not have reveal permission - should stay blurred`
        );
        return false;
      }

      // Fallback for cards without explicit reveal state (first card)
      const currentCardIndex = cards.findIndex(c => c.id === card.id);
      if (currentCardIndex <= 0) {
        console.log(`First card (${currentCardIndex <= 0}), always revealed`);
        return true; // First card is always revealed
      }

      // If we get here, the card doesn't have explicit reveal permission
      console.log(
        `Card ${card.name} has no explicit reveal permission - defaulting to false`
      );
      return false;
    },
    [cardStates, cards]
  );

  // Load cards automatically when the provider initializes
  useEffect(() => {
    const loadCards = async () => {
      console.log('CardContext: Starting to load cards...');
      try {
        const cardsData = await getCardsDirect();
        console.log('CardContext: Cards loaded:', cardsData);
        setCardsAndInitialize(cardsData);
      } catch (error) {
        console.error('CardContext: Failed to load cards:', error);
      }
    };

    loadCards();
  }, [setCardsAndInitialize]);

  return (
    <CardContext.Provider
      value={{
        formData,
        cardStates,
        cards,
        sessionId,
        updateField,
        completeCard,
        uncompleteCard,
        activateCard,
        setCardsAndInitialize,
        checkRevealConditions,
        shouldBeRevealed,
        revealCard,
        isCardComplete,
      }}
    >
      {children}
    </CardContext.Provider>
  );
}

export const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCardContext must be used within CardProvider');
  }
  return context;
};
