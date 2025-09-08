<?php
/**
 * Plugin Name: E1 Calculator - Energiaykkönen
 * Plugin URI: https://energiaykkonen.fi/
 * Description: Embed Energiaykkönen's savings calculator on your WordPress site using a simple shortcode [e1_calculator]
 * Version: 1.2.0
 * Author: Energiaykkönen Oy
 * Author URI: https://energiaykkonen.fi/
 * License: GPL v2 or later
 * Text Domain: e1-calculator
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('E1_CALCULATOR_VERSION', '1.2.0');
define('E1_CALCULATOR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('E1_CALCULATOR_PLUGIN_URL', plugin_dir_url(__FILE__));

// Default calculator URL (change this for production)
if (!defined('E1_CALCULATOR_URL')) {
    define('E1_CALCULATOR_URL', 'http://localhost:3001');
}

/**
 * Main plugin class
 */
class E1_Calculator {
    
    /**
     * Instance of this class
     */
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        // Initialize hooks
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('e1_calculator', array($this, 'render_shortcode'));
        
        // Admin hooks
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
            add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_settings_link'));
            add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
            
            // AJAX handlers for sync
            add_action('wp_ajax_e1_calculator_sync', array($this, 'ajax_sync_configuration'));
            add_action('wp_ajax_e1_calculator_test_connection', array($this, 'ajax_test_connection'));
        }
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('e1-calculator', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        // Only load on pages with our shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'e1_calculator')) {
            wp_enqueue_script(
                'e1-calculator-resize',
                E1_CALCULATOR_PLUGIN_URL . 'assets/resize-handler.js',
                array(),
                E1_CALCULATOR_VERSION,
                true
            );
            
            // Get synced configuration
            $sync_data = get_option('e1_calculator_sync_data', array());
            
            // Pass configuration to JavaScript
            wp_localize_script('e1-calculator-resize', 'e1_calculator_config', array(
                'calculator_url' => $this->get_calculator_url(),
                'allowed_origin' => $this->get_allowed_origin(),
                'auto_resize' => isset($sync_data['features']['autoResize']) ? $sync_data['features']['autoResize'] : true,
                'theme' => isset($sync_data['styling']) ? $sync_data['styling'] : array(),
            ));
            
            // Add inline styles
            wp_add_inline_style('wp-block-library', $this->get_inline_styles());
        }
    }
    
    /**
     * Render the calculator shortcode
     */
    public function render_shortcode($atts = array()) {
        // Get cached configuration
        $sync_data = get_option('e1_calculator_sync_data', array());
        
        // Use synced settings or defaults
        $default_height = isset($sync_data['embedSettings']['defaultHeight']) 
            ? $sync_data['embedSettings']['defaultHeight'] 
            : '600';
        
        // Parse shortcode attributes (only keep essential ones)
        $atts = shortcode_atts(array(
            'class' => '',
            'id' => 'e1-calculator-' . uniqid(),
        ), $atts, 'e1_calculator');
        
        // Get settings
        $calculator_url = $this->get_calculator_url();
        
        // Build iframe HTML with synced configuration
        $iframe_html = sprintf(
            '<div class="e1-calculator-wrapper %s">
                <iframe 
                    id="%s"
                    class="e1-calculator-iframe"
                    src="%s" 
                    width="100%%" 
                    height="%s" 
                    frameborder="0" 
                    scrolling="no"
                    allowtransparency="true"
                    title="%s"
                    style="border: none; overflow: hidden; width: 100%%; max-width: 100%%; transition: height 0.3s ease;">
                </iframe>
                <noscript>
                    <p>%s</p>
                </noscript>
            </div>',
            esc_attr($atts['class']),
            esc_attr($atts['id']),
            esc_url($calculator_url),
            esc_attr($default_height),
            __('Energiaykkönen Savings Calculator', 'e1-calculator'),
            __('Please enable JavaScript to use the calculator.', 'e1-calculator')
        );
        
        return $iframe_html;
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('E1 Calculator Settings', 'e1-calculator'),
            __('E1 Calculator', 'e1-calculator'),
            'manage_options',
            'e1-calculator-settings',
            array($this, 'render_admin_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('e1_calculator_settings', 'e1_calculator_url');
        
        // Add settings sections
        add_settings_section(
            'e1_calculator_main_settings',
            __('Calculator Settings', 'e1-calculator'),
            array($this, 'render_settings_section'),
            'e1-calculator-settings'
        );
        
        // Only register URL field - all other settings come from sync
        add_settings_field(
            'e1_calculator_url',
            __('Calculator URL', 'e1-calculator'),
            array($this, 'render_url_field'),
            'e1-calculator-settings',
            'e1_calculator_main_settings'
        );
    }
    
    /**
     * Render admin settings page
     */
    public function render_admin_page() {
        $last_sync = get_option('e1_calculator_last_sync', null);
        $sync_data = get_option('e1_calculator_sync_data', null);
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <!-- Sync Status Box -->
            <div id="e1-sync-status" class="notice notice-info inline" style="padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0;"><?php _e('Configuration Sync', 'e1-calculator'); ?></h3>
                
                <div class="sync-info">
                    <?php if ($last_sync): ?>
                        <p>
                            <strong><?php _e('Last synced:', 'e1-calculator'); ?></strong> 
                            <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($last_sync))); ?>
                        </p>
                        <?php if ($sync_data && isset($sync_data['version'])): ?>
                            <p>
                                <strong><?php _e('Calculator Version:', 'e1-calculator'); ?></strong> 
                                <?php echo esc_html($sync_data['version']); ?>
                            </p>
                        <?php endif; ?>
                    <?php else: ?>
                        <p><?php _e('Not synced yet. Click the button below to sync with the calculator.', 'e1-calculator'); ?></p>
                    <?php endif; ?>
                </div>
                
                <div class="sync-buttons" style="margin-top: 15px;">
                    <button type="button" id="e1-test-connection" class="button">
                        <?php _e('Test Connection', 'e1-calculator'); ?>
                    </button>
                    <button type="button" id="e1-sync-now" class="button button-primary">
                        <?php _e('Sync Changes', 'e1-calculator'); ?>
                    </button>
                    <span class="spinner" style="float: none; margin-top: 0;"></span>
                </div>
                
                <div id="sync-result" style="margin-top: 15px; display: none;"></div>
            </div>
            
            <form action="options.php" method="post">
                <?php
                settings_fields('e1_calculator_settings');
                do_settings_sections('e1-calculator-settings');
                submit_button();
                ?>
            </form>
            
            <!-- Synced Configuration Display -->
            <?php if ($sync_data): ?>
            <div class="e1-calculator-synced-config" style="margin-top: 30px; padding: 15px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">
                <h3><?php _e('Synced Configuration', 'e1-calculator'); ?></h3>
                <details>
                    <summary style="cursor: pointer; padding: 5px 0;">
                        <?php _e('View configuration details', 'e1-calculator'); ?>
                    </summary>
                    <pre style="background: white; padding: 10px; margin-top: 10px; overflow: auto; max-height: 400px;">
