import React, { useState, useEffect } from 'react';

interface EditableCalculationResultProps {
  value: string | number | null | undefined;
  originalValue: string | number | null | undefined;
  unit?: string;
  onUpdate: (newValue: number) => void;
  editButtonText?: string;
  editPrompt?: string;
  validationMin?: number;
  validationMax?: number;
  isCalculating?: boolean;
}

export const EditableCalculationResult: React.FC<EditableCalculationResultProps> = ({
  value,
  originalValue,
  unit = '',
  onUpdate,
  editButtonText = 'Korjaa lukemaa',
  editPrompt = 'Syötä todellinen kulutuksesi',
  validationMin,
  validationMax,
  isCalculating = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOverridden, setIsOverridden] = useState(false);

  // Safe value conversion function with smart object display
  const safeStringValue = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'object') {
      console.warn('EditableCalculationResult received object value:', val);
      // Try to create meaningful display string from object
      const obj = val as any;
      if (obj?.value !== undefined) {
        const valueStr = String(obj.value);
        const unit = obj.unit || obj.yksikko || '';
        return unit ? `${valueStr} ${unit}` : valueStr;
      }
      if (obj?.result !== undefined) {
        const resultStr = String(obj.result);
        const unit = obj.unit || obj.yksikko || '';
        return unit ? `${resultStr} ${unit}` : resultStr;
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  // Extract numeric value safely from any type
  const getNumericValue = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d,.-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof val === 'object' && val !== null) {
      // Try common object patterns
      if (val.value !== undefined) return getNumericValue(val.value);
      if (val.result !== undefined) return getNumericValue(val.result);
      if (val.amount !== undefined) return getNumericValue(val.amount);
      console.warn('Could not extract numeric value from object:', val);
      return 0;
    }
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Check if current value differs from original (indicates override)
  useEffect(() => {
    const numericValue = getNumericValue(value);
    const numericOriginal = getNumericValue(originalValue);
    setIsOverridden(Math.abs(numericValue - numericOriginal) > 0.01);
  }, [value, originalValue]);

  const handleEdit = () => {
    // Extract numeric value from display value
    const numericValue = getNumericValue(value);
    setEditValue(numericValue.toString());
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
    const numericOriginal = getNumericValue(originalValue);
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        color: '#3b82f6'
      }}>
        <div 
          className="loading-spinner"
          style={{
            height: '24px',
            width: '24px',
            border: '2px solid #e5e5e5',
            borderTopColor: '#3b82f6',
          }}
        ></div>
        Lasketaan...
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              padding: '8px 12px',
              border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '16px',
              flex: 1,
            }}
            placeholder="Syötä arvo"
            autoFocus
          />
          {unit && (
            <span style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              minWidth: 'max-content'
            }}>
              {unit}
            </span>
          )}
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            ✓ Tallenna
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            ✕ Peruuta
          </button>
        </div>
        {editPrompt && (
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: '4px 0' 
          }}>
            {editPrompt}
          </p>
        )}
        {error && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '14px',
            marginTop: '4px' 
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Don't render if no value to display
  if (!value || safeStringValue(value).trim() === '') {
    return (
      <div style={{
        padding: '16px',
        background: '#f9fafb',
        borderRadius: '8px',
        color: '#6b7280',
        textAlign: 'center' as const,
      }}>
        Ei tulosta näytettäväksi
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Edited indicator badge */}
      {isOverridden && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#f59e0b',
          color: 'white',
          fontSize: '12px',
          padding: '2px 6px',
          borderRadius: '12px',
          fontWeight: '500',
        }}>
          ✏️ Muokattu
        </div>
      )}

      {/* Result display */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '12px',
        }}>
          <div>
            <span style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
            }}>
              {safeStringValue(value).split(' ')[0]}
            </span>
            {safeStringValue(value).includes(' ') && (
              <span style={{
                fontSize: '16px',
                color: '#6b7280',
                marginLeft: '8px',
              }}>
                {safeStringValue(value).split(' ').slice(1).join(' ')}
              </span>
            )}
          </div>
        </div>

        {/* Edit/Revert buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOverridden && (
            <button
              onClick={handleRevert}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title={`Palauta alkuperäinen arvo: ${safeStringValue(originalValue)}`}
            >
              ↻ Palauta
            </button>
          )}
          <button
            onClick={handleEdit}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={editButtonText}
          >
            ✏️ {editButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};