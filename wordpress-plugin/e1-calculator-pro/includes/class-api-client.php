<?php
namespace E1_Calculator;

/**
 * API Client for communicating with Vercel backend
 */
class API_Client {
    
    /**
     * Security instance
     */
    private $security;
    
    /**
     * Constructor
     */
    public function __construct(Security $security) {
        $this->security = $security;
    }
    
    /**
     * Fetch widget bundle from API
     */
    public function fetch_widget_bundle() {
        $api_url = get_option('e1_calculator_api_url', '');
        $api_key = $this->security->get_api_key();
        
        if (empty($api_url) || empty($api_key)) {
            throw new \Exception(__('API URL and key are required', 'e1-calculator'));
        }
        
        // Make API request
        $response = wp_remote_get($api_url, [
            'timeout' => 30,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Accept' => 'application/json',
            ],
            'sslverify' => apply_filters('e1_calculator_ssl_verify', true),
        ]);
        
        if (is_wp_error($response)) {
            throw new \Exception($response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code !== 200) {
            $body = wp_remote_retrieve_body($response);
            $error_data = json_decode($body, true);
            $error_message = $error_data['error'] ?? __('API request failed', 'e1-calculator');
            throw new \Exception($error_message . ' (HTTP ' . $status_code . ')');
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data || !isset($data['success']) || !$data['success']) {
            throw new \Exception(__('Invalid API response', 'e1-calculator'));
        }
        
        // Validate checksum - critical for data integrity
        if (isset($data['checksum'])) {
            $calculated_checksum = hash('sha256', json_encode([
                'version' => $data['version'] ?? '',
                'widget' => $data['widget'] ?? [],
                'config' => $data['config'] ?? [],
            ]));
            
            if ($calculated_checksum !== $data['checksum']) {
                error_log(sprintf(
                    'E1 Calculator: Checksum validation failed. Expected: %s, Got: %s', 
                    $data['checksum'], 
                    $calculated_checksum
                ));
                throw new \Exception(__('Data integrity check failed - bundle rejected for security', 'e1-calculator'));
            }
        } else {
            // Require checksum for security
            throw new \Exception(__('Missing checksum - bundle rejected for security', 'e1-calculator'));
        }
        
        return $data;
    }
    
    /**
     * Test API connection
     */
    public function test_connection() {
        $api_url = get_option('e1_calculator_api_url', '');
        $api_key = $this->security->get_api_key();
        
        if (empty($api_url) || empty($api_key)) {
            return [
                'success' => false,
                'message' => __('API URL and key are required', 'e1-calculator')
            ];
        }
        
        $response = wp_remote_head($api_url, [
            'timeout' => 10,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
            ],
            'sslverify' => apply_filters('e1_calculator_ssl_verify', true),
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message()
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code === 200 || $status_code === 204) {
            return [
                'success' => true,
                'message' => __('Connection successful', 'e1-calculator')
            ];
        } else {
            return [
                'success' => false,
                'message' => sprintf(__('Connection failed (HTTP %d)', 'e1-calculator'), $status_code)
            ];
        }
    }
    
    /**
     * Get API status
     */
    public function get_api_status() {
        $api_url = get_option('e1_calculator_api_url', '');
        $api_key = $this->security->get_api_key();
        
        return [
            'configured' => !empty($api_url) && !empty($api_key),
            'url' => $api_url,
            'has_key' => !empty($api_key),
        ];
    }
}