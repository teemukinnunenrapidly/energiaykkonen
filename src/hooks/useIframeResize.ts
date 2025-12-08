import { useEffect, useRef } from 'react';

/**
 * A hook that sends the document height to the parent window via postMessage.
 * This allows the iframe on the WordPress site to automatically resize to fit the content.
 *
 * Features:
 * - Debounced (100ms) to prevent message flooding
 * - Only sends when height actually changes (prevents infinite growth loops)
 */
export function useIframeResize() {
  const lastHeightRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only run in browser environment and if inside an iframe
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;

      // Only send if height actually changed (prevents infinite growth)
      if (height === lastHeightRef.current) {
        return;
      }

      lastHeightRef.current = height;
      window.parent.postMessage(
        {
          type: 'E1_CALCULATOR_RESIZE',
          height: height,
        },
        '*'
      );
    };

    // Debounced version to prevent message flooding
    const debouncedSendHeight = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(sendHeight, 100);
    };

    // Send initial height immediately
    sendHeight();

    // Send height on resize and mutation (debounced)
    const resizeObserver = new ResizeObserver(debouncedSendHeight);
    const mutationObserver = new MutationObserver(debouncedSendHeight);

    resizeObserver.observe(document.body);
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // Also listen for window resize events
    window.addEventListener('resize', debouncedSendHeight);

    // Clean up
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', debouncedSendHeight);
    };
  }, []);
}
