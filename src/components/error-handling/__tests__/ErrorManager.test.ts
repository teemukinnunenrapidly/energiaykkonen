/**
 * @jest-environment jsdom
 */

import { ErrorManager, errorManager } from '../ErrorManager';
import { ErrorInfo } from '../ErrorDisplay';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock setTimeout for testing delays
jest.useFakeTimers();

describe('ErrorManager', () => {
  let manager: ErrorManager;

  beforeEach(() => {
    manager = new ErrorManager();
    mockFetch.mockClear();
    manager.clearHistory();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const error = new Error('Failed to fetch');
      const errorInfo = manager.classifyError(error);

      expect(errorInfo.type).toBe('network');
      expect(errorInfo.retryable).toBe(true);
      expect(errorInfo.message).toBe('Failed to fetch');
    });

    it('should classify timeout errors correctly', () => {
      const error = new Error('Request timeout');
      const errorInfo = manager.classifyError(error);

      expect(errorInfo.type).toBe('timeout');
      expect(errorInfo.retryable).toBe(true);
    });

    it('should classify permission errors correctly', () => {
      const error = new Error('CORS policy blocked');
      const errorInfo = manager.classifyError(error);

      expect(errorInfo.type).toBe('permission');
      expect(errorInfo.retryable).toBe(false);
    });

    it('should classify config errors correctly', () => {
      const error = new Error('config.json not found');
      const errorInfo = manager.classifyError(error);

      expect(errorInfo.type).toBe('config');
      expect(errorInfo.retryable).toBe(true);
    });

    it('should classify validation errors correctly', () => {
      const error = new Error('No cards available');
      const errorInfo = manager.classifyError(error);

      expect(errorInfo.type).toBe('validation');
      expect(errorInfo.retryable).toBe(false);
      expect(errorInfo.code).toBe('NO_CARDS');
    });

    it('should handle HTTP status codes', () => {
      const error = new Error('HTTP 404: Not Found');
      const errorInfo = manager.classifyError(error);

      expect(errorInfo.type).toBe('config');
      expect(errorInfo.retryable).toBe(true);
      expect(errorInfo.code).toBe('HTTP_404');
    });

    it('should classify unknown errors as unknown type', () => {
      const error = new Error('Some random error');
      const errorInfo = manager.classifyError(error);

      expect(errorInfo.type).toBe('unknown');
      expect(errorInfo.retryable).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should calculate exponential backoff delays correctly', () => {
      const delay0 = manager.calculateDelay(0);
      const delay1 = manager.calculateDelay(1);
      const delay2 = manager.calculateDelay(2);

      expect(delay0).toBeGreaterThanOrEqual(100);
      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay2).toBeLessThanOrEqual(10000); // Max delay cap
    });

    it('should retry operations with exponential backoff', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await manager.retryOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect maximum retry attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(manager.retryOperation(operation)).rejects.toMatchObject({
        type: 'unknown',
        message: 'Always fails',
        retryable: true,
      });

      expect(operation).toHaveBeenCalledTimes(3); // Default max attempts
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error('CORS policy blocked'));

      await expect(manager.retryOperation(operation)).rejects.toMatchObject({
        type: 'permission',
        retryable: false,
      });

      expect(operation).toHaveBeenCalledTimes(1); // Should only try once
    });
  });

  describe('Fetch with Retry', () => {
    it('should successfully fetch on first attempt', async () => {
      const mockResponse = new Response('{"test": true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      const response = await manager.fetchWithRetry(
        'https://example.com/config.json'
      );

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('{"test": true}', { status: 200 }));

      const response = await manager.fetchWithRetry(
        'https://example.com/config.json'
      );

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle HTTP error statuses', async () => {
      mockFetch.mockResolvedValue(new Response('Not Found', { status: 404 }));

      await expect(
        manager.fetchWithRetry('https://example.com/config.json')
      ).rejects.toMatchObject({
        type: 'config',
        retryable: true,
      });
    });

    it('should handle request timeout', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(resolve => {
            // Simulate a request that takes longer than timeout
            setTimeout(() => resolve(new Response('OK')), 15000);
          })
      );

      const fetchPromise = manager.fetchWithRetry(
        'https://example.com/slow-endpoint'
      );

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(10000);

      await expect(fetchPromise).rejects.toMatchObject({
        message: expect.stringContaining('timeout'),
      });
    });
  });

  describe('JSON Loading', () => {
    it('should load and parse JSON successfully', async () => {
      const testData = { cards: [], version: '1.0' };
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(testData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await manager.loadJSONWithRetry(
        'https://example.com/config.json'
      );

      expect(result).toEqual(testData);
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue(
        new Response('invalid json{', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(
        manager.loadJSONWithRetry('https://example.com/config.json')
      ).rejects.toThrow('Failed to parse JSON response');
    });
  });

  describe('Resource Loading', () => {
    it('should load script resources', async () => {
      // Mock document.createElement and appendChild
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any,
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any);
      jest.spyOn(document.head, 'appendChild').mockImplementation(element => {
        // Simulate successful load
        setTimeout(() => mockScript.onload?.(), 0);
        return element;
      });

      const loadPromise = manager.loadResourceWithRetry(
        'https://example.com/script.js',
        'script'
      );

      jest.advanceTimersByTime(100);
      await expect(loadPromise).resolves.toBeUndefined();

      expect(mockScript.src).toBe('https://example.com/script.js');
      expect(mockScript.async).toBe(true);
    });

    it('should load CSS resources', async () => {
      const mockLink = {
        rel: '',
        href: '',
        onload: null as any,
        onerror: null as any,
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest.spyOn(document.head, 'appendChild').mockImplementation(element => {
        setTimeout(() => mockLink.onload?.(), 0);
        return element;
      });

      const loadPromise = manager.loadResourceWithRetry(
        'https://example.com/styles.css',
        'css'
      );

      jest.advanceTimersByTime(100);
      await expect(loadPromise).resolves.toBeUndefined();

      expect(mockLink.rel).toBe('stylesheet');
      expect(mockLink.href).toBe('https://example.com/styles.css');
    });

    it('should handle resource loading failures', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any,
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any);
      jest.spyOn(document.head, 'appendChild').mockImplementation(element => {
        setTimeout(() => mockScript.onerror?.(), 0);
        return element;
      });

      const loadPromise = manager.loadResourceWithRetry(
        'https://example.com/missing.js',
        'script'
      );

      jest.advanceTimersByTime(100);

      await expect(loadPromise).rejects.toMatchObject({
        type: 'dependency',
        retryable: true,
      });
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics correctly', () => {
      manager.classifyError(new Error('Network error'));
      manager.classifyError(new Error('Config not found'));
      manager.classifyError(new Error('Another network error'));

      const stats = manager.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.network).toBe(2);
      expect(stats.byType.config).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
      expect(stats.lastError?.type).toBe('network'); // Most recent
    });

    it('should limit error history size', () => {
      // Create more errors than the history limit (50)
      for (let i = 0; i < 60; i++) {
        manager.classifyError(new Error(`Error ${i}`));
      }

      const stats = manager.getErrorStats();
      expect(stats.total).toBe(50); // Should be capped at 50
    });

    it('should clear error history', () => {
      manager.classifyError(new Error('Test error'));
      expect(manager.getErrorStats().total).toBe(1);

      manager.clearHistory();
      expect(manager.getErrorStats().total).toBe(0);
    });
  });

  describe('Context Handling', () => {
    it('should include context in error info', () => {
      const error = new Error('Test error');
      const context = {
        widgetId: 'test-widget',
        isolationMode: 'shadow' as const,
        url: 'https://example.com',
      };

      const errorInfo = manager.classifyError(error, context);

      expect(errorInfo.context).toMatchObject(context);
      expect(errorInfo.context?.userAgent).toBe(navigator.userAgent);
    });
  });
});

