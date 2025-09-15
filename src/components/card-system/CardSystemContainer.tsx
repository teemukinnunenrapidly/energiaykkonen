import React, { useState, useEffect, useRef } from 'react';
import { CardStream } from './CardStream';
import { CardProvider, useCardContext } from './CardContext';
import { initializeCommonDependencies } from '@/lib/session-data-table';
import { useCardStyles } from '@/hooks/useCardStyles';

interface CardSystemContainerProps {
  maxWidth?: string | number;
  fullWidth?: boolean;
  className?: string;
  showVisualSupport?: boolean;
  height?: number; // Height in pixels
  forceMode?: 'desktop' | 'mobile'; // Force a specific mode for preview
  showBlurredCards?: boolean; // Show upcoming cards in blurred state
  initialData?: any; // Initial data for offline mode
}

// Create inner component that has access to CardContext
function CardSystemInner({
  maxWidth,
  fullWidth = false,
  showVisualSupport = true,
  height,
  forceMode,
  showBlurredCards = false,
}: CardSystemContainerProps) {
  const styles = useCardStyles();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { cards } = useCardContext();

  // Use design tokens for defaults
  const containerMaxWidth = maxWidth || styles.container.maxWidth; // 1400px from token

  const [activeContext, setActiveContext] = useState<{
    cardId?: string;
    fieldId?: string;
    value?: string;
  }>({});

  const containerStyle = fullWidth
    ? {}
    : {
        maxWidth:
          typeof containerMaxWidth === 'number'
            ? `${containerMaxWidth}px`
            : containerMaxWidth,
      };

  // Determine if we should show desktop or mobile layout
  const [detectedMobile, setDetectedMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const bpStr = (styles.responsive as any)?.breakpoints?.mobile || '768px';
    const bp = parseInt(String(bpStr).replace('px', '')) || 768;

    // Prefer container width via ResizeObserver for accurate responsive detection
    let ro: ResizeObserver | null = null;
    const observeContainer = () => {
      if (!containerRef.current || typeof ResizeObserver === 'undefined') {
        return;
      }
      ro = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect?.width || window.innerWidth;
        setDetectedMobile(width <= bp);
      });
      ro.observe(containerRef.current);
    };

    // Fallback to window width
    const onResize = () =>
      setDetectedMobile(
        (containerRef.current?.offsetWidth || window.innerWidth) <= bp
      );

    observeContainer();
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (ro) {
        ro.disconnect();
      }
    };
  }, [styles.responsive]);
  const isMobileMode = forceMode === 'mobile' || detectedMobile;

  // Find the active card from cards list
  const activeCard = cards.find(c => c.id === activeContext.cardId);

  // Get visual object from active card
  const visualObject = activeCard?.visual_objects;

  // Auto-select first card with visual objects for better UX (when no active card)
  useEffect(() => {
    // Only run once when cards are first loaded
    if (!activeContext.cardId && cards.length > 0) {
      // Find first card with visual objects
      const cardWithVisual = cards.find(c => c.visual_objects);

      // If no card with visual, just select the first card
      const cardToSelect = cardWithVisual || cards[0];

      if (cardToSelect) {
        setActiveContext({
          cardId: cardToSelect.id,
          fieldId: 'auto_selected',
          value: 'preview',
        });
      }
    }
  }, [activeContext.cardId, cards]);

  return (
    <div
      ref={containerRef}
      style={{
        margin: '0 auto',
        minHeight: styles.container.minHeight,
        background: (styles.container as any).background || undefined,
        ...containerStyle,
      }}
    >
      <div
        style={{
          minHeight: styles.container.minHeight,
          height: styles.container.height,
          padding: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: styles.layout.gapBetweenPanels,
          position: 'relative',
        }}
      >
        {/* Visual Support Panel removed; visuals are rendered per-card inline in CardStream */}

        {/* Card Stream Panel */}
        <div
          style={{
            width: '100%',
            minHeight:
              (styles.cardStream as any).minHeight ||
              (styles.container as any).minHeight,
            height: (styles.cardStream as any).height || '100%',
            background: styles.cardStream.background,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <CardStream
            onFieldFocus={(cardId, fieldId, value) => {
              setActiveContext({ cardId, fieldId, value });
            }}
            activeCardId={activeContext.cardId}
            forceShowInline={isMobileMode}
            showBlurredCards={showBlurredCards}
          />
        </div>
      </div>
    </div>
  );
}

export function CardSystemContainer(props: CardSystemContainerProps) {
  // Initialize dependencies on mount
  useEffect(() => {
    initializeCommonDependencies();
  }, []);

  // Always wrap in CardProvider
  return (
    <CardProvider initialData={props.initialData}>
      <CardSystemInner {...props} />
    </CardProvider>
  );
}
