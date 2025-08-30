import React, { useState, useEffect } from 'react';
import { CardStream } from './CardStream';
import { VisualSupport } from './VisualSupport';
import { CardProvider } from './CardContext';
import { initializeCommonDependencies } from '@/lib/session-data-table';

interface CardSystemContainerProps {
  maxWidth?: string | number;
  fullWidth?: boolean;
  className?: string;
  showVisualSupport?: boolean;
  visualPosition?: 'left' | 'right';
  visualWidth?: string; // e.g., '40%', '500px', '50%'
  height?: number; // Height in pixels
  forceMode?: 'desktop' | 'mobile'; // Force a specific mode for preview
  showBlurredCards?: boolean; // Show upcoming cards in blurred state
}

export function CardSystemContainer({
  maxWidth = 1200,
  fullWidth = false,
  className = '',
  showVisualSupport = true,
  visualPosition = 'left',
  visualWidth = '50%',
  height = 800,
  forceMode,
  showBlurredCards = false,
}: CardSystemContainerProps) {
  // Initialize dependencies on mount
  useEffect(() => {
    initializeCommonDependencies();
  }, []);

  const [activeContext, setActiveContext] = useState<{
    cardId?: string;
    fieldId?: string;
    value?: string;
  }>({});

  const containerStyle = fullWidth
    ? {}
    : { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth };

  const cardStreamWidth = showVisualSupport
    ? `calc(100% - ${visualWidth})`
    : '100%';

  // Determine if we should show desktop or mobile layout
  const isMobileMode = forceMode === 'mobile';

  return (
    <CardProvider>
      <div className={`mx-auto ${className}`} style={containerStyle}>
        <div
          className="flex flex-col lg:flex-row p-2.5"
          style={{ height: `${height}px` }}
        >
          {/* Visual Support Panel - Conditional Position */}
          {showVisualSupport && visualPosition === 'left' && (
            <div
              className={
                forceMode
                  ? isMobileMode
                    ? 'hidden'
                    : 'block'
                  : 'hidden lg:block'
              }
              style={{ width: visualWidth, height: `${height - 20}px` }}
            >
              <VisualSupport objectId={activeContext.cardId} />
            </div>
          )}

          {/* Card Stream Panel */}
          <div
            className="w-full lg:w-auto flex-1 overflow-hidden"
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
              height: `${height - 20}px`,
            }}
          >
            <CardStream
              onFieldFocus={(cardId, fieldId, value) => {
                setActiveContext({ cardId, fieldId, value });
              }}
              showInlineVisual={forceMode ? isMobileMode : showVisualSupport}
              activeCardId={activeContext.cardId}
              forceShowInline={isMobileMode}
              showBlurredCards={showBlurredCards}
            />
          </div>

          {/* Visual Support Panel - Right Position */}
          {showVisualSupport && visualPosition === 'right' && (
            <div
              className={
                forceMode
                  ? isMobileMode
                    ? 'hidden'
                    : 'block'
                  : 'hidden lg:block'
              }
              style={{ width: visualWidth, height: `${height - 20}px` }}
            >
              <VisualSupport objectId={activeContext.cardId} />
            </div>
          )}
        </div>
      </div>
    </CardProvider>
  );
}
