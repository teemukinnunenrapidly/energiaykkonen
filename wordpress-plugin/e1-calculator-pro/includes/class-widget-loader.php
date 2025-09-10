<?php
namespace E1_Calculator;

/**
 * Korjattu Widget Loader - Käyttää wp_enqueue oikein
 * 
 * Parannukset:
 * - Käyttää wp_enqueue_script/style WordPress best practices
 * - Versiointi cache bustingiin metadata.json:sta
 * - jQuery noConflict yhteensopivuus
 * - Tukee useita widgettejä samalla sivulla
 * - Lataa resurssit vain kerran
 * - Scoped CSS estää konfliktit
 */
class Widget_Loader {
    
    private static $instance_count = 0;
    private static $widget_instances = [];
    private static $footer_initialized = false;
    private $cache_manager;
    
    /**
     * Constructor
     */
    public function __construct(Cache_Manager $cache_manager) {
        $this->cache_manager = $cache_manager;
        
        // Rekisteröi shortcode
        add_shortcode('e1_calculator', [$this, 'render_shortcode']);
        
        // Rekisteröi skriptit ja tyylit (EI lataa vielä)
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        
        // Lisää widget config footeriin
        add_action('wp_footer', [$this, 'output_widget_configs'], 20);
        
        // REST API endpoint
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        
        // AJAX endpoint for widget config
        add_action('wp_ajax_e1_widget_config', [$this, 'ajax_widget_config']);
        add_action('wp_ajax_nopriv_e1_widget_config', [$this, 'ajax_widget_config']);
    }
    
    /**
     * Rekisteröi widget-resurssit (EI lataa vielä)
     */
    public function register_assets() {
        // Hae versio ja cache info
        $cache_info = $this->cache_manager->get_cache_info();
        $version = $this->get_widget_version();
        
        // Tarkista että cache-tiedostot ovat olemassa
        if (!$this->verify_cache_files()) {
            return;
        }
        
        // Cache URL - käytä määriteltyä vakiota
        $cache_url = E1_CALC_CACHE_URL;
        
        // REKISTERÖI CSS (ei lataa vielä)
        wp_register_style(
            'e1-calculator-widget',
            $cache_url . 'widget.css',
            [], // Ei riippuvuuksia
            $version // Versio cache bustingiin
        );
        
        // REKISTERÖI JavaScript (ei lataa vielä)
        wp_register_script(
            'e1-calculator-widget',
            $cache_url . 'widget.js',
            [], // Vanilla JS, ei jQuery-riippuvuutta
            $version,
            true // Lataa footerissa
        );
        
        // Lisää lokalisointi data
        wp_localize_script('e1-calculator-widget', 'e1CalculatorData', [
            'apiUrl' => home_url('/wp-json/e1-calculator/v1/'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('e1_calculator_public'),
            'locale' => get_locale(),
        ]);
        
        // Get plugin settings
        $plugin_settings = Admin_Settings::get_settings();
        
        // Lisää widget config data for form submissions
        wp_localize_script('e1-calculator-widget', 'e1_widget_config', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('e1_widget_nonce'),
            'api_url' => get_option('e1_widget_api_url', 'https://your-app.vercel.app'),
            'plugin_url' => E1_CALC_PLUGIN_URL,
            'config_url' => admin_url('admin-ajax.php?action=e1_widget_config'),
            'settings' => [
                'shadow_dom_mode' => $plugin_settings['shadow_dom_mode'] ?? 'auto',
                'debug_mode' => $plugin_settings['debug_mode'] ?? false
            ]
        ]);
    }
    
