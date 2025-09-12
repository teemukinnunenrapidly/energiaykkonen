import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { CardSystemContainer } from '../components/card-system/CardSystemContainer';
import { CardProvider } from '../components/card-system/CardContext';
import { ErrorBoundary, ErrorDisplay, LoadingWithError, ErrorInfo } from '../components/error-handling/ErrorDisplay';
import { errorManager, loadJSONWithRetry, loadResourceWithRetry } from '../components/error-handling/ErrorManager';
import designTokens from '../../cardstream-complete-config.json';
import './widget-styles.css';
import '../components/error-handling/error-styles.css';
import shadowResetCSS from './styles/shadow-reset.css?raw';

// Widget configuration interface (enhanced with error handling options)
interface WidgetConfig {
  cloudflareAccountHash?: string;
  theme?: string;
  maxWidth?: string | number;
  maxHeight?: string | number;
  height?: number;
  showVisualSupport?: boolean;
  showBlurredCards?: boolean;
  customTokens?: any;
  progressiveImageLoading?: boolean;
  configUrl?: string;
  apiUrl?: string; // Vercel API URL for dynamic fetching
  useShadowDOM?: boolean;
  data?: any;
  
  // Error handling configuration
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showDetailedErrors?: boolean;
  onError?: (error: ErrorInfo) => void;
  
  // WordPress plugin format fields
  cards?: any[];
  visuals?: any[];
  cardStreamConfig?: any;
  calculations?: any;
  version?: string;
  generated_at?: string;
}

// Widget instance manager (enhanced)
interface WidgetInstance {
  unmount: () => void;
  updateConfig: (newConfig: WidgetConfig) => void;
  shadowRoot: ShadowRoot | null;
  mountPoint: HTMLElement;
  elementId: string;
  mode: 'shadow' | 'namespace';
  errorStats: () => any;
  retry: () => void;
}

// Global widget instances registry
const widgetInstances = new Map<string, WidgetInstance>();

// Helper function to generate CSS variables as string
function generateCSSVariables(tokens: any): string {
  let cssVariables = '';
  
  // Container tokens
  if (tokens.container) {
    cssVariables += `--e1-container-max-width: ${tokens.container.maxWidth}; `;
    cssVariables += `--e1-container-padding: ${tokens.container.padding}; `;
    cssVariables += `--e1-container-background: ${tokens.container.background}; `;
    cssVariables += `--e1-container-border-radius: ${tokens.container.borderRadius}; `;
    cssVariables += `--e1-container-box-shadow: ${tokens.container.boxShadow}; `;
  }
  
  // Color tokens with error state support
  if (tokens.colors) {
    if (tokens.colors.brand) {
      cssVariables += `--e1-color-primary: ${tokens.colors.brand.primary}; `;
      cssVariables += `--e1-color-primary-hover: ${tokens.colors.brand.primaryHover}; `;
      cssVariables += `--e1-color-primary-light: ${tokens.colors.brand.primaryLight}; `;
    }
    if (tokens.colors.text) {
      cssVariables += `--e1-text-primary: ${tokens.colors.text.primary}; `;
      cssVariables += `--e1-text-secondary: ${tokens.colors.text.secondary}; `;
      cssVariables += `--e1-text-tertiary: ${tokens.colors.text.tertiary}; `;
      cssVariables += `--e1-text-muted: ${tokens.colors.text.muted || '#6b7280'}; `;
    }
    if (tokens.colors.background) {
      cssVariables += `--e1-bg-primary: ${tokens.colors.background.primary}; `;
      cssVariables += `--e1-bg-secondary: ${tokens.colors.background.secondary}; `;
      cssVariables += `--e1-bg-tertiary: ${tokens.colors.background.tertiary}; `;
    }
    if (tokens.colors.state) {
      cssVariables += `--e1-state-success: ${tokens.colors.state.success}; `;
      cssVariables += `--e1-state-error: ${tokens.colors.state.error}; `;
      cssVariables += `--e1-state-warning: ${tokens.colors.state.warning}; `;
      cssVariables += `--e1-state-info: ${tokens.colors.state.info}; `;
      
      // Error UI specific variables
      cssVariables += `--e1-state-error-bg: ${tokens.colors.state.errorBg || '#fef2f2'}; `;
      cssVariables += `--e1-state-error-border: ${tokens.colors.state.errorBorder || '#fecaca'}; `;
      cssVariables += `--e1-state-error-light: ${tokens.colors.state.errorLight || '#fee2e2'}; `;
    }
  }
  
  // Add remaining necessary tokens...
  if (tokens.spacing) {
    cssVariables += `--e1-spacing-xs: ${tokens.spacing.xs || '4px'}; `;
    cssVariables += `--e1-spacing-sm: ${tokens.spacing.sm || '8px'}; `;
    cssVariables += `--e1-spacing-md: ${tokens.spacing.md || '16px'}; `;
    cssVariables += `--e1-spacing-lg: ${tokens.spacing.lg || '24px'}; `;
    cssVariables += `--e1-spacing-xl: ${tokens.spacing.xl || '32px'}; `;
  }
  
  return cssVariables;
}

