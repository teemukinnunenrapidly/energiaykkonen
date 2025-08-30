import React, { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { CardTemplate } from '@/lib/supabase';
import { useCardContext } from '../CardContext';

interface InfoCardProps {
  card: CardTemplate;
}

export function InfoCard({ card }: InfoCardProps) {
  const { completeCard, revealCard, cards, cardStates, submitData } =
    useCardContext();
  const hasGrantedPermissionRef = useRef<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Info cards should only complete when they are revealed (not blurred)
    const cardState = cardStates[card.id];
    const isThisCardRevealed = cardState?.isRevealed === true;
    const isAlreadyComplete = cardState?.status === 'complete';

    if (!isThisCardRevealed) {
      console.log(
        `🔴 InfoCard "${card.name}" is NOT revealed yet, NOT completing card`
      );
      return;
    }

    if (isAlreadyComplete) {
      console.log(`⏭️ InfoCard "${card.name}" is already complete, skipping`);
      return;
    }

    console.log(
      `🟢 InfoCard "${card.name}" IS revealed and not complete yet, completing card`
    );
    completeCard(card.id);
  }, [card.id, completeCard, cardStates]);

  useEffect(() => {
    // Only handle reveal_next_conditions when THIS info card is actually revealed (not blurred)
    const cardState = cardStates[card.id];
    const isThisCardRevealed = cardState?.isRevealed === true;

    if (!isThisCardRevealed) {
      console.log(
        `🔴 InfoCard "${card.name}" is NOT revealed yet (isRevealed=${cardState?.isRevealed}), not granting permissions`
      );
      hasGrantedPermissionRef.current = false; // Reset when card becomes blurred again
      return;
    }

    // Prevent granting permission multiple times
    if (hasGrantedPermissionRef.current) {
      console.log(
        `⏭️ InfoCard "${card.name}" has already granted permission, skipping`
      );
      return;
    }

    console.log(
      `🟢 InfoCard "${card.name}" IS REVEALED (isRevealed=${cardState?.isRevealed}), checking reveal timing for next card`
    );

    // Handle reveal timing to grant permission to the next card
    const revealTiming = card.reveal_timing;
    const legacyRevealConditions = card.reveal_next_conditions;
    const currentCardIndex = cards.findIndex(c => c.id === card.id);
    const nextCard = cards[currentCardIndex + 1];

    if (nextCard) {
      console.log(
        `InfoCard ${card.name} checking reveal timing for next card ${nextCard.name}:`,
        { reveal_timing: revealTiming, legacy: legacyRevealConditions }
      );

      // Use new reveal_timing if available, otherwise fall back to legacy system
      if (revealTiming) {
        if (revealTiming.timing === 'immediately') {
          // Grant reveal permission immediately when this info card is revealed
          console.log(
            `Granting immediate reveal permission to ${nextCard.name}`
          );
          revealCard(nextCard.id);
          hasGrantedPermissionRef.current = true;
        } else if (revealTiming.timing === 'after_delay') {
          // Grant reveal permission after the specified delay
          const delayMs = (revealTiming.delay_seconds || 3) * 1000;
          console.log(
            `Will grant reveal permission to ${nextCard.name} after ${delayMs}ms`
          );
          const timer = setTimeout(() => {
            console.log(
              `Granting delayed reveal permission to ${nextCard.name}`
            );
            revealCard(nextCard.id);
            hasGrantedPermissionRef.current = true;
          }, delayMs);

          // Clean up timer on unmount
          return () => clearTimeout(timer);
        }
      } else if (legacyRevealConditions) {
        // Fall back to legacy system
        if (
          !legacyRevealConditions ||
          legacyRevealConditions.type === 'immediately'
        ) {
          // Grant reveal permission immediately when this info card is revealed
          console.log(
            `Granting immediate reveal permission to ${nextCard.name} (legacy)`
          );
          revealCard(nextCard.id);
          hasGrantedPermissionRef.current = true;
        } else if (legacyRevealConditions.type === 'after_delay') {
          // Grant reveal permission after the specified delay
          const delayMs = (legacyRevealConditions.delay_seconds || 3) * 1000;
          console.log(
            `Will grant reveal permission to ${nextCard.name} after ${delayMs}ms (legacy)`
          );
          const timer = setTimeout(() => {
            console.log(
              `Granting delayed reveal permission to ${nextCard.name} (legacy)`
            );
            revealCard(nextCard.id);
            hasGrantedPermissionRef.current = true;
          }, delayMs);

          // Clean up timer on unmount
          return () => clearTimeout(timer);
        }
      } else {
        // Default behavior: immediate reveal
        console.log(
          `No reveal timing specified, defaulting to immediate reveal for ${nextCard.name}`
        );
        revealCard(nextCard.id);
        hasGrantedPermissionRef.current = true;
      }
    }
  }, [
    card.id,
    card.reveal_timing,
    card.reveal_next_conditions,
    revealCard,
    cards,
    cardStates,
  ]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit the form data using the CardContext submit functionality
      if (submitData) {
        await submitData(card.config?.submit_email_template);
      }

      // Mark this card as complete when submit button is clicked
      completeCard(card.id);

      // Show success message
      setSubmitSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Submission failed:', error);
      // Could add error state here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
          <div
            className="text-sm text-gray-700 space-y-2"
            dangerouslySetInnerHTML={{ __html: card.config.content }}
          />

          {/* Submit Button Section */}
          {card.config?.has_submit_button && (
            <div className="mt-4 pt-4 border-t border-yellow-300">
              {submitSuccess ? (
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <svg
                    className="w-8 h-8 text-green-600 mx-auto mb-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-green-800 font-medium">
                    {card.config?.submit_success_message ||
                      'Thank you! Your submission has been received.'}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`
                      inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg
                      ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                      }
                      transition-colors duration-200
                    `}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      card.config?.submit_button_text || 'Submit'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
