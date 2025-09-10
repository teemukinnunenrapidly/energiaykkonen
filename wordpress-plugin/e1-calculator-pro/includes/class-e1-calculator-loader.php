<?php
/**
 * E1 Calculator Widget Loader - Enhanced Version 2.2.0
 * 
 * Comprehensive WordPress plugin loader with:
 * - Dual script loading (loader + widget)
 * - Enhanced AJAX config endpoint with nonce security
 * - Advanced Gutenberg block with dynamic attributes
 * - Comprehensive error handling and compatibility checks
 * - Optimized caching and performance
 *
 * @package E1_Calculator_Pro
 * @since 2.2.0
 */

class E1_Calculator_Loader {
    
    private $version;
    private $cache_url;
    private $cache_path;
    private $script_dependencies = [];
    private $compatibility_issues = [];
    private $performance_metrics = [];
    
    public function __construct() {
        $this->version = get_option('e1_calculator_version', E1_CALC_VERSION);
        $this->cache_url = $this->get_cache_url();
        $this->cache_path = $this->get_cache_path();
        
        // Run compatibility checks
        $this->check_system_compatibility();
        
        // WordPress hooks
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_shortcode('e1_calculator', [$this, 'render_shortcode']);
        add_action('init', [$this, 'register_gutenberg_block']);
        add_action('wp_footer', [$this, 'add_fallback_styles']);
        
        // Enhanced AJAX endpoints with comprehensive security
        add_action('wp_ajax_e1_calculator_get_config', [$this, 'ajax_get_config']);
        add_action('wp_ajax_nopriv_e1_calculator_get_config', [$this, 'ajax_get_config']);
        add_action('wp_ajax_e1_calculator_validate_cache', [$this, 'ajax_validate_cache']);
        add_action('wp_ajax_e1_calculator_get_compatibility', [$this, 'ajax_get_compatibility']);
        add_action('wp_ajax_nopriv_e1_calculator_get_compatibility', [$this, 'ajax_get_compatibility']);
        
        // Performance monitoring
        add_action('wp_head', [$this, 'add_performance_monitoring']);
        
        // Cache management
        add_action('e1_calculator_clear_cache', [$this, 'clear_cache']);
        
        // Admin notices for compatibility issues
        if (is_admin() && !empty($this->compatibility_issues)) {
            add_action('admin_notices', [$this, 'show_compatibility_notices']);
        }
    }
    
    public function enqueue_scripts() {
        // Check if cache files exist before enqueueing
        if (!$this->validate_cache_files()) {
            $this->add_compatibility_issue('Cache files missing or corrupted');
            return;
        }
        
        $start_time = microtime(true);
        
        // 1. WordPress Loader Script (loads first, in head for immediate availability)
        wp_enqueue_script(
            'e1-calculator-loader',
            $this->cache_url . '/wordpress-loader.js',
            [],
            $this->version,
            false // Load in head for immediate initialization
        );
        
        // 2. Main Widget Script (loads after loader, with dependency)
        wp_enqueue_script(
            'e1-calculator-widget',
            $this->cache_url . '/widget.js',
            ['e1-calculator-loader'],
            $this->version,
            true // Load in footer after DOM
        );
        
        // 3. Enqueue appropriate CSS based on browser support
        $this->enqueue_widget_styles();
        
        // 4. Enhanced localized configuration
        wp_localize_script('e1-calculator-loader', 'e1CalculatorWP', [
            // Core configuration
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('e1-calculator-nonce'),
            'configNonce' => wp_create_nonce('e1-calculator-config'),
            'cacheUrl' => $this->cache_url,
            'version' => $this->version,
            
            // Environment detection
            'isAdmin' => is_admin(),
            'isBlockEditor' => $this->is_block_editor(),
            'isFrontend' => !is_admin(),
            'isPreview' => is_preview(),
            
            // Browser compatibility
            'browserSupport' => [
                'shadowDOM' => $this->check_shadow_dom_support(),
                'customElements' => $this->check_custom_elements_support(),
                'cssVariables' => $this->check_css_variables_support(),
                'fetch' => true, // Assume modern browsers
                'es6' => $this->check_es6_support(),
            ],
            
            // Performance and debugging
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'performanceTracking' => true,
            'compatibilityMode' => !empty($this->compatibility_issues),
            'fallbackMode' => $this->should_use_fallback_mode(),
            
            // Security headers
            'security' => [
                'contentSecurityPolicy' => $this->get_csp_config(),
                'allowedOrigins' => $this->get_allowed_origins(),
            ],
        ]);
        
        // 5. Enhanced auto-initialization with error handling
        wp_add_inline_script(
            'e1-calculator-widget',
            $this->get_initialization_script(),
            'after'
        );
        
        // Record performance metrics
        $this->performance_metrics['script_enqueue_time'] = microtime(true) - $start_time;
    }
    
