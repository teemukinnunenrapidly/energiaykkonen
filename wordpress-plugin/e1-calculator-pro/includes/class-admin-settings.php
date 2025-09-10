<?php
namespace E1_Calculator;

/**
 * E1 Calculator Admin Settings
 * 
 * Hallinnoi kriittiset WordPress plugin -asetukset:
 * - Shadow DOM Mode (Auto/Pois käytöstä) 
 * - Cache Tyhjennys (Widget cache -tiedostojen poisto)
 * - Debug Mode (Konsoli debug-viestit)
 */
class Admin_Settings {
    
    private $cache_manager;
    
    public function __construct(Cache_Manager $cache_manager) {
        $this->cache_manager = $cache_manager;
        
        // Lisää admin menu
        add_action('admin_menu', [$this, 'add_admin_menu']);
        
        // Rekisteröi asetukset
        add_action('admin_init', [$this, 'register_settings']);
        
        // AJAX toiminnot
        add_action('wp_ajax_e1_clear_cache', [$this, 'ajax_clear_cache']);
        add_action('wp_ajax_e1_test_widget', [$this, 'ajax_test_widget']);
        add_action('wp_ajax_e1_sync_widget', [$this, 'ajax_sync_widget']);
        
        // Admin käyttöliittymä
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
    }
    
    /**
     * Lisää admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'E1 Calculator Asetukset',
            'E1 Calculator',
            'manage_options',
            'e1-calculator-settings',
            [$this, 'settings_page']
        );
        
        // Lisää myös päävalikkoon jos halutaan
        add_menu_page(
            'E1 Calculator',
            'E1 Calculator', 
            'manage_options',
            'e1-calculator',
            [$this, 'settings_page'],
            'dashicons-calculator',
            30
        );
    }
    
    /**
     * Rekisteröi asetukset
     */
    public function register_settings() {
        // Asetusryhmä
        register_setting('e1_calculator_settings', 'e1_calculator_options', [
            'sanitize_callback' => [$this, 'sanitize_settings']
        ]);
        
        // Kriittiset asetukset osio
        add_settings_section(
            'e1_critical_settings',
            'Kriittiset Asetukset',
            [$this, 'critical_settings_section_callback'],
            'e1-calculator-settings'
        );
        
        // Shadow DOM Mode
        add_settings_field(
            'shadow_dom_mode',
            'Shadow DOM Mode',
            [$this, 'shadow_dom_mode_callback'],
            'e1-calculator-settings',
            'e1_critical_settings'
        );
        
        // Debug Mode
        add_settings_field(
            'debug_mode',
            'Debug Mode', 
            [$this, 'debug_mode_callback'],
            'e1-calculator-settings',
            'e1_critical_settings'
        );
        
        // Vercel API URL
        add_settings_field(
            'vercel_api_url',
            'Vercel API URL',
            [$this, 'vercel_api_url_callback'],
            'e1-calculator-settings',
            'e1_critical_settings'
        );
        
        // Cache asetukset osio
        add_settings_section(
            'e1_cache_settings',
            'Cache Hallinta',
            [$this, 'cache_settings_section_callback'],
            'e1-calculator-settings'
        );
        
        // Cache status ja tyhjennys
        add_settings_field(
            'cache_management',
            'Widget Cache',
            [$this, 'cache_management_callback'],
            'e1-calculator-settings',
            'e1_cache_settings'
        );
    }
    
