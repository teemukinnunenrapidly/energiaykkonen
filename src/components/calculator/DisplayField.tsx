'use client';

import { useState, useEffect } from 'react';
import {
  processDisplayContent,
  ShortcodeResult,
} from '@/lib/shortcode-processor';
import { FormField } from '@/types/form';
import { useCardContext } from '@/components/card-system/CardContext';

interface DisplayFieldProps {
  field: FormField;
  formVariables?: Record<string, any>;
  className?: string;
}

export function DisplayField({
  field,
  formVariables = {},
  className = '',
}: DisplayFieldProps) {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get sessionId from CardContext if available
  const cardContext = useCardContext();
  const sessionId = cardContext?.sessionId;

  useEffect(() => {
    if (field.type === 'display' && field.displayContent) {
      processShortcodes();
    }
  }, [field.displayContent, formVariables]);

  const processShortcodes = async () => {
    if (!field.displayContent) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result: ShortcodeResult = await processDisplayContent(
        field.displayContent,
        formVariables,
        sessionId // Now passes sessionId to enable unified engine
      );

      if (result.success && result.result) {
        setProcessedContent(result.result);
      } else {
        setError(result.error || 'Failed to process shortcodes');
        setProcessedContent(field.displayContent); // Fallback to original content
      }
    } catch (err) {
      console.error('Error processing display field shortcodes:', err);
      setError('Error processing shortcodes');
      setProcessedContent(field.displayContent); // Fallback to original content
    } finally {
      setIsProcessing(false);
    }
  };

  if (field.type !== 'display') {
    return null;
  }

  // Apply custom styling from field configuration
  const customStyles: React.CSSProperties = {};

  if (field.displayStyle) {
    if (field.displayStyle.backgroundColor) {
      customStyles.backgroundColor = field.displayStyle.backgroundColor;
    }
    if (field.displayStyle.textAlign) {
      customStyles.textAlign = field.displayStyle.textAlign;
    }
    if (field.displayStyle.fontSize) {
      customStyles.fontSize = field.displayStyle.fontSize;
    }
    if (field.displayStyle.fontWeight) {
      customStyles.fontWeight = field.displayStyle.fontWeight;
    }
  }

  return (
    <div className={`display-field ${className}`} style={customStyles}>
      {field.label && (
        <div className="display-field-label mb-2 font-medium text-gray-700">
          {field.label}
        </div>
      )}

      <div className="display-field-content">
        {isProcessing ? (
          <div className="text-gray-500 italic">Processing calculations...</div>
        ) : error ? (
          <div className="text-red-600 text-sm">{error}</div>
        ) : (
          <div
            className="display-field-text"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        )}
      </div>

      {field.helpText && (
        <div className="display-field-help mt-2 text-sm text-gray-600">
          {field.helpText}
        </div>
      )}
    </div>
  );
}
