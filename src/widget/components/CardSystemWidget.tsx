import React from 'react';
import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';
import { CardProvider } from '@/components/card-system/CardContext';
import '@/app/globals.css';

interface CardSystemWidgetProps {
  config?: {
    apiUrl?: string;
    theme?: string;
    maxWidth?: string;
    showVisualSupport?: boolean;
  };
}

export const CardSystemWidget: React.FC<CardSystemWidgetProps> = ({ config = {} }) => {
  // Store config globally for API calls
  if (typeof window !== 'undefined') {
    (window as any).E1_WIDGET_CONFIG = config;
  }

  return (
    <CardProvider>
      <div className="e1-widget-wrapper" style={{ width: '100%', height: '100%' }}>
        <CardSystemContainer
          maxWidth={config.maxWidth || '100%'}
          showVisualSupport={config.showVisualSupport !== false}
          fullWidth={true}
          className="e1-widget-card-system"
        />
      </div>
    </CardProvider>
  );
};