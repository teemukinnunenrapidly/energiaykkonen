// /src/components/card-system/CardStream.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useCardContext } from './CardContext';
import { CardRenderer } from './CardRenderer';
import { VisualSupport } from './VisualSupport';
import { useCardStyles } from '@/hooks/useCardStyles';

interface CardStreamProps {
  onFieldFocus?: (cardId: string, fieldId: string, value?: string) => void;
  activeCardId?: string;
  forceShowInline?: boolean; // For preview mode mobile
  showBlurredCards?: boolean; // Show upcoming cards in blurred state
}

export function CardStream({
  onFieldFocus,
  activeCardId,
  forceShowInline,
  showBlurredCards = false,
}: CardStreamProps) {
  const { cards, shouldBeRevealed, cardStates } = useCardContext();
  const styles = useCardStyles();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollIndicators, setScrollIndicators] = useState({
    showTop: false,
    showBottom: false,
  });

  // Auto-scrolling disabled - removed user scroll tracking

  // Update scroll indicators only
  const updateScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const hasScrollableContent = scrollHeight > clientHeight;

    setScrollIndicators(prev => {
      const newIndicators = {
        showTop: hasScrollableContent && scrollTop > 10,
        showBottom:
          hasScrollableContent && scrollTop < scrollHeight - clientHeight - 10,
      };

      // Only update if values actually changed
      if (
        prev.showTop === newIndicators.showTop &&
        prev.showBottom === newIndicators.showBottom
      ) {
        return prev;
      }

      return newIndicators;
    });
  }, []);

  // Update indicators on mount and when cards change
  useEffect(() => {
    updateScrollIndicators();
  }, [cards.length]); // Only depend on cards length, not the entire cards array or callback

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('scroll', updateScrollIndicators);
    return () =>
      container.removeEventListener('scroll', updateScrollIndicators);
  }, [updateScrollIndicators]);

  // Auto-scrolling disabled - removed auto-scroll to active card

  // Filter and sort cards based on reveal state and order
  const visibleCards = useMemo(() => {
    return cards
      .filter(card => shouldBeRevealed(card))
      .sort((a, b) => a.display_order - b.display_order);
  }, [cards, shouldBeRevealed]);

  const lockedCards = useMemo(() => {
    return cards
      .filter(card => !shouldBeRevealed(card))
      .sort((a, b) => a.display_order - b.display_order);
  }, [cards, shouldBeRevealed]);

  const hasMore = lockedCards.length > 0;

  // Find active card for visual support
  const activeCard = activeCardId
    ? cards.find(card => card.id === activeCardId)
    : cards.find(card => card.visual_objects); // Fallback to first card with visuals

  if (!cards.length) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '50%',
              height: '32px',
              width: '32px',
              border: '2px solid transparent',
              borderBottom: '2px solid #111827',
              margin: '0 auto 16px',
            }}
          ></div>
          <p style={{ color: '#6b7280' }}>Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Top Fade Indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'opacity 500ms',
          opacity: scrollIndicators.showTop ? 1 : 0,
          height: '32px',
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)',
        }}
      />

      {/* Card Stream Content */}
      <div
        ref={scrollContainerRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          // Auto-scrolling disabled
        }}
      >
        <div
          style={{
            padding: '30px',
            gap: '20px',
          }}
        >
          {/* Spacer for first card */}
          <div style={{ height: '20px' }}></div>

          {/* Inline Visual Support for Mobile */}
          {forceShowInline && (
            <div
              style={{
                display: forceShowInline ? 'block' : 'none',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: '32px' }}>
                  <VisualSupport activeCard={activeCard} compact={true} />
                </div>
              </div>
            </div>
          )}

          {/* Visible Cards with inline visual on desktop */}
          {visibleCards.map((card, index) => {
            const isActive = activeCardId === card.id;
            const isComplete = cardStates[card.id]?.status === 'complete';

            return (
              <>
              <div
                key={card.id}
                id={`card-${card.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  gap: styles.layout.gapBetweenPanels || '20px',
                  marginBottom: styles.card.base.marginBottom,
                }}
              >
                {/* Left: visual column (default placement) */}
                {!forceShowInline && (
                  <div style={{ flex: `0 0 ${styles.layout.visualSupportRatio || '35%'}`, minWidth: 0 }}>
                    {(card.visual_objects || (card as any).config?.linked_visual_object_id) ? (
                      <div
                        style={{
                          background: styles.card.base.background,
                          borderRadius: styles.card.base.borderRadius,
                          overflow: styles.card.base.overflow,
                          border: styles.card.base.border || '1px solid #e5e7eb',
                          boxShadow: styles.card.base.boxShadow,
                          height: '100%',
                        }}
                      >
                        <div style={{ height: '100%' }}>
                          <VisualSupport activeCard={card} compact={false} widgetMode={true} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '100%' }} />
                    )}
                  </div>
                )}

                {/* Right: interactive card */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: isActive
                      ? styles.card.states.active.background
                      : isComplete
                        ? styles.card.states.complete.background
                        : styles.card.base.background,
                    borderRadius: styles.card.base.borderRadius,
                    overflow: styles.card.base.overflow,
                    borderTop: isActive
                      ? styles.card.states.active.border
                      : styles.card.base.border || '1px solid #e5e7eb',
                    borderRight: isActive
                      ? styles.card.states.active.border
                      : styles.card.base.border || '1px solid #e5e7eb',
                    borderBottom: isActive
                      ? styles.card.states.active.border
                      : styles.card.base.border || '1px solid #e5e7eb',
                    borderLeft: isActive
                      ? styles.card.states.active.border
                      : isComplete
                        ? styles.card.states.complete.borderLeft
                        : styles.card.base.border || '1px solid #e5e7eb',
                    boxShadow: isActive
                      ? styles.card.states.active.boxShadow
                      : styles.card.base.boxShadow,
                    transform: isActive
                      ? styles.card.states.active.transform
                      : 'scale(1)',
                    opacity: isComplete
                      ? styles.card.states.complete.opacity
                      : '1',
                    transition: styles.card.base.transition,
                    position: 'relative',
                  }}
                >
                  {isComplete &&
                    styles.card.states.complete.checkmark?.enabled && (
                      <div
                        style={{
                          position: styles.card.states.complete.checkmark
                            .position as any,
                          top: styles.card.states.complete.checkmark.top,
                          right: styles.card.states.complete.checkmark.right,
                          width: styles.card.states.complete.checkmark.size,
                          height: styles.card.states.complete.checkmark.size,
                          background:
                            styles.card.states.complete.checkmark.background,
                          borderRadius:
                            styles.card.states.complete.checkmark.borderRadius,
                          padding: styles.card.states.complete.checkmark.padding,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: styles.card.states.complete.checkmark.color,
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.5 4.5L6 12L2.5 8.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  <CardRenderer card={card} onFieldFocus={onFieldFocus} />
                </div>
              </div>

              {/* Removed peek design */}
              </>
            );
          })}

          {/* Subtle call-to-action under cards */}
          {hasMore && (
            <div
              style={{
                padding: '12px 0 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#9CA3AF',
              }}
            >
              <style>{`
                @keyframes e1ArrowBounce { 0%,100% { transform: translateY(0); opacity: .8 } 50% { transform: translateY(4px); opacity: 1 } }
              `}</style>
              <div style={{ fontSize: '16px', lineHeight: 1, animation: 'e1ArrowBounce 1.4s ease-in-out infinite' }}>▾</div>
              <div style={{ marginTop: '6px', fontSize: '16px', textAlign: 'center' }}>
                Siirry eteenpäin vastaamalla kysymyksiin.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Fade Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'opacity 500ms',
          opacity: scrollIndicators.showBottom ? 1 : 0,
          height: '32px',
          background:
            'linear-gradient(0deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
