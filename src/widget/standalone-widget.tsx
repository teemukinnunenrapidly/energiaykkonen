import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { CardSystemContainer } from '../components/card-system/CardSystemContainer';
import designTokens from '../../cardstream-complete-config.json';
import './widget-styles.css';

// Widget configuration interface
interface WidgetConfig {
  cloudflareAccountHash?: string;
  theme?: string;
  maxWidth?: string | number;
  maxHeight?: string | number;
  height?: number;
  showVisualSupport?: boolean;
  showBlurredCards?: boolean;
  customTokens?: any; // Allow overriding design tokens
  progressiveImageLoading?: boolean;
  configUrl?: string; // URL to load config.json from
  data?: any; // Pre-loaded data (cards, visual objects, etc.)
}

// Global widget instance
let widgetInstance: any = null;

// Apply design tokens to CSS variables
function applyDesignTokens(tokens: any = designTokens.cardStreamConfig, customTokens?: any) {
  const mergedTokens = customTokens ? { ...tokens, ...customTokens } : tokens;
  const root = document.documentElement;
  
  // Container tokens
  if (mergedTokens.container) {
    root.style.setProperty('--e1-container-max-width', mergedTokens.container.maxWidth);
    root.style.setProperty('--e1-container-padding', mergedTokens.container.padding);
    root.style.setProperty('--e1-container-background', mergedTokens.container.background);
    root.style.setProperty('--e1-container-border-radius', mergedTokens.container.borderRadius);
    root.style.setProperty('--e1-container-box-shadow', mergedTokens.container.boxShadow);
  }
  
  // Layout tokens
  if (mergedTokens.layout) {
    root.style.setProperty('--e1-visual-support-ratio', mergedTokens.layout.visualSupportRatio);
    root.style.setProperty('--e1-card-stream-ratio', mergedTokens.layout.cardStreamRatio);
    root.style.setProperty('--e1-gap-between-panels', mergedTokens.layout.gapBetweenPanels);
  }
  
  // Color tokens
  if (mergedTokens.colors) {
    // Brand colors
    if (mergedTokens.colors.brand) {
      root.style.setProperty('--e1-color-primary', mergedTokens.colors.brand.primary);
      root.style.setProperty('--e1-color-primary-hover', mergedTokens.colors.brand.primaryHover);
      root.style.setProperty('--e1-color-primary-light', mergedTokens.colors.brand.primaryLight);
    }
    
    // Text colors
    if (mergedTokens.colors.text) {
      root.style.setProperty('--e1-text-primary', mergedTokens.colors.text.primary);
      root.style.setProperty('--e1-text-secondary', mergedTokens.colors.text.secondary);
      root.style.setProperty('--e1-text-tertiary', mergedTokens.colors.text.tertiary);
      root.style.setProperty('--e1-text-placeholder', mergedTokens.colors.text.placeholder);
    }
    
    // Background colors
    if (mergedTokens.colors.background) {
      root.style.setProperty('--e1-bg-primary', mergedTokens.colors.background.primary);
      root.style.setProperty('--e1-bg-secondary', mergedTokens.colors.background.secondary);
      root.style.setProperty('--e1-bg-tertiary', mergedTokens.colors.background.tertiary);
      root.style.setProperty('--e1-bg-disabled', mergedTokens.colors.background.disabled);
    }
    
    // Border colors
    if (mergedTokens.colors.border) {
      root.style.setProperty('--e1-border-default', mergedTokens.colors.border.default);
      root.style.setProperty('--e1-border-hover', mergedTokens.colors.border.hover);
    }
    
    // State colors
    if (mergedTokens.colors.state) {
      root.style.setProperty('--e1-state-success', mergedTokens.colors.state.success);
      root.style.setProperty('--e1-state-error', mergedTokens.colors.state.error);
      root.style.setProperty('--e1-state-warning', mergedTokens.colors.state.warning);
      root.style.setProperty('--e1-state-info', mergedTokens.colors.state.info);
    }
  }
  
  // Card tokens
  if (mergedTokens.card) {
    if (mergedTokens.card.base) {
      root.style.setProperty('--e1-card-bg', mergedTokens.card.base.background);
      root.style.setProperty('--e1-card-padding', mergedTokens.card.base.padding);
      root.style.setProperty('--e1-card-border-radius', mergedTokens.card.base.borderRadius);
      root.style.setProperty('--e1-card-margin-bottom', mergedTokens.card.base.marginBottom);
      root.style.setProperty('--e1-card-box-shadow', mergedTokens.card.base.boxShadow);
      root.style.setProperty('--e1-card-transition', mergedTokens.card.base.transition);
    }
    
    if (mergedTokens.card.title) {
      root.style.setProperty('--e1-card-title-size', mergedTokens.card.title.fontSize);
      root.style.setProperty('--e1-card-title-weight', mergedTokens.card.title.fontWeight);
      root.style.setProperty('--e1-card-title-color', mergedTokens.card.title.color);
    }
    
    if (mergedTokens.card.hover) {
      root.style.setProperty('--e1-card-hover-shadow', mergedTokens.card.hover.boxShadow);
      root.style.setProperty('--e1-card-hover-transform', mergedTokens.card.hover.transform);
    }
  }
  
  // Typography tokens
  if (mergedTokens.typography) {
    root.style.setProperty('--e1-font-family', mergedTokens.typography.fontFamily);
    root.style.setProperty('--e1-font-size-base', mergedTokens.typography.fontSizeBase);
    root.style.setProperty('--e1-line-height-base', mergedTokens.typography.lineHeightBase);
    root.style.setProperty('--e1-font-weight-light', String(mergedTokens.typography.fontWeightLight));
    root.style.setProperty('--e1-font-weight-normal', String(mergedTokens.typography.fontWeightNormal));
    root.style.setProperty('--e1-font-weight-medium', String(mergedTokens.typography.fontWeightMedium));
    root.style.setProperty('--e1-font-weight-semibold', String(mergedTokens.typography.fontWeightSemibold));
  }
  
  // Form elements tokens
  if (mergedTokens.formElements) {
    if (mergedTokens.formElements.input) {
      root.style.setProperty('--e1-input-height', mergedTokens.formElements.input.height);
      root.style.setProperty('--e1-input-padding', mergedTokens.formElements.input.padding);
      root.style.setProperty('--e1-input-border-radius', mergedTokens.formElements.input.borderRadius);
      root.style.setProperty('--e1-input-border-color', mergedTokens.formElements.input.borderColor);
      root.style.setProperty('--e1-input-bg', mergedTokens.formElements.input.background);
      root.style.setProperty('--e1-input-font-size', mergedTokens.formElements.input.fontSize);
      root.style.setProperty('--e1-input-transition', mergedTokens.formElements.input.transition);
    }
    
    if (mergedTokens.formElements.label) {
      root.style.setProperty('--e1-label-font-size', mergedTokens.formElements.label.fontSize);
      root.style.setProperty('--e1-label-font-weight', mergedTokens.formElements.label.fontWeight);
      root.style.setProperty('--e1-label-color', mergedTokens.formElements.label.color);
      root.style.setProperty('--e1-label-margin-bottom', mergedTokens.formElements.label.marginBottom);
    }
  }
  
  // Button tokens
  if (mergedTokens.submitButton) {
    root.style.setProperty('--e1-button-height', mergedTokens.submitButton.height);
    root.style.setProperty('--e1-button-padding', mergedTokens.submitButton.padding);
    root.style.setProperty('--e1-button-border-radius', mergedTokens.submitButton.borderRadius);
    root.style.setProperty('--e1-button-font-size', mergedTokens.submitButton.fontSize);
    root.style.setProperty('--e1-button-font-weight', mergedTokens.submitButton.fontWeight);
    root.style.setProperty('--e1-button-bg', mergedTokens.submitButton.background);
    root.style.setProperty('--e1-button-color', mergedTokens.submitButton.color);
    root.style.setProperty('--e1-button-transition', mergedTokens.submitButton.transition);
    
    if (mergedTokens.submitButton.hover) {
      root.style.setProperty('--e1-button-hover-bg', mergedTokens.submitButton.hover.background);
      root.style.setProperty('--e1-button-hover-transform', mergedTokens.submitButton.hover.transform);
    }
  }
  
  // Animation tokens
  if (mergedTokens.animations) {
    if (mergedTokens.animations.transitions) {
      root.style.setProperty('--e1-transition-fast', mergedTokens.animations.transitions.fast);
      root.style.setProperty('--e1-transition-default', mergedTokens.animations.transitions.default);
      root.style.setProperty('--e1-transition-slow', mergedTokens.animations.transitions.slow);
    }
  }
}