    /**
     * Enhanced admin script enqueuing with block editor support
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on relevant admin pages
        $valid_hooks = [
            'post.php',
            'post-new.php', 
            'site-editor.php',
            'theme-editor.php',
            'widgets.php'
        ];
        
        $is_block_context = $this->is_block_editor() || 
                           in_array($hook, $valid_hooks) ||
                           (isset($_GET['page']) && strpos($_GET['page'], 'gutenberg') !== false);
        
        if (!$is_block_context) {
            return;
        }
        
        // Load frontend scripts for block editor
        $this->enqueue_scripts();
        
        // Additional block editor specific scripts
        wp_enqueue_script(
            'e1-calculator-block-inspector',
            $this->cache_url . '/block-inspector.js',
            ['wp-blocks', 'wp-editor', 'wp-components'],
            $this->version,
            true
        );
        
        // Block editor specific localization
        wp_localize_script('e1-calculator-block-inspector', 'e1CalculatorBlockWP', [
            'previewUrl' => $this->cache_url . '/block-preview.html',
            'themes' => $this->get_available_themes(),
            'defaultHeight' => '600px',
            'mobileBreakpoint' => 768,
            'isRTL' => is_rtl(),
            'locale' => get_locale()
        ]);
    }
    
    /**
     * Enhanced shortcode/block rendering with comprehensive attributes
     */
    public function render_shortcode($atts) {
        static $instance_count = 0;
        $instance_count++;
        
        // Enhanced attribute defaults with comprehensive options
        $atts = shortcode_atts([
            // Core attributes
            'shadow' => 'true',
            'height' => '600px',
            'theme' => 'default',
            'class' => '',
            'auto_init' => 'true',
            
            // Enhanced attributes
            'showVisualSupport' => 'true',
            'enableCache' => 'true',
            'debugMode' => 'false',
            'mobileHeight' => '500px',
            'breakpoint' => '768',
            'lazyLoad' => 'false',
            'loadPriority' => 'normal',
            'ariaLabel' => 'E1 Energy Calculator',
            'tabIndex' => '0',
            'customCSS' => '',
            'containerClass' => '',
            'blockId' => '',
        ], $atts);
        
        // Generate unique widget ID
        $widget_id = !empty($atts['blockId']) ? 
            'e1-calculator-' . sanitize_html_class($atts['blockId']) :
            'e1-calculator-widget-' . get_the_ID() . '-' . $instance_count;
        
        // Combine CSS classes
        $css_classes = array_filter([
            'e1-calculator-container',
            $atts['class'],
            $atts['containerClass'],
            $this->should_use_fallback_mode() ? 'e1-fallback-mode' : 'e1-shadow-mode',
            $atts['lazyLoad'] === 'true' ? 'e1-lazy-load' : '',
        ]);
        
        // Responsive height handling
        $height_style = $this->get_responsive_height_style($atts['height'], $atts['mobileHeight'], $atts['breakpoint']);
        
        // Performance optimization: lazy loading
        $loading_strategy = $atts['lazyLoad'] === 'true' ? 'lazy' : 'eager';
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($widget_id); ?>"
             class="<?php echo esc_attr(implode(' ', $css_classes)); ?>"
             data-e1-calculator
             data-shadow="<?php echo esc_attr($atts['shadow']); ?>"
             data-auto-init="<?php echo esc_attr($atts['auto_init']); ?>"
             data-theme="<?php echo esc_attr($atts['theme']); ?>"
             data-show-visual-support="<?php echo esc_attr($atts['showVisualSupport']); ?>"
             data-enable-cache="<?php echo esc_attr($atts['enableCache']); ?>"
             data-debug="<?php echo esc_attr($atts['debugMode']); ?>"
             data-load-priority="<?php echo esc_attr($atts['loadPriority']); ?>"
             data-loading="<?php echo esc_attr($loading_strategy); ?>"
             data-config-url="<?php echo esc_url($this->cache_url . '/config.json'); ?>"
             role="application"
             aria-label="<?php echo esc_attr($atts['ariaLabel']); ?>"
             tabindex="<?php echo esc_attr($atts['tabIndex']); ?>"
             style="<?php echo esc_attr($height_style); ?>">
            
            <?php if ($atts['lazyLoad'] !== 'true'): ?>
            <!-- Enhanced loading state with better UX -->
            <div class="e1-calculator-loading" role="status" aria-label="Loading calculator">
                <?php echo $this->get_loading_styles(); ?>
                <div class="e1-loading-content">
                    <div class="e1-spinner" aria-hidden="true"></div>
                    <p class="e1-loading-text">Ladataan E1-laskuria...</p>
                    <div class="e1-loading-progress" aria-hidden="true">
                        <div class="e1-progress-bar"></div>
                    </div>
                </div>
            </div>
            <?php else: ?>
            <!-- Lazy loading placeholder -->
            <div class="e1-calculator-lazy-placeholder" role="button" tabindex="0" 
                 onclick="this.parentElement.removeAttribute('data-loading'); this.remove();">
                <div class="e1-lazy-content">
                    <h3>E1 Energy Calculator</h3>
                    <p>Click to load the interactive calculator</p>
                    <button class="e1-load-button">Load Calculator</button>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- Enhanced error handling -->
            <div class="e1-calculator-error" style="display: none;" role="alert">
                <h4>Loading Error</h4>
                <p>The calculator could not be loaded. This might be due to:</p>
                <ul>
                    <li>Slow internet connection</li>
                    <li>Browser compatibility issues</li>
                    <li>Temporary server problems</li>
                </ul>
                <button onclick="location.reload()" class="e1-retry-button">Retry</button>
            </div>
            
            <!-- Enhanced no JavaScript fallback -->
            <noscript>
                <div class="e1-calculator-noscript">
                    <?php echo $this->get_noscript_styles(); ?>
                    <div class="e1-noscript-content">
                        <h3>JavaScript Required</h3>
                        <p>The E1 Energy Calculator requires JavaScript to function properly. Please:</p>
                        <ol>
                            <li>Enable JavaScript in your browser settings</li>
                            <li>Refresh this page</li>
                            <li>Contact us if problems persist</li>
                        </ol>
                        <p><a href="https://enable-javascript.com/" target="_blank">How to enable JavaScript</a></p>
                    </div>
                </div>
            </noscript>
            
            <?php if (!empty($atts['customCSS'])): ?>
            <!-- Custom CSS injection -->
            <style>
            #<?php echo esc_attr($widget_id); ?> {
                <?php echo wp_strip_all_tags($atts['customCSS']); ?>
            }
            </style>
            <?php endif; ?>
        </div>
        <?php
        
