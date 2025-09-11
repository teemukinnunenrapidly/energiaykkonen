import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  type CardTemplate,
  getCardsDirect,
  updateFieldCompletion,
  updateCardCompletion,
  getCardCompletion,
  checkCardCompletion,
  initializeCleanSession,
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
  submitData: (emailTemplate?: string) => Promise<void>; // Submit form data
}

const CardContext = createContext<CardContextValue | null>(null);

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  // Check for forced new session (for testing/debugging)
  const forceNewSession =
    new URLSearchParams(window.location.search).get('new_session') === 'true';

  let sessionId = localStorage.getItem('card_session_id');

  if (!sessionId || forceNewSession) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('card_session_id', sessionId);
    console.log(
      `🆕 ${forceNewSession ? 'Forced' : 'Generated'} new session: ${sessionId}`
    );
  }

  return sessionId;
};

export function CardProvider({ 
  children,
  initialData,
  widgetMode = false
}: { 
  children: React.ReactNode;
  initialData?: any; // Initial data from config.json
  widgetMode?: boolean; // When true, skip all Supabase operations
}) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [cardOrder, setCardOrder] = useState<string[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [sessionId] = useState<string>(getSessionId());

  const updateField = useCallback(
    async (fieldName: string, value: any) => {
      console.log(
        `🔄 updateField called: fieldName="${fieldName}", value="${value}", sessionId="${sessionId}"`
      );

      // Update local formData immediately for UI responsiveness
      const newFormData = { ...formData, [fieldName]: value };
      setFormData(newFormData);
      console.log(`Updated formData for ${fieldName}:`, newFormData);

      // Also update the session data table (like a waiter writing down the order)
      // Skip in widget mode - no database connection
      if (!widgetMode) {
        updateSessionWithFormData(sessionId, newFormData);
      }

      // Find which card this field belongs to
      const fieldCard = cards.find(card =>
        card.card_fields?.some(field => field.field_name === fieldName)
      );

      if (fieldCard) {
        console.log(
          `🗃️ Updating field completion in database for card "${fieldCard.name}"`
        );

        // In widget mode, skip database operations and use local logic
        let shouldBeComplete = false;
        
        if (!widgetMode) {
          // Update field completion in database
          await updateFieldCompletion(fieldCard.id, fieldName, value, sessionId);

          // Check completion using database logic with proper session isolation
          shouldBeComplete = await checkCardCompletion(
            fieldCard.id,
            sessionId
          );

          console.log(
            `📋 Card "${fieldCard.name}" database completion check (session-isolated): ${shouldBeComplete}`
          );

          // Update card completion state based on database logic
          if (shouldBeComplete) {
            await updateCardCompletion(fieldCard.id, sessionId, true, fieldName);
          }
        } else {
          // Widget mode: Check completion locally using the configured completion_rules
          const fields = fieldCard.card_fields || [];
          const rules = fieldCard.completion_rules?.form_completion?.type as
            | 'all_fields'
            | 'any_field'
            | 'required_fields'
            | undefined;

          const valueFor = (name: string) => newFormData[name];

          if (rules === 'all_fields') {
            shouldBeComplete = fields.length === 0
              ? true
              : fields.every(f => {
                  const v = valueFor(f.field_name);
                  return v !== undefined && v !== null && v !== '';
                });
          } else if (rules === 'any_field') {
            shouldBeComplete = fields.some(f => {
              const v = valueFor(f.field_name);
              return v !== undefined && v !== null && v !== '';
            });
          } else if (rules === 'required_fields') {
            const requiredNames =
              fieldCard.completion_rules?.form_completion?.required_field_names || [];
            if (requiredNames.length > 0) {
              shouldBeComplete = requiredNames.every(name => {
                const v = valueFor(name);
                return v !== undefined && v !== null && v !== '';
              });
            } else {
              // Fallback to field-level required flags
              const requiredFields = fields.filter(f => f.required);
              shouldBeComplete = requiredFields.length === 0
                ? fields.some(f => {
                    const v = valueFor(f.field_name);
                    return v !== undefined && v !== null && v !== '';
                  })
                : requiredFields.every(f => {
                    const v = valueFor(f.field_name);
                    return v !== undefined && v !== null && v !== '';
                  });
            }
          } else {
            // No explicit rules: preserve current UX - require all required fields; if none, any field
            const requiredFields = fields.filter(f => f.required);
            shouldBeComplete = requiredFields.length === 0
              ? fields.some(f => {
                  const v = valueFor(f.field_name);
                  return v !== undefined && v !== null && v !== '';
                })
              : requiredFields.every(f => {
                  const v = valueFor(f.field_name);
                  return v !== undefined && v !== null && v !== '';
                });
          }

          console.log(
            `📋 Card "${fieldCard.name}" local completion (rules=${rules || 'default'}) -> ${shouldBeComplete}`
          );
        }
        
        if (shouldBeComplete) {

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
    [cards, sessionId, formData, widgetMode]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const unlockCard = useCallback((cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], status: 'unlocked' },
    }));
  }, []);

  // Preserved for future use when card unlocking logic is needed
  // const _unlockNextCards = useCallback(
  //   (cardId: string) => {
  //     const cardIndex = cardOrder.indexOf(cardId);

  //     // Based on card position in order, unlock the appropriate next cards
  //     // This matches the HTML demo's behavior

  //     if (cardIndex === 0) {
  //       // First form card (Property Details)
  //       // Immediately unlock next card (should be calculation)
  //       if (cardOrder[1]) {
  //         unlockCard(cardOrder[1]);
  //       }
  //       // After delay, unlock third card (next form)
  //       if (cardOrder[2]) {
  //         setTimeout(() => unlockCard(cardOrder[2]), 1000);
  //       }
  //     } else if (cardIndex === 2) {
  //       // Second form card (Heating)
  //       // Immediately unlock info card
  //       if (cardOrder[3]) {
  //         unlockCard(cardOrder[3]);
  //       }
  //       // After 800ms, unlock savings calculation
  //       if (cardOrder[4]) {
  //         setTimeout(() => unlockCard(cardOrder[4]), 800);
  //       }
  //       // After 1600ms, unlock contact form
  //       if (cardOrder[5]) {
  //         setTimeout(() => unlockCard(cardOrder[5]), 1600);
  //       }
  //     } else if (cardIndex === 5) {
  //       // Contact form
  //       // After 500ms, unlock submit button
  //       if (cardOrder[6]) {
  //         setTimeout(() => unlockCard(cardOrder[6]), 500);
  //       }
  //     }
  //   },
  //   [cardOrder, unlockCard]
  // );

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
      setCardStates(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], isRevealed: true },
      }));

      // Auto-complete non-form cards when revealed and cascade to next
      if (card && (card.type === 'info' || card.type === 'visual' || card.type === 'calculation')) {
        setCardStates(prev => ({
          ...prev,
          [cardId]: { ...prev[cardId], status: 'complete', isRevealed: true },
        }));

        const currentIndex = cards.findIndex(c => c.id === cardId);
        const nextCard = cards[currentIndex + 1];
        if (nextCard) {
          const timing = card.reveal_timing;
          if (timing?.timing === 'after_delay') {
            const delayMs = (timing.delay_seconds || 3) * 1000;
            console.log(`⏱️ Auto-complete cascade: revealing "${nextCard.name}" after ${delayMs}ms`);
            setTimeout(() => revealCard(nextCard.id), delayMs);
          } else {
            console.log(`⚡ Auto-complete cascade: revealing "${nextCard.name}" immediately`);
            revealCard(nextCard.id);
          }
        }
      }
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
        // Treat missing or empty reveal_timing as immediate
        const revealTiming = card.reveal_timing;
        console.log(`🕐 Reveal timing settings:`, {
          reveal_timing: revealTiming,
          nextCard: nextCard.name,
        });

        // Use reveal_timing (required for all cards)
        if (revealTiming && (revealTiming as any).timing) {
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
        } else {
          // No reveal_timing defined - require proper reveal_timing to be set
          console.warn(
            `Card "${card.name}" has no reveal_timing defined. Please set reveal_timing in admin.`
          );
          // Default to immediate reveal for now to prevent system from breaking
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

          // Use completion_rules (required for all form cards)
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
                const result = fields.every(field => {
                  const value = formData[field.field_name];
                  const isComplete =
                    value !== undefined && value !== null && value !== '';
                  console.log(
                    `🔍 Field completion check: ${field.field_name} (${field.field_type}) = "${value}" -> ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`
                  );
                  return isComplete;
                });
                console.log(
                  `🎯 Card "${card.name}" all_fields completion result: ${result} (${fields.length} fields total)`
                );
                return result;

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
            // No completion_rules defined - card requires proper completion_rules to be set
            console.warn(
              `Form card "${card.name}" has no completion_rules defined. Please set completion_rules in admin.`
            );
            return false; // Don't auto-complete cards without proper rules
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

  const submitData = useCallback(
    async (emailTemplate?: string) => {
      // In widget mode (WordPress), prefer posting to Vercel API if configured
      if (widgetMode) {
        try {
          const globalCfg = (window as any).__E1_WIDGET_DATA || {};
          // Gather possible sources for lead endpoint
          let leadApiUrl: string =
            globalCfg?.settings?.leadApiUrl ||
            (window as any).__E1_WIDGET_SETTINGS__?.leadApiUrl ||
            globalCfg?.api?.submitEndpoint ||
            (window as any).__E1_WIDGET_API__?.submitEndpoint ||
            '';

          // Ensure absolute URL; fallback to production API if missing
          if (!leadApiUrl) {
            leadApiUrl = 'https://energiaykkonen-calculator.vercel.app/api/submit-lead';
          } else if (leadApiUrl.startsWith('/')) {
            // If relative, prefix with Vercel origin (prevents posting to WP origin)
            const defaultOrigin = 'https://energiaykkonen-calculator.vercel.app';
            leadApiUrl = defaultOrigin + leadApiUrl;
          }

          if (leadApiUrl) {
            console.log('📧 Widget mode: Submitting to lead API', { leadApiUrl });
            const payload = {
              ...formData,
              submit_email_template: emailTemplate || '',
              session_id: sessionId,
            };

            const res = await fetch(leadApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              mode: 'cors',
              credentials: 'omit',
            });

            if (!res.ok) {
              const text = await res.text().catch(() => '');
              throw new Error(`Lead API error (${res.status}): ${text || res.statusText}`);
            }

            console.log('✅ Lead submitted successfully to Vercel API');
            return;
          }

          // Fallback to WordPress AJAX if API not configured
          console.log('ℹ️ Lead API not configured, falling back to WordPress AJAX');
          const wpConfig = (window as any).e1_widget_config;
          if (!wpConfig?.nonce) {
            throw new Error('WordPress configuration not found');
          }

          const response = await fetch(wpConfig.ajax_url || '/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              action: 'e1_submit_form',
              nonce: wpConfig.nonce,
              formData: JSON.stringify(formData),
              emailTemplate: emailTemplate || ''
            })
          });
          if (!response.ok) {
            throw new Error('WordPress submission failed');
          }
          await response.json().catch(() => ({}));
          console.log('✅ Widget form submitted successfully via WordPress');
          return;
        } catch (error) {
          console.error('❌ Widget submission error:', error);
          throw error;
        }
      }
      
      // Normal mode: use API endpoint
      const submitPayload = {
        ...formData,
        submit_email_template: emailTemplate,
      };

      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form data');
      }
    },
    [formData, widgetMode]
  );

  const completeCard = useCallback(
    (cardId: string) => {
      console.log(`completeCard called for: ${cardId}`);
      
      // Find the card being completed
      const completedCard = cards.find(c => c.id === cardId);
      
      setCardStates(prev => {
        const newStates = { ...prev };

        // Mark current card as complete
        newStates[cardId] = { ...newStates[cardId], status: 'complete' };

        // Check all cards to see if any should now be revealed based on this completion
        cards.forEach(card => {
          if (card.reveal_conditions && card.reveal_conditions.length > 0) {
            // Check if this card's reveal conditions are now met
            const conditionsMet = card.reveal_conditions.every(condition => {
              if (condition.type === 'card_complete') {
                const targetCardNames = condition.target || [];
                // Check if all target cards are complete
                return targetCardNames.every(targetName => {
                  const targetCard = cards.find(c => c.name === targetName);
                  if (!targetCard) return false;
                  
                  // Check if we just completed this card or it was already complete
                  if (targetCard.id === cardId) {
                    return true; // We just completed this card
                  }
                  return newStates[targetCard.id]?.status === 'complete';
                });
              }
              return true; // Unknown condition type, assume met
            });

            if (conditionsMet && !newStates[card.id]?.isRevealed) {
              console.log(`✅ Revealing card "${card.name}" - conditions met after completing "${completedCard?.name}"`);
              newStates[card.id] = { ...newStates[card.id], isRevealed: true };
              
              // If this is the next card in sequence and no other card is active, activate it
              const activeCard = Object.entries(newStates).find(([_, state]) => state.status === 'active');
              if (!activeCard) {
                newStates[card.id].status = 'active';
              }
            }
          }
        });

        console.log('Updated card states after completion:', newStates);
        return newStates;
      });

      // Handle granting reveal permission to next card based on reveal timing (legacy)
      const currentCardIndex = cards.findIndex(c => c.id === cardId);
      const nextCard = cards[currentCardIndex + 1];

      if (nextCard) {
        const currentCard = cards[currentCardIndex];
        // Treat missing or empty reveal_timing as immediate
        const revealTiming = currentCard.reveal_timing;
        console.log(
          `Card ${currentCard.name} completed, checking reveal timing for next card ${nextCard.name}:`,
          { reveal_timing: revealTiming }
        );

        // Use reveal_timing (required for all cards)
        if (revealTiming && (revealTiming as any).timing) {
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
        } else {
          // No reveal_timing defined - require proper reveal_timing to be set
          console.warn(
            `Card "${currentCard.name}" has no reveal_timing defined. Please set reveal_timing in admin.`
          );
          // Default to immediate reveal for now to prevent system from breaking
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
          // Check if this card was previously completed (skip in widget mode)
          let isComplete = false;
          if (!widgetMode) {
            const completionState = await getCardCompletion();
            isComplete = completionState?.is_complete || false;
          }

          newStates[cardId] = {
            status: isComplete ? 'complete' : 'hidden',
            isRevealed: false, // All cards start not revealed except first
          };

          console.log(
            `🔴 INIT: Card ${index} "${card?.name}" set to ${isComplete ? 'COMPLETE' : 'HIDDEN'} and NOT REVEALED`
          );
        }
      }

      // console.log('🔄 INIT: Final initial card states:', newStates);
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

      // console.log(
      // `shouldBeRevealed called for card: ${card.name} (${card.id}) - index: ${cards.findIndex(c => c.id === card.id)}`
      // );

      // Find the card state
      const cardState = cardStates[card.id];
      // console.log(`Card state for ${card.name}:`, cardState);

      // Check if this card has been explicitly revealed (has permission)
      if (cardState?.isRevealed === true) {
        // console.log(
        // `Card ${card.name} has reveal permission - should be revealed`
        // );
        return true;
      }

      if (cardState?.isRevealed === false) {
        // console.log(
        // `Card ${card.name} does not have reveal permission - should stay blurred`
        // );
        return false;
      }

      // Fallback for cards without explicit reveal state (first card)
      const currentCardIndex = cards.findIndex(c => c.id === card.id);
      if (currentCardIndex <= 0) {
        console.log(`First card (${currentCardIndex <= 0}), always revealed`);
        return true; // First card is always revealed
      }

      // If we get here, the card doesn't have explicit reveal permission
      // console.log(
      // `Card ${card.name} has no explicit reveal permission - defaulting to false`
      // );
      return false;
    },
    [cardStates, cards]
  );

  // Load cards automatically when the provider initializes
  useEffect(() => {
    console.log('🔥 CardContext useEffect is running!');
    const loadCards = async () => {
      console.log('🚀 CardContext: Starting to load cards...');
      try {
        let cardsData;
        
        // Check if we have initial data (offline mode)
        if (initialData?.cards) {
          console.log('📦 Using offline data from config.json');
          cardsData = initialData.cards;
        } 
        // Check if widget data is available globally (for standalone widget)
        else if (typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA?.cards) {
          console.log('📦 Using widget data from global store');
          cardsData = (window as any).__E1_WIDGET_DATA.cards;
        }
        // Otherwise fetch from Supabase (development mode) - skip in widget mode
        else if (!widgetMode) {
          console.log('📞 CardContext: Calling getCardsDirect()...');
          cardsData = await getCardsDirect();
        } else {
          console.warn('⚠️ Widget mode enabled but no data provided. Cards will be empty.');
          cardsData = [];
        }
        
        console.log(
          '✅ CardContext: Cards loaded successfully:',
          cardsData.length,
          'cards'
        );
        console.log(
          '📋 CardContext: Card details:',
          cardsData.map((c: any) => ({
            id: c.id,
            name: c.name,
            hasVisualObjects: !!c.visual_objects,
          }))
        );
        // Inline setCardsAndInitialize logic to avoid dependency issues
        console.log('🚀 setCardsAndInitialize called with:', cardsData);
        setCards(cardsData);
        const orderedCardIds = cardsData.map((card: any) => card.id);
        setCardOrder(orderedCardIds);

        // Initialize card states - simplified version for first load
        const newStates: Record<string, CardState> = {};
        for (let index = 0; index < orderedCardIds.length; index++) {
          const cardId = orderedCardIds[index];
          const card = cardsData.find((c: any) => c.id === cardId);

          if (index === 0) {
            // First card starts as active and revealed
            newStates[cardId] = { status: 'active', isRevealed: true };
            console.log(
              `🟢 INIT: Card ${index} "${card?.name}" set to ACTIVE and REVEALED`
            );
          } else {
            // Other cards start hidden and not revealed - progressive disclosure
            newStates[cardId] = { status: 'hidden', isRevealed: false };
            console.log(
              `🔴 INIT: Card ${index} "${card?.name}" set to HIDDEN and NOT REVEALED`
            );
          }
        }
        setCardStates(newStates);
      } catch (error) {
        console.error('❌ CardContext: Failed to load cards:', error);
        if (error instanceof Error) {
          console.error('Stack trace:', error.stack);
        }
      }
    };

    loadCards();
  }, [initialData, widgetMode]);

  // Initialize clean session on every app load (ensures fresh start) - skip in widget mode
  useEffect(() => {
    if (widgetMode) {
      console.log('🌐 Widget mode: Skipping session initialization');
      return;
    }
    
    const initializeSession = async () => {
      // Skip in widget mode - no database connection
      if (widgetMode) {
        console.log('🔧 Widget mode: Skipping session initialization');
        return;
      }
      
      console.log('🧹 Cleaning session data for fresh start...');
      try {
        await initializeCleanSession(sessionId);
        // Remove the cleanup flag if it exists
        localStorage.removeItem('session_needs_cleanup');
        console.log('✅ Session cleaned and initialized successfully');
      } catch (error) {
        console.error('❌ Failed to clean session:', error);
        // Continue anyway - don't break the user experience
      }
    };

    initializeSession();
  }, [sessionId, widgetMode]);

  const value = {
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
    submitData,
  };

  console.log('🎯 CardContext providing value:', { 
    cards: value.cards?.length || 0,
    hasCards: !!value.cards && value.cards.length > 0,
    cardStatesCount: Object.keys(value.cardStates || {}).length,
    formDataKeys: Object.keys(value.formData || {}).length,
    widgetMode
  });

  return (
    <CardContext.Provider value={value}>
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
