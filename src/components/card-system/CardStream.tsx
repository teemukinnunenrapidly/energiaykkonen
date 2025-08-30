// /src/components/card-system/CardStream.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCardContext } from './CardContext';
import { CardRenderer } from './CardRenderer';
import { VisualSupport } from './VisualSupport';

interface CardStreamProps {
  onFieldFocus?: (cardId: string, fieldId: string, value?: string) => void;
  showInlineVisual?: boolean;
  activeCardId?: string;
  forceShowInline?: boolean; // For preview mode mobile
  showBlurredCards?: boolean; // Show upcoming cards in blurred state
}

export function CardStream({
  onFieldFocus,
  showInlineVisual,
  activeCardId,
  forceShowInline,
  showBlurredCards = false,
}: CardStreamProps) {
  const { cards, shouldBeRevealed, cardStates } = useCardContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollIndicators, setScrollIndicators] = useState({
    showTop: false,
    showBottom: false,
  });

  // Track previous reveal states to detect transitions
  const [previousRevealStates, setPreviousRevealStates] = useState<
    Record<string, boolean>
  >({});

  // Track if user is manually scrolling to disable auto-scroll
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [userScrollTimeout, setUserScrollTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Update scroll indicators and detect manual scrolling
  const updateScrollIndicators = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const hasScrollableContent = scrollHeight > clientHeight;

    setScrollIndicators({
      showTop: hasScrollableContent && scrollTop > 10,
      showBottom:
        hasScrollableContent && scrollTop < scrollHeight - clientHeight - 10,
    });

    // Detect if user scrolled up (deliberately)
    const scrollDelta = scrollTop - lastScrollTop;
    if (Math.abs(scrollDelta) > 5) {
      // Only consider significant scroll movements
      if (scrollDelta < 0) {
        // User scrolled up
        setUserScrolledUp(true);
      } else if (scrollDelta > 50) {
        // User scrolled down significantly - might be intentional navigation
        // Reset the "scrolled up" flag if they scroll down a lot
        if (scrollTop > lastScrollTop + 100) {
          setUserScrolledUp(false);
        }
      }
    }

    // Re-enable auto-scroll if user reaches near the bottom
    const isNearBottom = scrollTop >= scrollHeight - clientHeight - 50;
    if (isNearBottom && userScrolledUp) {
      setUserScrolledUp(false);
    }

    setLastScrollTop(scrollTop);

    // Detect manual scrolling
    setIsUserScrolling(true);

    // Clear existing timeout
    if (userScrollTimeout) {
      clearTimeout(userScrollTimeout);
    }

    // Set a new timeout to reset user scrolling flag
    const newTimeout = setTimeout(() => {
      setIsUserScrolling(false);
    }, 2000); // Wait 2 seconds after user stops scrolling

    setUserScrollTimeout(newTimeout);
  };

  // Update indicators on mount and when cards change
  useEffect(() => {
    const timer = setTimeout(updateScrollIndicators, 100);
    return () => clearTimeout(timer);
  }, [cards]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
    };
  }, [userScrollTimeout]);

  // Memoize current reveal states to prevent infinite loops
  const currentRevealStates = useMemo(() => {
    const states: Record<string, boolean> = {};
    cards.forEach(card => {
      // Use the new reveal permission system
      states[card.id] = shouldBeRevealed(card, new Set());
    });
    return states;
  }, [cards, cardStates]); // Remove shouldBeRevealed from deps as it may change frequently

  // Auto-scroll to newly revealed cards
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    // Check if we're in preview mode
    const isPreviewMode = window.location.pathname.includes('/admin/preview');

    if (isPreviewMode) {
      // Find cards that just transitioned from blurred to revealed
      const newlyRevealedCards = cards.filter(card => {
        const wasRevealed = previousRevealStates[card.id] || false;
        const isNowRevealed = currentRevealStates[card.id];
        return !wasRevealed && isNowRevealed;
      });

      // Also check for cards that might have become visible due to form completion
      // This handles cases where cards with 'immediately' reveal become visible
      const visibleCards = cards.filter((card, index) => {
        if (index === 0) {
          return false;
        } // Skip first card
        return currentRevealStates[card.id];
      });

      // If we have newly revealed cards, scroll to them
      // If not, but we have visible cards that weren't visible before, scroll to the last one
      const cardsToScrollTo =
        newlyRevealedCards.length > 0
          ? newlyRevealedCards
          : visibleCards.length > 0
            ? [visibleCards[visibleCards.length - 1]]
            : [];

      // Update previous states for next comparison
      setPreviousRevealStates(currentRevealStates);

      // Auto-scroll to newly revealed cards or visible cards (only if user isn't manually scrolling and hasn't scrolled up)
      if (cardsToScrollTo.length > 0 && !isUserScrolling && !userScrolledUp) {
        const cardToScrollTo = cardsToScrollTo[cardsToScrollTo.length - 1];
        const cardElement = document.getElementById(
          `card-${cardToScrollTo.id}`
        );

        if (cardElement) {
          // Wait a bit for the transition to complete, then scroll
          setTimeout(() => {
            // Double-check that user still isn't scrolling and hasn't scrolled up
            if (isUserScrolling || userScrolledUp) {
              return;
            }

            // Calculate the scroll position to center the card
            const containerRect = container.getBoundingClientRect();
            const cardRect = cardElement.getBoundingClientRect();
            const scrollTop = container.scrollTop;

            const targetScrollTop =
              scrollTop +
              cardRect.top -
              containerRect.top -
              containerRect.height / 2 +
              cardRect.height / 2;

            // Smooth scroll to center the card
            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth',
            });
          }, 300); // Wait for blur-to-reveal transition
        }
      }
    }
  }, [cards, currentRevealStates, isUserScrolling, userScrolledUp]); // Remove objects from dependencies to prevent constant re-runs

  return (
    <div className="relative h-full w-full">
      {/* Top shadow overlay */}
      <div
        className={`absolute top-0 left-0 right-0 h-20 pointer-events-none z-10 transition-opacity duration-500 ${
          scrollIndicators.showTop ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `linear-gradient(180deg, 
            rgba(0,0,0,0.06) 0%, 
            rgba(0,0,0,0.03) 40%, 
            rgba(0,0,0,0.01) 70%, 
            transparent 100%)`,
        }}
      />

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollIndicators}
        className="h-full overflow-y-auto scroll-smooth custom-scrollbar"
        style={{ height: '100%' }}
      >
        <div className="px-6 py-8 space-y-8">
          {/* Inline Visual Support for Mobile */}
          {showInlineVisual && activeCardId && (
            <div className={`mb-6 ${forceShowInline ? '' : 'lg:hidden'}`}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48">
                  <VisualSupport objectId={activeCardId} compact={true} />
                </div>
              </div>
            </div>
          )}

          {cards.map((card, index) => {
            // In preview mode, show all cards but with different states
            const isRevealed = currentRevealStates[card.id];
            const isPreviewMode =
              window.location.pathname.includes('/admin/preview');

            // Find the first unrevealed card index (next card to be revealed)
            const firstUnrevealedIndex = cards.findIndex(c => !currentRevealStates[c.id]);
            const isFirstUpcoming = index === firstUnrevealedIndex;
            const isSecondUpcoming = index === firstUnrevealedIndex + 1;

            // Show logic:
            // - Preview mode: show all cards
            // - showBlurredCards: show revealed + next 2 upcoming cards
            // - Default: show only revealed cards
            let shouldShow = false;
            if (isPreviewMode) {
              shouldShow = true;
            } else if (showBlurredCards) {
              shouldShow = isRevealed || isFirstUpcoming || isSecondUpcoming;
            } else {
              shouldShow = isRevealed;
            }

            // Blur states for upcoming cards
            const isBlurred = !isRevealed && shouldShow;
            const isSecondBlur = isSecondUpcoming && !isRevealed;

            // Check if card is completed
            const cardState = cardStates[card.id];
            const isCompleted = cardState?.status === 'complete';

            if (!shouldShow) {
              return null;
            }

            return (
              <div
                key={card.id}
                id={`card-${card.id}`}
                className={`
                  transition-all duration-500 ease-out
                  ${
                    isBlurred
                      ? isSecondBlur
                        ? 'opacity-30 translate-y-0 blur-md pointer-events-none'
                        : 'opacity-60 translate-y-0 blur-sm pointer-events-none'
                      : 'opacity-100 translate-y-0'
                  }
                `}
                style={{
                  transitionDelay: isBlurred ? '0ms' : `${index * 100}ms`,
                }}
              >
                <div
                  className={`
                  bg-white rounded-lg shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-200
                  ${
                    isBlurred
                      ? isSecondBlur
                        ? 'border-gray-400 bg-gray-100'
                        : 'border-gray-300 bg-gray-50'
                      : isCompleted
                        ? 'border-green-300 shadow-green-100 hover:border-green-400'
                        : 'border-gray-200'
                  }
                `}
                >
                  <CardRenderer card={card} onFieldFocus={onFieldFocus} />
                </div>
              </div>
            );
          })}

          {/* Bottom spacer */}
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}
