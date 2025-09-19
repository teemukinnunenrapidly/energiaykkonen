import React, { useState, useEffect } from 'react';
import { useCardStyles } from '@/hooks/useCardStyles';

interface EditableCalculationResultProps {
  value: string; // Format: "number unit" e.g., "50820 kWH"
  originalValue: string;
  unit?: string;
  onUpdate: (value: number) => void;
  editButtonText?: string;
  isCalculating?: boolean;
  editPrompt?: string;
  validationMin?: number;
  validationMax?: number;
}

export const EditableCalculationResult: React.FC<
  EditableCalculationResultProps
> = ({
  value,
  originalValue,
  unit,
  onUpdate,
  editButtonText = 'Syötä lukema',
  isCalculating = false,
  validationMin,
  validationMax,
}) => {
  const styles = useCardStyles();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOverridden, setIsOverridden] = useState(false);

  // Extract numeric value from string
  const getNumericValue = (val: string): number => {
    if (!val) {
      return 0;
    }
    const numStr = val.split(' ')[0];
    return parseFloat(numStr.replace(/\s/g, '').replace(',', '.')) || 0;
  };

  // Check if value has been overridden
  useEffect(() => {
    const numericValue = getNumericValue(value);
    const numericOriginal = getNumericValue(originalValue);
    setIsOverridden(Math.abs(numericValue - numericOriginal) > 0.01);
  }, [value, originalValue]);

  const handleEdit = () => {
    const numericValue = getNumericValue(value);
    setEditValue(numericValue.toString());
    setError(null);
    setIsEditing(true);
  };

  const parseFormattedNumber = (input: string): number | null => {
    const normalized = input
      .replace(/\s/g, '') // Remove spaces
      .replace(',', '.'); // Replace comma with dot
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('fi-FI');
  };

  const handleSave = () => {
    const parsedValue = parseFormattedNumber(editValue);

    if (parsedValue === null) {
      setError('Syötä kelvollinen numero');
      return;
    }

    if (validationMin !== undefined && parsedValue < validationMin) {
      setError(`Arvon tulee olla vähintään ${formatNumber(validationMin)}`);
      return;
    }

    if (validationMax !== undefined && parsedValue > validationMax) {
      setError(`Arvon tulee olla enintään ${formatNumber(validationMax)}`);
      return;
    }

    onUpdate(parsedValue);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
  };

  const handleRevert = () => {
    const numericOriginal = getNumericValue(originalValue);
    onUpdate(numericOriginal);
  };

  if (isCalculating) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: styles.colors.state.info,
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${styles.colors.border.default}`,
            borderTopColor: styles.colors.state.info,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        Lasketaan...
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSave();
              }
              if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            style={{
              padding: styles.formElements.input.padding,
              border: `1px solid ${error ? styles.colors.state.error : styles.colors.border.default}`,
              borderRadius: styles.formElements.input.borderRadius,
              fontSize: styles.formElements.input.fontSize,
              flex: 1,
            }}
            placeholder="Syötä arvo"
            autoFocus
          />
          {unit && (
            <span
              style={{
                color: styles.colors.text.secondary,
                fontSize: styles.typography.fontSizeBase,
                minWidth: 'max-content',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={
              {
                flex: 1,
                padding: '0.625rem 1.5rem',
                background: styles.colors.state.success,
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              } as React.CSSProperties
            }
          >
            ✓ Tallenna
          </button>
          <button
            onClick={handleCancel}
            style={
              {
                flex: 1,
                padding: '0.625rem 1.5rem',
                background: styles.colors.text.secondary,
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              } as React.CSSProperties
            }
          >
            ✕ Peruuta
          </button>
        </div>

        {error && (
          <div
            style={{
              color: styles.colors.state.error,
              fontSize: styles.formElements.errorMessage.fontSize,
              marginTop: '4px',
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  // Non-editing display mode
  const displayValue = value.split(' ')[0];
  const displayUnit = unit || value.split(' ').slice(1).join(' ');

  return (
    <div style={{ position: 'relative' }}>
      {isOverridden && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: styles.colors.state.warning,
            color: 'white',
            fontSize: '0.75rem',
            padding: '2px 6px',
            borderRadius: '12px',
            fontWeight: styles.typography.fontWeightMedium,
          }}
        >
          Muokattu
        </div>
      )}

      {/* Display the calculated value - using calculation card styles */}
      <div style={styles.calculationCard.resultDisplay as React.CSSProperties}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              ...(styles.calculationCard.metricValue as React.CSSProperties),
              flex: 1,
            }}
          >
            {displayValue}
          </div>
          {displayUnit && (
            <div
              style={styles.calculationCard.metricUnit as React.CSSProperties}
            >
              {displayUnit}
            </div>
          )}
        </div>
      </div>

      {/* Edit button - properly styled with design tokens */}
      <button
        onClick={handleEdit}
        style={{
          width: '100%',
          padding: styles.formElements.input.padding,
          background: 'transparent',
          color: styles.colors.brand.primary,
          border: `1px solid ${styles.colors.brand.primary}`,
          borderRadius: styles.formElements.input.borderRadius,
          cursor: 'pointer',
          fontSize: styles.typography.fontSizeBase,
          fontWeight: styles.typography.fontWeightMedium,
          marginTop: '16px',
          marginBottom: isOverridden ? '8px' : '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = styles.colors.brand.primary;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = styles.colors.brand.primary;
        }}
      >
        ✏️ {editButtonText || 'Syötä lukema'}
      </button>

      {isOverridden && (
        <button
          onClick={handleRevert}
          style={{
            width: '100%',
            padding: styles.formElements.input.padding,
            background: styles.colors.text.secondary,
            color: 'white',
            border: 'none',
            borderRadius: styles.formElements.input.borderRadius,
            cursor: 'pointer',
            fontSize: styles.typography.fontSizeBase,
            fontWeight: styles.typography.fontWeightMedium,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          ↻ Palauta alkuperäinen ({originalValue.split(' ')[0]} {displayUnit})
        </button>
      )}
    </div>
  );
};
