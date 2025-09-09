<?php
namespace E1_Calculator;

/**
 * Admin interface class
 */
class Admin {
    
    /**
     * Dependencies
     */
    private $api_client;
    private $cache_manager;
    private $sync_manager;
    private $security;
    
    /**
     * Constructor
     */
    public function __construct(API_Client $api_client, Cache_Manager $cache_manager, Sync_Manager $sync_manager, Security $security) {
        $this->api_client = $api_client;
        $this->cache_manager = $cache_manager;
        $this->sync_manager = $sync_manager;
        $this->security = $security;
        
        $this->init();
    }
    
    /**
     * Initialize admin
     */
    private function init() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_filter('plugin_action_links_' . plugin_basename(E1_CALC_PLUGIN_FILE), [$this, 'add_action_links']);
        
        // Handle form submission directly before WordPress processes it
        add_action('admin_init', [$this, 'handle_settings_update'], 5);
        
        // AJAX handlers
        add_action('wp_ajax_e1_test_connection', [$this, 'ajax_test_connection']);
        add_action('wp_ajax_e1_restore_backup', [$this, 'ajax_restore_backup']);
        // Removed debug sync - use main sync widget only
    }
    
    /**
     * Handle settings update directly
     */
    public function handle_settings_update() {
        // Check if we're on our settings page and saving
        if (!isset($_POST['option_page']) || $_POST['option_page'] !== 'e1_calculator_settings') {
            return;
        }
        
        // Verify nonce
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'e1_calculator_settings-options')) {
            return;
        }
        
        // Save API URL directly if provided
        if (isset($_POST['e1_calculator_api_url'])) {
            $url = trim($_POST['e1_calculator_api_url']);
            update_option('e1_calculator_api_url', $url);
            error_log('E1 Calculator: Direct save API URL: ' . $url);
        }
        
        // Save API key directly if provided
        if (isset($_POST['e1_calculator_api_key']) && !empty($_POST['e1_calculator_api_key'])) {
            $key = trim($_POST['e1_calculator_api_key']);
            $this->security->save_api_key($key);
            error_log('E1 Calculator: Direct save API key: Key saved');
        }
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('E1 Calculator', 'e1-calculator'),
            __('E1 Calculator', 'e1-calculator'),
            'manage_options',
            'e1-calculator',
            [$this, 'render_main_page'],
            'dashicons-calculator',
            30
        );
        
        add_submenu_page(
            'e1-calculator',
            __('Settings', 'e1-calculator'),
            __('Settings', 'e1-calculator'),
            'manage_options',
            'e1-calculator',
            [$this, 'render_main_page']
        );
        
        add_submenu_page(
            'e1-calculator',
            __('Cache', 'e1-calculator'),
            __('Cache', 'e1-calculator'),
            'manage_options',
            'e1-calculator-cache',
            [$this, 'render_cache_page']
        );
        
        add_submenu_page(
            'e1-calculator',
            __('Help', 'e1-calculator'),
            __('Help', 'e1-calculator'),
            'manage_options',
            'e1-calculator-help',
            [$this, 'render_help_page']
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('e1_calculator_settings', 'e1_calculator_api_url', [
            'sanitize_callback' => [$this->security, 'sanitize_api_url'],
        ]);
        
        // Register API key setting with custom save handler
        register_setting('e1_calculator_settings', 'e1_calculator_api_key', [
            'sanitize_callback' => [$this, 'save_api_key_handler'],
        ]);
        
        register_setting('e1_calculator_settings', 'e1_calculator_auto_sync');
        register_setting('e1_calculator_settings', 'e1_calculator_cache_duration');
        register_setting('e1_calculator_settings', 'e1_calculator_store_submissions');
        register_setting('e1_calculator_settings', 'e1_calculator_send_notifications');
        register_setting('e1_calculator_settings', 'e1_calculator_notification_email', [
            'sanitize_callback' => 'sanitize_email',
        ]);
        
        // Widget submission settings
        register_setting('e1_calculator_settings', 'e1_widget_api_url', [
            'sanitize_callback' => 'esc_url_raw',
            'default' => 'https://your-app.vercel.app'
        ]);
        register_setting('e1_calculator_settings', 'e1_widget_secret_key', [
            'sanitize_callback' => 'sanitize_text_field'
        ]);
    }
    
    /**
     * Handle API key save
     */
    public function save_api_key_handler($value) {
        // Log for debugging
        error_log('E1 Calculator: Attempting to save API key: ' . (!empty($value) ? 'Key provided' : 'No key'));
        
        if (!empty($value)) {
            // Save encrypted API key
            $saved = $this->security->save_api_key($value);
            error_log('E1 Calculator: API key save result: ' . ($saved ? 'Success' : 'Failed'));
        }
        // Return empty string to avoid saving to the option directly
        return '';
    }
    
    /**
     * Render main settings page
     */
    public function render_main_page() {
        $api_status = $this->api_client->get_api_status();
        $cache_info = $this->cache_manager->get_cache_info();
        $sync_status = $this->sync_manager->get_sync_status();
        $sync_metadata = get_option('e1_calculator_sync_metadata', []);
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php if (isset($_GET['settings-updated'])): ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php _e('Settings saved.', 'e1-calculator'); ?></p>
                </div>
            <?php endif; ?>
            
            <!-- Status Box -->
            <div class="card" style="max-width: 800px;">
                <h2><?php _e('Status', 'e1-calculator'); ?></h2>
                
                <table class="form-table">
                    <tr>
                        <th><?php _e('API Connection', 'e1-calculator'); ?></th>
                        <td>
                            <?php if ($api_status['configured']): ?>
                                <span class="dashicons dashicons-yes-alt" style="color: #46b450;"></span>
                                <?php _e('Configured', 'e1-calculator'); ?>
                            <?php else: ?>
                                <span class="dashicons dashicons-warning" style="color: #ffb900;"></span>
                                <?php _e('Not configured', 'e1-calculator'); ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Cache Status', 'e1-calculator'); ?></th>
                        <td>
                            <?php if ($cache_info['valid']): ?>
                                <span class="dashicons dashicons-yes-alt" style="color: #46b450;"></span>
                                <?php _e('Valid', 'e1-calculator'); ?>
                                (<?php echo esc_html($cache_info['version']); ?>)
                            <?php elseif ($cache_info['exists']): ?>
                                <span class="dashicons dashicons-warning" style="color: #ffb900;"></span>
                                <?php _e('Expired', 'e1-calculator'); ?>
                            <?php else: ?>
                                <span class="dashicons dashicons-no-alt" style="color: #dc3232;"></span>
                                <?php _e('Empty', 'e1-calculator'); ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Widget Version', 'e1-calculator'); ?></th>
                        <td>
                            <?php if (!empty($sync_status['version']) && $sync_status['version'] !== 'unknown'): ?>
                                <strong><?php echo esc_html($sync_status['version']); ?></strong>
                            <?php else: ?>
                                <em><?php _e('Not synced yet', 'e1-calculator'); ?></em>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Last Sync', 'e1-calculator'); ?></th>
                        <td>
                            <?php if (!empty($sync_status['last_sync'])): ?>
                                <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($sync_status['last_sync']))); ?>
                                <?php if (!empty($sync_metadata['synced_by'])): ?>
                                    <br><small><?php printf(__('by %s', 'e1-calculator'), esc_html($sync_metadata['synced_by'])); ?></small>
                                <?php endif; ?>
                            <?php else: ?>
                                <?php _e('Never', 'e1-calculator'); ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('File Sizes', 'e1-calculator'); ?></th>
                        <td>
                            <?php if (!empty($sync_metadata['file_sizes'])): ?>
                                JS: <?php echo esc_html(size_format($sync_metadata['file_sizes']['js'])); ?> | 
                                CSS: <?php echo esc_html(size_format($sync_metadata['file_sizes']['css'])); ?> | 
                                Config: <?php echo esc_html(size_format($sync_metadata['file_sizes']['config'])); ?>
                            <?php else: ?>
                                <em><?php _e('No data available', 'e1-calculator'); ?></em>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Backup Status', 'e1-calculator'); ?></th>
                        <td>
                            <?php if ($sync_status['backup_count'] > 0): ?>
                                <span class="dashicons dashicons-yes-alt" style="color: #46b450;"></span>
                                <?php printf(_n('%d backup available', '%d backups available', $sync_status['backup_count'], 'e1-calculator'), $sync_status['backup_count']); ?>
                                <button type="button" id="restore-backup-btn" class="button button-small" style="margin-left: 10px;">
                                    <?php _e('🔄 Restore Latest Backup', 'e1-calculator'); ?>
                                </button>
                            <?php else: ?>
                                <span class="dashicons dashicons-warning" style="color: #ffb900;"></span>
                                <?php _e('No backups available', 'e1-calculator'); ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                </table>
                
                <p>
                    <button type="button" id="test-connection-btn" class="button">
                        <?php _e('Test Connection', 'e1-calculator'); ?>
                    </button>
                    <button type="button" id="sync-widget-btn" class="button button-primary">
                        <?php _e('Sync Widget', 'e1-calculator'); ?>
                    </button>
                    <button type="button" id="clear-cache-btn" class="button">
                        <?php _e('Clear Cache', 'e1-calculator'); ?>
                    </button>
                    <!-- Debug sync removed - use main sync button -->
                    <span class="spinner" style="float: none;"></span>
                </p>
                
                <div id="action-result" style="margin-top: 10px;"></div>
                
                <!-- Help for 403 errors -->
                <div class="notice notice-warning inline" style="margin-top: 20px;">
                    <p><strong><?php _e('Troubleshooting 403 Forbidden Errors:', 'e1-calculator'); ?></strong></p>
                    <p><?php _e('If widget CSS/JS files show 403 errors after syncing:', 'e1-calculator'); ?></p>
                    <ol style="margin-left: 20px;">
                        <li><?php _e('Deactivate and reactivate this plugin to regenerate cache permissions', 'e1-calculator'); ?></li>
                        <li><?php _e('Or delete this file via FTP/hosting panel:', 'e1-calculator'); ?> <code><?php echo E1_CALC_CACHE_DIR; ?>.htaccess</code></li>
                        <li><?php _e('Then click "Sync Widget" button again', 'e1-calculator'); ?></li>
                    </ol>
                </div>
            </div>
            
            <!-- Settings Form -->
            <form method="post" action="options.php">
                <?php settings_fields('e1_calculator_settings'); ?>
                
                <div class="card" style="max-width: 800px; margin-top: 20px;">
                    <h2><?php _e('API Settings', 'e1-calculator'); ?></h2>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="e1_calculator_api_url"><?php _e('API URL', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <input type="text" 
                                       id="e1_calculator_api_url"
                                       name="e1_calculator_api_url" 
                                       value="<?php echo esc_attr(get_option('e1_calculator_api_url')); ?>" 
                                       class="large-text" 
                                       placeholder="https://example.com/api/widget-bundle" />
                                <p class="description">
                                    <?php _e('Full widget bundle API endpoint URL (e.g. https://energiaykkonen-calculator.vercel.app/api/widget-bundle)', 'e1-calculator'); ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="e1_calculator_api_key"><?php _e('API Key', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <?php 
                                $api_key = $this->security->get_api_key();
                                $has_key = !empty($api_key);
                                ?>
                                <input type="password" 
                                       id="e1_calculator_api_key"
                                       name="e1_calculator_api_key" 
                                       value="<?php echo esc_attr($api_key); ?>" 
                                       class="regular-text" 
                                       placeholder="<?php echo $has_key ? __('API key is saved (hidden)', 'e1-calculator') : __('Enter your API key', 'e1-calculator'); ?>" />
                                <p class="description">
                                    <?php _e('API authentication key for widget bundle access', 'e1-calculator'); ?>
                                    <?php if ($has_key): ?>
                                        <br><span style="color: green;">✓ <?php _e('API key is currently saved', 'e1-calculator'); ?></span>
                                    <?php endif; ?>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div class="card" style="max-width: 800px; margin-top: 20px;">
                    <h2><?php _e('Widget Submission Settings', 'e1-calculator'); ?></h2>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="e1_widget_api_url"><?php _e('Widget Submit API URL', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <input type="url" 
                                       id="e1_widget_api_url"
                                       name="e1_widget_api_url" 
                                       value="<?php echo esc_attr(get_option('e1_widget_api_url', 'https://your-app.vercel.app')); ?>" 
                                       class="large-text" 
                                       placeholder="https://your-app.vercel.app" />
                                <p class="description">
                                    <?php _e('Your Next.js application URL for widget form submissions (e.g. https://energiaykkonen-calculator.vercel.app)', 'e1-calculator'); ?>
                                </p>
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
                                       class="regular-text" 
                                       placeholder="<?php _e('Enter shared secret key', 'e1-calculator'); ?>" />
                                <p class="description">
                                    <?php _e('Must match WIDGET_SECRET_KEY in your Next.js .env file. This ensures only your WordPress site can submit forms.', 'e1-calculator'); ?>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div class="card" style="max-width: 800px; margin-top: 20px;">
                    <h2><?php _e('Cache Settings', 'e1-calculator'); ?></h2>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="e1_calculator_cache_duration"><?php _e('Cache Duration', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <select id="e1_calculator_cache_duration" name="e1_calculator_cache_duration">
                                    <?php
                                    $current = get_option('e1_calculator_cache_duration', 86400);
                                    $options = [
                                        3600 => __('1 hour', 'e1-calculator'),
                                        21600 => __('6 hours', 'e1-calculator'),
                                        43200 => __('12 hours', 'e1-calculator'),
                                        86400 => __('24 hours', 'e1-calculator'),
                                        604800 => __('1 week', 'e1-calculator'),
                                    ];
                                    foreach ($options as $value => $label):
                                    ?>
                                        <option value="<?php echo $value; ?>" <?php selected($current, $value); ?>>
                                            <?php echo esc_html($label); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php _e('Auto Sync', 'e1-calculator'); ?></th>
                            <td>
                                <label>
                                    <input type="checkbox" 
                                           name="e1_calculator_auto_sync" 
                                           value="1" 
                                           <?php checked(get_option('e1_calculator_auto_sync'), 1); ?> />
                                    <?php _e('Automatically sync widget daily', 'e1-calculator'); ?>
                                </label>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div class="card" style="max-width: 800px; margin-top: 20px;">
                    <h2><?php _e('Form Submissions', 'e1-calculator'); ?></h2>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row"><?php _e('Store Submissions', 'e1-calculator'); ?></th>
                            <td>
                                <label>
                                    <input type="checkbox" 
                                           name="e1_calculator_store_submissions" 
                                           value="1" 
                                           <?php checked(get_option('e1_calculator_store_submissions'), 1); ?> />
                                    <?php _e('Store form submissions in database', 'e1-calculator'); ?>
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php _e('Email Notifications', 'e1-calculator'); ?></th>
                            <td>
                                <label>
                                    <input type="checkbox" 
                                           name="e1_calculator_send_notifications" 
                                           value="1" 
                                           <?php checked(get_option('e1_calculator_send_notifications'), 1); ?> />
                                    <?php _e('Send email notification on submission', 'e1-calculator'); ?>
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="e1_calculator_notification_email"><?php _e('Notification Email', 'e1-calculator'); ?></label>
                            </th>
                            <td>
                                <input type="email" 
                                       id="e1_calculator_notification_email"
                                       name="e1_calculator_notification_email" 
                                       value="<?php echo esc_attr(get_option('e1_calculator_notification_email', get_option('admin_email'))); ?>" 
                                       class="regular-text" />
                            </td>
                        </tr>
                    </table>
                </div>
                
                <?php submit_button(); ?>
            </form>
            
            <!-- Usage -->
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2><?php _e('Usage', 'e1-calculator'); ?></h2>
                <p><?php _e('Add the calculator to any page or post using the shortcode:', 'e1-calculator'); ?></p>
                <code style="display: inline-block; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    [e1_calculator]
                </code>
                
                <h3><?php _e('Shortcode Parameters', 'e1-calculator'); ?></h3>
                <ul>
                    <li><code>[e1_calculator id="my-calc"]</code> - <?php _e('Custom container ID', 'e1-calculator'); ?></li>
                    <li><code>[e1_calculator class="custom-class"]</code> - <?php _e('Additional CSS classes', 'e1-calculator'); ?></li>
                    <li><code>[e1_calculator height="800"]</code> - <?php _e('Minimum height in pixels', 'e1-calculator'); ?></li>
                </ul>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render cache page
     */
    public function render_cache_page() {
        $cache_info = $this->cache_manager->get_cache_info();
        $cache_dir = $this->cache_manager->get_cache_dir();
        ?>
        <div class="wrap">
            <h1><?php _e('Cache Management', 'e1-calculator'); ?></h1>
            
            <div class="card">
                <h2><?php _e('Cache Information', 'e1-calculator'); ?></h2>
                
                <table class="form-table">
                    <tr>
                        <th><?php _e('Cache Directory', 'e1-calculator'); ?></th>
                        <td><code><?php echo esc_html($cache_dir); ?></code></td>
                    </tr>
                    <tr>
                        <th><?php _e('Cache Status', 'e1-calculator'); ?></th>
                        <td><?php echo $cache_info['valid'] ? __('Valid', 'e1-calculator') : __('Invalid/Expired', 'e1-calculator'); ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('Cache Size', 'e1-calculator'); ?></th>
                        <td><?php echo size_format($cache_info['size']); ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('Cached Version', 'e1-calculator'); ?></th>
                        <td><?php echo esc_html($cache_info['version'] ?? __('N/A', 'e1-calculator')); ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('Cached At', 'e1-calculator'); ?></th>
                        <td>
                            <?php 
                            if ($cache_info['cached_at']) {
                                echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($cache_info['cached_at'])));
                            } else {
                                echo __('N/A', 'e1-calculator');
                            }
                            ?>
                        </td>
                    </tr>
                </table>
                
                <p>
                    <button type="button" id="clear-cache-btn" class="button button-primary">
                        <?php _e('Clear Cache', 'e1-calculator'); ?>
                    </button>
                </p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render help page
     */
    public function render_help_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Help', 'e1-calculator'); ?></h1>
            
            <div class="card">
                <h2><?php _e('Getting Started', 'e1-calculator'); ?></h2>
                <ol>
                    <li><?php _e('Configure API URL and API Key in Settings', 'e1-calculator'); ?></li>
                    <li><?php _e('Click "Sync Widget" to download the latest widget bundle', 'e1-calculator'); ?></li>
                    <li><?php _e('Add [e1_calculator] shortcode to any page or post', 'e1-calculator'); ?></li>
                </ol>
            </div>
            
            <div class="card">
                <h2><?php _e('Troubleshooting', 'e1-calculator'); ?></h2>
                <ul>
                    <li><?php _e('If widget doesn\'t appear, check that sync was successful', 'e1-calculator'); ?></li>
                    <li><?php _e('Clear cache if widget appears outdated', 'e1-calculator'); ?></li>
                    <li><?php _e('Check API connection if sync fails', 'e1-calculator'); ?></li>
                </ul>
            </div>
            
            <div class="card">
                <h2><?php _e('Support', 'e1-calculator'); ?></h2>
                <p><?php _e('For support, please contact:', 'e1-calculator'); ?> <a href="mailto:support@energiaykkonen.fi">support@energiaykkonen.fi</a></p>
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
                'testing' => __('Testing connection...', 'e1-calculator'),
                'syncing' => __('Syncing widget...', 'e1-calculator'),
                'clearing' => __('Clearing cache...', 'e1-calculator'),
                'success' => __('Success!', 'e1-calculator'),
                'error' => __('Error:', 'e1-calculator'),
            ],
        ]);
    }
    
    /**
     * AJAX: Test connection
     */
    public function ajax_test_connection() {
        if (!$this->security->validate_nonce($_POST['nonce'] ?? '')) {
            wp_send_json_error(['message' => __('Security check failed', 'e1-calculator')]);
        }
        
        if (!$this->security->check_admin_permissions()) {
            wp_send_json_error(['message' => __('Unauthorized', 'e1-calculator')]);
        }
        
        $result = $this->api_client->test_connection();
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX: Restore backup
     */
    public function ajax_restore_backup() {
        if (!$this->security->validate_nonce($_POST['nonce'] ?? '')) {
            wp_send_json_error(['message' => __('Security check failed', 'e1-calculator')]);
        }
        
        if (!$this->security->check_admin_permissions()) {
            wp_send_json_error(['message' => __('Unauthorized', 'e1-calculator')]);
        }
        
        try {
            // Get Sync_Manager and call restore method
            // Note: We need to add a public restore_backup method to Sync_Manager
            $backup_dir = WP_CONTENT_DIR . '/cache/e1-calculator-backup/';
            
            // Find latest backup
            $backups = glob($backup_dir . '*', GLOB_ONLYDIR);
            if (empty($backups)) {
                throw new \Exception(__('No backups available to restore', 'e1-calculator'));
            }
            
            rsort($backups); // Latest first
            $latest_backup = $backups[0];
            $backup_name = basename($latest_backup);
            
            // Restore files
            $files = glob($latest_backup . '/*');
            $restored = 0;
            
            foreach ($files as $file) {
                $filename = basename($file);
                $dest = E1_CALC_CACHE_DIR . $filename;
                if (copy($file, $dest)) {
                    $restored++;
                }
            }
            
            if ($restored === 0) {
                throw new \Exception(__('Failed to restore any files from backup', 'e1-calculator'));
            }
            
            // Log the restore
            error_log("E1 Calculator: Manual backup restore completed. Restored $restored files from: $backup_name");
            
            wp_send_json_success([
                'message' => sprintf(__('Backup restored successfully (%d files from %s)', 'e1-calculator'), $restored, $backup_name),
                'restored_files' => $restored,
                'backup_name' => $backup_name
            ]);
            
        } catch (\Exception $e) {
            error_log('E1 Calculator backup restore failed: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
            'message' => implode("\n", $debug_info)
        ]);
    }
    
    /**
     * Add plugin action links
     */
    public function add_action_links($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=e1-calculator') . '">' . __('Settings', 'e1-calculator') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
}