    /**
     * Validoi ja sanitoi asetukset
     */
    public function sanitize_settings($input) {
        $sanitized = [];
        
        // Shadow DOM Mode: auto, disabled
        if (isset($input['shadow_dom_mode'])) {
            $allowed_modes = ['auto', 'disabled'];
            $sanitized['shadow_dom_mode'] = in_array($input['shadow_dom_mode'], $allowed_modes) 
                ? $input['shadow_dom_mode'] 
                : 'auto';
        } else {
            $sanitized['shadow_dom_mode'] = 'auto';
        }
        
        // Debug Mode: boolean
        $sanitized['debug_mode'] = isset($input['debug_mode']) ? (bool)$input['debug_mode'] : false;
        
        // Vercel API URL: validate URL format
        if (isset($input['vercel_api_url'])) {
            $url = trim($input['vercel_api_url']);
            if (empty($url)) {
                $sanitized['vercel_api_url'] = '';
            } elseif (filter_var($url, FILTER_VALIDATE_URL)) {
                $sanitized['vercel_api_url'] = esc_url_raw($url);
            } else {
                $sanitized['vercel_api_url'] = '';
                add_settings_error(
                    'e1_calculator_options',
                    'invalid_vercel_url',
                    'Invalid Vercel API URL format. Please enter a valid URL.',
                    'error'
                );
            }
        } else {
            $sanitized['vercel_api_url'] = '';
        }
        
        // Cache viimeksi tyhjennetty (ei muokattavissa käyttäjän toimesta)
        $current_options = get_option('e1_calculator_options', []);
        $sanitized['cache_last_cleared'] = $current_options['cache_last_cleared'] ?? '';
        
        return $sanitized;
    }
    
