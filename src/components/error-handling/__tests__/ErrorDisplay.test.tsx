/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorDisplay,
  CompactErrorDisplay,
  LoadingWithError,
  ErrorBoundary,
  ErrorInfo,
} from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  const mockError: ErrorInfo = {
    type: 'network',
    message: 'Failed to load configuration',
    details: 'Network request failed with status 500',
    retryable: true,
    timestamp: new Date('2024-01-01T12:00:00Z'),
    context: { url: 'https://example.com/config.json' },
  };

  it('should render error information correctly', () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText('Verkkovirhe')).toBeInTheDocument();
    expect(
      screen.getByText('Yhteysvirhe palvelimeen. Tarkista verkkoyhteytesi.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Failed to load configuration')
    ).toBeInTheDocument();
  });

  it('should show retry button for retryable errors', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay error={mockError} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', {
      name: /yritä uudelleen/i,
    });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button for non-retryable errors', () => {
    const nonRetryableError: ErrorInfo = {
      ...mockError,
      type: 'permission',
      retryable: false,
    };

    render(<ErrorDisplay error={nonRetryableError} />);

    expect(
      screen.queryByRole('button', { name: /yritä uudelleen/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Ongelma vaatii manuaalista korjausta.')
    ).toBeInTheDocument();
  });

  it('should show retry count when available', () => {
    const errorWithRetry: ErrorInfo = {
      ...mockError,
      retryCount: 2,
    };

    render(<ErrorDisplay error={errorWithRetry} />);

    expect(screen.getByText('Yrityskerta: 3/3')).toBeInTheDocument();
  });

  it('should show technical details in expandable section', () => {
    render(<ErrorDisplay error={mockError} />);

    const detailsElement = screen.getByText('Tekniset tiedot');
    expect(detailsElement).toBeInTheDocument();

    // Details should be in a details element (collapsed by default)
    const detailsSection = detailsElement.closest('details');
    expect(detailsSection).toBeInTheDocument();
  });

  it('should show error code when available', () => {
    const errorWithCode: ErrorInfo = {
      ...mockError,
      code: 'HTTP_500',
    };

    render(<ErrorDisplay error={errorWithCode} />);

    expect(screen.getByText(/Virhekoodi:/)).toBeInTheDocument();
    expect(screen.getByText('HTTP_500')).toBeInTheDocument();
  });

  it('should show dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn();
    render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', {
      name: /sulje virheilmoitus/i,
    });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should disable retry button when retrying', () => {
    const onRetry = jest.fn();
    render(
      <ErrorDisplay error={mockError} onRetry={onRetry} isRetrying={true} />
    );

    const retryButton = screen.getByRole('button', {
      name: /yritetään uudelleen/i,
    });
    expect(retryButton).toBeDisabled();
  });

  it('should format timestamp correctly', () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText(/Tapahtunut:/)).toBeInTheDocument();
    // Check for Finnish locale formatting
    expect(screen.getByText(/1\.1\.2024/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ErrorDisplay error={mockError} className="custom-error" />
    );

    expect(container.firstChild).toHaveClass(
      'e1-error-display',
      'custom-error'
    );
  });
});

describe('CompactErrorDisplay', () => {
  const mockError: ErrorInfo = {
    type: 'config',
    message: 'Configuration file not found',
    retryable: true,
    timestamp: new Date(),
  };

  it('should render compact error information', () => {
    render(<CompactErrorDisplay error={mockError} />);

    expect(screen.getByText('Asetusvirhe')).toBeInTheDocument();
    expect(
      screen.getByText('Configuration file not found')
    ).toBeInTheDocument();
  });

  it('should show compact retry button for retryable errors', () => {
    const onRetry = jest.fn();
    render(<CompactErrorDisplay error={mockError} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', {
      name: /yritä uudelleen/i,
    });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button for non-retryable errors', () => {
    const nonRetryableError: ErrorInfo = {
      ...mockError,
      retryable: false,
    };

    render(<CompactErrorDisplay error={nonRetryableError} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should show spinning icon when retrying', () => {
    const onRetry = jest.fn();
    render(
      <CompactErrorDisplay
        error={mockError}
        onRetry={onRetry}
        isRetrying={true}
      />
    );

    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeDisabled();

    // Check for spinning class
    const icon = retryButton.querySelector('svg');
    expect(icon).toHaveClass('spinning');
  });
});