        return ob_get_clean();
    }
    
    /**
     * Register enhanced Gutenberg block with comprehensive attributes
     */
    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            $this->add_compatibility_issue('Gutenberg not available - blocks not registered');
            return;
        }
        
        // Enhanced block editor script with dependencies
        wp_register_script(
            'e1-calculator-block',
            $this->cache_url . '/block.js',
            [
                'wp-blocks',
                'wp-element', 
                'wp-editor',
                'wp-components',
                'wp-i18n',
                'wp-data'
            ],
            $this->version,
            true
        );
        
        // Block editor styles
        wp_register_style(
            'e1-calculator-block-editor',
            $this->cache_url . '/block-editor.css',
            ['wp-edit-blocks'],
            $this->version
        );
        
        // Register block with comprehensive attributes
        register_block_type('e1-calculator/widget', [
            'editor_script' => 'e1-calculator-block',
            'editor_style' => 'e1-calculator-block-editor',
            'render_callback' => [$this, 'render_block'],
            'attributes' => [
                // Core display attributes
                'shadow' => [
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Enable Shadow DOM isolation'
                ],
                'height' => [
                    'type' => 'string',
                    'default' => '600px',
                    'description' => 'Widget container height'
                ],
                'theme' => [
                    'type' => 'string',
                    'default' => 'default',
                    'enum' => ['default', 'light', 'dark', 'energiaykkonen', 'custom'],
                    'description' => 'Widget theme selection'
                ],
                
                // Advanced configuration
                'autoInit' => [
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Automatically initialize widget'
                ],
                'showVisualSupport' => [
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Show visual support panel'
                ],
                'enableCache' => [
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Enable client-side caching'
                ],
                'debugMode' => [
                    'type' => 'boolean',
                    'default' => false,
                    'description' => 'Enable debug logging'
                ],
                
                // Responsive settings
                'mobileHeight' => [
                    'type' => 'string',
                    'default' => '500px',
                    'description' => 'Mobile container height'
                ],
                'breakpoint' => [
                    'type' => 'number',
                    'default' => 768,
                    'description' => 'Mobile breakpoint in pixels'
                ],
                
                // Performance settings
                'lazyLoad' => [
                    'type' => 'boolean',
                    'default' => false,
                    'description' => 'Enable lazy loading'
                ],
                'loadPriority' => [
                    'type' => 'string',
                    'default' => 'normal',
                    'enum' => ['high', 'normal', 'low'],
                    'description' => 'Loading priority'
                ],
                
                // Accessibility settings
                'ariaLabel' => [
                    'type' => 'string',
                    'default' => 'E1 Energy Calculator',
                    'description' => 'Accessibility label'
                ],
                'tabIndex' => [
                    'type' => 'number',
                    'default' => 0,
                    'description' => 'Tab navigation index'
                ],
                
                // Custom styling
                'customCSS' => [
                    'type' => 'string',
                    'default' => '',
                    'description' => 'Custom CSS overrides'
                ],
                'containerClass' => [
                    'type' => 'string',
                    'default' => '',
                    'description' => 'Additional CSS classes'
                ],
                
                // Block metadata
                'blockId' => [
                    'type' => 'string',
                    'default' => '',
                    'description' => 'Unique block identifier'
                ],
                'lastModified' => [
                    'type' => 'string',
                    'default' => '',
                    'description' => 'Last modification timestamp'
                ]
            ],
            'supports' => [
                'html' => false,
                'align' => ['wide', 'full'],
                'spacing' => [
                    'margin' => true,
                    'padding' => true
                ],
                'color' => [
                    'background' => true,
                    'text' => false
                ]
            ]
        ]);
    }
    
    /**
     * Enhanced AJAX endpoint for config.json with comprehensive security
     */
    public function ajax_get_config() {
        $start_time = microtime(true);
        
        // Multi-layer nonce verification
        if (!check_ajax_referer('e1-calculator-config', 'nonce', false)) {
            wp_send_json_error([
                'message' => 'Invalid security token',
                'code' => 'INVALID_NONCE',
                'timestamp' => time()
            ], 403);
        }
        
        // Rate limiting check
        if (!$this->check_rate_limit()) {
            wp_send_json_error([
                'message' => 'Rate limit exceeded',
                'code' => 'RATE_LIMIT',
                'retry_after' => 60
            ], 429);
        }
        
        // Validate request source
        if (!$this->validate_request_source()) {
            wp_send_json_error([
                'message' => 'Invalid request source',
                'code' => 'INVALID_SOURCE'
            ], 403);
        }
        
        $config_file = $this->cache_path . '/config.json';
        
        // Enhanced file existence and integrity check
        if (!file_exists($config_file)) {
            // Try to regenerate config if possible
            if ($this->regenerate_config()) {
                error_log('E1 Calculator: Config file regenerated automatically');
            } else {
                wp_send_json_error([
                    'message' => 'Configuration not available',
                    'code' => 'CONFIG_MISSING',
                    'cache_status' => $this->get_cache_status()
                ], 404);
            }
        }
        
        // File integrity validation
        $config_content = file_get_contents($config_file);
        if (empty($config_content)) {
            wp_send_json_error([
                'message' => 'Empty configuration file',
                'code' => 'CONFIG_EMPTY'
            ], 500);
        }
        
        // JSON validation
        $config_data = json_decode($config_content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error([
                'message' => 'Invalid configuration format',
                'code' => 'CONFIG_INVALID',
                'json_error' => json_last_error_msg()
            ], 500);
        }
        
        // Sanitize and validate config data
        $sanitized_config = $this->sanitize_config_data($config_data);
        
        // Add runtime metadata
        $response_data = [
            'config' => $sanitized_config,
            'metadata' => [
                'version' => $this->version,
                'timestamp' => time(),
                'cache_timestamp' => filemtime($config_file),
                'processing_time' => round((microtime(true) - $start_time) * 1000, 2),
                'server_time' => current_time('Y-m-d H:i:s'),
                'cache_status' => 'valid',
                'compatibility_mode' => $this->should_use_fallback_mode()
            ],
            'security' => [
                'nonce_refresh' => wp_create_nonce('e1-calculator-config'),
                'session_id' => $this->get_session_id()
            ]
        ];
        
        // Set appropriate cache headers
        if (!headers_sent()) {
            header('Cache-Control: private, max-age=300'); // 5 minute cache
            header('Content-Type: application/json; charset=utf-8');
            header('X-E1-Calculator-Version: ' . $this->version);
        }
        
        wp_send_json_success($response_data);
    }
    
    /**
     * Additional AJAX endpoints
     */
    public function ajax_validate_cache() {
        check_ajax_referer('e1-calculator-nonce', 'nonce');
        
        $cache_status = [
            'valid' => $this->validate_cache_files(),
            'files' => [],
            'timestamp' => time()
        ];
        
        $required_files = ['wordpress-loader.js', 'widget.js', 'widget.css', 'config.json'];
        foreach ($required_files as $file) {
            $file_path = $this->cache_path . '/' . $file;
            $cache_status['files'][$file] = [
                'exists' => file_exists($file_path),
                'size' => file_exists($file_path) ? filesize($file_path) : 0,
                'modified' => file_exists($file_path) ? filemtime($file_path) : 0
            ];
        }
        
        wp_send_json_success($cache_status);
    }
    
    public function ajax_get_compatibility() {
        check_ajax_referer('e1-calculator-nonce', 'nonce');
        
        wp_send_json_success([
            'issues' => $this->compatibility_issues,
            'browser_support' => [
                'shadowDOM' => $this->check_shadow_dom_support(),
                'customElements' => $this->check_custom_elements_support(),
                'cssVariables' => $this->check_css_variables_support(),
                'es6' => $this->check_es6_support()
            ],
            'fallback_mode' => $this->should_use_fallback_mode(),
            'system_info' => [
                'php_version' => PHP_VERSION,
                'wp_version' => get_bloginfo('version'),
                'plugin_version' => $this->version
            ]
        ]);
    }
    
    /**
     * Enhanced cache URL and path management
     */
    private function get_cache_url() {
        $upload_dir = wp_upload_dir();
        $cache_url = $upload_dir['baseurl'] . '/e1-calculator-cache';
        
        // Ensure HTTPS in admin/secure contexts
        if (is_admin() || is_ssl()) {
            $cache_url = str_replace('http://', 'https://', $cache_url);
        }
        
        return $cache_url;
    }
    
    private function get_cache_path() {
        $upload_dir = wp_upload_dir();
        $cache_path = $upload_dir['basedir'] . '/e1-calculator-cache';
        
        // Ensure directory exists
        if (!file_exists($cache_path)) {
            wp_mkdir_p($cache_path);
            
            // Add security files
            $this->create_security_files($cache_path);
        }
        
        return $cache_path;
    }
    
    /**
     * Enhanced block editor detection
     */
    private function is_block_editor() {
        // Multiple ways to detect block editor context
        if (function_exists('get_current_screen')) {
            $screen = get_current_screen();
            if ($screen && method_exists($screen, 'is_block_editor') && $screen->is_block_editor()) {
                return true;
            }
        }
        
        // Check for Gutenberg plugin
        if (function_exists('is_gutenberg_page') && is_gutenberg_page()) {
            return true;
        }
        
        // Check REST API context
        if (defined('REST_REQUEST') && REST_REQUEST) {
            return false; // Don't load in REST context
        }
        
        // Check query parameters
        $editor_params = ['action' => 'edit', 'post_type', 'page'];
        foreach ($editor_params as $param) {
            if (isset($_GET[$param])) {
                return true;
            }
        }
        
        // Check for site editor or theme editor
        if (isset($_GET['page']) && in_array($_GET['page'], ['gutenberg', 'gutenberg-edit-site'])) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Enhanced browser compatibility checks
     */
    private function check_shadow_dom_support() {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Known unsupported browsers
        $unsupported_patterns = [
            '/MSIE [0-9]\./i',
            '/Trident\/[0-9]\./i',
            '/Edge\/1[2-7]\./i', // Edge Legacy < 18
            '/Chrome\/[1-4][0-9]\./i', // Chrome < 53
            '/Firefox\/[1-5][0-9]\./i', // Firefox < 63
            '/Safari\/[0-9]\./i', // Very old Safari
        ];
        
        foreach ($unsupported_patterns as $pattern) {
            if (preg_match($pattern, $user_agent)) {
                return false;
            }
        }
        
        return true;
    }
    
    private function check_custom_elements_support() {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Similar patterns as Shadow DOM but more restrictive
        return !preg_match('/MSIE|Trident|Edge\/1[0-7]\.|Chrome\/[1-5][0-9]\./i', $user_agent);
    }
    
    private function check_css_variables_support() {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // CSS Variables have broader support
        return !preg_match('/MSIE|Trident|Edge\/1[0-4]\./i', $user_agent);
    }
    
    private function check_es6_support() {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // ES6 support detection
        return !preg_match('/MSIE|Trident|Chrome\/[1-4][0-9]\.|Firefox\/[1-4][0-9]\./i', $user_agent);
    }
    
    /**
     * Comprehensive system compatibility check
     */
    private function check_system_compatibility() {
        // PHP version check
        if (version_compare(PHP_VERSION, '7.4', '<')) {
            $this->add_compatibility_issue('PHP 7.4 or higher required, current: ' . PHP_VERSION);
        }
        
        // WordPress version check
        global $wp_version;
        if (version_compare($wp_version, '5.8', '<')) {
            $this->add_compatibility_issue('WordPress 5.8 or higher required, current: ' . $wp_version);
        }
        
        // Cache directory check
        if (!is_writable($this->cache_path)) {
            $this->add_compatibility_issue('Cache directory not writable: ' . $this->cache_path);
        }
        
        // Required functions check
        $required_functions = ['json_decode', 'json_encode', 'file_get_contents', 'wp_enqueue_script'];
        foreach ($required_functions as $function) {
            if (!function_exists($function)) {
                $this->add_compatibility_issue('Required function missing: ' . $function);
            }
        }
        
        // Memory check
        $memory_limit = ini_get('memory_limit');
        if ($memory_limit && $memory_limit !== '-1') {
            $memory_bytes = $this->convert_to_bytes($memory_limit);
            if ($memory_bytes < 128 * 1024 * 1024) { // 128MB
                $this->add_compatibility_issue('Low memory limit: ' . $memory_limit . ' (128M recommended)');
            }
        }
    }
    
    private function add_compatibility_issue($issue) {
        $this->compatibility_issues[] = $issue;
        error_log('E1 Calculator Compatibility Issue: ' . $issue);
    }
    
    /**
     * Helper methods for enhanced functionality
     */
    
    private function enqueue_widget_styles() {
        // Determine which CSS to load based on browser support
        if ($this->should_use_fallback_mode()) {
            wp_enqueue_style(
                'e1-calculator-namespaced',
                $this->cache_url . '/widget-namespaced.css',
                [],
                $this->version
            );
        } else {
            wp_enqueue_style(
                'e1-calculator-shadow',
                $this->cache_url . '/widget.css',
                [],
                $this->version
            );
        }
    }
    
    private function get_initialization_script() {
        return '
        (function() {
            "use strict";
            
            // Performance tracking
            const startTime = performance.now();
            
            // Enhanced initialization with error handling
            function initializeE1Calculator() {
                if (!window.E1Calculator || !window.E1Calculator.initAll) {
                    console.warn("E1Calculator not available, retrying in 100ms...");
                    setTimeout(initializeE1Calculator, 100);
                    return;
                }
                
                try {
                    // Initialize all widgets with comprehensive options
                    const options = {
                        useShadowDOM: !window.e1CalculatorWP?.fallbackMode,
                        enableCache: true,
                        debugMode: window.e1CalculatorWP?.debug || false,
                        performanceTracking: true,
                        errorReporting: true
                    };
                    
                    window.E1Calculator.initAll(options).then(function(instances) {
                        const endTime = performance.now();
                        console.log(`E1 Calculator initialized: ${instances.length} widgets in ${Math.round(endTime - startTime)}ms`);
                        
                        // Dispatch custom event
                        window.dispatchEvent(new CustomEvent("e1-calculator-all-ready", {
                            detail: { 
                                total: instances.length, 
                                successful: instances.filter(i => i !== null).length,
                                loadTime: endTime - startTime
                            }
                        }));
                    }).catch(function(error) {
                        console.error("E1 Calculator initialization failed:", error);
                        
                        // Fallback initialization attempt
                        if (window.E1Calculator.initFallback) {
                            window.E1Calculator.initFallback();
                        }
                    });
                } catch (error) {
                    console.error("E1 Calculator initialization error:", error);
                }
            }
            
            // Wait for DOM and start initialization
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", initializeE1Calculator);
            } else {
                initializeE1Calculator();
            }
        })();
        ';
    }
    
    private function validate_cache_files() {
        $required_files = ['wordpress-loader.js', 'widget.js', 'widget.css', 'config.json'];
        
        foreach ($required_files as $file) {
            $file_path = $this->cache_path . '/' . $file;
            if (!file_exists($file_path) || filesize($file_path) === 0) {
                return false;
            }
        }
        
        return true;
    }
    
    private function should_use_fallback_mode() {
        return !empty($this->compatibility_issues) || 
               !$this->check_shadow_dom_support() ||
               (defined('E1_CALC_FORCE_FALLBACK') && E1_CALC_FORCE_FALLBACK);
    }
    
    public function render_block($attributes, $content, $block) {
        // Enhanced block rendering with full attribute support
        $merged_attributes = array_merge([
            'shadow' => $attributes['shadow'] ? 'true' : 'false',
            'height' => $attributes['height'],
            'theme' => $attributes['theme'],
            'class' => $attributes['containerClass'] ?? '',
            'auto_init' => $attributes['autoInit'] ? 'true' : 'false',
        ], $attributes);
        
        // Generate unique block ID if not provided
        if (empty($attributes['blockId'])) {
            $merged_attributes['blockId'] = 'block-' . wp_generate_uuid4();
        }
        
        return $this->render_shortcode($merged_attributes);
    }
    
    private function get_responsive_height_style($desktop_height, $mobile_height, $breakpoint) {
        $style = "min-height: {$desktop_height};";
        
        if ($mobile_height !== $desktop_height) {
            $style .= "\n@media (max-width: {$breakpoint}px) {";
            $style .= "\n  min-height: {$mobile_height};";
            $style .= "\n}";
        }
        
        return $style;
    }
    
    private function get_loading_styles() {
        return '<style>
        .e1-calculator-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
            min-height: 300px;
        }
        .e1-loading-content {
            max-width: 300px;
        }
        .e1-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e3f2fd;
            border-top: 4px solid #2196f3;
            border-radius: 50%;
            animation: e1-spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        .e1-loading-text {
            margin: 0 0 20px 0;
            color: #37474f;
            font-size: 18px;
            font-weight: 500;
        }
        .e1-loading-progress {
            width: 100%;
            height: 4px;
            background: #e3f2fd;
            border-radius: 2px;
            overflow: hidden;
        }
        .e1-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #2196f3, #21cbf3);
            border-radius: 2px;
            animation: e1-progress 2s ease-in-out infinite;
        }
        @keyframes e1-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes e1-progress {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(400%); }
        }
        </style>';
    }
    
    private function get_noscript_styles() {
        return '<style>
        .e1-calculator-noscript {
            padding: 40px 20px;
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 8px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .e1-noscript-content h3 {
            color: #856404;
            margin: 0 0 16px 0;
            font-size: 24px;
        }
        .e1-noscript-content p {
            color: #856404;
            margin: 0 0 16px 0;
            line-height: 1.6;
        }
        .e1-noscript-content ol {
            text-align: left;
            display: inline-block;
            margin: 16px 0;
        }
        .e1-noscript-content li {
            color: #856404;
            margin: 8px 0;
        }
        .e1-noscript-content a {
            color: #007cba;
            text-decoration: none;
            font-weight: bold;
        }
        .e1-noscript-content a:hover {
            text-decoration: underline;
        }
        </style>';
    }
    
    private function get_available_themes() {
        return [
            'default' => __('Default Theme', 'e1-calculator'),
            'light' => __('Light Theme', 'e1-calculator'),
            'dark' => __('Dark Theme', 'e1-calculator'),
            'energiaykkonen' => __('Energiaykkönen Theme', 'e1-calculator'),
            'custom' => __('Custom Theme', 'e1-calculator')
        ];
    }
    
    private function create_security_files($cache_path) {
        // Create .htaccess for Apache
        $htaccess_content = "# E1 Calculator Cache Security\n";
        $htaccess_content .= "<IfModule mod_headers.c>\n";
        $htaccess_content .= "    Header set X-Content-Type-Options nosniff\n";
        $htaccess_content .= "    Header set X-Frame-Options SAMEORIGIN\n";
        $htaccess_content .= "</IfModule>\n\n";
        $htaccess_content .= "<IfModule mod_expires.c>\n";
        $htaccess_content .= "    ExpiresActive On\n";
        $htaccess_content .= "    ExpiresByType application/javascript \"access plus 7 days\"\n";
        $htaccess_content .= "    ExpiresByType text/css \"access plus 7 days\"\n";
        $htaccess_content .= "    ExpiresByType application/json \"access plus 1 hour\"\n";
        $htaccess_content .= "</IfModule>\n";
        
        file_put_contents($cache_path . '/.htaccess', $htaccess_content);
        
        // Create index.php to prevent directory listing
        file_put_contents($cache_path . '/index.php', '<?php // Silence is golden');
    }
    
    /**
     * Security and utility methods
     */
    private function check_rate_limit() {
        $key = 'e1_calc_rate_limit_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
        $current = get_transient($key) ?: 0;
        
        if ($current >= 60) { // Max 60 requests per minute
            return false;
        }
        
        set_transient($key, $current + 1, 60);
        return true;
    }
    
    private function validate_request_source() {
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        
        return empty($referer) || parse_url($referer, PHP_URL_HOST) === $host;
    }
    
    private function sanitize_config_data($config) {
        // Recursively sanitize configuration data
        if (is_array($config)) {
            return array_map([$this, 'sanitize_config_data'], $config);
        }
        
        if (is_string($config)) {
            return wp_kses_post($config);
        }
        
        return $config;
    }
    
    private function get_session_id() {
        return substr(md5(wp_get_session_token() . NONCE_SALT), 0, 16);
    }
    
    private function convert_to_bytes($value) {
        $value = trim($value);
        $last = strtolower($value[strlen($value)-1]);
        $num = (int) $value;
        
        switch($last) {
            case 'g': $num *= 1024;
            case 'm': $num *= 1024;
            case 'k': $num *= 1024;
        }
        
        return $num;
    }
    
    public function show_compatibility_notices() {
        if (empty($this->compatibility_issues)) return;
        
        echo '<div class="notice notice-warning is-dismissible">';
        echo '<h3>E1 Calculator Compatibility Issues</h3>';
        echo '<ul>';
        foreach ($this->compatibility_issues as $issue) {
            echo '<li>' . esc_html($issue) . '</li>';
        }
        echo '</ul>';
        echo '<p>Some features may not work correctly. Please address these issues or contact support.</p>';
        echo '</div>';
    }
    
    // Additional helper methods - implement as needed
    private function regenerate_config() { return false; }
    private function get_cache_status() { return []; }
    private function get_csp_config() { return []; }
    private function get_allowed_origins() { return ['*']; }
    public function add_performance_monitoring() { /* Add performance monitoring */ }
    public function add_fallback_styles() { /* Add fallback CSS */ }
    public function clear_cache() { /* Cache clearing logic */ }
}

// Initialize enhanced loader
new E1_Calculator_Loader();