    /**
     * Admin sivun pääsisältö
     */
    public function settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('Sinulla ei ole riittäviä oikeuksia tälle sivulle.'));
        }
        
        // Hae nykyiset asetukset
        $options = get_option('e1_calculator_options', []);
        $cache_info = $this->cache_manager->get_cache_info();
        
        ?>
        <div class="wrap">
            <h1>
                <span class="dashicons dashicons-calculator"></span>
                E1 Calculator Asetukset
            </h1>
            
            <div id="e1-admin-notices"></div>
            
            <!-- Status paneeli -->
            <div class="e1-status-panel">
                <h2>Widget Status</h2>
                <div class="e1-status-grid">
                    <div class="e1-status-card">
                        <div class="e1-status-icon">
                            <?php if ($cache_info['has_cache']): ?>
                                <span class="dashicons dashicons-yes-alt" style="color: #00a32a;"></span>
                            <?php else: ?>
                                <span class="dashicons dashicons-warning" style="color: #dba617;"></span>
                            <?php endif; ?>
                        </div>
                        <div class="e1-status-content">
                            <strong>Cache Status</strong>
                            <p><?php echo $cache_info['has_cache'] ? 'Widget tiedostot löytyvät' : 'Widget ei ole synkronoitu'; ?></p>
                            <?php if ($cache_info['has_cache']): ?>
                                <small>Koko: <?php echo $this->format_file_size($cache_info['total_size']); ?></small>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <div class="e1-status-card">
                        <div class="e1-status-icon">
                            <?php if ($options['shadow_dom_mode'] === 'auto'): ?>
                                <span class="dashicons dashicons-admin-generic" style="color: #2271b1;"></span>
                            <?php else: ?>
                                <span class="dashicons dashicons-dismiss" style="color: #d63638;"></span>
                            <?php endif; ?>
                        </div>
                        <div class="e1-status-content">
                            <strong>Shadow DOM</strong>
                            <p><?php echo $options['shadow_dom_mode'] === 'auto' ? 'Automaattinen' : 'Pois käytöstä'; ?></p>
                            <small>Määrittää style-isolaation</small>
                        </div>
                    </div>
                    
                    <div class="e1-status-card">
                        <div class="e1-status-icon">
                            <?php if ($options['debug_mode']): ?>
                                <span class="dashicons dashicons-info" style="color: #72aee6;"></span>
                            <?php else: ?>
                                <span class="dashicons dashicons-hidden" style="color: #8c8f94;"></span>
                            <?php endif; ?>
                        </div>
                        <div class="e1-status-content">
                            <strong>Debug Mode</strong>
                            <p><?php echo $options['debug_mode'] ? 'Käytössä' : 'Pois käytöstä'; ?></p>
                            <small>Konsolin debug-viestit</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Asetukset lomake -->
            <form method="post" action="options.php" id="e1-settings-form">
                <?php 
                settings_fields('e1_calculator_settings');
                do_settings_sections('e1-calculator-settings');
                ?>
                
                <div class="e1-actions">
                    <?php submit_button('Tallenna Asetukset', 'primary', 'submit', false); ?>
                    <button type="button" id="e1-test-widget" class="button button-secondary">
                        <span class="dashicons dashicons-search"></span>
                        Testaa Widget
                    </button>
                </div>
            </form>
            
            <!-- Cache hallinta -->
            <div class="e1-cache-panel">
                <h2>Kehitystyökalut</h2>
                <div class="e1-tools-grid">
                    <div class="e1-tool-card">
                        <h3>Cache Hallinta</h3>
                        <p>Tyhjennä widget cache jos näet vanhoja versioita tai stylesheet-ongelmia.</p>
                        <button type="button" id="e1-clear-cache" class="button button-secondary">
                            <span class="dashicons dashicons-update"></span>
                            Tyhjennä Widget Cache
                        </button>
                        <div id="cache-status"></div>
                    </div>
                    
                    <div class="e1-tool-card">
                        <h3>Widget Testaus</h3>
                        <p>Testaa widget-toiminnallisuus erilaisilla asetuksilla.</p>
                        <div id="widget-test-results"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .e1-status-panel {
                background: #fff;
                border: 1px solid #c3dcf1;
                border-radius: 4px;
                padding: 20px;
                margin: 20px 0;
            }
            .e1-status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 15px;
            }
            .e1-status-card {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: #f6f7f7;
                border-radius: 4px;
                border-left: 4px solid #2271b1;
            }
            .e1-status-icon .dashicons {
                font-size: 24px;
            }
            .e1-status-content strong {
                display: block;
                margin-bottom: 5px;
                color: #1d2327;
            }
            .e1-status-content p {
                margin: 0;
                color: #3c434a;
            }
            .e1-status-content small {
                color: #646970;
                font-size: 12px;
            }
            .e1-actions {
                display: flex;
                gap: 10px;
                align-items: center;
                margin-top: 20px;
            }
            .e1-cache-panel {
                background: #fff;
                border: 1px solid #c3dcf1;
                border-radius: 4px;
                padding: 20px;
                margin: 20px 0;
            }
            .e1-tools-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 15px;
            }
            .e1-tool-card {
                padding: 20px;
                background: #f9f9f9;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            .e1-tool-card h3 {
                margin-top: 0;
                color: #1d2327;
            }
            .e1-tool-card p {
                color: #3c434a;
                font-size: 14px;
            }
            .e1-success {
                color: #00a32a;
                background: #dff0d8;
                border: 1px solid #d4e6cd;
                padding: 8px 12px;
                border-radius: 4px;
                margin-top: 10px;
            }
            .e1-error {
                color: #d63638;
                background: #f8d7da;
                border: 1px solid #f1aeb5;
                padding: 8px 12px;
                border-radius: 4px;
                margin-top: 10px;
            }
            .e1-loading {
                color: #2271b1;
                padding: 8px 12px;
                margin-top: 10px;
            }
        </style>
        <?php
    }
    
    /**
     * Kriittisten asetusten osion kuvaus
     */
    public function critical_settings_section_callback() {
        echo '<p>Nämä asetukset ovat välttämättömiä widget-toiminnallisuudelle. Muuta vain jos tiedät mitä teet.</p>';
    }
    
    /**
     * Shadow DOM mode asetus
     */
    public function shadow_dom_mode_callback() {
        $options = get_option('e1_calculator_options', []);
        $current_mode = $options['shadow_dom_mode'] ?? 'auto';
        ?>
        <select name="e1_calculator_options[shadow_dom_mode]" id="shadow_dom_mode">
            <option value="auto" <?php selected($current_mode, 'auto'); ?>>
                Auto (suositeltu) - Käytä Shadow DOM jos selain tukee
            </option>
            <option value="disabled" <?php selected($current_mode, 'disabled'); ?>>
                Pois käytöstä - Käytä CSS namespace -isolaatiota
            </option>
        </select>
        <p class="description">
            <strong>Auto:</strong> Widget käyttää Shadow DOM -teknologiaa moderni selaimissa parempaan style-isolaatioon.<br>
            <strong>Pois käytöstä:</strong> Pakottaa CSS namespace -isolaation. Käytä jos Shadow DOM aiheuttaa ongelmia.
        </p>
        <?php
    }
    
    /**
     * Debug mode asetus
     */
    public function debug_mode_callback() {
        $options = get_option('e1_calculator_options', []);
        $debug_enabled = $options['debug_mode'] ?? false;
        ?>
        <label for="debug_mode">
            <input type="checkbox" 
                   name="e1_calculator_options[debug_mode]" 
                   id="debug_mode" 
                   value="1" 
                   <?php checked($debug_enabled, true); ?>>
            Näytä debug-viestit selaimen konsolissa
        </label>
        <p class="description">
            Kun käytössä, widget kirjoittaa yksityiskohtaisia debug-viestejä selaimen konsoliin. 
            Auttaa ongelmien diagnosoinnissa. <strong>Älä jätä päälle tuotantoon.</strong>
        </p>
        <?php
    }
    
    /**
     * Vercel API URL callback
     */
    public function vercel_api_url_callback() {
        $options = get_option('e1_calculator_options', []);
        $vercel_url = $options['vercel_api_url'] ?? '';
        ?>
        <input type="url" 
               name="e1_calculator_options[vercel_api_url]" 
               id="vercel_api_url" 
               value="<?php echo esc_attr($vercel_url); ?>"
               class="regular-text code"
               placeholder="https://your-app.vercel.app/api/widget-config">
        <p class="description">
            Widget hakee config-tiedot tästä Vercel API-endpointista. Jos tyhjä, käytetään staattista config.json tiedostoa.
            <br><strong>Esimerkki:</strong> https://your-app.vercel.app/api/widget-config
        </p>
        <?php
    }
    
    /**
     * Cache asetusten osion kuvaus
     */
    public function cache_settings_section_callback() {
        echo '<p>Cache-tiedostojen hallinta kehitys- ja ylläpitotöitä varten.</p>';
    }
    
    /**
     * Cache hallinta näkymä
     */
    public function cache_management_callback() {
        $cache_info = $this->cache_manager->get_cache_info();
        $options = get_option('e1_calculator_options', []);
        ?>
        <div class="e1-cache-info">
            <h4>Cache Tiedot</h4>
            <ul>
                <li><strong>Status:</strong> <?php echo $cache_info['has_cache'] ? '✅ Cache löytyy' : '❌ Ei cachea'; ?></li>
                <?php if ($cache_info['has_cache']): ?>
                    <li><strong>Tiedostoja:</strong> <?php echo count($cache_info['files']); ?> kpl</li>
                    <li><strong>Koko yhteensä:</strong> <?php echo $this->format_file_size($cache_info['total_size']); ?></li>
                    <li><strong>Viimeksi synkronoitu:</strong> 
                        <?php echo $cache_info['last_modified'] ? date('d.m.Y H:i', $cache_info['last_modified']) : 'Tuntematon'; ?>
                    </li>
                <?php endif; ?>
            </ul>
            
            <?php if ($cache_info['has_cache']): ?>
                <h4>Cache Tiedostot</h4>
                <ul style="font-family: monospace; font-size: 12px;">
                    <?php foreach ($cache_info['files'] as $file): ?>
                        <li><?php echo esc_html($file); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
            
            <?php if (!empty($options['cache_last_cleared'])): ?>
                <p><small><strong>Viimeksi tyhjennetty:</strong> <?php echo $options['cache_last_cleared']; ?></small></p>
            <?php endif; ?>
            
            <div class="e1-sync-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                <h4>Synkronoi Widget Vercel:sta</h4>
                <p class="description">
                    Hakee tuoreimman widget-konfiguraation Vercel API:sta ja tallentaa cacheen. 
                    Käytä tätä kun tiedot on päivitetty Vercel-palvelimella.
                </p>
                
                <?php $vercel_url = $options['vercel_api_url'] ?? ''; ?>
                <?php if (empty($vercel_url)): ?>
                    <p style="color: #d63638;">
                        ⚠️ <strong>Vercel API URL ei ole määritelty.</strong> 
                        Määritä URL yllä ensin ennen synkronointia.
                    </p>
                <?php else: ?>
                    <button type="button" 
                            id="e1-sync-widget" 
                            class="button button-secondary"
                            data-api-url="<?php echo esc_attr($vercel_url); ?>">
                        <span class="dashicons dashicons-update"></span>
                        Synkronoi Widget Vercel:sta
                    </button>
                    <div id="sync-status" style="margin-top: 10px;"></div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
    
    /**
     * AJAX: Tyhjennä cache
     */
    public function ajax_clear_cache() {
        // Tarkista nonce ja oikeudet
        if (!check_ajax_referer('e1_admin_nonce', 'nonce', false) || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Ei oikeuksia']);
            return;
        }
        
        try {
            // Tyhjennä cache
            $result = $this->cache_manager->clear_cache();
            
            if ($result) {
                // Päivitä asetukset
                $options = get_option('e1_calculator_options', []);
                $options['cache_last_cleared'] = current_time('d.m.Y H:i:s');
                update_option('e1_calculator_options', $options);
                
                wp_send_json_success([
                    'message' => 'Widget cache tyhjennetty onnistuneesti!',
                    'cleared_at' => $options['cache_last_cleared']
                ]);
            } else {
                wp_send_json_error(['message' => 'Cache tyhjennys epäonnistui']);
            }
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Virhe: ' . $e->getMessage()]);
        }
    }
    
    /**
     * AJAX: Testaa widget
     */
    public function ajax_test_widget() {
        if (!check_ajax_referer('e1_admin_nonce', 'nonce', false) || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Ei oikeuksia']);
            return;
        }
        
        $options = get_option('e1_calculator_options', []);
        $cache_info = $this->cache_manager->get_cache_info();
        
        $test_results = [
            'cache_status' => $cache_info['has_cache'],
            'shadow_dom_mode' => $options['shadow_dom_mode'] ?? 'auto',
            'debug_mode' => $options['debug_mode'] ?? false,
            'config_accessible' => file_exists(E1_CALC_CACHE_DIR . 'config.json'),
            'widget_js_accessible' => file_exists(E1_CALC_CACHE_DIR . 'widget.js'),
            'widget_css_accessible' => file_exists(E1_CALC_CACHE_DIR . 'widget.css'),
            'timestamp' => current_time('c')
        ];
        
        // Laske pistemäärä
        $score = 0;
        $max_score = 6;
        
        if ($test_results['cache_status']) $score++;
        if ($test_results['config_accessible']) $score++;
        if ($test_results['widget_js_accessible']) $score++;
        if ($test_results['widget_css_accessible']) $score++;
        if ($test_results['shadow_dom_mode'] === 'auto') $score++;
        $score++; // Debug mode ei vaikuta pistemäärään negatiivisesti
        
        $test_results['score'] = $score;
        $test_results['max_score'] = $max_score;
        $test_results['status'] = $score >= 4 ? 'good' : 'warning';
        
        if ($score >= 5) {
            $test_results['message'] = 'Widget on valmiina käytettäväksi! ✅';
        } elseif ($score >= 3) {
            $test_results['message'] = 'Widget toimii, mutta joitakin tiedostoja puuttuu. ⚠️';
        } else {
            $test_results['message'] = 'Widget ei ole valmis käytettäväksi. Synkronoi ensin cache. ❌';
        }
        
        wp_send_json_success($test_results);
    }
    
    /**
     * AJAX: Synkronoi widget Vercel API:sta
     */
    public function ajax_sync_widget() {
        // Tarkista nonce ja oikeudet
        if (!check_ajax_referer('e1_admin_nonce', 'nonce', false) || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Ei oikeuksia']);
            return;
        }
        
        // Hae asetukset
        $options = get_option('e1_calculator_options', []);
        $vercel_url = $options['vercel_api_url'] ?? '';
        
        if (empty($vercel_url)) {
            wp_send_json_error(['message' => 'Vercel API URL ei ole määritelty']);
            return;
        }
        
        try {
            // Hae data Vercel API:sta
            $response = wp_remote_get($vercel_url, [
                'timeout' => 30,
                'headers' => [
                    'Accept' => 'application/json',
                    'User-Agent' => 'E1-Calculator-WordPress/' . E1_CALC_VERSION
                ]
            ]);
            
            if (is_wp_error($response)) {
                throw new Exception('Vercel API kutsu epäonnistui: ' . $response->get_error_message());
            }
            
            $status_code = wp_remote_retrieve_response_code($response);
            if ($status_code !== 200) {
                throw new Exception('Vercel API palautti virheen: HTTP ' . $status_code);
            }
            
            $body = wp_remote_retrieve_body($response);
            $config_data = json_decode($body, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Virheellinen JSON-vastaus Vercel API:sta');
            }
            
            if (empty($config_data)) {
                throw new Exception('Tyhjä vastaus Vercel API:sta');
            }
            
            // Tallenna cache
            $bundle = [
                'config' => $config_data,
                'version' => $config_data['version'] ?? 'vercel-sync',
                'checksum' => md5($body),
                'generated_at' => current_time('mysql'),
                'source' => 'vercel-api',
                'api_url' => $vercel_url
            ];
            
            $result = $this->cache_manager->save_bundle($bundle);
            
            if (!$result) {
                throw new Exception('Cachen tallennus epäonnistui');
            }
            
            // Päivitä asetukset
            $options['cache_last_synced'] = current_time('d.m.Y H:i:s');
            update_option('e1_calculator_options', $options);
            
            wp_send_json_success([
                'message' => 'Widget synkronoitu onnistuneesti Vercel:sta! ✅',
                'synced_at' => $options['cache_last_synced'],
                'cards_count' => isset($config_data['data']['cards']) ? count($config_data['data']['cards']) : 0,
                'visual_objects_count' => isset($config_data['data']['visualObjects']) ? count($config_data['data']['visualObjects']) : 0,
                'version' => $bundle['version']
            ]);
            
        } catch (Exception $e) {
            error_log('E1 Calculator Vercel sync error: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Lataa admin skriptit
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_e1-calculator-settings' && $hook !== 'toplevel_page_e1-calculator') {
            return;
        }
        
        wp_enqueue_script(
            'e1-calculator-admin',
            E1_CALC_PLUGIN_URL . 'assets/admin.js',
            ['jquery'],
            E1_CALC_VERSION,
            true
        );
        
        wp_localize_script('e1-calculator-admin', 'e1AdminAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('e1_admin_nonce'),
            'strings' => [
                'clearing' => 'Tyhjennetään cachea...',
                'testing' => 'Testataan widgetiä...',
                'error' => 'Virhe',
                'success' => 'Onnistui'
            ]
        ]);
    }
    
    /**
     * Apufunktio: Muotoile tiedostokoko
     */
    private function format_file_size($bytes) {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' B';
        }
    }
    
    /**
     * Hae nykyiset asetukset (public API)
     */
    public static function get_settings() {
        return get_option('e1_calculator_options', [
            'shadow_dom_mode' => 'auto',
            'debug_mode' => false,
            'cache_last_cleared' => ''
        ]);
    }
    
    /**
     * Tarkista onko debug mode käytössä
     */
    public static function is_debug_mode() {
        $options = self::get_settings();
        return !empty($options['debug_mode']);
    }
    
    /**
     * Hae Shadow DOM mode
     */
    public static function get_shadow_dom_mode() {
        $options = self::get_settings();
        return $options['shadow_dom_mode'] ?? 'auto';
    }
}