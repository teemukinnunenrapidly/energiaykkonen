import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X, RotateCcw } from 'lucide-react';

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
      <div className="text-4xl font-bold text-blue-600 flex items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        Lasketaan...
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`
              text-2xl font-bold px-3 py-1 border-2 rounded
              ${error ? 'border-red-500' : 'border-blue-500'}
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
            placeholder="0"
          />
          {unit && (
            <span className="text-2xl font-bold text-gray-600">{unit}</span>
          )}
          <button
            onClick={handleSave}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="Tallenna"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            onClick={handleCancel}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Peruuta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {editPrompt && <p className="text-sm text-gray-600">{editPrompt}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="text-4xl font-bold text-green-600">{value}</div>

          {isOverridden && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded"
              title={`Alkuperäinen laskettu arvo: ${originalValue}`}
            >
              muokattu
            </span>
          )}
        </div>

        {isOverridden && (
          <button
            onClick={handleRevert}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Palauta laskettu arvo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleEdit}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          {editButtonText}
        </button>
      </div>
    </div>
  );
}
