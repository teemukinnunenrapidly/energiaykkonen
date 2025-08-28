import React, { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import type { CardTemplate } from '@/lib/supabase';
import { useCardContext } from '../CardContext';

interface InfoCardProps {
  card: CardTemplate;
}

export function InfoCard({ card }: InfoCardProps) {
  const { completeCard, revealCard, cards, cardStates } = useCardContext();
  const hasGrantedPermissionRef = useRef<boolean>(false);

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
        </div>
      </div>
    </div>
  );
}
