<?php
namespace E1_Calculator;

/**
 * Main plugin class
 */
class Plugin {
    
    /**
     * Plugin instance
     */
    private static $instance = null;
    
    /**
     * Plugin components
     */
    private $api_client;
    private $cache_manager;
    private $sync_manager;
    private $widget;
    private $widget_loader;
    private $admin;
    private $security;
    
    /**
     * Get plugin instance
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
        $this->load_dependencies();
        $this->init_components();
        $this->register_hooks();
    }
    
    /**
     * Load required files
     */
    private function load_dependencies() {
        require_once E1_CALC_PLUGIN_DIR . 'includes/class-api-client.php';
        require_once E1_CALC_PLUGIN_DIR . 'includes/class-cache-manager.php';
        require_once E1_CALC_PLUGIN_DIR . 'includes/class-sync-manager.php';
        require_once E1_CALC_PLUGIN_DIR . 'includes/class-widget.php';
        require_once E1_CALC_PLUGIN_DIR . 'includes/class-e1-calculator-loader.php';
        require_once E1_CALC_PLUGIN_DIR . 'includes/class-security.php';
        
        // Include AJAX handler for widget form submissions
        require_once E1_CALC_PLUGIN_DIR . 'includes/ajax-handler.php';
        
        if (is_admin()) {
            require_once E1_CALC_PLUGIN_DIR . 'includes/class-admin-settings.php';
        }
    }
    
    /**
     * Initialize components
     */
    private function init_components() {
        $this->security = new Security();
        $this->api_client = new API_Client($this->security);
        $this->cache_manager = new Cache_Manager();
        $this->sync_manager = new Sync_Manager();
        $this->widget = new Widget($this->cache_manager);
        $this->widget_loader = new E1_Calculator_Loader();
        
        
        if (is_admin()) {
            $this->admin = new Admin_Settings($this->cache_manager);
        }
    }
    
    /**
     * Register WordPress hooks
     */
    private function register_hooks() {
        // Init hook
        add_action('init', array($this, 'init'));
        
        // Shortcode is now registered by Widget_Loader
        // add_shortcode('e1_calculator', array($this->widget, 'render')); // DEPRECATED
        
        // Scripts and styles are handled by Widget_Loader class
        // add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts')); // REMOVED - handled by Widget_Loader
        
        // AJAX endpoints  
        add_action('wp_ajax_e1_clear_cache', array($this, 'ajax_clear_cache'));
        add_action('wp_ajax_e1_sync_status', array($this, 'ajax_sync_status'));
        
        // Cron for auto-sync
        add_action('e1_calculator_sync_cron', array($this, 'cron_sync'));
    }
    
    /**
     * Plugin initialization
     */
    public function init() {
        // Load textdomain
        load_plugin_textdomain('e1-calculator', false, dirname(plugin_basename(E1_CALC_PLUGIN_FILE)) . '/languages');
        
        // Schedule cron if not scheduled
        if (!wp_next_scheduled('e1_calculator_sync_cron')) {
            wp_schedule_event(time(), 'daily', 'e1_calculator_sync_cron');
        }
    }
    
    /**
     * Enqueue frontend scripts
     */
    public function enqueue_scripts() {
        // Only load on pages with our shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'e1_calculator')) {
            // Widget files are loaded inline by the widget class
            // This is for any additional frontend scripts if needed
        }
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
                // Ensure we have a message
                $message = !empty($result['message']) ? $result['message'] : __('Sync failed - check error log', 'e1-calculator');
                wp_send_json_error([
                    'message' => $message,
                    'errors' => $result['errors'] ?? []
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
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'e1_calculator_ajax')) {
            wp_send_json_error(['message' => __('Security check failed', 'e1-calculator')]);
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Unauthorized', 'e1-calculator')]);
        }
        
        try {
            $this->cache_manager->clear_cache();
            wp_send_json_success(['message' => __('Cache cleared successfully', 'e1-calculator')]);
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX: Get sync status
     */
    public function ajax_sync_status() {
        // Check nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'e1_calculator_ajax')) {
            wp_send_json_error(['message' => __('Security check failed', 'e1-calculator')]);
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Unauthorized', 'e1-calculator')]);
        }
        
        $status = $this->sync_manager->get_sync_status();
        wp_send_json_success($status);
    }
    
    /**
     * Cron sync
     */
    public function cron_sync() {
        try {
            // Only sync if auto-sync is enabled
            if (get_option('e1_calculator_auto_sync', false)) {
                // Use secure sync manager for cron too
                $result = $this->sync_manager->sync_bundle($this->api_client);
                if (!$result['success']) {
                    error_log('E1 Calculator cron sync failed: ' . $result['message']);
                }
            }
        } catch (\Exception $e) {
            error_log('E1 Calculator auto-sync failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Plugin activation
     */
    public static function activate() {
        // Create cache directory
        if (!file_exists(E1_CALC_CACHE_DIR)) {
            wp_mkdir_p(E1_CALC_CACHE_DIR);
        }
        
        // Setup proper .htaccess rules - simplified for new system
        if (!file_exists(E1_CALC_CACHE_DIR . '.htaccess')) {
            $htaccess_content = "# E1 Calculator Cache Directory\n";
            $htaccess_content .= "Options -Indexes\n";
            $htaccess_content .= "<FilesMatch \"\\.(js|css|json)$\">\n";
            $htaccess_content .= "    Require all granted\n";
            $htaccess_content .= "</FilesMatch>\n";
            file_put_contents(E1_CALC_CACHE_DIR . '.htaccess', $htaccess_content);
        }
        
        // Set default options
        add_option('e1_calculator_api_url', 'https://energiaykkonen-calculator.vercel.app/api/widget-config');
        add_option('e1_calculator_api_key', '');
        add_option('e1_calculator_auto_sync', false);
        add_option('e1_calculator_cache_duration', 86400); // 24 hours
        
        // Schedule cron
        if (!wp_next_scheduled('e1_calculator_sync_cron')) {
            wp_schedule_event(time(), 'daily', 'e1_calculator_sync_cron');
        }
    }
    
    /**
     * Plugin deactivation
     */
    public static function deactivate() {
        // Clear cron
        wp_clear_scheduled_hook('e1_calculator_sync_cron');
    }
    
    /**
     * Plugin uninstall
     */
    public static function uninstall() {
        // Remove options
        delete_option('e1_calculator_api_url');
        delete_option('e1_calculator_api_key');
        delete_option('e1_calculator_api_key_encrypted');
        delete_option('e1_calculator_auto_sync');
        delete_option('e1_calculator_cache_duration');
        delete_option('e1_calculator_last_sync');
        delete_option('e1_calculator_sync_version');
        
        // Remove widget submission settings
        delete_option('e1_widget_api_url');
        delete_option('e1_widget_secret_key');
        
        // Remove cache directory
        if (file_exists(E1_CALC_CACHE_DIR)) {
            self::delete_directory(E1_CALC_CACHE_DIR);
        }
    }
    
    /**
     * Delete directory recursively
     */
    private static function delete_directory($dir) {
        if (!file_exists($dir)) {
            return;
        }
        
        $files = array_diff(scandir($dir), array('.', '..'));
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? self::delete_directory($path) : unlink($path);
        }
        return rmdir($dir);
    }
}