    /**
     * Shortcode handler
     */
    public function render_shortcode($atts) {
        error_log('[E1 DEBUG] Shortcode render_shortcode called with atts: ' . print_r($atts, true));
        // Oletusarvot
        $atts = shortcode_atts([
            'type' => 'default',
            'theme' => 'light',
            'class' => '',
            'height' => '',
            'id' => '',
        ], $atts, 'e1_calculator');
        
        // Support multiple widget instances on same page
        self::$instance_count++;
        $widget_id = !empty($atts['id']) ? esc_attr($atts['id']) : 'e1-calculator-widget-' . self::$instance_count;
        
        // Tarkista että cache on olemassa
        if (!$this->verify_cache_files()) {
            error_log('[E1 DEBUG] Cache files missing - returning error message');
            return '<div class="e1-calculator-error" style="padding: 20px; background: #fee; border: 1px solid #fcc; color: #c00;">
                        <strong>Widget Error:</strong> Widget not synced. Please sync in admin panel.
                    </div>';
        }
        
        error_log('[E1 DEBUG] Cache files verified successfully');
        
        // Tallenna instanssin config myöhempää käyttöä varten
        self::$widget_instances[$widget_id] = [
            'type' => $atts['type'],
            'theme' => $atts['theme'],
        ];
        
        // Also store in WordPress option as backup
        $current_instances = get_option('e1_widget_temp_instances', []);
        $current_instances[$widget_id] = [
            'type' => $atts['type'],
            'theme' => $atts['theme'],
        ];
        update_option('e1_widget_temp_instances', $current_instances);
        
        // LATAA RESURSSIT (vain kerran per sivu vaikka useita widgettejä)
        if (!wp_script_is('e1-calculator-widget', 'enqueued')) {
            error_log('[E1 DEBUG] Enqueueing widget assets (CSS + JS)');
            wp_enqueue_style('e1-calculator-widget');
            wp_enqueue_script('e1-calculator-widget');
        }
        
        error_log('[E1 DEBUG] Widget instance created: ' . $widget_id);
        
        // Määritä container style
        $container_style = '';
        if (!empty($atts['height'])) {
            $container_style = sprintf('style="min-height: %spx;"', esc_attr($atts['height']));
        }
        
        // Get plugin settings for API URL
        $plugin_settings = get_option('e1_calculator_options', []);
        $api_url = $plugin_settings['vercel_api_url'] ?? '';
        
        // Prepare data attributes
        $data_attrs = '';
        if (!empty($api_url)) {
            $data_attrs = sprintf(' data-api-url="%s"', esc_attr($api_url));
        }
        
        // Palauta container HTML with API URL data attribute
        return sprintf(
            '<div id="%s" class="e1-calculator-widget-container %s" data-type="%s" data-theme="%s"%s %s>
                <div class="e1-calculator-loading">
                    <div class="e1-loading-spinner"></div>
                    <p>%s</p>
                </div>
                <noscript>
                    <p style="background: #fffbcc; padding: 10px; border: 1px solid #e6db55;">
                        %s
                    </p>
                </noscript>
            </div>',
            esc_attr($widget_id),
            esc_attr($atts['class']),
            esc_attr($atts['type']),
            esc_attr($atts['theme']),
            $data_attrs,
            $container_style,
            __('Ladataan laskuria...', 'e1-calculator'),
            __('Tämä laskuri vaatii JavaScriptin toimiakseen. Ole hyvä ja ota JavaScript käyttöön selaimessasi.', 'e1-calculator')
        );
    }
    