// Load configuration and data from config.json
async function loadConfigData(configUrl: string): Promise<any> {
  try {
    const response = await fetch(configUrl);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    const config = await response.json();
    console.log('✅ Loaded widget config:', {
      version: config.version,
      cards: config.data?.cards?.length || 0,
      visualObjects: Object.keys(config.data?.visualObjects || {}).length,
      formulas: config.data?.formulas?.length || 0
    });
    return config;
  } catch (error) {
    console.error('❌ Failed to load config:', error);
    throw error;
  }
}

// Data adapter to ensure correct format
function adaptDataFormat(data: any): any {
  if (!data) return data;
  
  // Ensure cards have the correct structure
  if (data.cards && Array.isArray(data.cards)) {
    data.cards = data.cards.map((card: any) => {
      // Ensure card_fields exists (handle both 'fields' and 'card_fields')
      if (!card.card_fields && card.fields) {
        card.card_fields = card.fields;
        delete card.fields;
      }
      
      // Ensure card_fields is always an array
      if (!card.card_fields) {
        card.card_fields = [];
      }
      
      // Log to debug
      console.log(`Card "${card.name}" has ${card.card_fields.length} fields`);
      
      return card;
    });
  }
  
  return data;
}

// Widget wrapper component
const E1CalculatorWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetData, setWidgetData] = useState<any>(null);

  useEffect(() => {
    // Apply design tokens first
    applyDesignTokens(designTokens.cardStreamConfig, config.customTokens);
    
    // Store Cloudflare account hash globally for image loading
    if (config.cloudflareAccountHash) {
      (window as any).__E1_CLOUDFLARE_HASH = config.cloudflareAccountHash;
      // Also set as env variable for compatibility
      process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH = config.cloudflareAccountHash;
    }
    
    // Load data either from provided data or from config URL
    const loadData = async () => {
      try {
        let data = config.data;
        
        // If no data provided, try to load from config URL
        if (!data && config.configUrl) {
          try {
            const loadedConfig = await loadConfigData(config.configUrl);
            data = loadedConfig.data;
            
            // Also update Cloudflare hash if provided in config
            if (loadedConfig.cloudflareAccountHash) {
              (window as any).__E1_CLOUDFLARE_HASH = loadedConfig.cloudflareAccountHash;
              process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH = loadedConfig.cloudflareAccountHash;
            }
          } catch (fetchError) {
            console.warn('Failed to load config from URL, trying fallback...', fetchError);
          }
        }
        
        // If still no data, try default location
        if (!data) {
          try {
            const defaultUrl = 'wordpress-plugin/e1-calculator-pro/cache/config.json';
            const loadedConfig = await loadConfigData(defaultUrl);
            data = loadedConfig.data;
            
            if (loadedConfig.cloudflareAccountHash) {
              (window as any).__E1_CLOUDFLARE_HASH = loadedConfig.cloudflareAccountHash;
              process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH = loadedConfig.cloudflareAccountHash;
            }
          } catch (fetchError) {
            console.warn('Failed to load config from default location', fetchError);
            // In development/testing, you might have inline data
            // Check if there's mock data available
            if ((window as any).__E1_MOCK_DATA) {
              console.log('Using mock data for development');
              data = (window as any).__E1_MOCK_DATA;
            }
          }
        }
        
        if (!data) {
          throw new Error('No data available for widget - please provide data prop or configUrl');
        }
        
        // Adapt data format to ensure compatibility
        data = adaptDataFormat(data);
        
        // Store widget data globally for CardSystem to use
        (window as any).__E1_WIDGET_DATA = data;
        setWidgetData(data);
        
        // Apply theme if provided
        if (config.theme) {
          document.documentElement.setAttribute('data-theme', config.theme);
        }
        
        setIsReady(true);
      } catch (err) {
        console.error('Failed to load widget data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load widget data');
      }
    };
    
    loadData();
  }, [config]);

  if (error) {
    return (
      <div className="e1-widget-error">
        <p>Widget initialization failed: {error}</p>
      </div>
    );
  }

  if (!isReady || !widgetData) {
    return (
      <div className="e1-widget-loading">
        <div className="loading-spinner"></div>
        <p>Loading calculator...</p>
      </div>
    );
  }

  return (
    <div className="e1-widget-container">
      <CardSystemContainer
        initialData={widgetData}
        maxWidth={config.maxWidth}
        height={config.height}
        showVisualSupport={config.showVisualSupport !== false}
        showBlurredCards={config.showBlurredCards}
        widgetMode={true}
      />
    </div>
  );
};

