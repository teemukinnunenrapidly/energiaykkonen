'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, Copy, Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
  description?: string;
  presets?: string[];
  allowTransparency?: boolean;
  className?: string;
}

export default function ColorPicker({
  value,
  onChange,
  label,
  description,
  presets = [],
  className = '',
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [inputMode, setInputMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [copied, setCopied] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    setInputValue(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate and apply color
    if (isValidColor(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    if (!isValidColor(inputValue)) {
      setInputValue(value); // Reset to original value
    }
  };

  const handleCopyColor = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        handleColorChange(result.sRGBHex);
      } catch (err) {
        console.error('Eye dropper failed:', err);
      }
    }
  };

  const isValidColor = (color: string): boolean => {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  };

  const formatColor = (color: string, mode: 'hex' | 'rgb' | 'hsl'): string => {
    if (!isValidColor(color)) {
      return color;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return color;
      }

      ctx.fillStyle = color;
      const computedColor = ctx.fillStyle;

      if (mode === 'hex') {
        return computedColor;
      } else if (mode === 'rgb') {
        const rgb = ctx.getImageData(0, 0, 1, 1).data;
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      } else if (mode === 'hsl') {
        // Convert RGB to HSL
        const rgb = ctx.getImageData(0, 0, 1, 1).data;
        const r = rgb[0] / 255;
        const g = rgb[1] / 255;
        const b = rgb[2] / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

          switch (max) {
            case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4;
              break;
          }
          h /= 6;
        }

        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
      }
    } catch (err) {
      console.error('Color formatting failed:', err);
    }

    return color;
  };

  const handleFormatChange = (mode: 'hex' | 'rgb' | 'hsl') => {
    setInputMode(mode);
    const formatted = formatColor(value, mode);
    setInputValue(formatted);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>

      {/* Color preview and picker */}
      <div className="flex items-center gap-3">
        {/* Color preview */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm hover:border-gray-300 transition-colors"
            style={{ backgroundColor: value }}
            aria-label={`Select ${label} color`}
          />

          {/* Color picker dropdown */}
          {isOpen && (
            <div
              ref={pickerRef}
              className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]"
            >
              <div className="space-y-4">
                {/* Color input modes */}
                <div className="flex gap-2">
                  {(['hex', 'rgb', 'hsl'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleFormatChange(mode)}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        inputMode === mode
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Color input */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder={
                      inputMode === 'hex'
                        ? '#FF6B00'
                        : inputMode === 'rgb'
                          ? 'rgb(255, 107, 0)'
                          : 'hsl(24, 100%, 50%)'
                    }
                  />

                  {/* HTML5 color input */}
                  <input
                    type="color"
                    value={value}
                    onChange={e => handleColorChange(e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>

                {/* Preset swatches */}
                {presets.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Presets
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {presets.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => handleColorChange(preset)}
                          className="w-8 h-8 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                          style={{ backgroundColor: preset }}
                          aria-label={`Select ${preset}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleEyeDropper}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    title="Pick color from screen"
                  >
                    <Eye className="w-4 h-4" />
                    Eyedropper
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyColor}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    title="Copy color value"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Color value display */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter color value"
            />
            <button
              type="button"
              onClick={handleCopyColor}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy color value"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
