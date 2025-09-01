import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X, RotateCcw } from 'lucide-react';
import { useCardStyles } from '../../../hooks/useCardStyles';

interface EditableCalculationResultProps {
  value: string;
  originalValue: string;
  unit?: string;
  onUpdate: (newValue: number) => void;
  editButtonText?: string;
  editPrompt?: string;
  validationMin?: number;
  validationMax?: number;
  isCalculating?: boolean;
}

export function EditableCalculationResult({
  value,
  originalValue,
  unit = '',
  onUpdate,
  editButtonText = 'Korjaa lukemaa',
  editPrompt = 'Syötä todellinen kulutuksesi',
  validationMin,
  validationMax,
  isCalculating = false,
}: EditableCalculationResultProps) {
  const styles = useCardStyles();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOverridden, setIsOverridden] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if current value differs from original (indicates override)
  useEffect(() => {
    const numericValue = parseFloat(
      value.replace(/[^\d,.-]/g, '').replace(',', '.')
    );
    const numericOriginal = parseFloat(
      originalValue.replace(/[^\d,.-]/g, '').replace(',', '.')
    );
    setIsOverridden(Math.abs(numericValue - numericOriginal) > 0.01);
  }, [value, originalValue]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    // Extract numeric value from display value
    const numericValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    setEditValue(numericValue);
    setError(null);
    setIsEditing(true);
  };

  const parseFormattedNumber = (input: string): number | null => {
    // Handle Finnish number format: space as thousands separator, comma as decimal
    const normalized = input
      .replace(/\s/g, '') // Remove spaces (thousands separator)
      .replace(',', '.'); // Replace comma with dot for decimal

    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  const formatNumber = (num: number): string => {
    // Format with Finnish locale
    return num.toLocaleString('fi-FI');
  };

  const handleSave = () => {
    const parsedValue = parseFormattedNumber(editValue);

    if (parsedValue === null) {
      setError('Syötä kelvollinen numero');
      return;
    }

    // Validate against min/max if provided
    if (validationMin !== undefined && parsedValue < validationMin) {
      setError(`Arvon tulee olla vähintään ${formatNumber(validationMin)}`);
      return;
    }

    if (validationMax !== undefined && parsedValue > validationMax) {
      setError(`Arvon tulee olla enintään ${formatNumber(validationMax)}`);
      return;
    }

    // Update the value
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
    // Parse and update with original value
    const numericOriginal = parseFloat(
      originalValue.replace(/[^\d,.-]/g, '').replace(',', '.')
    );
    onUpdate(numericOriginal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isCalculating) {
    return (
      <div
        style={{
          color: styles.colors.state.info,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            height: '32px',
            width: '32px',
            border: '2px solid transparent',
            borderBottom: `2px solid ${styles.colors.state.info}`,
          }}
        ></div>
        Lasketaan...
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <div
          style={
            styles.calculationCard.editMode.inputGroup as React.CSSProperties
          }
        >
          <div
            style={{
              ...(styles.calculationCard.editMode
                .inputWrapper as React.CSSProperties),
              ...(error
                ? {
                    borderColor:
                      styles.calculationCard.editMode.inputError.borderColor,
                  }
                : {}),
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                ...(styles.calculationCard.editMode
                  .input as React.CSSProperties),
                paddingRight: unit ? '60px' : '12px', // Make room for unit label
              }}
              onFocus={e => {
                const wrapper = e.currentTarget.parentElement;
                if (wrapper) {
                  Object.assign(
                    wrapper.style,
                    styles.calculationCard.editMode.inputWrapperFocus
                  );
                }
              }}
              onBlur={e => {
                const wrapper = e.currentTarget.parentElement;
                if (wrapper && !error) {
                  wrapper.style.borderColor =
                    styles.calculationCard.editMode.inputWrapper.borderColor;
                  wrapper.style.boxShadow = 'none';
                }
              }}
            />
            {unit && (
              <span
                style={{
                  ...(styles.calculationCard.editMode
                    .unitLabel as React.CSSProperties),
                  position: 'absolute',
                  right: '1px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  borderLeft: '1px solid #e5e7eb',
                  borderRadius: '0 6px 6px 0',
                  color: '#6b7280',
                  fontSize: '14px',
                  pointerEvents: 'none',
                }}
              >
                {unit}
              </span>
            )}
          </div>
          <div
            style={
              styles.calculationCard.editMode
                .actionButtons as React.CSSProperties
            }
          >
            <button
              onClick={handleSave}
              style={
                styles.calculationCard.editMode
                  .saveButton as React.CSSProperties
              }
              onMouseEnter={e => {
                Object.assign(
                  e.currentTarget.style,
                  styles.calculationCard.editMode.saveButtonHover
                );
              }}
              onMouseLeave={e => {
                Object.assign(
                  e.currentTarget.style,
                  styles.calculationCard.editMode.saveButton
                );
              }}
            >
              <Check
                style={{
                  width: '14px',
                  height: '14px',
                  marginRight: '4px',
                  display: 'inline',
                }}
              />
              Tallenna
            </button>
            <button
              onClick={handleCancel}
              style={
                styles.calculationCard.editMode
                  .cancelButton as React.CSSProperties
              }
              onMouseEnter={e => {
                Object.assign(
                  e.currentTarget.style,
                  styles.calculationCard.editMode.cancelButtonHover
                );
              }}
              onMouseLeave={e => {
                Object.assign(
                  e.currentTarget.style,
                  styles.calculationCard.editMode.cancelButton
                );
              }}
            >
              <X
                style={{
                  width: '14px',
                  height: '14px',
                  marginRight: '4px',
                  display: 'inline',
                }}
              />
              Peruuta
            </button>
          </div>
        </div>
        {editPrompt && (
          <p
            style={{
              fontSize: styles.typography.fontSizeBase,
              color: styles.colors.text.secondary,
              marginTop: '8px',
            }}
          >
            {editPrompt}
          </p>
        )}
        {error && (
          <div
            style={styles.calculationCard.errorMessage as React.CSSProperties}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Edited indicator badge */}
      {isOverridden && (
        <div
          style={
            styles.calculationCard.editedIndicator.badge as React.CSSProperties
          }
        >
          <span
            style={
              styles.calculationCard.editedIndicator.icon as React.CSSProperties
            }
          >
            ✏️
          </span>
          Muokattu
        </div>
      )}

      {/* Result display */}
      <div>
        <div
          style={styles.calculationCard.resultSection as React.CSSProperties}
        >
          <div
            style={styles.calculationCard.resultDisplay as React.CSSProperties}
          >
            <div>
              <span
                style={
                  styles.calculationCard.metricValue as React.CSSProperties
                }
              >
                {value.split(' ')[0]}
              </span>
              {value.includes(' ') && (
                <span
                  style={
                    styles.calculationCard.metricUnit as React.CSSProperties
                  }
                >
                  {value.split(' ').slice(1).join(' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit/Revert buttons on separate row below */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {isOverridden && (
            <button
              onClick={handleRevert}
              style={styles.calculationCard.editButton as React.CSSProperties}
              onMouseEnter={e => {
                Object.assign(
                  e.currentTarget.style,
                  styles.calculationCard.editButtonHover
                );
              }}
              onMouseLeave={e => {
                Object.assign(
                  e.currentTarget.style,
                  styles.calculationCard.editButton
                );
              }}
              title={`Palauta alkuperäinen arvo: ${originalValue}`}
            >
              <RotateCcw
                style={{
                  ...(styles.calculationCard.editIcon as React.CSSProperties),
                  width: '14px',
                  height: '14px',
                }}
              />
              Palauta
            </button>
          )}
          <button
            onClick={handleEdit}
            style={styles.calculationCard.editButton as React.CSSProperties}
            onMouseEnter={e => {
              Object.assign(
                e.currentTarget.style,
                styles.calculationCard.editButtonHover
              );
            }}
            onMouseLeave={e => {
              Object.assign(
                e.currentTarget.style,
                styles.calculationCard.editButton
              );
            }}
            onFocus={e => {
              Object.assign(
                e.currentTarget.style,
                styles.calculationCard.editButtonFocus
              );
            }}
            onBlur={e => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.outlineOffset = '0';
            }}
            title={editButtonText}
          >
            <Edit2
              style={{
                ...(styles.calculationCard.editIcon as React.CSSProperties),
                width: '14px',
                height: '14px',
              }}
            />
            {editButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