describe('Global Error Manager', () => {
  beforeEach(() => {
    errorManager.clearHistory();
  });

  it('should be a singleton instance', () => {
    expect(errorManager).toBeInstanceOf(ErrorManager);
  });

  it('should provide utility functions', () => {
    expect(typeof errorManager.retryOperation).toBe('function');
    expect(typeof errorManager.fetchWithRetry).toBe('function');
    expect(typeof errorManager.loadJSONWithRetry).toBe('function');
  });
});

describe('Error Classification Edge Cases', () => {
  let manager: ErrorManager;

  beforeEach(() => {
    manager = new ErrorManager();
  });

  it('should handle string errors', () => {
    const errorInfo = manager.classifyError('Simple error message');
    expect(errorInfo.message).toBe('Simple error message');
    expect(errorInfo.type).toBe('unknown');
  });

  it('should handle errors without stack traces', () => {
    const error = new Error('Test error');
    error.stack = undefined;

    const errorInfo = manager.classifyError(error);
    expect(errorInfo.message).toBe('Test error');
    expect(errorInfo.details).toBeUndefined();
  });

  it('should handle empty error messages', () => {
    const error = new Error('');
    const errorInfo = manager.classifyError(error);

    expect(errorInfo.message).toBe('');
    expect(errorInfo.type).toBe('unknown');
  });
});
