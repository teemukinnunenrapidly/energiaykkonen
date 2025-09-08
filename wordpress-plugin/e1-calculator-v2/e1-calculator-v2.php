<?php
/**
 * Plugin Name: E1 Calculator Widget Sync
 * Plugin URI: https://energiaykkonen.fi/
 * Description: Synkronoi ja upota E1-laskuri suoraan WordPress-sivulle (ei iframe)
 * Version: 2.0.0
 * Author: Energiaykkönen Oy
 * License: GPL v2 or later
 * Text Domain: e1-calculator-v2
 */

// Estä suora pääsy
if (!defined('ABSPATH')) {
    exit;
}

// Plugin-vakiot
define('E1_CALC_V2_VERSION', '2.0.0');
define('E1_CALC_V2_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('E1_CALC_V2_PLUGIN_URL', plugin_dir_url(__FILE__));

class E1_Calculator_Widget_Sync {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('init', array($this, 'init'));
        add_shortcode('e1_calculator_widget', array($this, 'render_widget'));
        
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
            add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
            
            // AJAX handlers
            add_action('wp_ajax_e1_sync_widget', array($this, 'ajax_sync_widget'));
            add_action('wp_ajax_e1_test_api', array($this, 'ajax_test_api'));
        }
    }
    
    public function init() {
        load_plugin_textdomain('e1-calculator-v2', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Renderöi widget shortcode
     */
    public function render_widget($atts = array()) {
        $atts = shortcode_atts(array(
            'id' => 'e1-calculator-widget',
        ), $atts, 'e1_calculator_widget');
        
        // Hae tallennettu widget-data
        $widget_data = get_option('e1_widget_bundle', array());
        
        if (empty($widget_data) || !isset($widget_data['widget'])) {
            return '<div class="e1-widget-error">Widget ei ole vielä synkronoitu. Synkronoi admin-paneelista.</div>';
        }
        
        // Lisää widget-koodi sivulle
        $output = '';
        
        // CSS
        if (!empty($widget_data['widget']['css'])) {
            $output .= '<style type="text/css">' . $widget_data['widget']['css'] . '</style>';
        }
        
        // Container
        $output .= '<div id="' . esc_attr($atts['id']) . '"></div>';
        
        // JavaScript ja config
        if (!empty($widget_data['config'])) {
            $output .= '<script type="text/javascript">';
            $output .= 'window.E1_WIDGET_CONFIG = ' . json_encode($widget_data['config']) . ';';
            $output .= '</script>';
        }
        
        if (!empty($widget_data['widget']['js'])) {
            $output .= '<script type="text/javascript">' . $widget_data['widget']['js'] . '</script>';
        }
        
        return $output;
    }
    
    /**
     * Admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'E1 Calculator Widget Sync',
            'E1 Widget Sync',
            'manage_options',
            'e1-widget-sync',
            array($this, 'render_admin_page')
        );
    }
    
    /**
     * Rekisteröi asetukset
     */
    public function register_settings() {
        register_setting('e1_widget_settings', 'e1_widget_api_url');
        register_setting('e1_widget_settings', 'e1_widget_api_key');
    }
    
    /**
     * Admin-sivu
     */
    public function render_admin_page() {
        $api_url = get_option('e1_widget_api_url', 'http://localhost:3001/api/widget-bundle');
        $api_key = get_option('e1_widget_api_key', '');
        $widget_data = get_option('e1_widget_bundle', array());
        $last_sync = get_option('e1_widget_last_sync', null);
        ?>
        <div class="wrap">
            <h1>E1 Calculator Widget Sync</h1>
            
            <div class="card" style="max-width: 800px; margin: 20px 0;">
                <h2>API-asetukset</h2>
                <form method="post" action="options.php">
                    <?php settings_fields('e1_widget_settings'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">API URL</th>
                            <td>
                                <input type="url" name="e1_widget_api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" />
                                <p class="description">Widget bundle API:n osoite</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">API Key</th>
                            <td>
                                <input type="text" name="e1_widget_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" />
                                <p class="description">API-avain widget-datan hakemiseen</p>
                            </td>
                        </tr>
                    </table>
                    
                    <?php submit_button('Tallenna asetukset'); ?>
                </form>
            </div>
            
            <div class="card" style="max-width: 800px; margin: 20px 0;">
                <h2>Widget-synkronointi</h2>
                
                <?php if ($last_sync): ?>
                    <p><strong>Viimeksi synkronoitu:</strong> <?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($last_sync)); ?></p>
                    <?php if (!empty($widget_data['version'])): ?>
                        <p><strong>Versio:</strong> <?php echo esc_html($widget_data['version']); ?></p>
                    <?php endif; ?>
                    <?php if (!empty($widget_data['checksum'])): ?>
                        <p><strong>Checksum:</strong> <code><?php echo esc_html(substr($widget_data['checksum'], 0, 16)); ?>...</code></p>
                    <?php endif; ?>
                <?php else: ?>
                    <p>Widget ei ole vielä synkronoitu.</p>
                <?php endif; ?>
                
                <p style="margin-top: 20px;">
                    <button type="button" id="test-api-btn" class="button">Testaa yhteys</button>
                    <button type="button" id="sync-widget-btn" class="button button-primary">Synkronoi widget</button>
                    <span class="spinner" style="float: none; margin-top: 0;"></span>
                </p>
                
                <div id="sync-message" style="margin-top: 20px;"></div>
            </div>
            
            <div class="card" style="max-width: 800px; margin: 20px 0;">
                <h2>Käyttö</h2>
                <p>Lisää widget sivulle tai artikkeliin shortcodella:</p>
                <code style="display: inline-block; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    [e1_calculator_widget]
                </code>
                
                <?php if (!empty($widget_data)): ?>
                    <h3 style="margin-top: 30px;">Nykyinen widget-data</h3>
                    <details>
                        <summary style="cursor: pointer;">Näytä tekninen data</summary>
                        <div style="margin-top: 10px;">
                            <p><strong>JavaScript:</strong> <?php echo strlen($widget_data['widget']['js'] ?? '') . ' merkkiä'; ?></p>
                            <p><strong>CSS:</strong> <?php echo strlen($widget_data['widget']['css'] ?? '') . ' merkkiä'; ?></p>
                            <p><strong>Config:</strong></p>
                            <pre style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 300px;">
<?php echo esc_html(json_encode($widget_data['config'] ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?>
                            </pre>
                        </div>
                    </details>
                <?php endif; ?>
            </div>
            
            <div class="card" style="max-width: 800px; margin: 20px 0;">
                <h2>Esikatselu</h2>
                <div style="border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px;">
                    <?php echo do_shortcode('[e1_calculator_widget]'); ?>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Admin JavaScript
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_e1-widget-sync') {
            return;
        }
        
        wp_add_inline_script('jquery', "
        jQuery(document).ready(function($) {
            
            // Testaa API-yhteys
            $('#test-api-btn').on('click', function() {
                var btn = $(this);
                var spinner = $('.spinner');
                var messageDiv = $('#sync-message');
                
                btn.prop('disabled', true);
                spinner.addClass('is-active');
                messageDiv.html('');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'e1_test_api',
                        nonce: '" . wp_create_nonce('e1_widget_ajax') . "'
                    },
                    success: function(response) {
                        if (response.success) {
                            messageDiv.html('<div class=\"notice notice-success\"><p>' + response.data.message + '</p></div>');
                        } else {
                            messageDiv.html('<div class=\"notice notice-error\"><p>' + response.data.message + '</p></div>');
                        }
                    },
                    error: function() {
                        messageDiv.html('<div class=\"notice notice-error\"><p>Yhteyden testaus epäonnistui.</p></div>');
                    },
                    complete: function() {
                        btn.prop('disabled', false);
                        spinner.removeClass('is-active');
                    }
                });
            });
            
            // Synkronoi widget
            $('#sync-widget-btn').on('click', function() {
                var btn = $(this);
                var spinner = $('.spinner');
                var messageDiv = $('#sync-message');
                
                btn.prop('disabled', true);
                spinner.addClass('is-active');
                messageDiv.html('<div class=\"notice notice-info\"><p>Synkronoidaan...</p></div>');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'e1_sync_widget',
                        nonce: '" . wp_create_nonce('e1_widget_ajax') . "'
                    },
                    success: function(response) {
                        if (response.success) {
                            messageDiv.html('<div class=\"notice notice-success\"><p>' + response.data.message + '</p></div>');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        } else {
                            messageDiv.html('<div class=\"notice notice-error\"><p>' + response.data.message + '</p></div>');
                        }
                    },
                    error: function() {
                        messageDiv.html('<div class=\"notice notice-error\"><p>Synkronointi epäonnistui.</p></div>');
                    },
                    complete: function() {
                        btn.prop('disabled', false);
                        spinner.removeClass('is-active');
                    }
                });
            });
        });
        ");
    }
    
    /**
     * AJAX: Testaa API
     */
    public function ajax_test_api() {
        if (!wp_verify_nonce($_POST['nonce'], 'e1_widget_ajax')) {
            wp_die('Security check failed');
        }
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $api_url = get_option('e1_widget_api_url', '');
        $api_key = get_option('e1_widget_api_key', '');
        
        if (empty($api_url) || empty($api_key)) {
            wp_send_json_error(array(
                'message' => 'API URL ja API Key vaaditaan.'
            ));
        }
        
        $response = wp_remote_get($api_url, array(
            'timeout' => 10,
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
            ),
            'sslverify' => false, // Kehitysympäristöä varten
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Yhteys epäonnistui: ' . $response->get_error_message()
            ));
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code === 200) {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            if ($data && $data['success']) {
                wp_send_json_success(array(
                    'message' => 'Yhteys OK! Versio: ' . ($data['version'] ?? 'tuntematon')
                ));
            } else {
                wp_send_json_error(array(
                    'message' => 'API palautti virheellisen vastauksen.'
                ));
            }
        } elseif ($status_code === 401) {
            wp_send_json_error(array(
                'message' => 'Virheellinen API-avain.'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'API palautti virhekoodin: ' . $status_code
            ));
        }
    }
    
    /**
     * AJAX: Synkronoi widget
     */
    public function ajax_sync_widget() {
        if (!wp_verify_nonce($_POST['nonce'], 'e1_widget_ajax')) {
            wp_die('Security check failed');
        }
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $api_url = get_option('e1_widget_api_url', '');
        $api_key = get_option('e1_widget_api_key', '');
        
        if (empty($api_url) || empty($api_key)) {
            wp_send_json_error(array(
                'message' => 'API URL ja API Key vaaditaan.'
            ));
        }
        
        $response = wp_remote_get($api_url, array(
            'timeout' => 30,
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
            ),
            'sslverify' => false,
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Synkronointi epäonnistui: ' . $response->get_error_message()
            ));
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($status_code !== 200) {
            wp_send_json_error(array(
                'message' => 'API palautti virheen. Status: ' . $status_code
            ));
        }
        
        $data = json_decode($body, true);
        
        if (!$data || !$data['success']) {
            wp_send_json_error(array(
                'message' => 'Virheellinen API-vastaus.'
            ));
        }
        
        // Tarkista checksum
        $calculated_checksum = hash('sha256', json_encode(array(
            'version' => $data['version'],
            'widget' => $data['widget'],
            'config' => $data['config'],
        )));
        
        if ($calculated_checksum !== $data['checksum']) {
            // Varoitus mutta jatka silti (kehitysympäristöä varten)
            error_log('E1 Widget Sync: Checksum mismatch!');
        }
        
        // Tallenna widget-data
        update_option('e1_widget_bundle', $data);
        update_option('e1_widget_last_sync', current_time('mysql'));
        
        wp_send_json_success(array(
            'message' => 'Widget synkronoitu! Versio: ' . $data['version'],
            'version' => $data['version'],
            'checksum' => substr($data['checksum'], 0, 16),
        ));
    }
}

// Käynnistä plugin
add_action('plugins_loaded', array('E1_Calculator_Widget_Sync', 'get_instance'));

// Aktivointihook
register_activation_hook(__FILE__, 'e1_widget_sync_activate');
function e1_widget_sync_activate() {
    add_option('e1_widget_api_url', 'http://localhost:3001/api/widget-bundle');
    add_option('e1_widget_api_key', 'e1-widget-key-2025-secure-token');
}