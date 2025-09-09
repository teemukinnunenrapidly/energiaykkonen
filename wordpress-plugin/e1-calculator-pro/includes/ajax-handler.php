<?php
// e1-calculator-pro/includes/ajax-handler.php

// Register AJAX handlers
add_action('wp_ajax_e1_submit_form', 'handle_e1_widget_submission');
add_action('wp_ajax_nopriv_e1_submit_form', 'handle_e1_widget_submission');

function handle_e1_widget_submission() {
    // 1. Verify WordPress nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'e1_widget_nonce')) {
        wp_send_json_error([
            'message' => 'Security verification failed'
        ], 403);
        return;
    }
    
    // 2. Parse and validate data
    $form_data = json_decode(stripslashes($_POST['formData']), true);
    $calculations = json_decode(stripslashes($_POST['calculations']), true);
    $email_template = isset($_POST['emailTemplate']) ? sanitize_text_field($_POST['emailTemplate']) : 'default';
    
    if (empty($form_data) || empty($form_data['sahkoposti'])) {
        wp_send_json_error([
            'message' => 'Missing required form data'
        ], 400);
        return;
    }
    
    // 3. Get widget secret from WordPress options
    $widget_secret = get_option('e1_widget_secret_key');
    if (empty($widget_secret)) {
        error_log('E1 Widget: Secret key not configured');
        wp_send_json_error([
            'message' => 'Widget configuration error - Secret key not configured'
        ], 500);
        return;
    }
    
    // 4. Forward to Next.js API
    $base_url = get_option('e1_widget_api_url', 'https://your-app.vercel.app');
    // Remove trailing slash if present
    $base_url = rtrim($base_url, '/');
    $api_url = $base_url . '/api/widget-submit';
    
    $response = wp_remote_post($api_url, [
        'body' => json_encode([
            'formData' => $form_data,
            'calculations' => $calculations,
            'emailTemplate' => $email_template
        ]),
        'headers' => [
            'Content-Type' => 'application/json',
            'X-Widget-Secret' => $widget_secret
        ],
        'timeout' => 30,
        'sslverify' => true
    ]);
    
    // 5. Handle response
    if (is_wp_error($response)) {
        error_log('E1 Widget API Error: ' . $response->get_error_message());
        wp_send_json_error([
            'message' => 'Failed to submit form'
        ], 500);
        return;
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    $response_data = json_decode($response_body, true);
    
    if ($response_code !== 200 && $response_code !== 201) {
        wp_send_json_error([
            'message' => $response_data['error'] ?? 'Submission failed'
        ], $response_code);
        return;
    }
    
    // 6. Success response
    wp_send_json_success([
        'message' => 'Form submitted successfully',
        'leadId' => $response_data['leadId'] ?? null
    ]);
}

// Enqueue nonce for widget
add_action('wp_enqueue_scripts', 'e1_widget_enqueue_nonce');
function e1_widget_enqueue_nonce() {
    wp_localize_script('e1-widget-script', 'e1_widget_config', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('e1_widget_nonce'),
        'api_url' => get_option('e1_widget_api_url', 'https://your-app.vercel.app')
    ]);
}