<?php
namespace E1_Calculator;

/**
 * Simplified Widget Loader - No API needed!
 * Just loads widget from local cache files
 */
class Widget_Loader {
    
    private static $instance_count = 0;
    
    public function __construct() {
        // Register shortcode
        add_shortcode('e1_calculator', [$this, 'render_shortcode']);
        
        // Register scripts (but don't load yet)
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        
        // Add init script to footer
        add_action('wp_footer', [$this, 'output_init_script'], 20);
    }
    
    /**
     * Register assets
     */
    public function register_assets() {
        // Use plugin's local cache directory
        $cache_url = plugin_dir_url(dirname(__FILE__)) . 'cache/';
        
        wp_register_style(
            'e1-calculator-widget',
            $cache_url . 'widget.css',
            [],
            '3.2.2'
        );
        
        wp_register_script(
            'e1-calculator-widget',
            $cache_url . 'widget.js',
            [],
            '3.2.2',
            true
        );
    }
    
    /**
     * Shortcode handler
     */
    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'theme' => 'light',
            'class' => '',
            'height' => '',
        ], $atts, 'e1_calculator');
        
        self::$instance_count++;
        $widget_id = 'e1-calculator-widget-' . self::$instance_count;
        
        // Load resources
        if (self::$instance_count === 1) {
            wp_enqueue_style('e1-calculator-widget');
            wp_enqueue_script('e1-calculator-widget');
        }
        
        $style = !empty($atts['height']) ? 
            sprintf('style="min-height: %spx;"', esc_attr($atts['height'])) : '';
        
        return sprintf(
            '<div id="%s" class="e1-calculator-widget-container %s" data-theme="%s" %s>
                <div class="e1-calculator-loading">
                    <div class="e1-loading-spinner"></div>
                    <p>Ladataan laskuria...</p>
                </div>
            </div>',
            esc_attr($widget_id),
            esc_attr($atts['class']),
            esc_attr($atts['theme']),
            $style
        );
    }
    
    /**
     * Output init script
     */
    public function output_init_script() {
        if (self::$instance_count === 0) return;
        
        $cache_url = plugin_dir_url(dirname(__FILE__)) . 'cache/';
        ?>
        <script>
        (function() {
            function waitForWidget() {
                if (typeof window.E1Calculator === 'undefined') {
                    setTimeout(waitForWidget, 100);
                    return;
                }
                
                // Init each widget
                for (var i = 1; i <= <?php echo self::$instance_count; ?>; i++) {
                    var widgetId = 'e1-calculator-widget-' + i;
                    var container = document.getElementById(widgetId);
                    if (!container) continue;
                    
                    // Hide loading
                    var loading = container.querySelector('.e1-calculator-loading');
                    if (loading) loading.style.display = 'none';
                    
                    // Init widget with configUrl
                    window.E1Calculator.init(widgetId, {
                        configUrl: '<?php echo $cache_url; ?>config.json',
                        showVisualSupport: true,
                        theme: container.getAttribute('data-theme') || 'light'
                    });
                }
            }
            
            waitForWidget();
        })();
        </script>
        <?php
    }
}

// Initialize
new Widget_Loader();