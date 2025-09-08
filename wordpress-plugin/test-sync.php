<?php
/**
 * E1 Calculator Sync Diagnostic Tool
 * Upload this to WordPress root and run to diagnose sync issues
 */

// Load WordPress
require_once('wp-load.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('You must be logged in as an administrator to run this diagnostic.');
}

echo "<h1>E1 Calculator Sync Diagnostic</h1>";
echo "<pre>";

// 1. Check API configuration
echo "=== API Configuration ===\n";
$api_url = get_option('e1_calculator_api_url');
$api_key_encrypted = get_option('e1_calculator_api_key_encrypted');
echo "API URL: " . ($api_url ?: 'NOT SET') . "\n";
echo "API Key: " . ($api_key_encrypted ? 'SET (encrypted)' : 'NOT SET') . "\n\n";

// 2. Test API connection directly
echo "=== Testing API Connection ===\n";
if ($api_url && $api_key_encrypted) {
    // Decrypt API key
    $api_key = base64_decode($api_key_encrypted);
    
    echo "Testing: $api_url\n";
    
    $args = array(
        'timeout' => 30,
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Accept' => 'application/json',
        ),
        'sslverify' => false // Disable SSL verify for testing
    );
    
    $response = wp_remote_get($api_url, $args);
    
    if (is_wp_error($response)) {
        echo "ERROR: " . $response->get_error_message() . "\n";
    } else {
        $status = wp_remote_retrieve_response_code($response);
        echo "HTTP Status: $status\n";
        
        if ($status === 200) {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            if ($data && isset($data['success'])) {
                echo "✅ API Response: SUCCESS\n";
                echo "Version: " . ($data['version'] ?? 'unknown') . "\n";
                echo "Widget JS size: " . strlen($data['widget']['js'] ?? '') . " bytes\n";
                echo "Widget CSS size: " . strlen($data['widget']['css'] ?? '') . " bytes\n";
            } else {
                echo "❌ Invalid API response format\n";
            }
        } else {
            echo "❌ API returned error status: $status\n";
            $body = wp_remote_retrieve_body($response);
            echo "Response: " . substr($body, 0, 500) . "\n";
        }
    }
} else {
    echo "❌ API configuration missing\n";
}

echo "\n=== Directory Permissions ===\n";
// 3. Check cache directory
$cache_dir = WP_CONTENT_DIR . '/cache/e1-calculator/';
echo "Cache directory: $cache_dir\n";

if (!file_exists($cache_dir)) {
    echo "❌ Cache directory does not exist\n";
    echo "Attempting to create...\n";
    if (wp_mkdir_p($cache_dir)) {
        echo "✅ Created successfully\n";
    } else {
        echo "❌ Failed to create directory\n";
    }
} else {
    echo "✅ Cache directory exists\n";
    echo "Writable: " . (is_writable($cache_dir) ? '✅ YES' : '❌ NO') . "\n";
    echo "Permissions: " . substr(sprintf('%o', fileperms($cache_dir)), -4) . "\n";
}

// Check backup directory
$backup_dir = WP_CONTENT_DIR . '/cache/e1-calculator-backup/';
echo "\nBackup directory: $backup_dir\n";
if (!file_exists($backup_dir)) {
    echo "❌ Backup directory does not exist\n";
    if (wp_mkdir_p($backup_dir)) {
        echo "✅ Created successfully\n";
    }
} else {
    echo "✅ Backup directory exists\n";
    echo "Writable: " . (is_writable($backup_dir) ? '✅ YES' : '❌ NO') . "\n";
}

echo "\n=== PHP Configuration ===\n";
echo "Memory limit: " . ini_get('memory_limit') . "\n";
echo "Max execution time: " . ini_get('max_execution_time') . " seconds\n";
echo "OpenSSL: " . (extension_loaded('openssl') ? '✅ Enabled' : '❌ Disabled') . "\n";
echo "cURL: " . (function_exists('curl_init') ? '✅ Enabled' : '❌ Disabled') . "\n";

echo "\n=== WordPress Configuration ===\n";
echo "WP_DEBUG: " . (defined('WP_DEBUG') && WP_DEBUG ? 'true' : 'false') . "\n";
echo "WP_DEBUG_LOG: " . (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG ? 'true' : 'false') . "\n";
echo "Site URL: " . get_site_url() . "\n";
echo "WordPress version: " . get_bloginfo('version') . "\n";
echo "PHP version: " . PHP_VERSION . "\n";

// 4. Try to perform a simple sync test
echo "\n=== Attempting Manual Sync ===\n";
if ($api_url && $api_key) {
    try {
        // Fetch the bundle
        $response = wp_remote_get($api_url, $args);
        
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            if ($data && isset($data['widget'])) {
                // Try to write test files
                $test_file = $cache_dir . 'test-write.txt';
                if (file_put_contents($test_file, 'Test write at ' . date('Y-m-d H:i:s'))) {
                    echo "✅ Can write to cache directory\n";
                    unlink($test_file);
                    
                    // Try to save actual widget files
                    $js_file = $cache_dir . 'widget.js';
                    $css_file = $cache_dir . 'widget.css';
                    $config_file = $cache_dir . 'config.json';
                    
                    $js_written = file_put_contents($js_file, $data['widget']['js'] ?? '');
                    $css_written = file_put_contents($css_file, $data['widget']['css'] ?? '');
                    $config_written = file_put_contents($config_file, json_encode($data['config'] ?? []));
                    
                    if ($js_written && $css_written && $config_written) {
                        echo "✅ Successfully wrote widget files to cache\n";
                        echo "  - widget.js: " . number_format($js_written) . " bytes\n";
                        echo "  - widget.css: " . number_format($css_written) . " bytes\n";
                        echo "  - config.json: " . number_format($config_written) . " bytes\n";
                        
                        // Update sync metadata
                        update_option('e1_calculator_sync_metadata', [
                            'version' => $data['version'] ?? 'unknown',
                            'last_sync' => current_time('mysql'),
                            'synced_by' => wp_get_current_user()->user_login,
                            'file_sizes' => [
                                'js' => $js_written,
                                'css' => $css_written,
                                'config' => $config_written
                            ]
                        ]);
                        
                        echo "\n🎉 SYNC SUCCESSFUL! Widget files are ready.\n";
                    } else {
                        echo "❌ Failed to write widget files\n";
                    }
                } else {
                    echo "❌ Cannot write to cache directory\n";
                    echo "Please check directory permissions\n";
                }
            }
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
}

echo "\n=== Recent PHP Errors ===\n";
$error_log = ini_get('error_log');
if ($error_log && file_exists($error_log)) {
    $errors = file_get_contents($error_log);
    $lines = explode("\n", $errors);
    $recent = array_slice($lines, -10);
    foreach ($recent as $line) {
        if (strpos($line, 'E1') !== false || strpos($line, 'calculator') !== false) {
            echo $line . "\n";
        }
    }
} else {
    echo "Error log not accessible\n";
}

echo "</pre>";
echo "<hr>";
echo "<p><strong>⚠️ Delete this test-sync.php file after testing for security!</strong></p>";
echo "<p><a href='/wp-admin/admin.php?page=e1-calculator'>← Back to E1 Calculator Settings</a></p>";
?>