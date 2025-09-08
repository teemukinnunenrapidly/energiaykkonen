import React from 'react';
import ReactDOM from 'react-dom/client';
import { CalculatorWidget } from './components/CalculatorWidget';
import './styles.css';

// Widget initialization function
function initE1Widget(elementId: string, config?: any) {
  const container = document.getElementById(elementId);

  if (!container) {
    console.error(`E1 Widget: Container with id "${elementId}" not found`);
    return null;
  }

  // Store config globally
  if (config) {
    (window as any).E1_WIDGET_CONFIG = config;
  }

  // Create React root and render widget
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <CalculatorWidget />
    </React.StrictMode>
  );

  return root;
}

// Auto-initialize if default container exists
if (typeof window !== 'undefined') {
  // Expose widget API globally
  (window as any).E1Widget = {
    init: initE1Widget,
    version: '2.0.0',
    config: (window as any).E1_WIDGET_CONFIG || {},
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const defaultContainer = document.getElementById('e1-calculator-widget');
      if (defaultContainer) {
        initE1Widget('e1-calculator-widget');
      }
    });
  } else {
    const defaultContainer = document.getElementById('e1-calculator-widget');
    if (defaultContainer) {
      initE1Widget('e1-calculator-widget');
    }
  }
}

export { initE1Widget };