    /**
     * Tulosta widget-konfiguraatiot footeriin
     */
    public function output_widget_configs() {
        // Prevent multiple initializations - use simpler check
        if (self::$footer_initialized) {
            return;
        }
        
        // Simple check - if no widgets, don't output anything
        if (empty(self::$widget_instances) && self::$instance_count === 0) {
            return;
        }
        
        // If we have instance count but empty instances array, recreate default instance
        if (empty(self::$widget_instances) && self::$instance_count > 0) {
            for ($i = 1; $i <= self::$instance_count; $i++) {
                $widget_id = 'e1-calculator-widget-' . $i;
                self::$widget_instances[$widget_id] = [
                    'type' => 'default',
                    'theme' => 'light',
                ];
            }
        }
        
        // Mark as initialized
        self::$footer_initialized = true;
        
        ?>
        <script id="e1-calculator-init">
        (function() {
            'use strict';
            
            console.log('🚀 E1 Calculator initialization starting...');
            
            // Simple wait for E1Calculator to be available
            function initializeWidget() {
                if (typeof window.E1Calculator === 'undefined') {
                    console.log('⏳ Waiting for E1Calculator...');
                    setTimeout(initializeWidget, 100);
                    return;
                }
                
                console.log('✅ E1Calculator found, initializing widgets...');
                
                // Widget configurations  
                var instances = <?php echo json_encode(self::$widget_instances, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
                
                // Initialize each widget
                Object.keys(instances).forEach(function(widgetId) {
                    var container = document.getElementById(widgetId);
                    if (!container) {
                        console.warn('⚠️ Container not found for:', widgetId);
                        return;
                    }
                    
                    console.log('🔧 Initializing widget:', widgetId);
                    
                    // Hide loading spinner
                    var loadingEl = container.querySelector('.e1-calculator-loading');
                    if (loadingEl) loadingEl.style.display = 'none';
                    
                    // Get API URL from data attribute
                    var apiUrl = container.getAttribute('data-api-url');
                    
                    // Prepare config options
                    var configOptions = {
                        configUrl: '<?php echo E1_CALC_CACHE_URL; ?>config.json',
                        showVisualSupport: true,
                        theme: instances[widgetId].theme || 'light'
                    };
                    
                    // Add API URL if available (widget will use for dynamic fetching)
                    if (apiUrl) {
                        configOptions.apiUrl = apiUrl;
                        console.log('📡 API URL configured for widget:', widgetId, '- URL:', apiUrl);
                    }
                    
                    try {
                        window.E1Calculator.init(widgetId, configOptions);
                        console.log('✅ Widget initialized:', widgetId);
                    } catch (error) {
                        console.error('❌ Widget init failed for ' + widgetId + ':', error);
                        // Show error message in container
                        container.innerHTML = '<div style="padding: 20px; background: #fee; border: 1px solid #fcc; color: #c00;">Widget initialization failed. Check console for details.</div>';
                    }
                });
            }
            
            // Start initialization
            initializeWidget();
        })();
        </script>
        <?php
        
        // Clean up temporary instances to prevent memory issues
        $this->cleanup_widget_instances();
    }
    
    /**
     * Clean up widget instances and memory
     */
    private function cleanup_widget_instances() {
        // Clean up temporary instances option
        delete_option('e1_widget_temp_instances');
        
        // Reset static variables for next page load
        add_action('wp_footer', function() {
            // This runs after footer output, preparing for next page
        }, 99);
    }
    
    /**
     * Destroy widget instances (for programmatic cleanup)
     */
    public static function destroy_widgets() {
        self::$instance_count = 0;
        self::$widget_instances = [];
        self::$footer_initialized = false;
        delete_option('e1_widget_temp_instances');
    }
    
    /**
     * Hae widget versio cache bustingiin
     */
    private function get_widget_version() {
        // ALWAYS use file timestamp for cache busting to force reload
        // This ensures WordPress always loads the latest widget after plugin update
        $js_file = E1_CALC_CACHE_DIR . 'widget.js';
        if (file_exists($js_file)) {
            // Use both version AND timestamp for aggressive cache busting
            return E1_CALC_VERSION . '-' . filemtime($js_file);
        }
        
        // Fallback to just version
        return E1_CALC_VERSION;
    }
    
    /**
     * Varmista että cache-tiedostot ovat olemassa
     */
    private function verify_cache_files() {
        $required_files = ['widget.js', 'widget.css', 'config.json'];
        
        foreach ($required_files as $file) {
            if (!file_exists(E1_CALC_CACHE_DIR . $file)) {
                $this->show_admin_notice($file);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Näytä admin-ilmoitus puuttuvista tiedostoista
     */
    private function show_admin_notice($missing_file) {
        if (current_user_can('manage_options')) {
            add_action('wp_footer', function() use ($missing_file) {
                ?>
                <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #dc3232; color: white; padding: 15px; text-align: center; z-index: 9999;">
                    <strong>E1 Calculator:</strong> Widget ei ole synkronoitu (<?php echo esc_html($missing_file); ?> puuttuu).
                    <a href="<?php echo admin_url('admin.php?page=e1-calculator'); ?>" style="color: white; text-decoration: underline; margin-left: 10px;">
                        → Synkronoi nyt
                    </a>
                </div>
                <?php
            });
        }
    }
    
    /**
     * Rekisteröi REST API endpoint
     */
    public function register_rest_routes() {
        register_rest_route('e1-calculator/v1', '/submit', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_form_submission'],
            'permission_callback' => '__return_true', // Public endpoint
            'args' => [
                'data' => [
                    'required' => true,
                    'type' => 'object',
                ],
                'widget_id' => [
                    'required' => false,
                    'type' => 'string',
                ],
            ],
        ]);
    }
    
    /**
     * Käsittele lomakkeen lähetys
     */
    public function handle_form_submission($request) {
        $data = $request->get_param('data');
        $widget_id = $request->get_param('widget_id');
        
        // Validoi nonce
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'e1_calculator_public')) {
            return new \WP_Error('invalid_nonce', __('Turvallisuustarkistus epäonnistui', 'e1-calculator'), ['status' => 403]);
        }
        
        // Hook prosessointiin
        $result = apply_filters('e1_calculator_process_submission', true, $data, $widget_id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        // Tallenna jos asetus päällä
        if (get_option('e1_calculator_store_submissions', false)) {
            $this->store_submission($data, $widget_id);
        }
        
        // Lähetä sähköposti jos asetus päällä
        if (get_option('e1_calculator_send_notifications', false)) {
            $this->send_notification($data, $widget_id);
        }
        
        return [
            'success' => true,
            'message' => __('Lomake lähetetty onnistuneesti', 'e1-calculator'),
            'widget_id' => $widget_id,
        ];
    }
    
    /**
     * Tallenna lomakedata
     */
    private function store_submission($data, $widget_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'e1_calculator_submissions';
        
        $wpdb->insert($table_name, [
            'widget_id' => $widget_id,
            'data' => json_encode($data),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'created_at' => current_time('mysql'),
        ]);
    }
    
    /**
     * Lähetä sähköposti-ilmoitus
     */
    private function send_notification($data, $widget_id) {
        $to = get_option('e1_calculator_notification_email', get_option('admin_email'));
        $subject = sprintf(__('Uusi E1 Calculator lomake (#%s)', 'e1-calculator'), $widget_id);
        
        $message = __('Uusi lomake on vastaanotettu:', 'e1-calculator') . "\n\n";
        $message .= sprintf(__('Widget ID: %s', 'e1-calculator'), $widget_id) . "\n\n";
        
        foreach ($data as $key => $value) {
            $label = ucfirst(str_replace(['_', '-'], ' ', $key));
            $message .= sprintf("%s: %s\n", $label, $value);
        }
        
        $message .= "\n" . sprintf(__('Lähetetty: %s', 'e1-calculator'), current_time('mysql'));
        
        wp_mail($to, $subject, $message);
    }
    
    /**
     * Setup cache directory ja .htaccess
     */
    public static function setup_cache_directory() {
        $cache_dir = E1_CALC_CACHE_DIR;
        
        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }
        
        // .htaccess joka sallii JS/CSS latauksen mutta estää muut
        $htaccess = $cache_dir . '.htaccess';
        // Always recreate to ensure correct rules
        $rules = "# E1 Calculator Cache Directory\n";
        $rules .= "# Allow access to JS, CSS and JSON files\n\n";
        
        // For Apache 2.4+
        $rules .= "<IfModule mod_authz_core.c>\n";
        $rules .= "    <FilesMatch \"\\.(js|css|json)$\">\n";
        $rules .= "        Require all granted\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "    <FilesMatch \"\\.(php|html|htm|txt)$\">\n";
        $rules .= "        Require all denied\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "</IfModule>\n\n";
        
        // For Apache 2.2 (fallback)
        $rules .= "<IfModule !mod_authz_core.c>\n";
        $rules .= "    <FilesMatch \"\\.(js|css|json)$\">\n";
        $rules .= "        Order Allow,Deny\n";
        $rules .= "        Allow from all\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "    <FilesMatch \"\\.(php|html|htm|txt)$\">\n";
        $rules .= "        Order Deny,Allow\n";
        $rules .= "        Deny from all\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "</IfModule>\n\n";
        
        $rules .= "# Disable directory browsing\n";
        $rules .= "Options -Indexes\n";
        
        file_put_contents($htaccess, $rules);
    }
    
    /**
     * AJAX endpoint for widget config
     */
    public function ajax_widget_config() {
        // Set JSON header
        header('Content-Type: application/json');
        
        try {
            // Check if Vercel API is configured for dynamic fetching
            $options = get_option('e1_calculator_options', []);
            $vercel_url = $options['vercel_api_url'] ?? '';
            $use_dynamic_fetching = !empty($vercel_url);
            
            $config = [];
            $source = 'cache';
            
            if ($use_dynamic_fetching) {
                // Try to fetch fresh data from Vercel API
                try {
                    $response = wp_remote_get($vercel_url, [
                        'timeout' => 15, // Shorter timeout for frontend calls
                        'headers' => [
                            'Accept' => 'application/json',
                            'User-Agent' => 'E1-Calculator-Widget/' . E1_CALC_VERSION
                        ]
                    ]);
                    
                    if (!is_wp_error($response)) {
                        $status_code = wp_remote_retrieve_response_code($response);
                        if ($status_code === 200) {
                            $body = wp_remote_retrieve_body($response);
                            $api_config = json_decode($body, true);
                            
                            if (json_last_error() === JSON_ERROR_NONE && !empty($api_config)) {
                                $config = $api_config;
                                $source = 'vercel-api';
                                
                                // Optionally update cache with fresh data in background
                                if (($options['debug_mode'] ?? false)) {
                                    error_log('E1 Calculator: Fresh config loaded from Vercel API');
                                }
                            }
                        }
                    }
                } catch (Exception $e) {
                    if (($options['debug_mode'] ?? false)) {
                        error_log('E1 Calculator: Vercel API fetch failed, falling back to cache: ' . $e->getMessage());
                    }
                }
            }
            
            // Fallback to cache if Vercel API failed or not configured
            if (empty($config)) {
                $bundle = $this->cache_manager->get_bundle();
                $config = $bundle['config'] ?? [];
                $source = 'cache-fallback';
            }
            
            if (empty($config)) {
                wp_send_json_error(['message' => 'Config not found in cache or API']);
                return;
            }
            
            // Add metadata about config source
            $response_data = [
                'config' => $config,
                'meta' => [
                    'source' => $source,
                    'timestamp' => time(),
                    'version' => $config['version'] ?? 'unknown',
                    'dynamic_fetching' => $use_dynamic_fetching
                ]
            ];
            
            wp_send_json_success($response_data);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
}