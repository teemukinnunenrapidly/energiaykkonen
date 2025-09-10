/**
 * E1 Calculator Admin JavaScript
 * Handles admin panel interactions for critical settings
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Admin notices container
    const $notices = $('#e1-admin-notices');
    
    /**
     * Show admin notice
     */
    function showNotice(message, type = 'info') {
        const noticeClass = type === 'error' ? 'notice-error' : 
                           type === 'success' ? 'notice-success' : 
                           type === 'warning' ? 'notice-warning' : 'notice-info';
        
        const notice = `
            <div class="notice ${noticeClass} is-dismissible">
                <p>${message}</p>
                <button type="button" class="notice-dismiss">
                    <span class="screen-reader-text">Dismiss this notice.</span>
                </button>
            </div>
        `;
        
        $notices.html(notice);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            $notices.find('.notice').fadeOut();
        }, 5000);
        
        // Handle manual dismiss
        $notices.find('.notice-dismiss').on('click', function() {
            $(this).closest('.notice').fadeOut();
        });
        
        // Scroll to notice
        $('html, body').animate({
            scrollTop: $notices.offset().top - 50
        }, 500);
    }
    
    /**
     * Clear Widget Cache
     */
    $('#e1-clear-cache').on('click', function() {
        const $button = $(this);
        const $status = $('#cache-status');
        const originalText = $button.text();
        
        // Disable button and show loading
        $button.prop('disabled', true);
        $button.html('<span class="dashicons dashicons-update spin"></span> ' + e1AdminAjax.strings.clearing);
        
        $status.html('<div class="e1-loading">🔄 Tyhjennetään widget cachea...</div>');
        
        $.ajax({
            url: e1AdminAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'e1_clear_cache',
                nonce: e1AdminAjax.nonce
            },
            timeout: 30000,
            success: function(response) {
                if (response.success) {
                    showNotice(response.data.message, 'success');
                    $status.html('<div class="e1-success">✅ ' + response.data.message + 
                               '<br><small>Tyhjennetty: ' + response.data.cleared_at + '</small></div>');
                    
                    // Update cache status in main panel
                    updateCacheStatus();
                } else {
                    showNotice(response.data.message, 'error');
                    $status.html('<div class="e1-error">❌ ' + response.data.message + '</div>');
                }
            },
            error: function(xhr, status, error) {
                const errorMsg = 'AJAX virhe: ' + (error || status);
                showNotice(errorMsg, 'error');
                $status.html('<div class="e1-error">❌ ' + errorMsg + '</div>');
            },
            complete: function() {
                // Restore button
                $button.prop('disabled', false);
                $button.html('<span class="dashicons dashicons-update"></span> ' + originalText);
            }
        });
    });
    
    /**
     * Test Widget Functionality
     */
    $('#e1-test-widget').on('click', function() {
        const $button = $(this);
        const $results = $('#widget-test-results');
        const originalText = $button.text();
        
        // Disable button and show loading
        $button.prop('disabled', true);
        $button.html('<span class="dashicons dashicons-search spin"></span> ' + e1AdminAjax.strings.testing);
        
        $results.html('<div class="e1-loading">🔍 Testataan widget-toiminnallisuutta...</div>');
        
        $.ajax({
            url: e1AdminAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'e1_test_widget',
                nonce: e1AdminAjax.nonce
            },
            timeout: 15000,
            success: function(response) {
                if (response.success) {
                    const data = response.data;
                    const statusClass = data.status === 'good' ? 'e1-success' : 
                                       data.status === 'warning' ? 'e1-warning' : 'e1-error';
                    
                    let resultsHtml = `
                        <div class="${statusClass}">
                            <h4>${data.message}</h4>
                            <p><strong>Pistemäärä:</strong> ${data.score}/${data.max_score}</p>
                        </div>
                        <div class="test-details" style="margin-top: 15px;">
                            <h4>Yksityiskohtaiset tulokset:</h4>
                            <ul>
                                <li>${data.cache_status ? '✅' : '❌'} Cache-tiedostot</li>
                                <li>${data.config_accessible ? '✅' : '❌'} config.json saatavilla</li>
                                <li>${data.widget_js_accessible ? '✅' : '❌'} widget.js saatavilla</li>
                                <li>${data.widget_css_accessible ? '✅' : '❌'} widget.css saatavilla</li>
                                <li>${data.shadow_dom_mode === 'auto' ? '✅' : '⚠️'} Shadow DOM Mode: ${data.shadow_dom_mode}</li>
                                <li>${data.debug_mode ? '🔍' : '👁️'} Debug Mode: ${data.debug_mode ? 'Käytössä' : 'Pois käytöstä'}</li>
                            </ul>
                            <small>Testattu: ${new Date(data.timestamp).toLocaleString('fi-FI')}</small>
                        </div>
                    `;
                    
                    $results.html(resultsHtml);
                    
                    // Show overall status notice
                    if (data.status === 'good') {
                        showNotice('Widget-testaus onnistui! Widget on valmis käytettäväksi.', 'success');
                    } else if (data.status === 'warning') {
                        showNotice('Widget toimii osittain. Tarkista puuttuvat tiedostot.', 'warning');
                    } else {
                        showNotice('Widget-testaus epäonnistui. Synkronoi cache ja yritä uudelleen.', 'error');
                    }
                } else {
                    showNotice(response.data.message, 'error');
                    $results.html('<div class="e1-error">❌ ' + response.data.message + '</div>');
                }
            },
            error: function(xhr, status, error) {
                const errorMsg = 'Testaus epäonnistui: ' + (error || status);
                showNotice(errorMsg, 'error');
                $results.html('<div class="e1-error">❌ ' + errorMsg + '</div>');
            },
            complete: function() {
                // Restore button
                $button.prop('disabled', false);
                $button.html('<span class="dashicons dashicons-search"></span> ' + originalText);
            }
        });
    });
    
    /**
     * Sync Widget from Vercel API
     */
    $('#e1-sync-widget').on('click', function() {
        const $button = $(this);
        const $status = $('#sync-status');
        const originalText = $button.text();
        const apiUrl = $button.data('api-url');
        
        // Disable button and show loading
        $button.prop('disabled', true);
        $button.html('<span class="dashicons dashicons-update spin"></span> Synkronoidaan...');
        
        $status.html('<div class="e1-loading">🔄 Haetaan tietoja Vercel API:sta...</div>');
        
        $.ajax({
            url: e1AdminAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'e1_sync_widget',
                nonce: e1AdminAjax.nonce
            },
            timeout: 45000, // Longer timeout for API call
            success: function(response) {
                if (response.success) {
                    const data = response.data;
                    showNotice('Widget synkronoitu onnistuneesti Vercel:sta! ✅', 'success');
                    
                    let statusHtml = `
                        <div class="e1-success">
                            <h4>✅ ${data.message}</h4>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li><strong>Synkronoitu:</strong> ${data.synced_at}</li>
                                <li><strong>Kortit:</strong> ${data.cards_count} kpl</li>
                                <li><strong>Visuaaliset objektit:</strong> ${data.visual_objects_count} kpl</li>
                                <li><strong>Versio:</strong> ${data.version}</li>
                            </ul>
                        </div>
                    `;
                    
                    $status.html(statusHtml);
                    
                    // Update cache status in main panel
                    updateCacheStatus();
                } else {
                    showNotice('Synkronointi epäonnistui: ' + response.data.message, 'error');
                    $status.html('<div class="e1-error">❌ ' + response.data.message + '</div>');
                }
            },
            error: function(xhr, status, error) {
                const errorMsg = 'Synkronointi epäonnistui: ' + (error || status);
                showNotice(errorMsg, 'error');
                $status.html('<div class="e1-error">❌ ' + errorMsg + '</div>');
            },
            complete: function() {
                // Restore button
                $button.prop('disabled', false);
                $button.html('<span class="dashicons dashicons-update"></span> ' + originalText);
            }
        });
    });
    
    /**
     * Update cache status in main panel
     */
    function updateCacheStatus() {
        // Update cache status without reloading the page
        $.ajax({
            url: e1AdminAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'e1_get_cache_status',
                nonce: e1AdminAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    const data = response.data;
                    updateCacheStatusDisplay(data);
                }
            },
            error: function() {
                console.warn('E1 Calculator: Failed to update cache status');
            }
        });
    }
    
    /**
     * Update cache status display
     */
    function updateCacheStatusDisplay(cacheInfo) {
        // Update main status panel
        const $statusCard = $('.e1-status-card').first();
        const $icon = $statusCard.find('.e1-status-icon .dashicons');
        const $content = $statusCard.find('.e1-status-content');
        
        if (cacheInfo.has_cache) {
            $icon.removeClass('dashicons-warning').addClass('dashicons-yes-alt').css('color', '#00a32a');
            $content.find('p').text('Widget tiedostot löytyvät');
            $content.find('small').text('Koko: ' + formatFileSize(cacheInfo.total_size));
        } else {
            $icon.removeClass('dashicons-yes-alt').addClass('dashicons-warning').css('color', '#dba617');
            $content.find('p').text('Widget ei ole synkronoitu');
            $content.find('small').remove();
        }
        
        // Update cache info section
        const $cacheInfo = $('.e1-cache-info');
        if (cacheInfo.has_cache) {
            $cacheInfo.find('li').first().html('<strong>Status:</strong> ✅ Cache löytyy');
            $cacheInfo.find('li').eq(1).html('<strong>Tiedostoja:</strong> ' + cacheInfo.files.length + ' kpl');
            $cacheInfo.find('li').eq(2).html('<strong>Koko yhteensä:</strong> ' + formatFileSize(cacheInfo.total_size));
        } else {
            $cacheInfo.find('li').first().html('<strong>Status:</strong> ❌ Ei cachea');
        }
    }
    
    /**
     * Format file size
     */
    function formatFileSize(bytes) {
        if (bytes >= 1048576) {
            return (bytes / 1048576).toFixed(2) + ' MB';
        } else if (bytes >= 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return bytes + ' B';
        }
    }
    
    /**
     * Real-time settings validation
     */
    
    // Shadow DOM Mode change handler
    $('#shadow_dom_mode').on('change', function() {
        const mode = $(this).val();
        const $description = $(this).siblings('.description');
        
        if (mode === 'disabled') {
            $description.html(`
                <strong style="color: #d63638;">⚠️ Varoitus:</strong> Shadow DOM on pois käytöstä.<br>
                Widget käyttää CSS namespace -isolaatiota, joka voi aiheuttaa style-konflikteja.<br>
                <strong>Suosittelemme Auto-tilaa</strong> ellei sinulla ole erityisiä syitä poistaa Shadow DOM käytöstä.
            `);
        } else {
            $description.html(`
                <strong style="color: #00a32a;">✅ Suositeltu asetus.</strong><br>
                Widget käyttää Shadow DOM -teknologiaa modernissa selaimissa ja CSS namespace -isolaatiota vanhemmissa selaimissa.
            `);
        }
    });
    
    // Debug Mode change handler
    $('#debug_mode').on('change', function() {
        const isChecked = $(this).is(':checked');
        const $description = $(this).closest('label').siblings('.description');
        
        if (isChecked) {
            $description.html(`
                <strong style="color: #d63638;">⚠️ Debug-tila käytössä:</strong><br>
                Widget kirjoittaa yksityiskohtaisia debug-viestejä selaimen konsoliin.<br>
                <strong>Muista poistaa tämä käytöstä tuotannossa</strong> suorituskyvyn ja tietoturvan vuoksi.
            `);
        } else {
            $description.html(`
                Debug-viestit ovat pois käytöstä. Ota käyttöön vain ongelmien diagnosointia varten.
            `);
        }
    });
    
    /**
     * Form submission handling
     */
    $('#e1-settings-form').on('submit', function(e) {
        const shadowMode = $('#shadow_dom_mode').val();
        const debugMode = $('#debug_mode').is(':checked');
        
        // Show warning if debug mode is enabled
        if (debugMode) {
            const confirmMsg = 'Debug-tila on käytössä. Tämä voi paljastaa arkaluonteisia tietoja konsolissa.\n\nHaluatko varmasti tallentaa asetukset?';
            if (!confirm(confirmMsg)) {
                e.preventDefault();
                return false;
            }
        }
        
        // Show saving notice
        showNotice('Tallennetaan asetuksia...', 'info');
    });
    
    /**
     * Auto-save functionality for critical settings
     */
    let autoSaveTimeout;
    
    function scheduleAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            // Auto-save only if user has been idle for 3 seconds
            const formData = $('#e1-settings-form').serialize();
            
            $.ajax({
                url: $('#e1-settings-form').attr('action'),
                type: 'POST',
                data: formData,
                success: function() {
                    console.log('E1 Calculator: Settings auto-saved');
                },
                error: function() {
                    console.warn('E1 Calculator: Auto-save failed');
                }
            });
        }, 3000);
    }
    
    // Trigger auto-save on change
    $('#shadow_dom_mode, #debug_mode').on('change', scheduleAutoSave);
    
    /**
     * Add CSS animations for spinners
     */
    const spinnerCSS = `
        <style>
        .spin {
            animation: e1-spin 1s linear infinite;
        }
        @keyframes e1-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .e1-warning {
            color: #dba617;
            background: #fff8e1;
            border: 1px solid #ffecb5;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 10px;
        }
        .test-details ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .test-details li {
            margin: 5px 0;
            font-family: monospace;
            font-size: 13px;
        }
        </style>
    `;
    
    $('head').append(spinnerCSS);
    
    /**
     * Initialize tooltips for better UX
     */
    function initTooltips() {
        // Add tooltips to status icons
        $('.e1-status-icon').each(function() {
            const $icon = $(this);
            const $card = $icon.closest('.e1-status-card');
            const title = $card.find('strong').text();
            const description = $card.find('small').text();
            
            $icon.attr('title', title + ': ' + description);
        });
    }
    
    initTooltips();
    
    /**
     * Keyboard shortcuts
     */
    $(document).on('keydown', function(e) {
        // Ctrl/Cmd + Shift + C = Clear Cache
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            $('#e1-clear-cache').click();
        }
        
        // Ctrl/Cmd + Shift + T = Test Widget
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            $('#e1-test-widget').click();
        }
    });
    
    // Show keyboard shortcuts in console
    if (console && console.info) {
        console.info('%cE1 Calculator Admin Shortcuts:', 'color: #2271b1; font-weight: bold;');
        console.info('Ctrl+Shift+C: Clear Cache');
        console.info('Ctrl+Shift+T: Test Widget');
    }
});