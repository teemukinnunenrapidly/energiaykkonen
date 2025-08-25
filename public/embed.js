/**
 * Embed.js - Dynamic iframe resizing for WordPress integration
 *
 * This script enables automatic height adjustment of iframes containing
 * the energiaykkonen calculator when embedded in WordPress or other sites.
 *
 * Usage:
 * 1. Include this script on the page with the iframe
 * 2. The iframe will automatically communicate its height to the parent
 * 3. Parent page should listen for resize messages and adjust iframe height
 *
 * @version 1.0.0
 * @author energiaykkonen-calculator
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    debounceDelay: 100, // Milliseconds to debounce height updates
    minHeight: 400, // Minimum iframe height
    maxHeight: 5000, // Maximum iframe height for safety
    messageType: 'calculator-resize',
  };

  let lastHeight = 0;
  let debounceTimer = null;

  /**
   * Calculate the current content height
   * Uses multiple methods to ensure accuracy across different browsers
   */
  function getContentHeight() {
    const body = document.body;
    const html = document.documentElement;

    // Get the maximum height from different measurement methods
    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    // Clamp to min/max values
    return Math.min(Math.max(height, CONFIG.minHeight), CONFIG.maxHeight);
  }

  /**
   * Send height to parent window via postMessage
   */
  function sendHeight() {
    const currentHeight = getContentHeight();

    // Only send if height has changed to prevent unnecessary updates
    if (currentHeight !== lastHeight) {
      lastHeight = currentHeight;

      // Send message to parent with current height
      const message = {
        type: CONFIG.messageType,
        height: currentHeight,
        source: 'energiaykkonen-calculator',
        timestamp: Date.now(),
      };

      // Send to parent window (works cross-origin)
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      }

      // Also send to top window in case of nested iframes
      if (window.top && window.top !== window) {
        window.top.postMessage(message, '*');
      }
    }
  }

  /**
   * Debounced version of sendHeight to prevent excessive calls
   */
  function debouncedSendHeight() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(sendHeight, CONFIG.debounceDelay);
  }

  /**
   * Initialize the resize monitoring
   */
  function init() {
    // Send initial height
    sendHeight();

    // Monitor DOM changes with MutationObserver
    if (window.MutationObserver) {
      const observer = new MutationObserver(debouncedSendHeight);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }

    // Fallback: Monitor window resize events
    window.addEventListener('resize', debouncedSendHeight);

    // Monitor load events for images and other resources
    window.addEventListener('load', sendHeight);

    // Monitor for when content might change (form interactions, etc.)
    document.addEventListener('DOMContentLoaded', sendHeight);

    // Additional monitoring for dynamic content
    const monitoringEvents = ['input', 'change', 'click', 'focus', 'blur'];
    monitoringEvents.forEach(eventType => {
      document.addEventListener(eventType, debouncedSendHeight, true);
    });

    // Periodic check as fallback (every 2 seconds)
    setInterval(sendHeight, 2000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for potential manual use
  window.EnergiayykkonenEmbed = {
    sendHeight: sendHeight,
    getHeight: getContentHeight,
    version: '1.0.0',
  };
})();

/**
 * Parent page integration code (for WordPress):
 *
 * Add this script to the parent page (WordPress) where the iframe is embedded:
 *
 * <script>
 * window.addEventListener('message', function(event) {
 *   // Optional: verify origin for security
 *   // if (event.origin !== 'https://laskuri.energiaykkonen.fi') return;
 *
 *   if (event.data && event.data.type === 'calculator-resize') {
 *     const iframe = document.getElementById('energiaykkonen-calculator');
 *     if (iframe && event.data.height) {
 *       iframe.style.height = event.data.height + 'px';
 *       iframe.style.transition = 'height 0.3s ease'; // Smooth resize
 *     }
 *   }
 * });
 * </script>
 *
 * Example iframe embed code for WordPress:
 *
 * <iframe
 *   id="energiaykkonen-calculator"
 *   src="https://laskuri.energiaykkonen.fi/"
 *   style="width: 100%; border: none; overflow: hidden;"
 *   scrolling="no"
 *   frameborder="0"
 *   allowtransparency="true"
 *   title="Energiaykkonen Calculator"
 * ></iframe>
 */
