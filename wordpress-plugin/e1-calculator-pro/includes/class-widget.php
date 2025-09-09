<?php
namespace E1_Calculator;

/**
 * Widget rendering class
 */
class Widget {
    
    /**
     * Cache manager instance
     */
    private $cache_manager;
    
    /**
     * Widget instance counter
     */
    private static $instance_count = 0;
    
    /**
     * Constructor
     */
    public function __construct(Cache_Manager $cache_manager) {
        $this->cache_manager = $cache_manager;
    }
    
    /**
     * Render widget shortcode
     */
    public function render($atts = []) {
        // Parse attributes
        $atts = shortcode_atts([
            'id' => '',
            'class' => '',
            'height' => '',
            'theme' => '',
        ], $atts, 'e1_calculator');
        
        // Get cached bundle
        $bundle = $this->cache_manager->get_bundle();
        
        if (!$bundle || !isset($bundle['js']) || !isset($bundle['css'])) {
            return $this->render_error(__('Widget not available. Please sync from admin panel.', 'e1-calculator'));
        }
        
        // Generate unique ID if not provided
        self::$instance_count++;
        $widget_id = !empty($atts['id']) ? esc_attr($atts['id']) : 'e1-calculator-widget-' . self::$instance_count;
        
        // Build output
        $output = '';
        
        // Add inline CSS (only once)
        if (self::$instance_count === 1) {
            $output .= $this->render_styles($bundle['css']);
        }
        
        // Add container
        $container_classes = 'e1-calculator-widget-container';
        if (!empty($atts['class'])) {
            $container_classes .= ' ' . esc_attr($atts['class']);
        }
        
        $container_style = '';
        if (!empty($atts['height'])) {
            $container_style = 'style="min-height: ' . esc_attr($atts['height']) . 'px;"';
        }
        
        $output .= sprintf(
            '<div class="%s" %s><div id="%s"></div></div>',
            $container_classes,
            $container_style,
            $widget_id
        );
        
        // Add configuration and JavaScript
        $output .= $this->render_scripts($bundle, $widget_id, $atts);
        
        return $output;
    }
    
    /**
     * Render styles
     */
    private function render_styles($css) {
        // Add unique wrapper to prevent conflicts
        $wrapped_css = sprintf(
            '<style type="text/css" id="e1-calculator-widget-styles">%s</style>',
            $css
        );
        
        return $wrapped_css;
    }
    
    /**
     * Render scripts
     */
    private function render_scripts($bundle, $widget_id, $atts) {
        $output = '<script type="text/javascript">';
        
        // Add configuration
        if (!empty($bundle['config'])) {
            $config = $bundle['config'];
            
            // Add custom theme if provided
            if (!empty($atts['theme'])) {
                $config['theme'] = $atts['theme'];
            }
            
            // Add API endpoint for form submissions
            $config['apiUrl'] = home_url('/wp-json/e1-calculator/v1/submit');
            
            $output .= sprintf(
                'window.E1_WIDGET_CONFIG_%s = %s;',
                str_replace('-', '_', $widget_id),
                json_encode($config)
            );
        }
        
        // Add widget JavaScript
        $output .= "\n(function() {\n";
        $output .= $bundle['js'];
        $output .= "\n";
        
        // Initialize widget
        $output .= sprintf(
            "if (typeof E1Calculator !== 'undefined' && E1Calculator.init) {
                E1Calculator.init('%s', window.E1_WIDGET_CONFIG_%s || {});
            } else if (document.getElementById('%s')) {
                console.error('E1 Calculator: Widget initialization failed');
            }",
            $widget_id,
            str_replace('-', '_', $widget_id),
            $widget_id
        );
        
        $output .= "\n})();";
        $output .= '</script>';
        
        return $output;
    }
    
    /**
     * Render error message
     */
    private function render_error($message) {
        return sprintf(
            '<div class="e1-calculator-error" style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 4px; color: #c00;">
                <strong>%s</strong> %s
            </div>',
            __('E1 Calculator Error:', 'e1-calculator'),
            esc_html($message)
        );
    }
    
    /**
     * Register REST API endpoint for form submissions
     */
    public static function register_rest_routes() {
        register_rest_route('e1-calculator/v1', '/submit', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_form_submission'],
            'permission_callback' => '__return_true', // Public endpoint
            'args' => [
                'data' => [
                    'required' => true,
                    'type' => 'object',
                ],
            ],
        ]);
    }
    
    /**
     * Handle form submission from widget
     */
    public static function handle_form_submission($request) {
        $data = $request->get_param('data');
        
        // Validate data
        if (empty($data)) {
            return new \WP_Error('invalid_data', __('Invalid form data', 'e1-calculator'), ['status' => 400]);
        }
        
        // Hook for processing submissions
        $result = apply_filters('e1_calculator_process_submission', true, $data);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        // Store submission (optional)
        if (get_option('e1_calculator_store_submissions', false)) {
            self::store_submission($data);
        }
        
        // Send email notification (optional)
        if (get_option('e1_calculator_send_notifications', false)) {
            self::send_notification($data);
        }
        
        return [
            'success' => true,
            'message' => __('Form submitted successfully', 'e1-calculator'),
        ];
    }
    
    /**
     * Store form submission
     */
    private static function store_submission($data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'e1_calculator_submissions';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            // Create table
            $charset_collate = $wpdb->get_charset_collate();
            
            $sql = "CREATE TABLE $table_name (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                data longtext NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                ip_address varchar(45),
                user_agent text,
                PRIMARY KEY (id)
            ) $charset_collate;";
            
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
        }
        
        // Insert submission
        $wpdb->insert($table_name, [
            'data' => json_encode($data),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        ]);
    }
    
    /**
     * Send email notification
     */
    private static function send_notification($data) {
        $to = get_option('e1_calculator_notification_email', get_option('admin_email'));
        $subject = __('New E1 Calculator Submission', 'e1-calculator');
        
        $message = __('A new form submission has been received:', 'e1-calculator') . "\n\n";
        
        foreach ($data as $key => $value) {
            $message .= ucfirst(str_replace('_', ' ', $key)) . ': ' . $value . "\n";
        }
        
        $message .= "\n" . __('Submitted at:', 'e1-calculator') . ' ' . current_time('mysql');
        
        wp_mail($to, $subject, $message);
    }
}