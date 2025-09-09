<?php
/**
 * Plugin Name: E1 Calculator Pro
 * Plugin URI: https://energiaykkonen.fi/
 * Description: Professional widget sync system for E1 Calculator with caching and optimization
 * Version: 3.3.4
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
define('E1_CALC_VERSION', '3.3.4');
define('E1_CALC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('E1_CALC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('E1_CALC_PLUGIN_FILE', __FILE__);
define('E1_CALC_CACHE_DIR', WP_CONTENT_DIR . '/cache/e1-calculator/');
define('E1_CALC_CACHE_URL', WP_CONTENT_URL . '/cache/e1-calculator/');

// Autoloader for plugin classes
spl_autoload_register(function ($class) {
    $prefix = 'E1_Calculator\\';
    $base_dir = E1_CALC_PLUGIN_DIR . 'includes/';
    
    // Check if class uses our namespace
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    // Get relative class name
    $relative_class = substr($class, $len);
    
    // Replace namespace separators with directory separators
    $file = $base_dir . 'class-' . str_replace('\\', '/', strtolower(str_replace('_', '-', $relative_class))) . '.php';
    
    // Require file if it exists
    if (file_exists($file)) {
        require $file;
    }
});

// Load main plugin class
require_once E1_CALC_PLUGIN_DIR . 'includes/class-plugin.php';

// Initialize plugin
function e1_calculator_init() {
    return E1_Calculator\Plugin::get_instance();
}

// Start the plugin
add_action('plugins_loaded', 'e1_calculator_init');

// Activation hook
register_activation_hook(__FILE__, array('E1_Calculator\\Plugin', 'activate'));

// Deactivation hook
register_deactivation_hook(__FILE__, array('E1_Calculator\\Plugin', 'deactivate'));

// Uninstall hook
register_uninstall_hook(__FILE__, array('E1_Calculator\\Plugin', 'uninstall'));