import React from 'react';
import type { CardTemplate } from '@/lib/supabase';
import { useCardStyles } from '@/hooks/useCardStyles';
import { NextButton } from '../NextButton';

interface InfoCardProps {
  card: CardTemplate;
  isLastCard?: boolean;
}

export function InfoCard({ card, isLastCard = false }: InfoCardProps) {
  const styles = useCardStyles();

  return (
    <div
      style={{
        padding: styles.card.base.padding,
        background: styles.infoCard.background,
      }}
    >
      {/* Header section with separator */}
      {(card.title || card.config?.description) && (
        <div style={styles.card.header as React.CSSProperties}>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: styles.card.title.fontSize,
                fontWeight: styles.card.title.fontWeight,
                color: styles.card.title.color,
                lineHeight: styles.card.title.lineHeight,
                marginBottom: styles.card.title.marginBottom,
                letterSpacing: styles.card.title.letterSpacing,
              }}
            >
              {card.title || card.name}
            </h3>

            {card.config?.description && (
              <p
                style={{
                  fontSize: styles.card.description.fontSize,
                  fontWeight: styles.card.description.fontWeight,
                  color: styles.card.description.color,
                  lineHeight: styles.card.description.lineHeight,
                  marginBottom: styles.card.description.marginBottom,
                }}
              >
                {card.config.description}
              </p>
            )}
          </div>
        </div>
      )}

      {card.config?.content && (
        <div
          style={{
            fontSize: styles.infoCard.content.fontSize,
            color: styles.infoCard.content.color,
            lineHeight: styles.infoCard.content.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: card.config.content }}
        />
      )}

      {/* Next Button */}
      <NextButton card={card} isLastCard={isLastCard} />
    </div>
  );
}
