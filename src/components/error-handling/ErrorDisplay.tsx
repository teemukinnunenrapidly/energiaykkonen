import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

// Error types for classification
export type ErrorType =
  | 'network' // Network/fetch errors
  | 'config' // Configuration/JSON parsing errors
  | 'dependency' // Missing dependencies or resources
  | 'render' // React rendering errors
  | 'validation' // Data validation errors
  | 'timeout' // Request timeout errors
  | 'permission' // Permission/CORS errors
  | 'unknown'; // Unknown errors

export interface ErrorInfo {
  type: ErrorType;
  code?: string;
  message: string;
  details?: string;
  retryable: boolean;
  retryCount?: number;
  timestamp: Date;
  context?: Record<string, any>;
}

interface ErrorDisplayProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  className?: string;
}

// Error type to user-friendly message mapping
const ERROR_MESSAGES: Record<
  ErrorType,
  { title: string; description: string; icon: string }
> = {
  network: {
    title: 'Verkkovirhe',
    description: 'Yhteysvirhe palvelimeen. Tarkista verkkoyhteytesi.',
    icon: '🌐',
  },
  config: {
    title: 'Asetusvirhe',
    description: 'Laskurin asetustiedosto on virheellinen tai puuttuu.',
    icon: '⚙️',
  },
  dependency: {
    title: 'Resurssivirhe',
    description: 'Tarvittava resurssi ei ole käytettävissä.',
    icon: '📦',
  },
  render: {
    title: 'Näyttövirhe',
    description: 'Laskurin näyttämisessä tapahtui virhe.',
    icon: '🖥️',
  },
  validation: {
    title: 'Tietovirhe',
    description: 'Ladatut tiedot ovat virheellisiä tai vioittuneita.',
    icon: '🔍',
  },
  timeout: {
    title: 'Aikakatkaisuvirhe',
    description: 'Pyyntö kesti liian kauan - yritä uudelleen.',
    icon: '⏱️',
  },
  permission: {
    title: 'Käyttöoikeusvirhe',
    description: 'Resurssin käyttö estettiin turvallisuussyistä.',
    icon: '🔒',
  },
  unknown: {
    title: 'Tuntematon virhe',
    description: 'Tapahtui odottamaton virhe.',
    icon: '❓',
  },
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  className = '',
}) => {
  const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.unknown;

  return (
    <div className={`e1-error-display ${className}`} role="alert">
      <div className="e1-error-content">
        <div className="e1-error-header">
          <div className="e1-error-icon">
            <AlertCircle className="e1-error-icon-svg" />
            <span className="e1-error-emoji">{errorInfo.icon}</span>
          </div>
          <div className="e1-error-text">
            <h3 className="e1-error-title">{errorInfo.title}</h3>
            <p className="e1-error-description">{errorInfo.description}</p>
          </div>
          {onDismiss && (
            <button
              className="e1-error-dismiss"
              onClick={onDismiss}
              aria-label="Sulje virheilmoitus"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="e1-error-details">
          <p className="e1-error-message">{error.message}</p>

          {error.details && (
            <details className="e1-error-technical">
              <summary>Tekniset tiedot</summary>
              <pre className="e1-error-code">{error.details}</pre>
            </details>
          )}

          {error.code && (
            <p className="e1-error-code-inline">
              Virhekoodi: <code>{error.code}</code>
            </p>
          )}

          {error.retryCount && error.retryCount > 0 && (
            <p className="e1-error-retry-count">
              Yrityskerta: {error.retryCount + 1}/3
            </p>
          )}
        </div>

        <div className="e1-error-actions">
          {error.retryable && onRetry && (
            <button
              className="e1-error-retry-btn"
              onClick={onRetry}
              disabled={isRetrying}
              type="button"
            >
              <RefreshCw
                className={`e1-error-retry-icon ${isRetrying ? 'spinning' : ''}`}
                size={16}
              />
              {isRetrying ? 'Yritetään uudelleen...' : 'Yritä uudelleen'}
            </button>
          )}

          {!error.retryable && (
            <p className="e1-error-no-retry">
              Ongelma vaatii manuaalista korjausta.
            </p>
          )}
        </div>

        <div className="e1-error-meta">
          <small className="e1-error-timestamp">
            Tapahtunut: {error.timestamp.toLocaleString('fi-FI')}
          </small>
        </div>
      </div>
    </div>
  );
};

// Compact error display for smaller spaces
export const CompactErrorDisplay: React.FC<{
  error: ErrorInfo;
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ error, onRetry, isRetrying }) => {
  const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.unknown;

  return (
    <div className="e1-error-compact" role="alert">
      <div className="e1-error-compact-content">
        <span className="e1-error-compact-icon">{errorInfo.icon}</span>
        <span className="e1-error-compact-text">{errorInfo.title}</span>
        {error.retryable && onRetry && (
          <button
            className="e1-error-compact-retry"
            onClick={onRetry}
            disabled={isRetrying}
            title="Yritä uudelleen"
            type="button"
          >
            <RefreshCw className={isRetrying ? 'spinning' : ''} size={14} />
          </button>
        )}
      </div>
      {error.message && (
        <div className="e1-error-compact-message">{error.message}</div>
      )}
    </div>
  );
};

// Loading state with potential error
export const LoadingWithError: React.FC<{
  isLoading: boolean;
  error?: ErrorInfo;
  onRetry?: () => void;
  loadingText?: string;
  children?: React.ReactNode;
}> = ({ isLoading, error, onRetry, loadingText = 'Ladataan...', children }) => {
  if (error) {
    return (
      <CompactErrorDisplay
        error={error}
        onRetry={onRetry}
        isRetrying={isLoading}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="e1-loading-state">
        <div className="e1-loading-spinner"></div>
        <p className="e1-loading-text">{loadingText}</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: ErrorInfo) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorInfo: ErrorInfo = {
      type: 'render',
      message: error.message,
      details: error.stack,
      retryable: true,
      timestamp: new Date(),
    };

    return {
      hasError: true,
      error: errorInfo,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedError: ErrorInfo = {
      type: 'render',
      message: error.message,
      details: `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`,
      retryable: true,
      timestamp: new Date(),
      context: {
        componentStack: errorInfo.componentStack,
      },
    };

    console.error('🚨 React Error Boundary caught error:', enhancedError);

    if (this.props.onError) {
      this.props.onError(enhancedError);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
          className="e1-error-boundary"
        />
      );
    }

    return this.props.children;
  }
}
