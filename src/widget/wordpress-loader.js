/**
 * E1 Calculator Robust WordPress Loader
 * 
 * Features:
 * - Comprehensive dependency checking (DOM, jQuery, Block Editor)
 * - Exponential backoff retry logic for slow dependencies
 * - Automatic Shadow DOM/Namespace fallback detection
 * - User-friendly error handling with troubleshooting
 * - WordPress theme and editor compatibility
 * - Performance monitoring and logging
 */

(function(window, document, undefined) {
  'use strict';
  
  // Prevent multiple initialization
  if (window.E1CalculatorLoader) {
    return window.E1CalculatorLoader;
  }

  // Get WordPress configuration (passed via wp_localize_script)
  const wpConfig = window.e1_widget_config || {};
  const adminSettings = wpConfig.settings || {};
  
  // Configuration constants with admin setting overrides
  const CONFIG = {
    MAX_RETRY_ATTEMPTS: adminSettings.debug_mode ? 5 : 3,
    BASE_RETRY_DELAY: 200, // ms
    MAX_RETRY_DELAY: 5000, // ms
    DEPENDENCY_TIMEOUT: 15000, // ms
    PERFORMANCE_LOGGING: adminSettings.debug_mode || false,
    USER_FRIENDLY_ERRORS: true,
    SHADOW_DOM_MODE: adminSettings.shadow_dom_mode || 'auto',
    DEBUG_MODE: adminSettings.debug_mode || false
  };

  // Logging utility with performance tracking
  const Logger = {
    performance: {},
    
    log(level, message, data = null) {
      if (CONFIG.PERFORMANCE_LOGGING) {
        const timestamp = new Date().toISOString();
        const prefix = `[E1Calculator ${level.toUpperCase()}] ${timestamp}`;
        
        if (data) {
          console[level](prefix, message, data);
        } else {
          console[level](prefix, message);
        }
      }
    },
    
    info(message, data) { this.log('info', message, data); },
    warn(message, data) { this.log('warn', message, data); },
    error(message, data) { this.log('error', message, data); },
    
    startTimer(label) {
      this.performance[label] = performance.now();
    },
    
    endTimer(label) {
      if (this.performance[label]) {
        const duration = performance.now() - this.performance[label];
        this.info(`Performance: ${label} took ${duration.toFixed(2)}ms`);
        delete this.performance[label];
        return duration;
      }
    }
  };

  // Dependency detection utilities
  const DependencyDetector = {
    // Check if DOM is ready
    isDOMReady() {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    },

    // Check WordPress environment
    isWordPressReady() {
      // Frontend should not require window.wp; only block editor/admin does
      const isAdminOrEditor = document.body.classList.contains('wp-admin') ||
                              document.body.classList.contains('block-editor-page') ||
                              !!document.querySelector('.block-editor');
      const hasWPObject = typeof window.wp !== 'undefined';

      // In admin/block editor, wait for wp object; otherwise treat as ready
      if (isAdminOrEditor && !hasWPObject) {
        return false;
      }
      return true;
    },

    // Check jQuery availability (WordPress standard)
    isjQueryReady() {
      // WordPress usually includes jQuery, but it's optional for our widget
      return typeof window.jQuery === 'undefined' || 
             (typeof window.jQuery === 'function' && window.jQuery.fn);
    },

    // Check Block Editor environment
    isBlockEditorReady() {
      const isBlockEditor = document.body.classList.contains('block-editor-page') ||
                           document.body.classList.contains('wp-admin');
      
      if (!isBlockEditor) {
        return true; // Not in block editor, so ready
      }
      
      // In block editor, check for required objects
      return typeof window.wp !== 'undefined' && 
             typeof window.wp.blocks !== 'undefined' &&
             typeof window.wp.domReady !== 'undefined';
    },

    // Check if widget containers exist
    hasWidgetContainers() {
      return document.querySelectorAll('[id^="e1-calculator-widget"], [class*="e1-calculator-container"]').length > 0;
    },

    // Comprehensive readiness check
    isEnvironmentReady() {
      return {
        dom: this.isDOMReady(),
        wordpress: this.isWordPressReady(),
        jquery: this.isjQueryReady(),
        blockEditor: this.isBlockEditorReady(),
        containers: this.hasWidgetContainers()
      };
    }
  };

  // Exponential backoff utility
  const RetryManager = {
    calculateDelay(attempt) {
      const delay = CONFIG.BASE_RETRY_DELAY * Math.pow(2, attempt);
      return Math.min(delay, CONFIG.MAX_RETRY_DELAY);
    },

    async withRetry(fn, context = '', maxAttempts = CONFIG.MAX_RETRY_ATTEMPTS) {
      let lastError;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const result = await fn(attempt);
          
          if (attempt > 0) {
            Logger.info(`${context} succeeded on attempt ${attempt + 1}`);
          }
          
          return result;
        } catch (error) {
          lastError = error;
          
          if (attempt < maxAttempts - 1) {
            const delay = this.calculateDelay(attempt);
            Logger.warn(`${context} failed on attempt ${attempt + 1}, retrying in ${delay}ms`, error);
            await this.delay(delay);
          }
        }
      }
      
      Logger.error(`${context} failed after ${maxAttempts} attempts`, lastError);
      throw lastError;
    },

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };

  // Error display utilities
  const ErrorDisplay = {
    createErrorElement(containerId, error, troubleshooting = []) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'e1-calculator-error';
      errorDiv.setAttribute('data-container-id', containerId);
      
      errorDiv.innerHTML = `
        <div style="
          padding: 20px;
          margin: 10px 0;
          background: linear-gradient(135deg, #fee 0%, #fef5e7 100%);
          border: 1px solid #f5c6cb;
          border-left: 4px solid #dc3545;
          border-radius: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #721c24;
        ">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 20px; margin-right: 8px;">⚠️</span>
            <strong style="font-size: 16px;">E1-laskurin lataus epäonnistui</strong>
          </div>
          
          <p style="margin: 8px 0; line-height: 1.5;">
            ${this.getErrorMessage(error)}
          </p>
          
          ${troubleshooting.length > 0 ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f5c6cb;">
              <strong style="font-size: 14px; color: #856404;">🔧 Vianmääritys:</strong>
              <ul style="margin: 8px 0 0 20px; font-size: 14px; line-height: 1.4;">
                ${troubleshooting.map(tip => `<li style="margin: 4px 0;">${tip}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="margin-top: 16px; text-align: center;">
            <button 
              onclick="window.E1Calculator?.retry?.('${containerId}')" 
              style="
                background: #007cba;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 8px;
              "
            >
              🔄 Yritä uudelleen
            </button>
            <button 
              onclick="this.parentElement.parentElement.style.display='none'" 
              style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              "
            >
              ✕ Piilota
            </button>
          </div>
        </div>
      `;
      
      return errorDiv;
    },

    getErrorMessage(error) {
      if (typeof error === 'string') return error;
      
      // Common error patterns
      if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
        return 'Verkko-ongelma. Tarkista internetyhteytesi.';
      }
      
      if (error?.message?.includes('config')) {
        return 'Laskurin asetustiedostoja ei löytynyt. Ota yhteyttä sivuston ylläpitäjään.';
      }
      
      if (error?.message?.includes('Shadow DOM') || error?.message?.includes('attachShadow')) {
        return 'Selaimesi ei tue kaikkia ominaisuuksia. Laskuri yrittää käynnistyä yhteensopivuustilassa.';
      }
      
      return 'Odottamaton virhe tapahtui. Jos ongelma jatkuu, päivitä sivu tai ota yhteyttä tukeen.';
    },

    getTroubleshootingTips(error, environment) {
      const tips = [];
      
      if (!environment.dom) {
        tips.push('Sivu ei ole vielä latautunut kokonaan');
      }
      
      if (!environment.wordpress) {
        tips.push('WordPress-ympäristö ei ole valmis');
      }
      
      if (!environment.containers) {
        tips.push('Laskurin säilöelementtiä ei löydy sivulta');
      }
      
      if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
        tips.push('Tarkista internetyhteytesi');
        tips.push('Varmista että sivuston palvelin vastaa');
      }
      
      if (error?.message?.includes('config')) {
        tips.push('Varmista että laskuri on asennettu oikein');
        tips.push('Tarkista WordPress-pluginin asetukset');
      }
      
      return tips;
    }
  };

  // Shadow DOM support detection
  const ShadowDOMDetector = {
    isSupported() {
      return typeof Element !== 'undefined' && 
             typeof Element.prototype.attachShadow === 'function';
    },

    shouldUseShadowDOM(container) {
      // Check explicit data attribute
      if (container.dataset.shadow === 'false') {
        return false;
      }
      
      // Disable in block editor (can cause issues)
      const isBlockEditor = document.body.classList.contains('block-editor-page') ||
                           document.body.classList.contains('wp-admin') ||
                           document.querySelector('.block-editor');
      
      if (isBlockEditor) {
        Logger.info('Block editor detected, using namespace fallback');
        return false;
      }
      
      // Check browser support
      if (!this.isSupported()) {
        Logger.info('Shadow DOM not supported, using namespace fallback');
        return false;
      }
      
      // Check for known problematic themes/plugins
      const problematicSelectors = [
        '.elementor', '.divi-theme', '.avada-theme',
        '[data-elementor-type]', '.vc_row'
      ];
      
      for (const selector of problematicSelectors) {
        if (document.querySelector(selector)) {
          Logger.info(`Problematic theme/plugin detected (${selector}), using namespace fallback`);
          return false;
        }
      }
      
      return true;
    }
  };

  // Main WordPress Loader class
  class E1CalculatorWordPressLoader {
    constructor() {
      this.instances = new Map();
      this.configCache = null;
      this.initPromise = null;
      this.performanceMetrics = {};
      
      Logger.info('E1Calculator WordPress Loader initialized');
    }

    // Wait for all dependencies with comprehensive checking
    async waitForDependencies() {
      Logger.startTimer('dependency-wait');
      
      return RetryManager.withRetry(async (attempt) => {
        const environment = DependencyDetector.isEnvironmentReady();
        
        Logger.info(`Dependency check attempt ${attempt + 1}`, environment);
        
        // All critical dependencies must be ready
        const criticalChecks = ['dom', 'wordpress', 'jquery', 'blockEditor'];
        const failedChecks = criticalChecks.filter(check => !environment[check]);
        
        if (failedChecks.length > 0) {
          throw new Error(`Dependencies not ready: ${failedChecks.join(', ')}`);
        }
        
        // Containers check is less critical, might appear later
        if (!environment.containers && attempt < 2) {
          throw new Error('Widget containers not found yet');
        }
        
        Logger.endTimer('dependency-wait');
        return environment;
        
      }, 'Dependency waiting');
    }

    // Load configuration with retry logic
    async loadConfig(configUrl) {
      if (this.configCache) {
        return this.configCache;
      }

      Logger.startTimer('config-load');
      
      const config = await RetryManager.withRetry(async (attempt) => {
        // Try different loading methods
        const methods = [
          () => this.fetchConfig(configUrl),
          () => this.loadConfigWithjQuery(configUrl),
          () => this.loadConfigWithXHR(configUrl)
        ];
        
        const method = methods[Math.min(attempt, methods.length - 1)];
        return await method();
        
      }, `Config loading from ${configUrl}`);

      this.configCache = config;
      Logger.endTimer('config-load');
      
      return config;
    }

    // Fetch-based config loading
    async fetchConfig(configUrl) {
      const cacheBuster = `?v=${Date.now()}&t=${Math.random()}`;
      const response = await fetch(configUrl + cacheBuster, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const config = await response.json();
      
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration data received');
      }
      
      return config;
    }

    // jQuery-based config loading (WordPress fallback)
    async loadConfigWithjQuery(configUrl) {
      if (typeof window.jQuery === 'undefined') {
        throw new Error('jQuery not available');
      }
      
      return new Promise((resolve, reject) => {
        window.jQuery.ajax({
          url: configUrl,
          type: 'GET',
          dataType: 'json',
          cache: false,
          timeout: 10000,
          success: (data) => {
            if (!data || typeof data !== 'object') {
              reject(new Error('Invalid configuration data'));
              return;
            }
            resolve(data);
          },
          error: (xhr, status, error) => {
            reject(new Error(`jQuery AJAX failed: ${status} - ${error}`));
          }
        });
      });
    }

    // XMLHttpRequest fallback
    async loadConfigWithXHR(configUrl) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', configUrl + `?v=${Date.now()}`, true);
        xhr.timeout = 10000;
        xhr.setRequestHeader('Accept', 'application/json');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (!data || typeof data !== 'object') {
                reject(new Error('Invalid configuration data'));
                return;
              }
              resolve(data);
            } catch (error) {
              reject(new Error('Failed to parse configuration JSON'));
            }
          } else {
            reject(new Error(`XHR failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during XHR'));
        xhr.ontimeout = () => reject(new Error('XHR timeout'));
        
        xhr.send();
      });
    }

    // Initialize widget with comprehensive error handling
    async initWidget(config) {
      const {
        containerId,
        useShadowDOM = 'auto',
        configUrl = '/wp-content/uploads/e1-calculator-cache/config.json',
        apiUrl
      } = config;

      Logger.startTimer(`widget-init-${containerId}`);
      
      try {
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error(`Container element #${containerId} not found in DOM`);
        }

        // Ensure no focus outline/border is shown on the host container
        try {
          container.classList.add('e1-no-focus-outline');
          container.style.outline = 'none';
          container.style.boxShadow = 'none';
          const globalStyleId = 'e1-global-no-outline';
          if (!document.getElementById(globalStyleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = globalStyleId;
            styleEl.textContent = `
              .e1-no-focus-outline:focus,
              .e1-no-focus-outline:focus-visible,
              .e1-no-focus-outline:focus-within { outline: none !important; box-shadow: none !important; }
            `;
            document.head.appendChild(styleEl);
          }
        } catch (_) {}

        // Check for existing instance
        if (this.instances.has(containerId)) {
          Logger.info(`Widget ${containerId} already initialized, skipping`);
          return this.instances.get(containerId);
        }

        // Hide loading state
        const loadingEl = container.querySelector('.e1-calculator-loading');
        if (loadingEl) {
          loadingEl.style.display = 'none';
        }

        // Load configuration
        const configData = await this.loadConfig(configUrl);

        // Determine isolation method
        const shouldUseShadowDOM = useShadowDOM === 'auto' ? 
          ShadowDOMDetector.shouldUseShadowDOM(container) : 
          Boolean(useShadowDOM);

        // Initialize with appropriate isolation
        let mountPoint, shadowRoot = null;
        
        if (shouldUseShadowDOM) {
          ({ mountPoint, shadowRoot } = await this.initWithShadowDOM(container));
        } else {
          mountPoint = await this.initWithNamespace(container);
        }

        // Wait for main widget script
        await this.waitForMainWidget();

        // Render widget
        const instance = await this.renderWidget(mountPoint, configData, {
          useShadowDOM: shouldUseShadowDOM,
          containerId,
          apiUrl // Pass API URL to enhanced widget
        });

        // Store instance
        const instanceData = {
          container,
          shadowRoot,
          mountPoint,
          instance,
          config: configData,
          isolationMode: shouldUseShadowDOM ? 'shadow-dom' : 'namespace'
        };
        
        this.instances.set(containerId, instanceData);

        // Dispatch ready event
        container.dispatchEvent(new CustomEvent('e1-calculator-ready', {
          detail: { 
            containerId, 
            instance: instanceData,
            isolationMode: instanceData.isolationMode
          }
        }));

        Logger.endTimer(`widget-init-${containerId}`);
        Logger.info(`Widget ${containerId} initialized successfully with ${instanceData.isolationMode}`);
        
        return instanceData;

      } catch (error) {
        Logger.error(`Failed to initialize widget ${containerId}`, error);
        
        // Show user-friendly error
        await this.showErrorMessage(containerId, error);
        
        Logger.endTimer(`widget-init-${containerId}`);
        throw error;
      }
    }

    // Initialize with Shadow DOM
    async initWithShadowDOM(container) {
      try {
        const shadowRoot = container.attachShadow({ mode: 'open' });
        
        // Load and inject reset styles
        const resetCSS = await this.loadResetStyles();
        const styleEl = document.createElement('style');
        styleEl.textContent = resetCSS;
        shadowRoot.appendChild(styleEl);
        
        // Load main widget styles
        await this.loadWidgetStylesIntoShadow(shadowRoot);
        
        // Create mount point
        const mountPoint = document.createElement('div');
        mountPoint.className = 'widget-root';
        shadowRoot.appendChild(mountPoint);
        
        return { mountPoint, shadowRoot };
        
      } catch (error) {
        Logger.warn('Shadow DOM initialization failed, falling back to namespace', error);
        throw error;
      }
    }

    // Initialize with namespace isolation
    async initWithNamespace(container) {
      // Load namespaced styles
      await this.loadNamespacedStyles();
      
      // Clear container and create isolated root
      container.innerHTML = '';
      const mountPoint = document.createElement('div');
      mountPoint.className = 'e1-calculator-isolated-root widget-root';
      container.appendChild(mountPoint);
      
      return mountPoint;
    }

    // Load Shadow DOM reset styles
    async loadResetStyles() {
      const resetCSS = `
        /* E1 Calculator Shadow DOM Reset */
        :host {
          /* Do NOT reset 'all' so CSS variables from the host/page cascade in */
          display: block;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: #1a1a1a;
          /* Avoid layout containment so position: sticky works across ancestors */
          contain: paint style;
          isolation: isolate;
          width: 100%;
          min-height: 400px;
        }
        
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          border: 0;
          font-size: 100%;
          font: inherit;
          vertical-align: baseline;
        }
        
        .widget-root {
          width: 100%;
          height: 100%;
          position: relative;
          background: #ffffff;
          border-radius: 8px;
          /* Allow sticky descendants to track viewport/window scroll */
          overflow: visible;
          z-index: 1;
        }
      `;
      
      return resetCSS;
    }

    // Load widget styles into Shadow DOM
    async loadWidgetStylesIntoShadow(shadowRoot) {
      try {
        const cssUrl = '/wp-content/uploads/e1-calculator-cache/widget.css';
        const response = await fetch(cssUrl);
        const css = await response.text();
        
        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        shadowRoot.appendChild(styleEl);
        
      } catch (error) {
        Logger.warn('Failed to load widget styles into shadow DOM', error);
      }
    }

    // Load namespaced styles
    async loadNamespacedStyles() {
      const styleId = 'e1-calculator-namespaced-styles';
      
      if (document.getElementById(styleId)) {
        return;
      }
      
      const link = document.createElement('link');
      link.id = styleId;
      link.rel = 'stylesheet';
      link.href = '/wp-content/uploads/e1-calculator-cache/widget-namespaced.css';
      
      return new Promise((resolve, reject) => {
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    }

    // Wait for main widget script
    async waitForMainWidget() {
      return RetryManager.withRetry(async (attempt) => {
        if (typeof window.E1CalculatorWidget === 'undefined' || 
            typeof window.E1CalculatorWidget.init === 'undefined') {
          throw new Error('Main E1Calculator widget not loaded');
        }
        
        return true;
      }, 'Main widget loading', 3);
    }

    // Render widget instance
    async renderWidget(mountPoint, configData, options) {
      // Use the main widget's initialization
      if (window.E1CalculatorWidget && window.E1CalculatorWidget.init) {
        return window.E1CalculatorWidget.init({
          container: mountPoint,
          config: configData,
          ...options
        });
      }
      
      throw new Error('Main E1Calculator widget not available');
    }

    // Show user-friendly error message
    async showErrorMessage(containerId, error) {
      if (!CONFIG.USER_FRIENDLY_ERRORS) {
        return;
      }
      
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const environment = DependencyDetector.isEnvironmentReady();
      const troubleshooting = ErrorDisplay.getTroubleshootingTips(error, environment);
      const errorElement = ErrorDisplay.createErrorElement(containerId, error, troubleshooting);
      
      container.innerHTML = '';
      container.appendChild(errorElement);
    }

    // Public API methods
    async init(config = {}) {
      if (typeof config === 'string') {
        config = { containerId: config };
      }
      
      await this.waitForDependencies();
      return this.initWidget(config);
    }

    async initAll() {
      try {
        await this.waitForDependencies();
        
        const containers = document.querySelectorAll(
          '[id^="e1-calculator-widget"], [class*="e1-calculator-container"]'
        );
        
        if (containers.length === 0) {
          Logger.info('No E1Calculator containers found on page');
          return [];
        }
        
        Logger.info(`Found ${containers.length} E1Calculator containers`);
        
        const initPromises = Array.from(containers).map(container => {
          const config = {
            containerId: container.id || `e1-calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            useShadowDOM: container.dataset.shadow || 'auto',
            configUrl: container.dataset.configUrl,
            apiUrl: container.dataset.apiUrl // Pass API URL from data attribute
          };
          
          // Set ID if missing
          if (!container.id) {
            container.id = config.containerId;
          }
          
          return this.init(config).catch(error => {
            Logger.error(`Failed to initialize container ${config.containerId}`, error);
            return null;
          });
        });
        
        const results = await Promise.all(initPromises);
        const successful = results.filter(result => result !== null);
        
        Logger.info(`Successfully initialized ${successful.length}/${containers.length} widgets`);
        return successful;
        
      } catch (error) {
        Logger.error('Failed to initialize widgets', error);
        throw error;
      }
    }

    // Retry failed widget
    async retry(containerId) {
      Logger.info(`Retrying widget initialization for ${containerId}`);
      
      // Clear cached config to force reload
      this.configCache = null;
      
      // Remove existing instance
      if (this.instances.has(containerId)) {
        this.destroy(containerId);
      }
      
      // Clear error display
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<div class="e1-calculator-loading"><p>Yritetään uudelleen...</p></div>';
      }
      
      return this.init({ containerId });
    }

    // Destroy widget instance
    destroy(containerId) {
      const instance = this.instances.get(containerId);
      if (instance) {
        try {
          if (instance.instance && typeof instance.instance.destroy === 'function') {
            instance.instance.destroy();
          }
          
          if (instance.shadowRoot) {
            instance.shadowRoot.innerHTML = '';
          } else {
            instance.container.innerHTML = '';
          }
          
          this.instances.delete(containerId);
          Logger.info(`Widget ${containerId} destroyed`);
          
        } catch (error) {
          Logger.error(`Failed to destroy widget ${containerId}`, error);
        }
      }
    }

    // Destroy all instances
    destroyAll() {
      const containerIds = Array.from(this.instances.keys());
      containerIds.forEach(id => this.destroy(id));
      
      // Remove namespaced styles
      const namespacedStyles = document.getElementById('e1-calculator-namespaced-styles');
      if (namespacedStyles) {
        namespacedStyles.remove();
      }
      
      Logger.info('All widgets destroyed');
    }

    // Get instance information
    getInstances() {
      return new Map(this.instances);
    }

    // Get performance metrics
    getPerformanceMetrics() {
      return { ...this.performanceMetrics };
    }
  }

  // Initialize loader
  const loader = new E1CalculatorWordPressLoader();
  
  // Global API
  window.E1Calculator = window.E1Calculator || {};
  Object.assign(window.E1Calculator, {
    // Core methods
    init: (config) => loader.init(config),
    initAll: () => loader.initAll(),
    retry: (containerId) => loader.retry(containerId),
    destroy: (containerId) => loader.destroy(containerId),
    destroyAll: () => loader.destroyAll(),
    
    // Information methods
    instances: () => loader.getInstances(),
    performance: () => loader.getPerformanceMetrics(),
    
    // Utility methods
    isReady: () => DependencyDetector.isEnvironmentReady(),
    supportsShadowDOM: () => ShadowDOMDetector.isSupported()
  });
  
  // Mark as loaded
  window.E1CalculatorLoader = loader;
  
  // Auto-initialization
  (async function autoInit() {
    try {
      await loader.waitForDependencies();
      
      // Auto-init containers with data-e1-auto-init="true"
      const autoInitContainers = document.querySelectorAll('[data-e1-auto-init="true"]');
      if (autoInitContainers.length > 0) {
        Logger.info(`Auto-initializing ${autoInitContainers.length} widgets`);
        await loader.initAll();
      }
      
    } catch (error) {
      Logger.error('Auto-initialization failed', error);
    }
  })();

  // WordPress Block Editor integration
  if (typeof window.wp !== 'undefined' && window.wp.domReady) {
    window.wp.domReady(() => {
      // Handle dynamic content in block editor
      const observeBlockEditor = () => {
        const targetNode = document.querySelector('.block-editor-writing-flow') || 
                          document.querySelector('.edit-post-visual-editor') ||
                          document.body;
        
        if (targetNode) {
          const observer = new MutationObserver((mutations) => {
            let hasNewWidgets = false;
            
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const widgets = node.querySelectorAll('[id^="e1-calculator-widget"], [class*="e1-calculator-container"]');
                  if (widgets.length > 0) {
                    hasNewWidgets = true;
                  }
                }
              });
            });
            
            if (hasNewWidgets) {
              Logger.info('New widgets detected in block editor, initializing...');
              loader.initAll().catch(error => {
                Logger.error('Failed to initialize new widgets in block editor', error);
              });
            }
          });
          
          observer.observe(targetNode, {
            childList: true,
            subtree: true
          });
          
          Logger.info('Block editor observer initialized');
        }
      };
      
      // Delay observer setup to ensure block editor is ready
      setTimeout(observeBlockEditor, 1000);
    });
  }

  return loader;

})(window, document);