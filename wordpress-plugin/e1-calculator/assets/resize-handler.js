/**
 * E1 Calculator Resize Handler
 * Handles automatic height adjustment for embedded calculator iframes
 */
(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initResizeHandler);
    } else {
        initResizeHandler();
    }
    
    function initResizeHandler() {
        // Get configuration from WordPress (includes synced settings)
        const config = window.e1_calculator_config || {
            calculator_url: 'http://localhost:3001',
            allowed_origin: 'http://localhost:3001',
            auto_resize: true,
            theme: {}
        };
        
        // Debug mode (can be enabled via console)
        window.e1_calculator_debug = false;
        
        // Track resize events
        let resizeCount = 0;
        let lastHeight = 0;
        
        // Apply theme if provided
        if (config.theme && Object.keys(config.theme).length > 0) {
            applyThemeToIframes(config.theme);
        }
        
        // Listen for messages from the calculator iframe
        window.addEventListener('message', function(event) {
            // Security check - verify origin
            if (config.allowed_origin && !event.origin.startsWith(config.allowed_origin.split(':').slice(0, 2).join(':'))) {
                if (window.e1_calculator_debug) {
                    console.log('E1 Calculator: Rejected message from unauthorized origin:', event.origin);
                }
                return;
            }
            
            // Check if this is a resize message and auto_resize is enabled
            if (event.data && event.data.type === 'calculator-resize' && config.auto_resize !== false) {
                resizeCount++;
                
                if (window.e1_calculator_debug) {
                    console.log('E1 Calculator: Resize message #' + resizeCount, event.data);
                }
                
                // Find all calculator iframes on the page
                const iframes = document.querySelectorAll('.e1-calculator-iframe');
                
                iframes.forEach(function(iframe) {
                    if (event.data.height && event.data.height !== lastHeight) {
                        const newHeight = Math.min(Math.max(event.data.height, 400), 5000);
                        iframe.style.height = newHeight + 'px';
                        lastHeight = newHeight;
                        
                        // Trigger custom event for other scripts to listen to
                        const resizeEvent = new CustomEvent('e1-calculator-resized', {
                            detail: {
                                height: newHeight,
                                iframe: iframe,
                                messageCount: resizeCount
                            }
                        });
                        document.dispatchEvent(resizeEvent);
                        
                        if (window.e1_calculator_debug) {
                            console.log('E1 Calculator: Height updated to', newHeight + 'px');
                        }
                    }
                });
            }
            
            // Handle other message types
            if (event.data && event.data.type === 'calculator-loaded') {
                if (window.e1_calculator_debug) {
                    console.log('E1 Calculator: Calculator loaded successfully');
                }
                
                // Trigger custom event
                const loadEvent = new CustomEvent('e1-calculator-loaded', {
                    detail: { source: event.origin }
                });
                document.dispatchEvent(loadEvent);
            }
            
            if (event.data && event.data.type === 'calculator-submitted') {
                if (window.e1_calculator_debug) {
                    console.log('E1 Calculator: Form submitted', event.data);
                }
                
                // Trigger custom event for tracking
                const submitEvent = new CustomEvent('e1-calculator-submitted', {
                    detail: event.data
                });
                document.dispatchEvent(submitEvent);
                
                // Optional: Track with Google Analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        'event_category': 'E1 Calculator',
                        'event_label': 'Calculator Form Submitted'
                    });
                }
            }
        });
        
        // Function to apply theme to iframes
        function applyThemeToIframes(theme) {
            // Wait for iframes to be ready
            setTimeout(function() {
                const iframes = document.querySelectorAll('.e1-calculator-iframe');
                iframes.forEach(function(iframe) {
                    try {
                        iframe.contentWindow.postMessage({
                            type: 'theme-update',
                            theme: theme
                        }, config.allowed_origin);
                        
                        if (window.e1_calculator_debug) {
                            console.log('E1 Calculator: Theme applied to iframe', theme);
                        }
                    } catch (e) {
                        if (window.e1_calculator_debug) {
                            console.error('E1 Calculator: Failed to apply theme', e);
                        }
                    }
                });
            }, 1000); // Wait 1 second for iframe to load
        }
        
        // Add helper functions to window for debugging
        window.e1Calculator = {
            debug: function(enabled) {
                window.e1_calculator_debug = enabled;
                console.log('E1 Calculator debug mode:', enabled ? 'ON' : 'OFF');
            },
            getStats: function() {
                return {
                    resizeCount: resizeCount,
                    lastHeight: lastHeight,
                    iframes: document.querySelectorAll('.e1-calculator-iframe').length,
                    config: config
                };
            },
            reload: function() {
                const iframes = document.querySelectorAll('.e1-calculator-iframe');
                iframes.forEach(function(iframe) {
                    iframe.src = iframe.src;
                });
                console.log('E1 Calculator: Reloaded ' + iframes.length + ' iframe(s)');
            },
            applyTheme: function(theme) {
                applyThemeToIframes(theme);
            }
        };
        
        // Log initialization
        if (window.e1_calculator_debug) {
            console.log('E1 Calculator: Resize handler initialized', {
                config: config,
                iframes: document.querySelectorAll('.e1-calculator-iframe').length
            });
        }
    }
})();