// Apply design tokens to CSS variables with Shadow DOM support
function applyDesignTokens(
  tokens: any = designTokens.cardStreamConfig, 
  customTokens?: any,
  targetElement?: HTMLElement | ShadowRoot
) {
  const mergedTokens = customTokens ? { ...tokens, ...customTokens } : tokens;
  
  // For Shadow DOM, inject CSS variables as a style element
  if (targetElement && 'host' in targetElement) {
    const shadowRoot = targetElement as ShadowRoot;
    let variableStyle = shadowRoot.querySelector('#e1-design-tokens') as HTMLStyleElement;
    
    if (!variableStyle) {
      variableStyle = document.createElement('style');
      variableStyle.id = 'e1-design-tokens';
      shadowRoot.appendChild(variableStyle);
    }
    
    const cssVariables = generateCSSVariables(mergedTokens);
    variableStyle.textContent = `:host { ${cssVariables} }`;
    return;
  }
  
  // For regular elements, set CSS custom properties
  const root = (targetElement as HTMLElement) || document.documentElement;
  const cssVariables = generateCSSVariables(mergedTokens);
  
  // Parse and apply CSS variables
  cssVariables.split(';').forEach(declaration => {
    const [property, value] = declaration.split(':').map(s => s.trim());
    if (property && value) {
      root.style.setProperty(property, value);
    }
  });
}

// Enhanced load configuration function with retry logic
async function loadConfigDataWithRetry(
  configUrl: string, 
  widgetId?: string,
  onRetry?: () => void
): Promise<any> {
  try {
    console.log(`🔄 Loading config from: ${configUrl}`);
    
    const config = await loadJSONWithRetry(configUrl, {
      widgetId,
      url: configUrl
    });
    
    console.log('✅ Successfully loaded widget config:', {
      version: config.version,
      cards: config.data?.cards?.length || 0,
      visualObjects: Object.keys(config.data?.visualObjects || {}).length,
      formulas: config.data?.formulas?.length || 0
    });
    
    return config;
    
  } catch (error) {
    console.error('❌ Failed to load config after all retries:', error);
    throw error;
  }
}

