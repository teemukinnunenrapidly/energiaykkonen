import { useState, useEffect } from 'react';
import { processDisplayContent, ShortcodeResult, getAvailableShortcodes } from '@/lib/shortcode-processor';

interface UseShortcodeProcessingProps {
  content: string;
  formVariables?: Record<string, any>;
}

interface UseShortcodeProcessingReturn {
  processedContent: string;
  isProcessing: boolean;
  error: string | null;
  availableShortcodes: Array<{
    name: string;
    shortcode: string;
    description: string;
    category: string;
  }>;
  refreshShortcodes: () => Promise<void>;
}

export function useShortcodeProcessing({
  content,
  formVariables = {},
}: UseShortcodeProcessingProps): UseShortcodeProcessingReturn {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableShortcodes, setAvailableShortcodes] = useState<Array<{
    name: string;
    shortcode: string;
    description: string;
    category: string;
  }>>([]);

  // Process shortcodes when content or form variables change
  useEffect(() => {
    if (content) {
      processShortcodes();
    }
  }, [content, formVariables]);

  // Load available shortcodes on mount
  useEffect(() => {
    loadAvailableShortcodes();
  }, []);

  const processShortcodes = async () => {
    if (!content) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result: ShortcodeResult = await processDisplayContent(
        content,
        formVariables
      );

      if (result.success && result.result) {
        setProcessedContent(result.result);
      } else {
        setError(result.error || 'Failed to process shortcodes');
        setProcessedContent(content); // Fallback to original content
      }
    } catch (err) {
      console.error('Error processing shortcodes:', err);
      setError('Error processing shortcodes');
      setProcessedContent(content); // Fallback to original content
    } finally {
      setIsProcessing(false);
    }
  };

  const loadAvailableShortcodes = async () => {
    try {
      const shortcodes = await getAvailableShortcodes();
      setAvailableShortcodes(shortcodes);
    } catch (err) {
      console.error('Error loading available shortcodes:', err);
    }
  };

  const refreshShortcodes = async () => {
    await loadAvailableShortcodes();
  };

  return {
    processedContent,
    isProcessing,
    error,
    availableShortcodes,
    refreshShortcodes,
  };
}
