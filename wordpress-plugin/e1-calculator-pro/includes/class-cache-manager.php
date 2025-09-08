<?php
namespace E1_Calculator;

/**
 * Cache Manager for widget files
 */
class Cache_Manager {
    
    /**
     * Cache file names
     */
    const CACHE_JS = 'widget.js';
    const CACHE_CSS = 'widget.css';
    const CACHE_CONFIG = 'config.json';
    const CACHE_META = 'meta.json';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->ensure_cache_directory();
    }
    
    /**
     * Ensure cache directory exists
     */
    private function ensure_cache_directory() {
        if (!file_exists(E1_CALC_CACHE_DIR)) {
            wp_mkdir_p(E1_CALC_CACHE_DIR);
            
            // Add .htaccess for security
            $htaccess = E1_CALC_CACHE_DIR . '.htaccess';
            if (!file_exists($htaccess)) {
                file_put_contents($htaccess, "Deny from all\n");
            }
            
            // Add index.php for extra security
            $index = E1_CALC_CACHE_DIR . 'index.php';
            if (!file_exists($index)) {
                file_put_contents($index, "<?php // Silence is golden\n");
            }
        }
    }
    
    /**
     * Save widget bundle to cache
     */
    public function save_bundle($bundle) {
        $this->ensure_cache_directory();
        
        try {
            // Save JavaScript
            if (isset($bundle['widget']['js'])) {
                file_put_contents(
                    E1_CALC_CACHE_DIR . self::CACHE_JS,
                    $bundle['widget']['js']
                );
            }
            
            // Save CSS
            if (isset($bundle['widget']['css'])) {
                file_put_contents(
                    E1_CALC_CACHE_DIR . self::CACHE_CSS,
                    $bundle['widget']['css']
                );
            }
            
            // Save config
            if (isset($bundle['config'])) {
                file_put_contents(
                    E1_CALC_CACHE_DIR . self::CACHE_CONFIG,
                    json_encode($bundle['config'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                );
            }
            
            // Save metadata
            $meta = [
                'version' => $bundle['version'] ?? 'unknown',
                'checksum' => $bundle['checksum'] ?? '',
                'generated_at' => $bundle['generated_at'] ?? '',
                'cached_at' => current_time('mysql'),
                'cache_timestamp' => time(),
            ];
            
            file_put_contents(
                E1_CALC_CACHE_DIR . self::CACHE_META,
                json_encode($meta, JSON_PRETTY_PRINT)
            );
            
            return true;
            
        } catch (\Exception $e) {
            error_log('E1 Calculator cache save failed: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get cached widget bundle
     */
    public function get_bundle() {
        if (!$this->is_cache_valid()) {
            return null;
        }
        
        $bundle = [];
        
        // Read JavaScript
        $js_file = E1_CALC_CACHE_DIR . self::CACHE_JS;
        if (file_exists($js_file)) {
            $bundle['js'] = file_get_contents($js_file);
        }
        
        // Read CSS
        $css_file = E1_CALC_CACHE_DIR . self::CACHE_CSS;
        if (file_exists($css_file)) {
            $bundle['css'] = file_get_contents($css_file);
        }
        
        // Read config
        $config_file = E1_CALC_CACHE_DIR . self::CACHE_CONFIG;
        if (file_exists($config_file)) {
            $bundle['config'] = json_decode(file_get_contents($config_file), true);
        }
        
        // Read metadata
        $meta_file = E1_CALC_CACHE_DIR . self::CACHE_META;
        if (file_exists($meta_file)) {
            $bundle['meta'] = json_decode(file_get_contents($meta_file), true);
        }
        
        return !empty($bundle) ? $bundle : null;
    }
    
    /**
     * Check if cache is valid
     */
    public function is_cache_valid() {
        $meta_file = E1_CALC_CACHE_DIR . self::CACHE_META;
        
        if (!file_exists($meta_file)) {
            return false;
        }
        
        $meta = json_decode(file_get_contents($meta_file), true);
        
        if (!$meta || !isset($meta['cache_timestamp'])) {
            return false;
        }
        
        // Check cache age
        $cache_duration = get_option('e1_calculator_cache_duration', 86400); // Default 24 hours
        $cache_age = time() - $meta['cache_timestamp'];
        
        if ($cache_age > $cache_duration) {
            return false;
        }
        
        // Check if all required files exist
        $required_files = [
            E1_CALC_CACHE_DIR . self::CACHE_JS,
            E1_CALC_CACHE_DIR . self::CACHE_CSS,
            E1_CALC_CACHE_DIR . self::CACHE_CONFIG,
        ];
        
        foreach ($required_files as $file) {
            if (!file_exists($file)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Clear cache
     */
    public function clear_cache() {
        $files = [
            self::CACHE_JS,
            self::CACHE_CSS,
            self::CACHE_CONFIG,
            self::CACHE_META,
        ];
        
        foreach ($files as $file) {
            $path = E1_CALC_CACHE_DIR . $file;
            if (file_exists($path)) {
                unlink($path);
            }
        }
        
        return true;
    }
    
    /**
     * Get cache info
     */
    public function get_cache_info() {
        $info = [
            'exists' => false,
            'valid' => false,
            'version' => null,
            'cached_at' => null,
            'size' => 0,
        ];
        
        $meta_file = E1_CALC_CACHE_DIR . self::CACHE_META;
        
        if (file_exists($meta_file)) {
            $info['exists'] = true;
            $meta = json_decode(file_get_contents($meta_file), true);
            
            if ($meta) {
                $info['version'] = $meta['version'] ?? null;
                $info['cached_at'] = $meta['cached_at'] ?? null;
                $info['valid'] = $this->is_cache_valid();
                
                // Calculate total cache size
                $files = [self::CACHE_JS, self::CACHE_CSS, self::CACHE_CONFIG, self::CACHE_META];
                foreach ($files as $file) {
                    $path = E1_CALC_CACHE_DIR . $file;
                    if (file_exists($path)) {
                        $info['size'] += filesize($path);
                    }
                }
            }
        }
        
        return $info;
    }
    
    /**
     * Get cache directory path
     */
    public function get_cache_dir() {
        return E1_CALC_CACHE_DIR;
    }
    
    /**
     * Get cache directory URL
     */
    public function get_cache_url() {
        return E1_CALC_CACHE_URL;
    }
}