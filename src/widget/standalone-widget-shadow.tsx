import React from 'react';
import ReactDOM from 'react-dom/client';
import { CardSystemContainer } from '../components/card-system/CardSystemContainer';
import { CardProvider } from '../components/card-system/CardContext';

interface E1CalculatorConfig {
  containerId?: string;
  useShadowDOM?: boolean;
  configUrl?: string;
  apiUrl?: string;
  isolated?: boolean;
  theme?: string;
  maxWidth?: string | number;
  height?: number;
  showVisualSupport?: boolean;
  data?: any;
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
      isolated = false,
      theme = 'light',
      showVisualSupport = true
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
        <CardProvider initialData={configData} widgetMode={true}>
          <CardSystemContainer 
            initialData={configData}
            maxWidth={config.maxWidth}
            height={config.height}
            showVisualSupport={showVisualSupport}
            widgetMode={true}
          />
        </CardProvider>
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #333;
        }
        * {
          box-sizing: border-box;
        }
        .widget-root {
          width: 100%;
          height: 100%;
          position: relative;
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
    E1CalculatorWidget: typeof CardSystemContainer;
    E1CalculatorCore: E1CalculatorWidget;
  }
}

if (typeof window !== 'undefined') {
  window.E1CalculatorCore = new E1CalculatorWidget();
  window.E1CalculatorWidget = CardSystemContainer;
}

export default E1CalculatorWidget;