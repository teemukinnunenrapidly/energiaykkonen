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
        }

        // Always write .htaccess that ALLOWS public access to widget assets
        $htaccess = E1_CALC_CACHE_DIR . '.htaccess';
        $rules = <<<HTACCESS
# E1 Calculator cache rules
<IfModule mod_headers.c>
    Header set X-Content-Type-Options nosniff
    Header set X-Frame-Options SAMEORIGIN
</IfModule>

# Serve JS/CSS/JSON with correct MIME types
AddType application/javascript .js
AddType text/css .css
AddType application/json .json

# Allow public access to widget assets
<FilesMatch "^(widget\\.js|widget\\.css|config\\.json)$">
    <IfModule mod_authz_core.c>
        Require all granted
    </IfModule>
    <IfModule !mod_authz_core.c>
        Allow from all
        Satisfy any
    </IfModule>
</FilesMatch>
HTACCESS;
        @file_put_contents($htaccess, $rules);

        // Ensure index.php exists
        $index = E1_CALC_CACHE_DIR . 'index.php';
        @file_put_contents($index, "<?php // Silence is golden\n");
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
                'checksum' => $bundle['checksum'] ?? null,
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
        
        // Read metadata (try both meta.json and metadata.json for compatibility)
        $meta_file = E1_CALC_CACHE_DIR . 'metadata.json';
        if (!file_exists($meta_file)) {
            $meta_file = E1_CALC_CACHE_DIR . self::CACHE_META;
        }
        if (file_exists($meta_file)) {
            $bundle['meta'] = json_decode(file_get_contents($meta_file), true);
        }
        
        // Debug: Log what we found
        if (!empty($bundle['config'])) {
            error_log('E1 Calculator: Cache bundle loaded with config containing:');
            // Check the correct nested structure: config.data.cards
            error_log('  - Cards: ' . (isset($bundle['config']['data']['cards']) ? count($bundle['config']['data']['cards']) : 'MISSING'));
            $visualObjects = isset($bundle['config']['data']['visualObjects']) ? count($bundle['config']['data']['visualObjects']) : 0;
            $visuals = isset($bundle['config']['data']['visuals']) ? count($bundle['config']['data']['visuals']) : 0;
            error_log('  - VisualObjects: ' . ($visualObjects > 0 ? $visualObjects : 'MISSING'));
            error_log('  - Visuals (fallback): ' . ($visuals > 0 ? $visuals : 'MISSING'));
            
            // If cards are empty, debug the structure
            if (empty($bundle['config']['data']['cards'])) {
                error_log('E1 Calculator: Config top-level keys: ' . implode(', ', array_keys($bundle['config'])));
                if (isset($bundle['config']['data'])) {
                    error_log('E1 Calculator: Config.data keys: ' . implode(', ', array_keys($bundle['config']['data'])));
                }
            }
        } else {
            error_log('E1 Calculator: No config found in cache bundle');
        }
        
        return !empty($bundle) ? $bundle : null;
    }
    
    /**
     * Check if cache is valid
     */
    public function is_cache_valid() {
        // Try new metadata.json first, fallback to meta.json
        $meta_file = E1_CALC_CACHE_DIR . 'metadata.json';
        if (!file_exists($meta_file)) {
            $meta_file = E1_CALC_CACHE_DIR . self::CACHE_META;
        }
        
        if (!file_exists($meta_file)) {
            return false;
        }
        
        $meta = json_decode(file_get_contents($meta_file), true);
        
        if (!$meta) {
            return false;
        }

        // Support multiple timestamp formats for compatibility:
        // - cache_epoch (number)
        // - cache_timestamp (ISO string or epoch)
        // - deployment.timestamp (ISO string)
        $cache_epoch = 0;
        if (isset($meta['cache_epoch']) && is_numeric($meta['cache_epoch'])) {
            $cache_epoch = (int) $meta['cache_epoch'];
        } elseif (isset($meta['cache_timestamp'])) {
            $ts = $meta['cache_timestamp'];
            if (is_numeric($ts)) {
                $cache_epoch = (int) $ts;
            } else {
                $parsed = strtotime($ts);
                $cache_epoch = $parsed ? (int) $parsed : 0;
            }
        } elseif (isset($meta['deployment']) && is_array($meta['deployment']) && isset($meta['deployment']['timestamp'])) {
            $parsed = strtotime($meta['deployment']['timestamp']);
            $cache_epoch = $parsed ? (int) $parsed : 0;
        }

        if ($cache_epoch <= 0) {
            return false;
        }

        // Check cache age
        $cache_duration = get_option('e1_calculator_cache_duration', 86400); // Default 24 hours
        $cache_age = time() - $cache_epoch;
        
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
            'metadata.json', // New metadata file
        ];
        
        foreach ($files as $file) {
            $path = E1_CALC_CACHE_DIR . $file;
            if (file_exists($path)) {
                unlink($path);
            }
        }
        
        // Also clear temp files (be tolerant if temp/ doesn't exist)
        $temp_dir = E1_CALC_CACHE_DIR . 'temp/';
        if (file_exists($temp_dir)) {
            $temp_files = glob($temp_dir . '*.tmp') ?: [];
            foreach ($temp_files as $file) {
                @unlink($file);
            }
        }
        
        error_log('E1 Calculator: Cache cleared completely');
        
        return true;
    }
    
    /**
     * Get cache info
     */
    public function get_cache_info() {
        $info = [
            'exists' => false,
            'valid' => false,
            'has_cache' => false,
            'version' => null,
            'cached_at' => null,
            'size' => 0,
            'files' => [],
            'total_size' => 0,
            'last_modified' => null,
        ];
        
        // Check for both metadata.json and meta.json
        $meta_file = E1_CALC_CACHE_DIR . 'metadata.json';
        if (!file_exists($meta_file)) {
            $meta_file = E1_CALC_CACHE_DIR . self::CACHE_META;
        }
        
        if (file_exists($meta_file)) {
            $info['exists'] = true;
            $meta = json_decode(file_get_contents($meta_file), true);
            
            if ($meta) {
                $info['version'] = $meta['version'] ?? null;
                // Determine a human-readable cached_at value
                $cached_at = $meta['cached_at'] ?? ($meta['synced_at'] ?? null);
                if (!$cached_at) {
                    if (isset($meta['cache_timestamp'])) {
                        $ts = $meta['cache_timestamp'];
                        if (is_numeric($ts)) {
                            $cached_at = gmdate('c', (int) $ts);
                        } else {
                            $cached_at = $ts; // assume ISO
                        }
                    } elseif (isset($meta['cache_epoch']) && is_numeric($meta['cache_epoch'])) {
                        $cached_at = gmdate('c', (int) $meta['cache_epoch']);
                    } elseif (isset($meta['deployment']['timestamp'])) {
                        $cached_at = $meta['deployment']['timestamp'];
                    }
                }
                $info['cached_at'] = $cached_at;
                $info['valid'] = $this->is_cache_valid();
            }
        }
        
        // Check for required files
        $required_files = [self::CACHE_JS, self::CACHE_CSS, self::CACHE_CONFIG];
        $found_files = [];
        $total_size = 0;
        $last_modified = 0;
        
        foreach ($required_files as $file) {
            $path = E1_CALC_CACHE_DIR . $file;
            if (file_exists($path)) {
                $found_files[] = $file;
                $file_size = filesize($path);
                $total_size += $file_size;
                $file_mtime = filemtime($path);
                if ($file_mtime > $last_modified) {
                    $last_modified = $file_mtime;
                }
            }
        }
        
        // Cache is considered to exist if we have all required files
        $info['has_cache'] = count($found_files) === count($required_files);
        $info['files'] = $found_files;
        $info['total_size'] = $total_size;
        $info['size'] = $total_size; // For backward compatibility
        $info['last_modified'] = $last_modified > 0 ? $last_modified : null;
        
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