// Enhanced widget component with comprehensive error handling
const E1CalculatorWidget: React.FC<{ 
  config: WidgetConfig; 
  isolationMode?: 'shadow' | 'namespace';
  elementId?: string;
}> = ({ 
  config, 
  isolationMode = 'namespace',
  elementId
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [widgetData, setWidgetData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Handle errors with classification and logging
  const handleError = useCallback((err: any, context?: string) => {
    const errorInfo = errorManager.classifyError(err, {
      widgetId: elementId,
      isolationMode,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      retryAttempt: retryCount
    });
    
    console.error(`🚨 Widget Error (${context || 'Unknown'}):`, errorInfo);
    
    setError(errorInfo);
    setIsLoading(false);
    
    // Call custom error handler if provided
    if (config.onError) {
      config.onError(errorInfo);
    }
    
    // Fire error event on container
    if (elementId) {
      const container = document.getElementById(elementId);
      if (container) {
        container.dispatchEvent(new CustomEvent('e1-calculator-error', {
          detail: { error: errorInfo, context }
        }));
      }
    }
  }, [config.onError, elementId, isolationMode, retryCount]);

  // Retry function
  const handleRetry = useCallback(async () => {
    if (retryCount >= (config.maxRetries || 3)) {
      console.warn('🚫 Maximum retry attempts reached');
      return;
    }
    
    console.log(`🔄 Retrying widget initialization (attempt ${retryCount + 1})`);
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
    
    // Trigger re-initialization
    loadData();
  }, [retryCount, config.maxRetries]);

  // Enhanced data loading with error handling
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Apply design tokens first. If running inside Shadow DOM, scope variables to that root
      let tokenTarget: any = undefined;
      try {
        // Prefer the root node of our rendered container (works in both Shadow and regular DOM)
        const containerRoot: any = containerRef.current?.getRootNode?.();
        if (containerRoot && (containerRoot as any).host) {
          tokenTarget = containerRoot; // ShadowRoot
        } else if (elementId) {
          // Fallback: attempt via elementId if available
          const hostEl = document.getElementById(elementId);
          const rootNode: any = hostEl?.getRootNode?.();
          if (rootNode && (rootNode as any).host) {
            tokenTarget = rootNode; // ShadowRoot
          }
        }
      } catch {}
      applyDesignTokens(designTokens.cardStreamConfig, config.customTokens, tokenTarget);
      
      // Store Cloudflare account hash globally for image loading
      if (config.cloudflareAccountHash) {
        (window as any).__E1_CLOUDFLARE_HASH = config.cloudflareAccountHash;
        process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH = config.cloudflareAccountHash;
      }
      
      let data = null;
      let rootConfig: any = null; // store last loaded root config (for settings/api)
      
      // Try multiple data sources with error handling
      try {
        // 1. Try API URL first if available (for real-time data)
        if (!data && config.apiUrl) {
          try {
            console.log('🚀 Attempting to load fresh data from Vercel API:', config.apiUrl);
            const loadedConfig = await loadConfigDataWithRetry(config.apiUrl, elementId);
            rootConfig = loadedConfig;
            data = loadedConfig.data || loadedConfig;
            console.log('✅ Successfully loaded data from Vercel API');
            
            if (loadedConfig.cloudflareAccountHash) {
              (window as any).__E1_CLOUDFLARE_HASH = loadedConfig.cloudflareAccountHash;
              process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH = loadedConfig.cloudflareAccountHash;
            }
          } catch (apiError) {
            console.warn('⚠️ API URL failed, falling back to config.json:', apiError);
            // Continue to fallback methods below
          }
        }
        
        // 2. Check for WordPress config data (fallback)
        if (!data && typeof window !== 'undefined') {
          const configKeys = Object.keys(window).filter(key => key.startsWith('E1_WIDGET_CONFIG_'));
          if (configKeys.length > 0) {
            const wpConfig = (window as any)[configKeys[0]];
            if (wpConfig && (wpConfig.data || wpConfig.cards)) {
              console.log('✅ Using WordPress config data as fallback');
              data = wpConfig.data || wpConfig;
            }
          }
        }
        
        // 3. Check provided data (fallback)
        if (!data && config.data) {
          console.log('✅ Using provided config data as fallback');
          data = config.data;
        }
        
        // 4. Load from config URL with retry logic (fallback)
        if (!data && config.configUrl) {
          console.log('🔄 Loading data from config.json URL as fallback');
          const loadedConfig = await loadConfigDataWithRetry(config.configUrl, elementId);
          rootConfig = loadedConfig;
          data = loadedConfig.data || loadedConfig;
          
          if (loadedConfig.cloudflareAccountHash) {
            (window as any).__E1_CLOUDFLARE_HASH = loadedConfig.cloudflareAccountHash;
            process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH = loadedConfig.cloudflareAccountHash;
          }
          // Expose settings/api from root-level config so submit flow can find leadApiUrl
          if (loadedConfig.settings || loadedConfig.api) {
            (window as any).__E1_WIDGET_SETTINGS__ = loadedConfig.settings || {};
            (window as any).__E1_WIDGET_API__ = loadedConfig.api || {};
          }
        }
        
        // 5. Try default WordPress plugin location (fallback)
        if (!data) {
          try {
            const defaultUrl = '/wp-content/plugins/e1-calculator-pro/cache/config.json';
            console.log('🔄 Trying default WordPress location as final fallback');
            const loadedConfig = await loadConfigDataWithRetry(defaultUrl, elementId);
            data = loadedConfig.data || loadedConfig;
          } catch (defaultError) {
            console.warn('Default location failed, checking for mock data');
            
            // 6. Check for mock data in development (last resort)
            if ((window as any).__E1_MOCK_DATA) {
              console.log('✅ Using mock data for development');
              data = (window as any).__E1_MOCK_DATA;
            }
          }
        }
        
        if (!data) {
          throw new Error('No data available - check configUrl, provide data prop, or ensure WordPress plugin is properly configured');
        }
        
        // Validate data structure
        if (!data.cards || !Array.isArray(data.cards)) {
          throw new Error('Invalid data structure - cards array is missing or invalid');
        }
        
        // Transform data if needed
        data = adaptDataFormat(data);
        
        // Store globally for components
        (window as any).__E1_WIDGET_DATA = {
          cards: data.cards || [],
          visualObjects: data.visualObjects || {},
          formulas: data.formulas || [],
          lookupTables: data.lookupTables || {},
          theme: data.theme || {},
          cloudflareAccountHash: config.cloudflareAccountHash || (window as any).__E1_CLOUDFLARE_HASH,
          // Bubble up lead API configuration for submission logic
          settings: (window as any).__E1_WIDGET_SETTINGS__ || rootConfig?.settings || {},
          api: (window as any).__E1_WIDGET_API__ || rootConfig?.api || {},
          ...data
        };
        
        console.log('✅ Widget data loaded successfully:', {
          cardCount: data.cards?.length || 0,
          visualObjectCount: Object.keys(data.visualObjects || {}).length,
          cloudflareHash: (window as any).__E1_CLOUDFLARE_HASH ? 'Available' : 'Missing'
        });
        
        setWidgetData(data);
        
        // Apply theme
        if (config.theme) {
          document.documentElement.setAttribute('data-theme', config.theme);
        }
        
        setIsReady(true);
        setIsLoading(false);
        
        // Fire success event
        if (elementId) {
          const container = document.getElementById(elementId);
          if (container) {
            container.dispatchEvent(new CustomEvent('e1-calculator-loaded', {
              detail: { data, retryCount }
            }));
          }
        }
        
      } catch (loadError) {
        throw new Error(`Data loading failed: ${loadError instanceof Error ? loadError.message : loadError}`);
      }
      
    } catch (err) {
      handleError(err, 'Data Loading');
    }
  }, [config, elementId, handleError]);

  // Data adapter to ensure correct format
  const adaptDataFormat = (data: any): any => {
    if (!data) return data;
    
    if (data.cards && Array.isArray(data.cards)) {
      console.log(`✅ Processing ${data.cards.length} cards`);
      
      data.cards = data.cards.map((card: any) => {
        if (!card.card_fields && card.fields) {
          card.card_fields = card.fields;
          delete card.fields;
        }
        
        if (!card.card_fields) {
          card.card_fields = [];
        }
        
        return card;
      });
      
      console.log(`✅ Cards processed successfully: ${data.cards.length} cards`);
    } else {
      console.warn('⚠️ No cards array found in data - this may cause rendering issues');
    }
    
    return data;
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle error display
  if (error) {
    return (
      <div className="e1-widget-container">
        <ErrorDisplay
          error={{
            ...error,
            retryCount
          }}
          onRetry={error.retryable && (config.enableRetry !== false) ? handleRetry : undefined}
          isRetrying={isLoading}
          className="e1-widget-error"
        />
      </div>
    );
  }

  // Handle loading state
  if (!isReady || !widgetData) {
    return (
      <LoadingWithError
        isLoading={isLoading}
        error={error || undefined}
        onRetry={handleRetry}
        loadingText="Ladataan laskuria..."
      />
    );
  }

  // Apply appropriate container class based on isolation mode
  const containerClass = isolationMode === 'shadow' ? 'e1-widget-container' : 'e1-widget-container';

  return (
    <ErrorBoundary onError={handleError}>
      <div className={containerClass} ref={containerRef}>
        <CardProvider initialData={widgetData} widgetMode={true}>
          <CardSystemContainer
            initialData={widgetData}
            maxWidth={config.maxWidth}
            height={config.height}
            showVisualSupport={config.showVisualSupport !== false}
            showBlurredCards={config.showBlurredCards}
            widgetMode={true}
          />
        </CardProvider>
      </div>
    </ErrorBoundary>
  );
};

