<?php
namespace E1_Calculator;

/**
 * Security class for API key encryption and validation
 */
class Security {
    
    /**
     * Encryption method
     */
    const CIPHER = 'aes-256-cbc';
    
    /**
     * Get encryption key
     */
    private function get_encryption_key() {
        $key = defined('E1_CALC_ENCRYPTION_KEY') ? E1_CALC_ENCRYPTION_KEY : AUTH_KEY;
        return substr(hash('sha256', $key), 0, 32);
    }
    
    /**
     * Get initialization vector
     */
    private function get_iv() {
        $iv = defined('E1_CALC_ENCRYPTION_IV') ? E1_CALC_ENCRYPTION_IV : AUTH_SALT;
        return substr(hash('sha256', $iv), 0, 16);
    }
    
    /**
     * Encrypt API key
     */
    public function encrypt_api_key($api_key) {
        if (empty($api_key)) {
            return '';
        }
        
        if (!extension_loaded('openssl')) {
            // Fallback to base64 if OpenSSL not available
            return base64_encode($api_key);
        }
        
        $encrypted = openssl_encrypt(
            $api_key,
            self::CIPHER,
            $this->get_encryption_key(),
            0,
            $this->get_iv()
        );
        
        return $encrypted;
    }
    
    /**
     * Decrypt API key
     */
    public function decrypt_api_key($encrypted_key) {
        if (empty($encrypted_key)) {
            return '';
        }
        
        if (!extension_loaded('openssl')) {
            // Fallback from base64 if OpenSSL not available
            return base64_decode($encrypted_key);
        }
        
        $decrypted = openssl_decrypt(
            $encrypted_key,
            self::CIPHER,
            $this->get_encryption_key(),
            0,
            $this->get_iv()
        );
        
        return $decrypted;
    }
    
    /**
     * Save API key (encrypted)
     */
    public function save_api_key($api_key) {
        if (empty($api_key)) {
            delete_option('e1_calculator_api_key_encrypted');
            return true;
        }
        
        $encrypted = $this->encrypt_api_key($api_key);
        return update_option('e1_calculator_api_key_encrypted', $encrypted);
    }
    
    /**
     * Get API key (decrypted)
     */
    public function get_api_key() {
        $encrypted = get_option('e1_calculator_api_key_encrypted', '');
        
        if (empty($encrypted)) {
            // Try legacy unencrypted option
            $legacy = get_option('e1_calculator_api_key', '');
            if (!empty($legacy)) {
                // Migrate to encrypted storage
                $this->save_api_key($legacy);
                delete_option('e1_calculator_api_key');
                return $legacy;
            }
            return '';
        }
        
        return $this->decrypt_api_key($encrypted);
    }
    
    /**
     * Validate nonce
     */
    public function validate_nonce($nonce, $action = 'e1_calculator_ajax') {
        return wp_verify_nonce($nonce, $action);
    }
    
    /**
     * Create nonce
     */
    public function create_nonce($action = 'e1_calculator_ajax') {
        return wp_create_nonce($action);
    }
    
    /**
     * Check admin permissions
     */
    public function check_admin_permissions() {
        return current_user_can('manage_options');
    }
    
    /**
     * Sanitize API URL
     */
    public function sanitize_api_url($url) {
        // Trim whitespace
        $url = trim($url);
        
        // Don't use esc_url_raw as it may truncate - just validate
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            error_log('E1 Calculator: Invalid URL format: ' . $url);
            return '';
        }
        
        // Check for allowed protocols
        $parsed = parse_url($url);
        if (!in_array($parsed['scheme'] ?? '', ['http', 'https'])) {
            error_log('E1 Calculator: Invalid URL scheme: ' . ($parsed['scheme'] ?? 'none'));
            return '';
        }
        
        // Return the clean URL
        return $url;
    }
    
    /**
     * Sanitize API key
     */
    public function sanitize_api_key($key) {
        // Remove whitespace
        $key = trim($key);
        
        // Only allow alphanumeric, dash, underscore
        $key = preg_replace('/[^a-zA-Z0-9\-_]/', '', $key);
        
        return $key;
    }
    
    /**
     * Generate secure token
     */
    public function generate_token($length = 32) {
        if (function_exists('random_bytes')) {
            return bin2hex(random_bytes($length / 2));
        } elseif (function_exists('openssl_random_pseudo_bytes')) {
            return bin2hex(openssl_random_pseudo_bytes($length / 2));
        } else {
            // Fallback to less secure method
            return wp_generate_password($length, false, false);
        }
    }
    
    /**
     * Get security status
     */
    public function get_security_status() {
        return [
            'openssl_available' => extension_loaded('openssl'),
            'encryption_key_defined' => defined('E1_CALC_ENCRYPTION_KEY'),
            'api_key_encrypted' => !empty(get_option('e1_calculator_api_key_encrypted')),
            'legacy_key_exists' => !empty(get_option('e1_calculator_api_key')),
        ];
    }
}