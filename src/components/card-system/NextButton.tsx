import React, { useState } from 'react';
import { useCardStyles } from '@/hooks/useCardStyles';
import { useCardContext } from './CardContext';
import type { CardTemplate } from '@/lib/supabase';

interface NextButtonProps {
  card: CardTemplate;
  isLastCard?: boolean;
  variant?: 'default' | 'inverse';
}

export function NextButton({
  card,
  isLastCard = false,
  variant = 'default',
}: NextButtonProps) {
  const styles = useCardStyles();
  const { cards, formData, completeCard, revealCard, cardStates } =
    useCardContext();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isHovered, setIsHovered] = useState(false);

  // Don't show button on last card
  if (isLastCard) {
    return null;
  }

  // Don't show on submit cards (they have their own submit button)
  if (card.config?.has_submit_button) {
    return null;
  }

  // Hide button when card is already complete (user already clicked "Seuraava")
  if (cardStates[card.id]?.status === 'complete') {
    return null;
  }

  const validateAndAdvance = () => {
    // For non-form cards, just advance
    if (card.type !== 'form') {
      advanceToNext();
      return;
    }

    // Validate required fields for form cards
    const validationErrors: Record<string, string> = {};
    const fields = card.card_fields || [];

    for (const field of fields) {
      if (field.required) {
        const value = formData[field.field_name];
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (typeof value === 'number' &&
            value === 0 &&
            field.field_type !== 'quantity');

        if (isEmpty) {
          validationErrors[field.field_name] = 'Tämä kenttä on pakollinen';
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Clear errors and advance
    setErrors({});
    advanceToNext();
  };

  // Find next card for preview
  const currentIndex = cards.findIndex(c => c.id === card.id);
  const nextCard = cards[currentIndex + 1];

  const advanceToNext = () => {
    // Mark current card as complete
    completeCard(card.id);

    if (nextCard) {
      revealCard(nextCard.id);

      // Auto-scroll to next card after a brief delay for DOM to update
      setTimeout(() => {
        const nextCardElement = document.getElementById(`card-${nextCard.id}`);
        if (nextCardElement) {
          nextCardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    }
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: 600,
    color: variant === 'inverse' ? styles.colors.brand.primary : '#ffffff',
    background:
      variant === 'inverse'
        ? isHovered
          ? '#f9fafb'
          : '#ffffff'
        : isHovered
          ? styles.colors.brand.primaryHover
          : styles.colors.brand.primary,
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: styles.animations.transitions.default,
    transform: isHovered ? 'translateY(-1px)' : 'none',
    boxShadow: isHovered
      ? variant === 'inverse'
        ? '0 4px 12px rgba(0, 0, 0, 0.1)'
        : '0 4px 12px rgba(16, 185, 129, 0.3)'
      : variant === 'inverse'
        ? '0 2px 4px rgba(0, 0, 0, 0.05)'
        : 'none',
    marginTop: '24px',
  };

  return (
    <div>
      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: '#fef2f2',
            borderRadius: '8px',
            borderLeft: `4px solid ${styles.colors.state.error}`,
          }}
        >
          <p
            style={{
              color: styles.colors.state.error,
              fontSize: '14px',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Täytä pakolliset kentät jatkaaksesi
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={validateAndAdvance}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={buttonStyle}
      >
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Seuraava
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transition: 'transform 200ms ease',
                transform: isHovered ? 'translateY(2px)' : 'translateY(0)',
              }}
            >
              <path
                d="M8 3v10M4 9l4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {nextCard && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 400,
                opacity: 0.7,
              }}
            >
              {nextCard.title || nextCard.name}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
