<?php
namespace E1_Calculator;

/**
 * Simple admin class with only essential functionality
 */
class Admin_Simple {
    
    private $api_client;
    private $cache_manager;
    private $sync_manager;
    private $security;
    
    public function __construct($api_client, $cache_manager, $sync_manager, $security) {
        $this->api_client = $api_client;
        $this->cache_manager = $cache_manager;
        $this->sync_manager = $sync_manager;
        $this->security = $security;
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // AJAX handlers
        add_action('wp_ajax_e1_sync_widget', array($this, 'ajax_sync_widget'));
        add_action('wp_ajax_e1_clear_cache', array($this, 'ajax_clear_cache'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('E1 Calculator', 'e1-calculator'),
            __('E1 Calculator', 'e1-calculator'),
            'manage_options',
            'e1-calculator',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('e1_calculator_settings', 'e1_calculator_api_url', array(
            'sanitize_callback' => array($this->security, 'sanitize_api_url'),
        ));
        
        register_setting('e1_calculator_settings', 'e1_calculator_api_key', array(
            'sanitize_callback' => array($this, 'save_api_key'),
        ));
        
        register_setting('e1_calculator_settings', 'e1_widget_api_url', array(
            'sanitize_callback' => 'esc_url_raw',
        ));
        
        register_setting('e1_calculator_settings', 'e1_widget_secret_key');
    }
    
    /**
     * Save API key with encryption
     */
    public function save_api_key($api_key) {
        if (!empty($api_key)) {
            $this->security->save_api_key($api_key);
        }
        return ''; // Don't store unencrypted
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        $sync_status = $this->sync_manager->get_sync_status();
        ?>
        <div class="wrap">
            <h1><?php _e('E1 Calculator', 'e1-calculator'); ?></h1>
            
            <div id="action-result"></div>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('e1_calculator_settings');
                do_settings_sections('e1_calculator_settings');
                ?>
                
                <div class="card" style="max-width: 800px;">
                    <h2><?php _e('Configuration', 'e1-calculator'); ?></h2>
                    <p class="description"><?php _e('Configure these 4 values, then press Sync Widget to download the latest widget.', 'e1-calculator'); ?></p>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="e1_calculator_api_url"><?php _e('API URL', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <input type="url" 
                                       id="e1_calculator_api_url"
                                       name="e1_calculator_api_url" 
                                       value="<?php echo esc_attr(get_option('e1_calculator_api_url', 'https://energiaykkonen-calculator.vercel.app/api/widget-bundle')); ?>" 
                                       class="large-text" 
                                       required />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="e1_calculator_api_key"><?php _e('API Key', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <input type="password" 
                                       id="e1_calculator_api_key"
                                       name="e1_calculator_api_key" 
                                       value="<?php echo esc_attr($this->security->get_api_key()); ?>" 
                                       class="regular-text" />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="e1_widget_api_url"><?php _e('Widget Submit API URL', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <input type="url" 
                                       id="e1_widget_api_url"
                                       name="e1_widget_api_url" 
                                       value="<?php echo esc_attr(get_option('e1_widget_api_url', 'https://energiaykkonen-calculator.vercel.app')); ?>" 
                                       class="large-text" />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="e1_widget_secret_key"><?php _e('Widget Secret Key', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <input type="password" 
                                       id="e1_widget_secret_key"
                                       name="e1_widget_secret_key" 
                                       value="<?php echo esc_attr(get_option('e1_widget_secret_key')); ?>" 
                                       class="regular-text" />
                            </td>
                        </tr>
                    </table>
                    
                    <?php submit_button(); ?>
                </div>
            </form>
            
            <!-- Sync Widget Section -->
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2><?php _e('Sync Widget', 'e1-calculator'); ?></h2>
                
                <p>
                    <button type="button" id="sync-widget-btn" class="button button-primary button-hero">
                        <?php _e('Sync Widget', 'e1-calculator'); ?>
                    </button>
                    <button type="button" id="clear-cache-btn" class="button" style="margin-left: 10px;">
                        <?php _e('Clear Cache First', 'e1-calculator'); ?>
                    </button>
                    <span class="spinner" style="float: none; margin: 0 0 0 10px;"></span>
                </p>
                <p class="description">
                    <?php _e('If sync fails or shows old data, click "Clear Cache First" then "Sync Widget".', 'e1-calculator'); ?>
                </p>
                
                <?php if ($sync_status['last_sync']): ?>
                <div class="sync-status" style="margin-top: 15px;">
                    <p><strong><?php _e('Last Sync:', 'e1-calculator'); ?></strong> 
                       <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($sync_status['last_sync']))); ?>
                    </p>
                    <?php if ($sync_status['version']): ?>
                    <p><strong><?php _e('Version:', 'e1-calculator'); ?></strong> <?php echo esc_html($sync_status['version']); ?></p>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            </div>
            
            <!-- Usage Instructions -->
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2><?php _e('Usage', 'e1-calculator'); ?></h2>
                <p><?php _e('After syncing the widget, add it to any page or post using:', 'e1-calculator'); ?></p>
                <code style="display: inline-block; padding: 10px; background: #f0f0f0; border-radius: 4px; font-size: 16px;">
                    [e1_calculator]
                </code>
            </div>
        </div>
        <?php
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if (!strpos($hook, 'e1-calculator')) {
            return;
        }
        
        wp_enqueue_script('e1-calculator-admin', E1_CALC_PLUGIN_URL . 'assets/js/admin.js', ['jquery'], E1_CALC_VERSION, true);
        wp_enqueue_style('e1-calculator-admin', E1_CALC_PLUGIN_URL . 'assets/css/admin.css', [], E1_CALC_VERSION);
        
        wp_localize_script('e1-calculator-admin', 'e1_calculator_admin', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => $this->security->create_nonce(),
            'strings' => [
                'syncing' => __('Syncing widget...', 'e1-calculator'),
                'success' => __('Success!', 'e1-calculator'),
                'error' => __('Error:', 'e1-calculator'),
            ],
        ]);
    }
    
    /**
     * AJAX: Sync widget
     */
    public function ajax_sync_widget() {
        // Check nonce (use same method as working debug sync)
        if (!$this->security->validate_nonce($_POST['nonce'] ?? '')) {
            wp_send_json_error(['message' => __('Security check failed', 'e1-calculator')]);
        }
        
        // Check permissions (use same method as working debug sync)  
        if (!$this->security->check_admin_permissions()) {
            wp_send_json_error(['message' => __('Unauthorized', 'e1-calculator')]);
        }
        
        try {
            // Use new secure sync manager
            $result = $this->sync_manager->sync_bundle($this->api_client);
            
            if ($result['success']) {
                wp_send_json_success([
                    'message' => $result['message'],
                    'version' => $result['version'],
                    'timestamp' => current_time('mysql')
                ]);
            } else {
                // Detailed error message for debugging
                $message = !empty($result['message']) ? $result['message'] : __('Sync failed - check error log', 'e1-calculator');
                $errors = $result['errors'] ?? [];
                
                // Add configuration details for debugging
                $debug_info = [
                    'API URL' => get_option('e1_calculator_api_url', 'NOT SET'),
                    'API Key Length' => strlen($this->security->get_api_key()) > 0 ? strlen($this->security->get_api_key()) . ' chars' : 'NOT SET',
                    'PHP Version' => PHP_VERSION,
                    'WordPress Version' => get_bloginfo('version'),
                    'SSL Available' => extension_loaded('openssl') ? 'Yes' : 'No'
                ];
                
                wp_send_json_error([
                    'message' => $message,
                    'errors' => $errors,
                    'debug' => $debug_info
                ]);
            }
        } catch (\Exception $e) {
            error_log('E1 Calculator AJAX sync error: ' . $e->getMessage());
            wp_send_json_error([
                'message' => 'Sync failed: ' . $e->getMessage(),
                'errors' => [$e->getMessage()]
            ]);
        }
    }
    
    /**
     * AJAX: Clear cache
     */
    public function ajax_clear_cache() {
        // Check nonce
        if (!$this->security->validate_nonce($_POST['nonce'] ?? '')) {
            wp_send_json_error(['message' => __('Security check failed', 'e1-calculator')]);
        }
        
        // Check permissions
        if (!$this->security->check_admin_permissions()) {
            wp_send_json_error(['message' => __('Unauthorized', 'e1-calculator')]);
        }
        
        try {
            $this->cache_manager->clear_cache();
            wp_send_json_success(['message' => __('Cache cleared successfully. Now click "Sync Widget" to download fresh data.', 'e1-calculator')]);
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
}