<?php echo esc_html(json_encode($sync_data, JSON_PRETTY_PRINT)); ?>
                    </pre>
                </details>
            </div>
            <?php endif; ?>
            
            <div class="e1-calculator-info">
                <h2><?php _e('How to Use', 'e1-calculator'); ?></h2>
                <p><?php _e('Add the calculator to any page or post using the shortcode:', 'e1-calculator'); ?></p>
                <code>[e1_calculator]</code>
                
                <p style="margin-top: 10px; color: #666;">
                    <?php _e('All display settings are automatically synced from the calculator app.', 'e1-calculator'); ?>
                </p>
                
                <h3><?php _e('Support', 'e1-calculator'); ?></h3>
                <p>
                    <?php _e('For support, please contact', 'e1-calculator'); ?> 
                    <a href="mailto:support@energiaykkonen.fi">support@energiaykkonen.fi</a>
                </p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render settings section description
     */
    public function render_settings_section() {
        echo '<p>' . __('Set the calculator URL and sync configuration from the app.', 'e1-calculator') . '</p>';
    }
    
    /**
     * Render URL field
     */
    public function render_url_field() {
        $value = get_option('e1_calculator_url', E1_CALCULATOR_URL);
        ?>
        <input type="url" 
               name="e1_calculator_url" 
               value="<?php echo esc_attr($value); ?>" 
               class="regular-text" />
        <p class="description">
            <?php _e('The URL of your E1 Calculator instance.', 'e1-calculator'); ?>
        </p>
        <?php
    }
    
    
    /**
     * Add settings link to plugin list
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="options-general.php?page=e1-calculator-settings">' . 
                        __('Settings', 'e1-calculator') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
    
    /**
     * Get calculator URL
     */
    private function get_calculator_url() {
        return get_option('e1_calculator_url', E1_CALCULATOR_URL);
    }
    
    /**
     * Get allowed origin for security
     */
    private function get_allowed_origin() {
        $url = $this->get_calculator_url();
        $parsed = parse_url($url);
        return $parsed['scheme'] . '://' . $parsed['host'] . 
               (isset($parsed['port']) ? ':' . $parsed['port'] : '');
    }
    
    /**
     * Get inline styles
     */
    private function get_inline_styles() {
        return '
            .e1-calculator-wrapper {
                width: 100%;
                max-width: 100%;
                margin: 20px 0;
            }
            .e1-calculator-iframe {
                display: block;
                width: 100% !important;
                max-width: 100% !important;
            }
        ';
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on our settings page
        if ($hook !== 'settings_page_e1-calculator-settings') {
            return;
        }
        
        // Add admin JavaScript
        wp_add_inline_script('jquery', $this->get_admin_javascript());
    }
    
    /**
     * Get admin JavaScript for sync functionality
     */
    private function get_admin_javascript() {
        return "
        jQuery(document).ready(function($) {
            // Test connection button
            $('#e1-test-connection').on('click', function() {
                var button = $(this);
                var spinner = $('.spinner');
                var resultDiv = $('#sync-result');
                
                button.prop('disabled', true);
                spinner.addClass('is-active');
                resultDiv.hide();
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'e1_calculator_test_connection',
                        nonce: '" . wp_create_nonce('e1_calculator_ajax') . "'
                    },
                    success: function(response) {
                        if (response.success) {
                            resultDiv.html('<div class=\"notice notice-success\"><p>' + response.data.message + '</p></div>');
                        } else {
                            resultDiv.html('<div class=\"notice notice-error\"><p>' + response.data.message + '</p></div>');
                        }
                        resultDiv.slideDown();
                    },
                    error: function() {
                        resultDiv.html('<div class=\"notice notice-error\"><p>Connection test failed. Please check your settings.</p></div>');
                        resultDiv.slideDown();
                    },
                    complete: function() {
                        button.prop('disabled', false);
                        spinner.removeClass('is-active');
                    }
                });
            });
            
            // Sync button
            $('#e1-sync-now').on('click', function() {
                var button = $(this);
                var spinner = $('.spinner');
                var resultDiv = $('#sync-result');
                
                button.prop('disabled', true);
                spinner.addClass('is-active');
                resultDiv.hide();
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'e1_calculator_sync',
                        nonce: '" . wp_create_nonce('e1_calculator_ajax') . "'
                    },
                    success: function(response) {
                        if (response.success) {
                            resultDiv.html('<div class=\"notice notice-success\"><p>' + response.data.message + '</p></div>');
                            // Reload page after 2 seconds to show updated data
                            setTimeout(function() {
                                window.location.reload();
                            }, 2000);
                        } else {
                            resultDiv.html('<div class=\"notice notice-error\"><p>' + response.data.message + '</p></div>');
                        }
                        resultDiv.slideDown();
                    },
                    error: function() {
                        resultDiv.html('<div class=\"notice notice-error\"><p>Sync failed. Please check your connection and try again.</p></div>');
                        resultDiv.slideDown();
                    },
                    complete: function() {
                        button.prop('disabled', false);
                        spinner.removeClass('is-active');
                    }
                });
            });
        });
        ";
    }
    
    /**
     * AJAX handler for testing connection
     */
    public function ajax_test_connection() {
        // Check nonce
        if (!wp_verify_nonce($_POST['nonce'], 'e1_calculator_ajax')) {
            wp_die('Security check failed');
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $calculator_url = $this->get_calculator_url();
        $test_url = trailingslashit($calculator_url) . 'api/widget-config';
        
        // Test connection
        $response = wp_remote_get($test_url, array(
            'timeout' => 10,
            'sslverify' => false, // For development
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Connection failed: ' . $response->get_error_message()
            ));
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code === 200) {
            wp_send_json_success(array(
                'message' => 'Connection successful! Calculator is reachable.'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Connection failed. Status code: ' . $status_code
            ));
        }
    }
    
    /**
     * AJAX handler for syncing configuration
     */
    public function ajax_sync_configuration() {
        // Check nonce
        if (!wp_verify_nonce($_POST['nonce'], 'e1_calculator_ajax')) {
            wp_die('Security check failed');
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $calculator_url = $this->get_calculator_url();
        $config_url = trailingslashit($calculator_url) . 'api/widget-config';
        
        // Fetch configuration
        $response = wp_remote_get($config_url, array(
            'timeout' => 10,
            'sslverify' => false, // For development
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Sync failed: ' . $response->get_error_message()
            ));
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($status_code !== 200) {
            wp_send_json_error(array(
                'message' => 'Sync failed. Unable to fetch configuration.'
            ));
        }
        
        $config = json_decode($body, true);
        
        if (!$config) {
            wp_send_json_error(array(
                'message' => 'Invalid configuration data received.'
            ));
        }
        
        // Store configuration
        update_option('e1_calculator_sync_data', $config);
        update_option('e1_calculator_last_sync', current_time('mysql'));
        
        wp_send_json_success(array(
            'message' => 'Configuration synced successfully! Version: ' . ($config['version'] ?? 'Unknown'),
            'config' => $config
        ));
    }
}

// Initialize the plugin
add_action('plugins_loaded', array('E1_Calculator', 'get_instance'));

// Activation hook
register_activation_hook(__FILE__, 'e1_calculator_activate');
function e1_calculator_activate() {
    // Set default options
    add_option('e1_calculator_url', E1_CALCULATOR_URL);
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'e1_calculator_deactivate');
function e1_calculator_deactivate() {
    // Clean up if needed
}