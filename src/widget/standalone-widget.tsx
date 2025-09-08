import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { CardSystemContainer } from '../components/card-system/CardSystemContainer';
import { createClient } from '@supabase/supabase-js';
import designTokens from '../../cardstream-complete-config.json';
import './widget-styles.css';

// Widget configuration interface
interface WidgetConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  theme?: string;
  maxWidth?: string | number;
  maxHeight?: string | number;
  height?: number;
  showVisualSupport?: boolean;
  showBlurredCards?: boolean;
  customTokens?: any; // Allow overriding design tokens
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

// Initialize Supabase client
function initSupabase(config: WidgetConfig) {
  const url = config.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = config.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('E1 Widget: Supabase credentials not provided');
    return null;
  }
  
  return createClient(url, key);
}

// Widget wrapper component
const E1CalculatorWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Apply design tokens first
    applyDesignTokens(designTokens.cardStreamConfig, config.customTokens);
    
    // Initialize Supabase and other dependencies
    const supabase = initSupabase(config);
    
    if (!supabase) {
      setError('Failed to initialize database connection');
      return;
    }

    // Store supabase instance globally for the card system to use
    (window as any).__E1_SUPABASE = supabase;
    
    // Apply theme if provided
    if (config.theme) {
      document.documentElement.setAttribute('data-theme', config.theme);
    }
    
    setIsReady(true);
  }, [config]);

  if (error) {
    return (
      <div className="e1-widget-error">
        <p>Widget initialization failed: {error}</p>
      </div>
    );
  }

  if (!isReady) {
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
        maxWidth={config.maxWidth}
        height={config.height}
        showVisualSupport={config.showVisualSupport !== false}
        showBlurredCards={config.showBlurredCards}
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
      if (container.getAttribute('data-supabase-url')) {
        config.supabaseUrl = container.getAttribute('data-supabase-url') || undefined;
      }
      if (container.getAttribute('data-supabase-key')) {
        config.supabaseAnonKey = container.getAttribute('data-supabase-key') || undefined;
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