// Widget initialization function
function initWidget(elementId: string, config: WidgetConfig = {}) {
  const container = document.getElementById(elementId);
  
  if (!container) {
    console.error(`E1 Widget: Container element with id "${elementId}" not found`);
    return null;
  }
  
  // Clear any existing instance
  if (widgetInstance) {
    widgetInstance.unmount();
  }
  
  // Create React root and render widget
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <E1CalculatorWidget config={config} />
    </React.StrictMode>
  );
  
  widgetInstance = root;
  
  return {
    unmount: () => {
      root.unmount();
      widgetInstance = null;
    },
    updateConfig: (newConfig: WidgetConfig) => {
      root.render(
        <React.StrictMode>
          <E1CalculatorWidget config={{ ...config, ...newConfig }} />
        </React.StrictMode>
      );
    }
  };
}

// Auto-initialize if default container exists
if (typeof window !== 'undefined') {
  // Expose widget API globally
  (window as any).E1Calculator = {
    init: initWidget,
    version: '1.0.0',
  };
  
  // Auto-init on DOM ready with data attributes
  const autoInit = () => {
    const containers = document.querySelectorAll('[data-e1-calculator]');
    containers.forEach((container) => {
      const config: WidgetConfig = {};
      
      // Read config from data attributes
      if (container.getAttribute('data-config-url')) {
        config.configUrl = container.getAttribute('data-config-url') || undefined;
      }
      if (container.getAttribute('data-cloudflare-hash')) {
        config.cloudflareAccountHash = container.getAttribute('data-cloudflare-hash') || undefined;
      }
      if (container.getAttribute('data-theme')) {
        config.theme = container.getAttribute('data-theme') || undefined;
      }
      if (container.getAttribute('data-max-width')) {
        config.maxWidth = container.getAttribute('data-max-width') || undefined;
      }
      if (container.getAttribute('data-height')) {
        config.height = parseInt(container.getAttribute('data-height') || '0') || undefined;
      }
      if (container.getAttribute('data-show-visual') !== null) {
        config.showVisualSupport = container.getAttribute('data-show-visual') === 'true';
      }
      
      initWidget(container.id || 'e1-calculator-' + Math.random().toString(36).substr(2, 9), config);
    });
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

// Export for UMD build
export default {
  init: initWidget,
  version: '1.0.0',
};

export { initWidget };