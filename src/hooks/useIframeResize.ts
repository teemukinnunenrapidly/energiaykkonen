import { useEffect } from 'react';

/**
 * A hook that sends the document height to the parent window via postMessage.
 * This allows the iframe on the WordPress site to automatically resize to fit the content.
 */
export function useIframeResize() {
  useEffect(() => {
    // Only run in browser environment and if inside an iframe
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage(
        {
          type: 'E1_CALCULATOR_RESIZE',
          height: height,
        },
        '*'
      );
    };

    // Send initial height
    sendHeight();

    // Send height on resize and mutation
    const resizeObserver = new ResizeObserver(sendHeight);
    const mutationObserver = new MutationObserver(sendHeight);

    resizeObserver.observe(document.body);
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // Also listen for window resize events
    window.addEventListener('resize', sendHeight);

    // Clean up
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, []);
}