describe('LoadingWithError', () => {
  const mockError: ErrorInfo = {
    type: 'timeout',
    message: 'Request timed out',
    retryable: true,
    timestamp: new Date(),
  };

  it('should show loading state when isLoading is true', () => {
    render(<LoadingWithError isLoading={true} />);

    expect(screen.getByText('Ladataan...')).toBeInTheDocument();
    expect(screen.getByText('Ladataan...')).toBeInTheDocument();
  });

  it('should show custom loading text', () => {
    render(
      <LoadingWithError isLoading={true} loadingText="Lataan tietoja..." />
    );

    expect(screen.getByText('Lataan tietoja...')).toBeInTheDocument();
  });

  it('should show error when error is present', () => {
    const onRetry = jest.fn();
    render(
      <LoadingWithError isLoading={false} error={mockError} onRetry={onRetry} />
    );

    expect(screen.getByText('Aikakatkaisuvirhe')).toBeInTheDocument();
  });

  it('should show error even when loading is true', () => {
    const onRetry = jest.fn();
    render(
      <LoadingWithError isLoading={true} error={mockError} onRetry={onRetry} />
    );

    expect(screen.getByText('Aikakatkaisuvirhe')).toBeInTheDocument();
    expect(screen.queryByText('Ladataan...')).not.toBeInTheDocument();
  });

  it('should render children when not loading and no error', () => {
    render(
      <LoadingWithError isLoading={false}>
        <div>Content loaded successfully</div>
      </LoadingWithError>
    );

    expect(screen.getByText('Content loaded successfully')).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  // Component that throws an error
  const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
    if (shouldThrow) {
      throw new Error('Test component error');
    }
    return <div>Component rendered successfully</div>;
  };

  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText('Component rendered successfully')
    ).toBeInTheDocument();
  });

  it('should catch and display errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Näyttövirhe')).toBeInTheDocument();
    expect(screen.getByText('Test component error')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'render',
        message: 'Test component error',
        retryable: true,
      })
    );
  });

  it('should allow retrying after error', async () => {
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText('Näyttövirhe')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', {
      name: /yritä uudelleen/i,
    });
    fireEvent.click(retryButton);

    // Component should be rendered again, but still throw
    expect(screen.getByText('Näyttövirhe')).toBeInTheDocument();

    // Now make it not throw and rerender
    shouldThrow = false;
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // After retry, if we click retry again, the component should work
    const newRetryButton = screen.getByRole('button', {
      name: /yritä uudelleen/i,
    });
    fireEvent.click(newRetryButton);

    await waitFor(() => {
      expect(
        screen.getByText('Component rendered successfully')
      ).toBeInTheDocument();
    });
  });

  it('should include component stack in error details', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Open technical details
    const detailsToggle = screen.getByText('Tekniset tiedot');
    fireEvent.click(detailsToggle);

    // Should include component stack information
    const technicalDetails = screen.getByText(/Component Stack/);
    expect(technicalDetails).toBeInTheDocument();
  });
});

describe('Error Type Mapping', () => {
  it('should show correct Finnish messages for all error types', () => {
    const errorTypes: Array<[string, string]> = [
      ['network', 'Verkkovirhe'],
      ['config', 'Asetusvirhe'],
      ['dependency', 'Resurssivirhe'],
      ['render', 'Näyttövirhe'],
      ['validation', 'Tietovirhe'],
      ['timeout', 'Aikakatkaisuvirhe'],
      ['permission', 'Käyttöoikeusvirhe'],
      ['unknown', 'Tuntematon virhe'],
    ];

    errorTypes.forEach(([type, expectedTitle]) => {
      const error: ErrorInfo = {
        type: type as any,
        message: 'Test message',
        retryable: true,
        timestamp: new Date(),
      };

      const { unmount } = render(<ErrorDisplay error={error} />);

      expect(screen.getByText(expectedTitle)).toBeInTheDocument();

      unmount();
    });
  });

  it('should show correct emoji for each error type', () => {
    const errorTypes: Array<[string, string]> = [
      ['network', '🌐'],
      ['config', '⚙️'],
      ['dependency', '📦'],
      ['render', '🖥️'],
      ['validation', '🔍'],
      ['timeout', '⏱️'],
      ['permission', '🔒'],
      ['unknown', '❓'],
    ];

    errorTypes.forEach(([type, expectedEmoji]) => {
      const error: ErrorInfo = {
        type: type as any,
        message: 'Test message',
        retryable: true,
        timestamp: new Date(),
      };

      const { container, unmount } = render(<ErrorDisplay error={error} />);

      expect(container.textContent).toContain(expectedEmoji);

      unmount();
    });
  });
});