// Enhanced CSS/Script loading with retry logic
class StyleManager {
  private static shadowStyles = new Map<ShadowRoot, Set<string>>();
  private static namespacedStylesAdded = false;

  // Inject styles into Shadow DOM with error handling
  static injectShadowStyles(shadowRoot: ShadowRoot, styleId: string, cssContent: string) {
    if (!this.shadowStyles.has(shadowRoot)) {
      this.shadowStyles.set(shadowRoot, new Set());
    }
    
    const existingStyles = this.shadowStyles.get(shadowRoot)!;
    if (existingStyles.has(styleId)) {
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = cssContent;
    shadowRoot.appendChild(styleElement);
    
    existingStyles.add(styleId);
    console.log(`🎨 Injected ${styleId} into Shadow DOM`);
  }

  // Load and inject widget styles with retry for Shadow DOM
  static async loadShadowWidgetStyles(shadowRoot: ShadowRoot, widgetId?: string) {
    try {
      const cssUrl = '/wp-content/uploads/e1-calculator-cache/e1-calculator-widget.min.css';
      
      // Use error manager for retry logic
      await loadResourceWithRetry(cssUrl, 'css', { widgetId });
      
      // Load CSS content and inject
      const response = await errorManager.fetchWithRetry(cssUrl);
      const css = await response.text();
      
      this.injectShadowStyles(shadowRoot, 'widget-styles', css);
      
      // Also inject error styles
      this.injectShadowStyles(shadowRoot, 'error-styles', `
        /* Error handling styles for Shadow DOM */
        .e1-error-display { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; }
        .e1-error-title { color: #dc2626; font-weight: 600; margin-bottom: 8px; }
        .e1-error-retry-btn { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .e1-loading-spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `);
      
      return true;
    } catch (error) {
      console.error('Failed to load Shadow DOM widget styles:', error);
      return false;
    }
  }

  // Add namespaced styles with error handling
  static async addNamespacedStyles(widgetId?: string) {
    if (this.namespacedStylesAdded) {
      return;
    }
    
    try {
      const cssUrl = '/wp-content/uploads/e1-calculator-cache/widget-namespaced.min.css';
      await loadResourceWithRetry(cssUrl, 'css', { widgetId });
      
      console.log('📦 Namespaced styles loaded successfully');
      this.namespacedStylesAdded = true;
    } catch (error) {
      console.error('Failed to load namespaced styles:', error);
      // Continue without styles - the error will be visible to the user
    }
  }

  static cleanup(shadowRoot: ShadowRoot | null = null) {
    if (shadowRoot && this.shadowStyles.has(shadowRoot)) {
      this.shadowStyles.delete(shadowRoot);
      console.log('🧹 Cleaned up Shadow DOM styles');
    }
  }

  static checkBrowserSupport() {
    const support = {
      shadowDOM: !!Element.prototype.attachShadow,
      customElements: !!window.customElements,
      cssVariables: CSS.supports('--test', 'value'),
      fetch: !!window.fetch,
      es6: typeof Symbol !== 'undefined'
    };
    
    console.log('🔍 Browser support check:', support);
    return support;
  }
}

// Init function for WordPress loader compatibility
const init = (options: { container: HTMLElement | string; config: any; [key: string]: any }) => {
  const { container, config, ...restOptions } = options;
  
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.getElementById(container) 
    : container;
    
  if (!containerElement) {
    throw new Error(`Container not found: ${container}`);
  }
  
  // Create React root and render widget
  const root = ReactDOM.createRoot(containerElement);
  root.render(React.createElement(E1CalculatorWidget, {
    config: {
      ...config,
      ...restOptions
    }
  }));
  
  return {
    container: containerElement,
    root,
    destroy: () => {
      root.unmount();
    }
  };
};

// Export enhanced components and utilities
export { E1CalculatorWidget, StyleManager, init };
export type { WidgetConfig, WidgetInstance };

// Expose init on the global for WordPress loader compatibility (runtime only)
if (typeof window !== 'undefined') {
  (window as any).E1CalculatorWidget = (window as any).E1CalculatorWidget || {};
  if (typeof (window as any).E1CalculatorWidget.init !== 'function') {
    (window as any).E1CalculatorWidget.init = init;
  }
}