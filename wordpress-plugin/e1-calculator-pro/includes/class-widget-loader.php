<?php
namespace E1_Calculator;

/**
 * Korjattu Widget Loader - Käyttää wp_enqueue oikein
 * 
 * Parannukset:
 * - Käyttää wp_enqueue_script/style WordPress best practices
 * - Versiointi cache bustingiin metadata.json:sta
 * - jQuery noConflict yhteensopivuus
 * - Tukee useita widgettejä samalla sivulla
 * - Lataa resurssit vain kerran
 * - Scoped CSS estää konfliktit
 */
class Widget_Loader {
    
    private static $instance_count = 0;
    private static $widget_instances = [];
    private $cache_manager;
    
    /**
     * Constructor
     */
    public function __construct(Cache_Manager $cache_manager) {
        $this->cache_manager = $cache_manager;
        
        // Rekisteröi shortcode
        add_shortcode('e1_calculator', [$this, 'render_shortcode']);
        
        // Rekisteröi skriptit ja tyylit (EI lataa vielä)
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        
        // Lisää widget config footeriin
        add_action('wp_footer', [$this, 'output_widget_configs'], 20);
        
        // REST API endpoint
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }
    
    /**
     * Rekisteröi widget-resurssit (EI lataa vielä)
     */
    public function register_assets() {
        // Hae versio ja cache info
        $cache_info = $this->cache_manager->get_cache_info();
        $version = $this->get_widget_version();
        
        // Tarkista että cache-tiedostot ovat olemassa
        if (!$this->verify_cache_files()) {
            return;
        }
        
        // Cache URL - käytä määriteltyä vakiota
        $cache_url = E1_CALC_CACHE_URL;
        
        // REKISTERÖI CSS (ei lataa vielä)
        wp_register_style(
            'e1-calculator-widget',
            $cache_url . 'widget.css',
            [], // Ei riippuvuuksia
            $version // Versio cache bustingiin
        );
        
        // REKISTERÖI JavaScript (ei lataa vielä)
        wp_register_script(
            'e1-calculator-widget',
            $cache_url . 'widget.js',
            [], // Vanilla JS, ei jQuery-riippuvuutta
            $version,
            true // Lataa footerissa
        );
        
        // Lisää lokalisointi data
        wp_localize_script('e1-calculator-widget', 'e1CalculatorData', [
            'apiUrl' => home_url('/wp-json/e1-calculator/v1/'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('e1_calculator_public'),
            'locale' => get_locale(),
        ]);
    }
    
    /**
     * Shortcode handler
     */
    public function render_shortcode($atts) {
        // Oletusarvot
        $atts = shortcode_atts([
            'type' => 'default',
            'theme' => 'light',
            'class' => '',
            'height' => '',
            'id' => '',
        ], $atts, 'e1_calculator');
        
        // Luo uniikki ID tälle instanssille
        self::$instance_count++;
        $widget_id = !empty($atts['id']) ? esc_attr($atts['id']) : 'e1-calculator-widget-' . self::$instance_count;
        
        // Tallenna instanssin config myöhempää käyttöä varten
        self::$widget_instances[$widget_id] = [
            'type' => $atts['type'],
            'theme' => $atts['theme'],
            'api_url' => get_option('e1_calculator_api_url', ''),
        ];
        
        // LATAA RESURSSIT (vain kerran vaikka useita widgettejä)
        if (self::$instance_count === 1) {
            wp_enqueue_style('e1-calculator-widget');
            wp_enqueue_script('e1-calculator-widget');
        }
        
        // Määritä container style
        $container_style = '';
        if (!empty($atts['height'])) {
            $container_style = sprintf('style="min-height: %spx;"', esc_attr($atts['height']));
        }
        
        // Palauta container HTML
        return sprintf(
            '<div id="%s" class="e1-calculator-widget-container %s" data-type="%s" data-theme="%s" %s>
                <div class="e1-calculator-loading">
                    <div class="e1-loading-spinner"></div>
                    <p>%s</p>
                </div>
                <noscript>
                    <p style="background: #fffbcc; padding: 10px; border: 1px solid #e6db55;">
                        %s
                    </p>
                </noscript>
            </div>',
            esc_attr($widget_id),
            esc_attr($atts['class']),
            esc_attr($atts['type']),
            esc_attr($atts['theme']),
            $container_style,
            __('Ladataan laskuria...', 'e1-calculator'),
            __('Tämä laskuri vaatii JavaScriptin toimiakseen. Ole hyvä ja ota JavaScript käyttöön selaimessasi.', 'e1-calculator')
        );
    }
    
    /**
     * Tulosta widget-konfiguraatiot footeriin
     */
    public function output_widget_configs() {
        // Jos ei widgettejä sivulla, älä tee mitään
        if (empty(self::$widget_instances)) {
            return;
        }
        
        // Lataa config
        $bundle = $this->cache_manager->get_bundle();
        $config = $bundle['config'] ?? [];
        
        ?>
        <script id="e1-calculator-init">
        (function() {
            'use strict';
            
            // Odota että widget library on ladattu
            function waitForWidget() {
                if (typeof window.E1Widget === 'undefined') {
                    // Yritä uudelleen 100ms päästä
                    setTimeout(waitForWidget, 100);
                    return;
                }
                
                // Widget configurations
                var instances = <?php echo json_encode(self::$widget_instances, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
                var globalConfig = <?php echo json_encode($config, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
                
                // Alusta jokainen widget
                Object.keys(instances).forEach(function(widgetId) {
                    var instanceConfig = instances[widgetId];
                    
                    // Yhdistä global config ja instance config
                    var fullConfig = Object.assign({}, globalConfig, instanceConfig, {
                        containerId: widgetId,
                        apiEndpoint: window.e1CalculatorData ? window.e1CalculatorData.apiUrl : '',
                        nonce: window.e1CalculatorData ? window.e1CalculatorData.nonce : '',
                    });
                    
                    // Alusta widget kun DOM on valmis
                    function initWidget() {
                        var container = document.getElementById(widgetId);
                        if (!container) {
                            console.warn('E1 Widget: Container not found:', widgetId);
                            return;
                        }
                        
                        try {
                            // Poista latausviesti
                            var loadingEl = container.querySelector('.e1-calculator-loading');
                            if (loadingEl) {
                                loadingEl.style.display = 'none';
                            }
                            
                            // Alusta widget
                            if (window.E1Widget && typeof window.E1Widget.init === 'function') {
                                window.E1Widget.init(widgetId, fullConfig);
                                console.log('E1 Widget initialized:', widgetId);
                            } else {
                                throw new Error('E1Widget.init is not a function');
                            }
                        } catch (error) {
                            console.error('E1 Widget initialization error:', error);
                            container.innerHTML = '<div class="e1-widget-error" style="padding: 20px; background: #fee; border: 1px solid #fcc; color: #c00;">' +
                                '<strong>Widget-virhe:</strong> ' + error.message + 
                                '</div>';
                        }
                    }
                    
                    // Tarkista onko DOM valmis
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', initWidget);
                    } else {
                        // DOM on jo valmis, mutta odota seuraava tick
                        setTimeout(initWidget, 0);
                    }
                });
            }
            
            // Aloita odottaminen
            waitForWidget();
            
            // jQuery noConflict -yhteensopivuus
            if (typeof jQuery !== 'undefined') {
                jQuery(function($) {
                    // Widget on alustettu vanilla JS:llä
                    // Lisää jQuery-pohjaisia lisätoimintoja tarvittaessa
                    
                    // Esim. smooth scroll tuloksiin
                    $(document).on('e1-calculator:results', function(event, data) {
                        var $container = $('#' + data.widgetId);
                        if ($container.length) {
                            $('html, body').animate({
                                scrollTop: $container.offset().top - 100
                            }, 500);
                        }
                    });
                });
            }
        })();
        </script>
        <?php
    }
    
    /**
     * Hae widget versio cache bustingiin
     */
    private function get_widget_version() {
        $meta = get_option('e1_calculator_sync_metadata', []);
        
        if (!empty($meta['version'])) {
            // Käytä synkattu versiota
            return $meta['version'];
        }
        
        // Fallback: käytä tiedoston muokkausaikaa
        $js_file = E1_CALC_CACHE_DIR . 'widget.js';
        if (file_exists($js_file)) {
            return filemtime($js_file);
        }
        
        // Viimeinen fallback
        return E1_CALC_VERSION;
    }
    
    /**
     * Varmista että cache-tiedostot ovat olemassa
     */
    private function verify_cache_files() {
        $required_files = ['widget.js', 'widget.css', 'config.json'];
        
        foreach ($required_files as $file) {
            if (!file_exists(E1_CALC_CACHE_DIR . $file)) {
                $this->show_admin_notice($file);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Näytä admin-ilmoitus puuttuvista tiedostoista
     */
    private function show_admin_notice($missing_file) {
        if (current_user_can('manage_options')) {
            add_action('wp_footer', function() use ($missing_file) {
                ?>
                <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #dc3232; color: white; padding: 15px; text-align: center; z-index: 9999;">
                    <strong>E1 Calculator:</strong> Widget ei ole synkronoitu (<?php echo esc_html($missing_file); ?> puuttuu).
                    <a href="<?php echo admin_url('admin.php?page=e1-calculator'); ?>" style="color: white; text-decoration: underline; margin-left: 10px;">
                        → Synkronoi nyt
                    </a>
                </div>
                <?php
            });
        }
    }
    
    /**
     * Rekisteröi REST API endpoint
     */
    public function register_rest_routes() {
        register_rest_route('e1-calculator/v1', '/submit', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_form_submission'],
            'permission_callback' => '__return_true', // Public endpoint
            'args' => [
                'data' => [
                    'required' => true,
                    'type' => 'object',
                ],
                'widget_id' => [
                    'required' => false,
                    'type' => 'string',
                ],
            ],
        ]);
    }
    
    /**
     * Käsittele lomakkeen lähetys
     */
    public function handle_form_submission($request) {
        $data = $request->get_param('data');
        $widget_id = $request->get_param('widget_id');
        
        // Validoi nonce
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'e1_calculator_public')) {
            return new \WP_Error('invalid_nonce', __('Turvallisuustarkistus epäonnistui', 'e1-calculator'), ['status' => 403]);
        }
        
        // Hook prosessointiin
        $result = apply_filters('e1_calculator_process_submission', true, $data, $widget_id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        // Tallenna jos asetus päällä
        if (get_option('e1_calculator_store_submissions', false)) {
            $this->store_submission($data, $widget_id);
        }
        
        // Lähetä sähköposti jos asetus päällä
        if (get_option('e1_calculator_send_notifications', false)) {
            $this->send_notification($data, $widget_id);
        }
        
        return [
            'success' => true,
            'message' => __('Lomake lähetetty onnistuneesti', 'e1-calculator'),
            'widget_id' => $widget_id,
        ];
    }
    
    /**
     * Tallenna lomakedata
     */
    private function store_submission($data, $widget_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'e1_calculator_submissions';
        
        $wpdb->insert($table_name, [
            'widget_id' => $widget_id,
            'data' => json_encode($data),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'created_at' => current_time('mysql'),
        ]);
    }
    
    /**
     * Lähetä sähköposti-ilmoitus
     */
    private function send_notification($data, $widget_id) {
        $to = get_option('e1_calculator_notification_email', get_option('admin_email'));
        $subject = sprintf(__('Uusi E1 Calculator lomake (#%s)', 'e1-calculator'), $widget_id);
        
        $message = __('Uusi lomake on vastaanotettu:', 'e1-calculator') . "\n\n";
        $message .= sprintf(__('Widget ID: %s', 'e1-calculator'), $widget_id) . "\n\n";
        
        foreach ($data as $key => $value) {
            $label = ucfirst(str_replace(['_', '-'], ' ', $key));
            $message .= sprintf("%s: %s\n", $label, $value);
        }
        
        $message .= "\n" . sprintf(__('Lähetetty: %s', 'e1-calculator'), current_time('mysql'));
        
        wp_mail($to, $subject, $message);
    }
    
    /**
     * Setup cache directory ja .htaccess
     */
    public static function setup_cache_directory() {
        $cache_dir = E1_CALC_CACHE_DIR;
        
        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }
        
        // .htaccess joka sallii JS/CSS latauksen mutta estää muut
        $htaccess = $cache_dir . '.htaccess';
        // Always recreate to ensure correct rules
        $rules = "# E1 Calculator Cache Directory\n";
        $rules .= "# Allow access to JS, CSS and JSON files\n\n";
        
        // For Apache 2.4+
        $rules .= "<IfModule mod_authz_core.c>\n";
        $rules .= "    <FilesMatch \"\\.(js|css|json)$\">\n";
        $rules .= "        Require all granted\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "    <FilesMatch \"\\.(php|html|htm|txt)$\">\n";
        $rules .= "        Require all denied\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "</IfModule>\n\n";
        
        // For Apache 2.2 (fallback)
        $rules .= "<IfModule !mod_authz_core.c>\n";
        $rules .= "    <FilesMatch \"\\.(js|css|json)$\">\n";
        $rules .= "        Order Allow,Deny\n";
        $rules .= "        Allow from all\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "    <FilesMatch \"\\.(php|html|htm|txt)$\">\n";
        $rules .= "        Order Deny,Allow\n";
        $rules .= "        Deny from all\n";
        $rules .= "    </FilesMatch>\n";
        $rules .= "</IfModule>\n\n";
        
        $rules .= "# Disable directory browsing\n";
        $rules .= "Options -Indexes\n";
        
        file_put_contents($htaccess, $rules);
    }
}