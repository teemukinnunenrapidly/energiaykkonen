import React, { useState, useEffect } from 'react';
import { CardStream } from './CardStream';
import { VisualSupport } from './VisualSupport';
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
  widgetMode?: boolean; // When true, skip all Supabase operations
}

// Create inner component that has access to CardContext
function CardSystemInner({
  maxWidth,
  fullWidth = false,
  className = '',
  showVisualSupport = true,
  height,
  forceMode,
  showBlurredCards = false,
  widgetMode = false,
}: CardSystemContainerProps) {
  const styles = useCardStyles();
  const { cards } = useCardContext();

  // Use design tokens for defaults
  const containerMaxWidth = maxWidth || styles.container.maxWidth; // 1400px from token
  const containerHeight = height || styles.container.height; // 'auto' from token

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

  const cardStreamWidth = showVisualSupport
    ? styles.layout.cardStreamRatio
    : '100%';

  // Determine if we should show desktop or mobile layout
  const isMobileMode = forceMode === 'mobile';

  // Find the active card from cards list
  const activeCard = cards.find(c => c.id === activeContext.cardId);

  // Resolve visual object from linked_visual_object_id (for widget mode)
  let visualObject = activeCard?.visual_objects;
  
  if (widgetMode && activeCard?.config?.linked_visual_object_id) {
    // In widget mode, get visual object from global data
    const widgetData = (window as any).__E1_WIDGET_DATA;
    console.log('🔍 Attempting to resolve visual object:', {
      activeCardId: activeCard?.id,
      linkedId: activeCard.config.linked_visual_object_id,
      hasWidgetData: !!widgetData,
      hasVisualObjects: !!widgetData?.visualObjects,
      visualObjectsKeys: widgetData?.visualObjects ? Object.keys(widgetData.visualObjects) : [],
    });
    
    if (widgetData?.visualObjects) {
      visualObject = widgetData.visualObjects[activeCard.config.linked_visual_object_id];
      console.log('🎨 Widget mode: Resolved visual object:', {
        linkedId: activeCard.config.linked_visual_object_id,
        found: !!visualObject,
        title: visualObject?.title,
        hasImages: visualObject?.images?.length > 0,
        imageCount: visualObject?.images?.length || 0,
      });
    } else {
      console.warn('⚠️ No visual objects found in widget data');
    }
  }

  // Debug logging
  console.log('🏗️ CardSystemContainer state:', {
    totalCards: cards.length,
    cardsWithVisuals: cards.filter(c => c.visual_objects || c.config?.linked_visual_object_id).length,
    activeContextCardId: activeContext.cardId,
    activeCardName: activeCard?.name,
    activeCardHasVisuals: !!visualObject,
    widgetMode,
  });

  // Auto-select first card with visual objects for better UX (when no active card)
  useEffect(() => {
    // Only run once when cards are first loaded
    if (!activeContext.cardId && cards.length > 0) {
      // In widget mode, prioritize cards with linked_visual_object_id
      const cardWithVisual = cards.find(c => 
        c.visual_objects || (widgetMode && c.config?.linked_visual_object_id)
      );
      
      // If no card with visual, just select the first card
      const cardToSelect = cardWithVisual || cards[0];
      
      if (cardToSelect) {
        console.log('🎯 Auto-selecting card:', {
          cardId: cardToSelect.id,
          cardName: cardToSelect.name,
          hasVisual: !!(cardToSelect.visual_objects || cardToSelect.config?.linked_visual_object_id),
        });
        setActiveContext({
          cardId: cardToSelect.id,
          fieldId: 'auto_selected',
          value: 'preview',
        });
      }
    }
  }, [cards.length, widgetMode]); // React to cards loading

  return (
    <div
      style={{
        margin: '0 auto',
        ...containerStyle,
      }}
    >
      <div
        style={{
          height: containerHeight === 'auto' ? 'auto' : `${containerHeight}px`,
          padding: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: styles.layout.gapBetweenPanels,
          position: 'relative',
        }}
      >
        {/* Visual Support Panel */}
        {showVisualSupport && (
          <div
            style={{
              display: !isMobileMode ? 'block' : 'none',
              width: styles.layout.visualSupportRatio,
              height: '100%',
              background: styles.visualSupport.background,
              borderRight: styles.visualSupport.borderRight,
            }}
          >
            <VisualSupport
              activeCard={activeCard}
              visualConfig={visualObject}
              compact={isMobileMode}
              widgetMode={widgetMode}
            />
          </div>
        )}

        {/* Card Stream Panel */}
        <div
          style={{
            width: forceMode
              ? isMobileMode
                ? '100%'
                : showVisualSupport
                  ? cardStreamWidth
                  : '100%'
              : showVisualSupport
                ? cardStreamWidth
                : '100%',
            height: '100%',
            background: styles.cardStream.background,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <CardStream
            onFieldFocus={(cardId, fieldId, value) => {
              console.log('🎯 onFieldFocus called:', {
                cardId,
                fieldId,
                value,
              });
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
  // Initialize dependencies on mount (skip in widget mode)
  useEffect(() => {
    if (!props.widgetMode) {
      initializeCommonDependencies();
    }
  }, [props.widgetMode]);

  return (
    <CardProvider initialData={props.initialData} widgetMode={props.widgetMode}>
      <CardSystemInner {...props} />
    </CardProvider>
  );
}
