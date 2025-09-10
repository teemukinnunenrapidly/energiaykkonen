<?php
/**
 * Plugin Name: E1 Calculator Pro
 * Plugin URI: https://energiaykkonen.fi/
 * Description: Professional widget with Shadow DOM isolation and WordPress integration
 * Version: 2.2.0
 * Author: Energiaykkönen Oy
 * License: GPL v2 or later
 * Text Domain: e1-calculator
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('E1_CALC_VERSION', '2.2.0');
define('E1_CALC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('E1_CALC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('E1_CALC_PLUGIN_FILE', __FILE__);

// Cache directory in WordPress uploads
$upload_dir = wp_upload_dir();
define('E1_CALC_CACHE_DIR', $upload_dir['basedir'] . '/e1-calculator-cache/');
define('E1_CALC_CACHE_URL', $upload_dir['baseurl'] . '/e1-calculator-cache/');

// Load plugin classes
require_once E1_CALC_PLUGIN_DIR . 'includes/class-cache-manager.php';
require_once E1_CALC_PLUGIN_DIR . 'includes/class-e1-calculator-loader.php';
require_once E1_CALC_PLUGIN_DIR . 'includes/class-admin-settings.php';

// Initialize plugin
add_action('init', function() {
    // Initialize cache manager
    $cache_manager = new E1_Calculator\Cache_Manager();
    
    // Initialize widget loader
    $widget_loader = new E1_Calculator_Loader();
    
    // Initialize admin settings (only in admin)
    if (is_admin()) {
        new E1_Calculator\Admin_Settings($cache_manager);
    }
});

// Simple activation hook to create cache directory
register_activation_hook(__FILE__, function() {
    // Create cache directory
    if (!file_exists(E1_CALC_CACHE_DIR)) {
        wp_mkdir_p(E1_CALC_CACHE_DIR);
    }
    
    // Set default options
    $default_options = [
        'shadow_dom_mode' => 'auto',
        'debug_mode' => false,
        'cache_last_cleared' => ''
    ];
    
    // Only add defaults if no options exist
    if (!get_option('e1_calculator_options')) {
        add_option('e1_calculator_options', $default_options);
    }
    
    // Set version option
    update_option('e1_calculator_version', E1_CALC_VERSION);
});

// Deactivation cleanup
register_deactivation_hook(__FILE__, function() {
    // Clean up temporary files but keep cache and settings
    delete_transient('e1_calculator_config_cache');
    delete_option('e1_calculator_temp_data');
});

// Uninstall cleanup function
function e1_calculator_uninstall() {
    // Remove all plugin options
    delete_option('e1_calculator_options');
    delete_option('e1_calculator_version');
    
    // Optionally remove cache directory
    // (commented out to preserve user data)
    // $cache_manager = new E1_Calculator\Cache_Manager();
    // $cache_manager->clear_cache();
}

// Uninstall cleanup (only if explicitly uninstalled)
register_uninstall_hook(__FILE__, 'e1_calculator_uninstall');