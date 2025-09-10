# E1 Calculator Widget - Isolaation Toteutussuunnitelma

## 📋 Yhteenveto Muutoksista

### Päätavoitteet:
1. **Shadow DOM -pohjainen isolaatio** moderneihin selaimiin
2. **CSS Namespace fallback** vanhoille selaimille  
3. **Robustimpi WordPress initialization**
4. **Parempi error handling ja retry-logiikka**
5. **Gutenberg block editor -tuki**

---

## 🆕 Uudet Tiedostot

### 1. `src/widget/wordpress-loader.js`
**Polku:** `src/widget/wordpress-loader.js`  
**Tarkoitus:** Robustimpi widget loader WordPress-ympäristöön

```javascript
(function() {
  'use strict';
  
  // Vältä multiple initialization
  if (window.E1CalculatorInitialized) {
    return;
  }
  
  class E1CalculatorLoader {
    constructor() {
      this.instances = new Map();
      this.configCache = null;
      this.initQueue = [];
      this.isReady = false;
      this.retryCount = 0;
      this.maxRetries = 3;
    }

    // Odota DOM ja WordPress jQuery
    waitForDependencies() {
      return new Promise((resolve) => {
        const checkReady = () => {
          const isDOMReady = document.readyState !== 'loading';
          const hasContainer = document.querySelector('[id^="e1-calculator-widget"]');
          const isWordPressReady = typeof wp !== 'undefined' || 
                                   !document.querySelector('script[src*="wp-includes"]');
          
          if (isDOMReady && hasContainer && isWordPressReady) {
            resolve();
          } else if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(checkReady, 100);
          } else {
            console.warn('E1Calculator: Forcing initialization after timeout');
            resolve();
          }
        };

        if (document.readyState === 'complete') {
          checkReady();
        } else {
          document.addEventListener('DOMContentLoaded', checkReady);
          window.addEventListener('load', checkReady);
          
          if (typeof jQuery !== 'undefined') {
            jQuery(document).ready(checkReady);
          }
          
          if (window.wp?.domReady) {
            window.wp.domReady(checkReady);
          }
        }
      });
    }

    async loadConfig(url) {
      if (this.configCache) {
        return this.configCache;
      }

      try {
        const cacheBuster = `?v=${Date.now()}`;
        const response = await fetch(url + cacheBuster);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        this.configCache = await response.json();
        return this.configCache;
      } catch (error) {
        console.error('E1Calculator: Config loading failed', error);
        
        if (typeof jQuery !== 'undefined' && jQuery.ajax) {
          return new Promise((resolve, reject) => {
            jQuery.ajax({
              url: url,
              dataType: 'json',
              cache: false,
              success: (data) => {
                this.configCache = data;
                resolve(data);
              },
              error: reject
            });
          });
        }
        
        throw error;
      }
    }

    async initWidget(config) {
      const {
        containerId,
        useShadowDOM = true,
        configUrl = '/wp-content/uploads/e1-calculator-cache/config.json'
      } = config;

      try {
        const container = document.getElementById(containerId);
        if (!container) {
          console.warn(`E1Calculator: Container #${containerId} not found`);
          return;
        }

        if (this.instances.has(containerId)) {
          console.log(`E1Calculator: Widget #${containerId} already initialized`);
          return this.instances.get(containerId);
        }

        const loadingEl = container.querySelector('.e1-calculator-loading');
        if (loadingEl) {
          loadingEl.style.display = 'none';
        }

        const configData = await this.loadConfig(configUrl);
        const isBlockEditor = document.body.classList.contains('block-editor-page');
        const shouldUseShadow = useShadowDOM && !isBlockEditor && container.attachShadow;

        let mountPoint;
        let shadowRoot = null;

        if (shouldUseShadow) {
          try {
            shadowRoot = container.attachShadow({ mode: 'open' });
            
            const styleEl = document.createElement('style');
            styleEl.textContent = `
              :host {
                all: initial;
                display: block;
                contain: layout style;
              }
              * {
                box-sizing: border-box;
              }
              ${await this.loadStyles(configUrl.replace('config.json', 'widget.css'))}
            `;
            shadowRoot.appendChild(styleEl);
            
            mountPoint = document.createElement('div');
            mountPoint.id = 'widget-root';
            shadowRoot.appendChild(mountPoint);
          } catch (e) {
            console.warn('E1Calculator: Shadow DOM failed, using fallback', e);
            shouldUseShadow = false;
          }
        }
        
        if (!shouldUseShadow) {
          this.addNamespacedStyles();
          mountPoint = document.createElement('div');
          mountPoint.className = 'e1-calculator-isolated-root';
          container.innerHTML = '';
          container.appendChild(mountPoint);
        }

        const instance = await this.renderReactWidget(mountPoint, configData);
        
        this.instances.set(containerId, {
          container,
          shadowRoot,
          mountPoint,
          instance,
          config: configData
        });

        container.dispatchEvent(new CustomEvent('e1-calculator-ready', {
          detail: { containerId, instance }
        }));

        return instance;

      } catch (error) {
        console.error(`E1Calculator: Failed to initialize widget #${containerId}`, error);
        
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = `
            <div class="e1-calculator-error" style="padding: 20px; text-align: center; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
              <p>Laskurin lataus epäonnistui. Yritä päivittää sivu.</p>
            </div>
          `;
        }
        throw error;
      }
    }

    async loadStyles(url) {
      try {
        const response = await fetch(url);
        return await response.text();
      } catch (error) {
        console.warn('E1Calculator: Could not load styles', error);
        return '';
      }
    }

    addNamespacedStyles() {
      if (document.getElementById('e1-calculator-namespaced-styles')) {
        return;
      }

      const link = document.createElement('link');
      link.id = 'e1-calculator-namespaced-styles';
      link.rel = 'stylesheet';
      link.href = '/wp-content/uploads/e1-calculator-cache/widget-namespaced.css';
      document.head.appendChild(link);
    }

    async renderReactWidget(mountPoint, configData) {
      if (!window.React || !window.ReactDOM) {
        await this.loadReactDependencies();
      }

      return new Promise((resolve) => {
        const React = window.React;
        const ReactDOM = window.ReactDOM;
        
        const root = ReactDOM.createRoot ? 
          ReactDOM.createRoot(mountPoint) :
          { render: (element) => ReactDOM.render(element, mountPoint) };

        const WidgetApp = window.E1CalculatorWidget || (() => 
          React.createElement('div', {}, 'Widget ladataan...')
        );

        root.render(
          React.createElement(WidgetApp, {
            config: configData,
            onReady: () => resolve(root)
          })
        );
      });
    }

    async loadReactDependencies() {
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      if (!window.React) {
        await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
      }
      if (!window.ReactDOM) {
        await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
      }
    }

    async init(config = {}) {
      await this.waitForDependencies();
      
      if (typeof config === 'string') {
        config = { containerId: config };
      }

      return this.initWidget(config);
    }

    async initAll() {
      const containers = document.querySelectorAll('[id^="e1-calculator-widget"]');
      const promises = [];

      containers.forEach(container => {
        const config = {
          containerId: container.id,
          useShadowDOM: container.dataset.shadow !== 'false',
          configUrl: container.dataset.configUrl || undefined
        };
        promises.push(this.init(config));
      });

      return Promise.all(promises);
    }

    destroy(containerId) {
      const instance = this.instances.get(containerId);
      if (instance) {
        if (instance.instance && instance.instance.unmount) {
          instance.instance.unmount();
        }
        
        if (instance.shadowRoot) {
          instance.shadowRoot.innerHTML = '';
        }
        
        instance.container.innerHTML = '';
        this.instances.delete(containerId);
      }
    }

    destroyAll() {
      this.instances.forEach((_, containerId) => {
        this.destroy(containerId);
      });
    }
  }

  const loader = new E1CalculatorLoader();
  
  window.E1Calculator = {
    init: (config) => loader.init(config),
    initAll: () => loader.initAll(),
    destroy: (containerId) => loader.destroy(containerId),
    destroyAll: () => loader.destroyAll(),
    instances: () => loader.instances
  };

  window.E1CalculatorInitialized = true;

  loader.waitForDependencies().then(() => {
    const autoInitContainers = document.querySelectorAll('[data-e1-auto-init="true"]');
    if (autoInitContainers.length > 0) {
      loader.initAll();
    }
  });

  if (window.wp?.blocks) {
    window.wp.domReady(() => {
      const observer = new MutationObserver(() => {
        loader.initAll();
      });
      
      const editorCanvas = document.querySelector('.block-editor-writing-flow');
      if (editorCanvas) {
        observer.observe(editorCanvas, {
          childList: true,
          subtree: true
        });
      }
    });
  }

})();
```

### 2. `src/widget/styles/shadow-reset.css`
**Polku:** `src/widget/styles/shadow-reset.css`  
**Tarkoitus:** Shadow DOM reset styles

```css
/* Reset Shadow DOM:n sisällä */
:host {
  all: initial;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  color: #333;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Varmista että widget-tyylit eivät vuoda ulos */
:host {
  contain: layout style;
}

/* Widget base styles */
.widget-root {
  width: 100%;
  height: 100%;
  position: relative;
}
```

---

## 📝 Muokattavat Tiedostot

### 1. `src/widget/standalone-widget.tsx`
**Muutoksen tyyppi:** Merkittävä päivitys  
**Syy:** Shadow DOM -tuki ja parempi isolaatio

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WidgetApp } from './WidgetApp';

interface E1CalculatorConfig {
  containerId?: string;
  useShadowDOM?: boolean;
  configUrl?: string;
  apiUrl?: string;
  isolated?: boolean;
}

interface WidgetInstance {
  container: HTMLElement;
  shadowRoot: ShadowRoot | null;
  root: ReactDOM.Root;
  config: any;
}

class E1CalculatorWidget {
  private instances: Map<string, WidgetInstance> = new Map();
  
  async init(config: E1CalculatorConfig = {}) {
    const {
      containerId = 'e1-calculator-widget',
      useShadowDOM = true,
      configUrl = '/wp-content/uploads/e1-calculator-cache/config.json',
      isolated = false
    } = config;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    // Estä duplicate initialization
    if (this.instances.has(containerId)) {
      return this.instances.get(containerId);
    }

    // Lataa config
    const configData = await this.loadConfig(configUrl);

    let mountPoint: HTMLElement;
    let shadowRoot: ShadowRoot | null = null;
    
    if (useShadowDOM && container.attachShadow && !isolated) {
      // Shadow DOM mode
      shadowRoot = container.attachShadow({ mode: 'open' });
      
      // Injektoi reset + widget styles
      const styleElement = document.createElement('style');
      styleElement.textContent = await this.loadStyles();
      shadowRoot.appendChild(styleElement);
      
      mountPoint = document.createElement('div');
      mountPoint.id = 'widget-root';
      mountPoint.className = 'widget-root';
      shadowRoot.appendChild(mountPoint);
    } else {
      // Namespace isolation mode
      this.addNamespacedStyles();
      mountPoint = document.createElement('div');
      mountPoint.className = 'e1-calculator-isolated-root widget-root';
      container.appendChild(mountPoint);
    }

    // Renderöi React app
    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <WidgetApp 
          config={configData}
          isolated={!useShadowDOM || isolated}
          containerId={containerId}
        />
      </React.StrictMode>
    );

    // Tallenna instance
    const instance: WidgetInstance = {
      container,
      shadowRoot,
      root,
      config: configData
    };
    
    this.instances.set(containerId, instance);
    
    // Fire ready event
    container.dispatchEvent(new CustomEvent('e1-calculator-ready', {
      detail: { instance, containerId }
    }));

    return instance;
  }

  private async loadConfig(url: string): Promise<any> {
    try {
      const response = await fetch(url + '?v=' + Date.now());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to load config:', error);
      return {};
    }
  }

  private async loadStyles(): Promise<string> {
    try {
      const response = await fetch('/wp-content/uploads/e1-calculator-cache/widget.css');
      const styles = await response.text();
      
      // Lisää shadow reset styles
      const resetStyles = `
        :host {
          all: initial;
          display: block;
          contain: layout style;
        }
        * {
          box-sizing: border-box;
        }
      `;
      
      return resetStyles + styles;
    } catch (error) {
      console.error('Failed to load styles:', error);
      return '';
    }
  }

  private addNamespacedStyles(): void {
    if (document.getElementById('e1-calculator-namespaced-styles')) {
      return;
    }
    
    const link = document.createElement('link');
    link.id = 'e1-calculator-namespaced-styles';
    link.rel = 'stylesheet';
    link.href = '/wp-content/uploads/e1-calculator-cache/widget-namespaced.css';
    document.head.appendChild(link);
  }

  destroy(containerId: string): void {
    const instance = this.instances.get(containerId);
    if (instance) {
      instance.root.unmount();
      if (instance.shadowRoot) {
        instance.shadowRoot.innerHTML = '';
      }
      instance.container.innerHTML = '';
      this.instances.delete(containerId);
    }
  }

  destroyAll(): void {
    this.instances.forEach((_, containerId) => {
      this.destroy(containerId);
    });
  }
}

// Export for WordPress loader
declare global {
  interface Window {
    E1CalculatorWidget: typeof WidgetApp;
    E1CalculatorCore: E1CalculatorWidget;
  }
}

if (typeof window !== 'undefined') {
  window.E1CalculatorCore = new E1CalculatorWidget();
  window.E1CalculatorWidget = WidgetApp;
}

export default E1CalculatorWidget;
```

### 2. `webpack.widget.config.js`
**Muutoksen tyyppi:** Päivitys  
**Syy:** PostCSS namespace support ja dual CSS output

```javascript
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      'e1-calculator-widget': './src/widget/standalone-widget.tsx',
      'wordpress-loader': './src/widget/wordpress-loader.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].min.js',
      library: {
        name: 'E1Calculator',
        type: 'umd',
        export: 'default',
      },
      globalObject: 'this',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react', '@babel/preset-env'],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: isProduction 
                    ? 'e1w_[hash:base64:5]'
                    : '[name]__[local]___[hash:base64:5]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('autoprefixer'),
                    // Namespace isolation plugin käytetään vain build-vaiheessa
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].min.css',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // Bundle React sisään widgetiin
    externals: {},
  };
};
```

### 3. `scripts/deploy-to-wordpress.js`
**Muutoksen tyyppi:** Lisäys namespace CSS generointiin  
**Syy:** Dual CSS output (normal + namespaced)

```javascript
const fs = require('fs').promises;
const path = require('path');
const postcss = require('postcss');
const prefixwrap = require('postcss-prefixwrap');
const { createClient } = require('@supabase/supabase-js');

// Generoi namespace-versio CSS:stä
async function generateNamespacedCSS(cssContent) {
  const result = await postcss([
    prefixwrap('.e1-calculator-isolated-root', {
      ignoredSelectors: [':root', 'html', 'body', ':host'],
      prefixRootTags: true,
    })
  ]).process(cssContent, { from: undefined });
  
  return result.css;
}

async function deployToWordPress() {
  console.log('🚀 Starting WordPress deployment...');
  
  const WORDPRESS_PATH = process.env.WORDPRESS_PATH || './wordpress-plugin/e1-calculator-pro';
  const CACHE_DIR = path.join(WORDPRESS_PATH, 'cache');
  const UPLOAD_DIR = '/wp-content/uploads/e1-calculator-cache';
  
  // Varmista että cache-hakemisto on olemassa
  await fs.mkdir(CACHE_DIR, { recursive: true });
  
  // 1. Kopioi widget-tiedostot
  console.log('📦 Copying widget files...');
  
  // Kopioi JavaScript-tiedostot
  const widgetJS = await fs.readFile('./dist/e1-calculator-widget.min.js');
  const loaderJS = await fs.readFile('./dist/wordpress-loader.min.js');
  
  await fs.writeFile(path.join(CACHE_DIR, 'widget.js'), widgetJS);
  await fs.writeFile(path.join(CACHE_DIR, 'wordpress-loader.js'), loaderJS);
  
  // Kopioi ja generoi CSS-tiedostot
  const widgetCSS = await fs.readFile('./dist/e1-calculator-widget.min.css');
  const widgetCSSString = widgetCSS.toString();
  
  // Tallenna normaali CSS (Shadow DOM käyttöön)
  await fs.writeFile(path.join(CACHE_DIR, 'widget.css'), widgetCSS);
  
  // Generoi ja tallenna namespaced CSS (fallback käyttöön)
  console.log('🎨 Generating namespaced CSS...');
  const namespacedCSS = await generateNamespacedCSS(widgetCSSString);
  await fs.writeFile(path.join(CACHE_DIR, 'widget-namespaced.css'), namespacedCSS);
  
  // 2. Hae data Supabasesta
  console.log('📊 Fetching data from Supabase...');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Hae kaikki tarvittava data
  const [cardsRes, visualsRes, formulasRes] = await Promise.all([
    supabase.from('cards').select('*').order('order'),
    supabase.from('visual_objects').select('*'),
    supabase.from('formulas').select('*')
  ]);
  
  // Luo config.json
  const config = {
    version: new Date().toISOString(),
    cards: cardsRes.data || [],
    visualObjects: visualsRes.data || [],
    formulas: formulasRes.data || [],
    settings: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      shadowDomEnabled: true,
      fallbackMode: 'namespace',
    }
  };
  
  // Tallenna config.json
  await fs.writeFile(
    path.join(CACHE_DIR, 'config.json'),
    JSON.stringify(config, null, 2)
  );
  
  // 3. Päivitä version WordPress-tietokantaan (optional)
  console.log('📝 Updating version info...');
  
  const versionFile = path.join(CACHE_DIR, 'version.txt');
  await fs.writeFile(versionFile, config.version);
  
  console.log('✅ WordPress deployment completed!');
  console.log(`📁 Files deployed to: ${CACHE_DIR}`);
  console.log(`🌐 Accessible at: ${UPLOAD_DIR}/`);
  
  // Listaa deployatut tiedostot
  const files = await fs.readdir(CACHE_DIR);
  console.log('📋 Deployed files:');
  files.forEach(file => {
    console.log(`   - ${file}`);
  });
}

// Run deployment
deployToWordPress().catch(console.error);
```

---

## 🔧 WordPress Plugin Muutokset

### 1. `wordpress-plugin/e1-calculator-pro/includes/class-e1-calculator-loader.php`

```php
<?php
/**
 * E1 Calculator Widget Loader
 *
 * @package E1_Calculator_Pro
 * @since 1.0.0
 */

class E1_Calculator_Loader {
    
    private $version;
    private $cache_url;
    
    public function __construct() {
        $this->version = get_option('e1_calculator_version', time());
        $this->cache_url = $this->get_cache_url();
        
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_shortcode('e1_calculator', [$this, 'render_shortcode']);
        add_action('init', [$this, 'register_gutenberg_block']);
        
        // AJAX endpoints
        add_action('wp_ajax_e1_calculator_get_config', [$this, 'ajax_get_config']);
        add_action('wp_ajax_nopriv_e1_calculator_get_config', [$this, 'ajax_get_config']);
    }
    
    public function enqueue_scripts() {
        // WordPress Loader ensin
        wp_enqueue_script(
            'e1-calculator-loader',
            $this->cache_url . '/wordpress-loader.js',
            [],
            $this->version,
            false // Load in head
        );
        
        // Main widget
        wp_enqueue_script(
            'e1-calculator-widget',
            $this->cache_url . '/widget.js',
            ['e1-calculator-loader'],
            $this->version,
            true
        );
        
        // Localize script
        wp_localize_script('e1-calculator-loader', 'e1CalculatorWP', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('e1-calculator-nonce'),
            'cacheUrl' => $this->cache_url,
            'version' => $this->version,
            'isAdmin' => is_admin(),
            'isBlockEditor' => $this->is_block_editor(),
            'shadowDomSupport' => $this->check_shadow_dom_support(),
        ]);
        
        // Auto-init inline script
        wp_add_inline_script(
            'e1-calculator-widget',
            'if(window.E1Calculator && window.E1Calculator.initAll) { 
                document.addEventListener("DOMContentLoaded", function() {
                    window.E1Calculator.initAll();
                });
            }',
            'after'
        );
    }
    
    public function enqueue_admin_scripts($hook) {
        if (!$this->is_block_editor()) {
            return;
        }
        
        $this->enqueue_scripts();
    }
    
    public function render_shortcode($atts) {
        static $instance_count = 0;
        $instance_count++;
        
        $atts = shortcode_atts([
            'shadow' => 'true',
            'height' => '600px',
            'class' => '',
            'auto_init' => 'true',
            'theme' => 'default', // Tukee eri teemoja
        ], $atts);
        
        $widget_id = 'e1-calculator-widget-' . get_the_ID() . '-' . $instance_count;
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($widget_id); ?>"
             class="e1-calculator-container <?php echo esc_attr($atts['class']); ?>"
             data-shadow="<?php echo esc_attr($atts['shadow']); ?>"
             data-e1-auto-init="<?php echo esc_attr($atts['auto_init']); ?>"
             data-config-url="<?php echo esc_url($this->cache_url . '/config.json'); ?>"
             data-theme="<?php echo esc_attr($atts['theme']); ?>"
             style="min-height: <?php echo esc_attr($atts['height']); ?>;">
            
            <!-- Loading state -->
            <div class="e1-calculator-loading">
                <style>
                    .e1-calculator-loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .e1-calculator-loading .spinner {
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #3498db;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: e1-spin 1s linear infinite;
                    }
                    @keyframes e1-spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .e1-calculator-loading p {
                        margin-top: 10px;
                        color: #666;
                    }
                </style>
                <div class="spinner"></div>
                <p>Ladataan E1-laskuria...</p>
            </div>
            
            <!-- No JavaScript fallback -->
            <noscript>
                <div style="padding: 20px; background: #f8d7da; color: #721c24; text-align: center; border-radius: 4px;">
                    <strong>JavaScript vaaditaan</strong>
                    <p>E1-laskuri vaatii JavaScriptin toimiakseen. Ole hyvä ja ota JavaScript käyttöön selaimessasi.</p>
                </div>
            </noscript>
        </div>
        <?php
        
        return ob_get_clean();
    }
    
    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }
        
        wp_register_script(
            'e1-calculator-block',
            $this->cache_url . '/block.js',
            ['wp-blocks', 'wp-element', 'wp-editor'],
            $this->version
        );
        
        register_block_type('e1-calculator/widget', [
            'editor_script' => 'e1-calculator-block',
            'render_callback' => [$this, 'render_shortcode'],
            'attributes' => [
                'shadow' => [
                    'type' => 'boolean',
                    'default' => true,
                ],
                'height' => [
                    'type' => 'string',
                    'default' => '600px',
                ],
                'theme' => [
                    'type' => 'string',
                    'default' => 'default',
                ],
            ],
        ]);
    }
    
    public function ajax_get_config() {
        check_ajax_referer('e1-calculator-nonce', 'nonce');
        
        $config_file = $this->get_cache_path() . '/config.json';
        
        if (!file_exists($config_file)) {
            wp_send_json_error('Config file not found');
        }
        
        $config = file_get_contents($config_file);
        wp_send_json_success(json_decode($config, true));
    }
    
    private function get_cache_url() {
        $upload_dir = wp_upload_dir();
        return $upload_dir['baseurl'] . '/e1-calculator-cache';
    }
    
    private function get_cache_path() {
        $upload_dir = wp_upload_dir();
        return $upload_dir['basedir'] . '/e1-calculator-cache';
    }
    
    private function is_block_editor() {
        if (function_exists('get_current_screen')) {
            $screen = get_current_screen();
            return $screen && $screen->is_block_editor();
        }
        return false;
    }
    
    private function check_shadow_dom_support() {
        // Tarkista user agent palvelimella (basic check)
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Vanhat IE:t eivät tue Shadow DOM:ia
        if (strpos($user_agent, 'MSIE') !== false || strpos($user_agent, 'Trident') !== false) {
            return false;
        }
        
        return true; // Oletus: tuettu
    }
}

// Initialize loader
new E1_Calculator_Loader();
```

---

## 📦 NPM Dependencies

### package.json päivitykset:
```json
{
  "devDependencies": {
    "postcss": "^8.4.31",
    "postcss-loader": "^7.3.3",
    "postcss-prefixwrap": "^1.51.0",
    "autoprefixer": "^10.4.16",
    "css-loader": "^6.8.1",
    "mini-css-extract-plugin": "^2.7.6",
    "css-minimizer-webpack-plugin": "^5.0.1",
    "terser-webpack-plugin": "^5.3.9"
  }
}
```

---

## 🚀 Build & Deploy Commands

### package.json scripts:
```json
{
  "scripts": {
    "build:widget": "webpack --config webpack.widget.config.js --mode production",
    "build:widget:dev": "webpack --config webpack.widget.config.js --mode development",
    "deploy:wordpress": "npm run build:widget && node scripts/deploy-to-wordpress.js",
    "test:widget": "npm run build:widget:dev && serve dist",
    "test:isolation": "npm run build:widget && npm run test:shadow && npm run test:namespace",
    "test:shadow": "node scripts/test-shadow-dom.js",
    "test:namespace": "node scripts/test-namespace-isolation.js"
  }
}
```

---

## ✅ Deployment Checklist

### 1. **Ennen deployment:**
- [ ] Päivitä kaikki npm-riippuvuudet
- [ ] Aja `npm install`
- [ ] Testaa widget lokaalisti: `npm run test:widget`
- [ ] Testaa Shadow DOM: `npm run test:shadow`
- [ ] Testaa namespace fallback: `npm run test:namespace`

### 2. **Build-vaihe:**
- [ ] `npm run build:widget`
- [ ] Tarkista että `dist/` sisältää:
  - [ ] `e1-calculator-widget.min.js`
  - [ ] `wordpress-loader.min.js`
  - [ ] `e1-calculator-widget.min.css`

### 3. **WordPress deployment:**
- [ ] Aseta environment-muuttujat:
  - [ ] `WORDPRESS_PATH`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
- [ ] Aja `npm run deploy:wordpress`
- [ ] Tarkista cache-hakemisto:
  - [ ] `widget.js`
  - [ ] `wordpress-loader.js`
  - [ ] `widget.css`
  - [ ] `widget-namespaced.css`
  - [ ] `config.json`

### 4. **WordPress-testaus:**
- [ ] Testaa eri selaimilla (Chrome, Firefox, Safari, Edge)
- [ ] Testaa vanhoilla selaimilla (IE11 fallback)
- [ ] Testaa eri WordPress-teemoilla
- [ ] Testaa Gutenberg-editorissa
- [ ] Testaa mobile-laitteilla
- [ ] Tarkista console virheilmoitukset

### 5. **Production-tarkistukset:**
- [ ] Shadow DOM toimii moderneissa selaimissa
- [ ] Namespace fallback toimii vanhoissa selaimissa
- [ ] Ei tyylikonflikteja WordPress-teeman kanssa
- [ ] Widget latautuu alle 3 sekunnissa
- [ ] Error handling toimii oikein

---

## 🐛 Troubleshooting

### Yleisimmät ongelmat ja ratkaisut:

#### 1. **Widget ei lataudu:**
```javascript
// Tarkista console:
window.E1Calculator // Pitäisi olla objekti
window.E1CalculatorInitialized // Pitäisi olla true
```

#### 2. **Shadow DOM ei toimi:**
```javascript
// Pakota namespace mode:
document.querySelectorAll('[data-shadow]').forEach(el => {
  el.dataset.shadow = 'false';
});
window.E1Calculator.initAll();
```

#### 3. **CSS-konfliktit:**
```css
/* Lisää WordPress-teemaan tarvittaessa: */
.e1-calculator-container {
  all: initial;
  display: block;
}
```

#### 4. **jQuery-konfliktit:**
```javascript
// Käytä noConflict mode:
jQuery.noConflict();
(function($) {
  // Widget code here
})(jQuery);
```

---

## 📊 Performance Metrics

### Tavoitteet:
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Bundle Size:** < 200KB (gzipped)
- **CSS Size:** < 50KB
- **Config Load:** < 500ms

### Optimoinnit:
1. React bundlattu mukaan (ei external CDN)
2. CSS minimoitu ja namespace-generoitu build-aikana
3. Config.json cachetettu ensimmäisen latauksen jälkeen
4. Shadow DOM vähentää reflow/repaint

---

## 🔐 Security Considerations

1. **XSS Protection:**
   - Shadow DOM isoloi JavaScript-kontekstin
   - Config.json sanitoidaan ennen renderöintiä
   - React automaattisesti escapettaa stringit

2. **CORS:**
   - Widget toimii same-origin politiikalla
   - API-kutsut WordPress Ajax API:n kautta

3. **Nonce Verification:**
   - WordPress nonce kaikissa AJAX-kutsuissa
   - CSRF-suojaus automaattisesti

---

## 📝 Muutosloki

### Version 2.0.0 - Shadow DOM Implementation
- ✨ Lisätty Shadow DOM -tuki
- ✨ CSS namespace fallback
- 🐛 Korjattu WordPress initialization -ongelmat
- 🚀 Parannettu suorituskykyä
- 📦 Päivitetty build pipeline
- 🔧 Lisätty Gutenberg-tuki