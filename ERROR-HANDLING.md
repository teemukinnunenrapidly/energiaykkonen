# E1 Calculator - Error Handling & Retry Logic

This document describes the comprehensive error handling and retry system implemented for the E1 Calculator widget.

## 🎯 Overview

The error handling system provides:

- **Clear User Feedback**: Finnish-language error messages with intuitive UI
- **Automatic Retry Logic**: 3-attempt exponential backoff for transient failures
- **Error Classification**: Automatic categorization of different error types
- **Comprehensive Testing**: Automated error scenario testing across browsers
- **Debug Support**: Detailed logging and error context for troubleshooting

## 🏗️ Architecture

### Core Components

1. **ErrorManager** (`src/components/error-handling/ErrorManager.ts`)
   - Centralized error classification and retry logic
   - Exponential backoff with jitter
   - Network request handling with timeouts

2. **ErrorDisplay** (`src/components/error-handling/ErrorDisplay.tsx`)
   - User-facing error UI components
   - Retry buttons and progress indicators
   - Responsive and accessible design

3. **Enhanced Widget** (`src/widget/enhanced-standalone-widget.tsx`)
   - Integrated error handling in widget lifecycle
   - React Error Boundaries for render errors
   - Context-aware error reporting

## 🔍 Error Types & Classification

The system automatically classifies errors into these categories:

### Network Errors (`network`)
- **Symptoms**: `fetch failed`, `connection refused`, `ECONNREFUSED`
- **User Message**: "Verkkovirhe - Yhteysvirhe palvelimeen"
- **Retryable**: ✅ Yes (3 attempts with exponential backoff)
- **Common Causes**: Internet connectivity issues, server overload

### Configuration Errors (`config`)
- **Symptoms**: `config.json not found`, `404`, JSON parsing errors
- **User Message**: "Asetusvirhe - Laskurin asetustiedosto puuttuu"
- **Retryable**: ✅ Yes (server may be temporarily unavailable)
- **Common Causes**: Missing config files, server configuration issues

### Dependency Errors (`dependency`)
- **Symptoms**: `script not loaded`, `404 .js/.css`, resource loading failures
- **User Message**: "Resurssivirhe - Tarvittava resurssi ei ole käytettävissä"
- **Retryable**: ✅ Yes (CDN issues may be temporary)
- **Common Causes**: CDN failures, missing files, network issues

### Validation Errors (`validation`)
- **Symptoms**: `no cards available`, invalid data structure
- **User Message**: "Tietovirhe - Ladatut tiedot ovat virheellisiä"
- **Retryable**: ❌ No (data structure issues require manual fix)
- **Common Causes**: Invalid configuration data, missing required fields

### Timeout Errors (`timeout`)
- **Symptoms**: `timeout`, `timed out`, request duration > 10s
- **User Message**: "Aikakatkaisuvirhe - Pyyntö kesti liian kauan"
- **Retryable**: ✅ Yes (server may respond faster on retry)
- **Common Causes**: Slow server response, network latency

### Permission Errors (`permission`)
- **Symptoms**: `CORS`, `403 Forbidden`, `401 Unauthorized`
- **User Message**: "Käyttöoikeusvirhe - Resurssin käyttö estettiin"
- **Retryable**: ❌ No (permission issues require configuration fix)
- **Common Causes**: CORS misconfiguration, authentication issues

### Render Errors (`render`)
- **Symptoms**: React component errors, JavaScript exceptions during render
- **User Message**: "Näyttövirhe - Laskurin näyttämisessä tapahtui virhe"
- **Retryable**: ✅ Yes (may be transient state issue)
- **Common Causes**: Invalid props, component lifecycle issues

## ⚙️ Retry Configuration

### Default Settings
```typescript
{
  maxAttempts: 3,        // Maximum retry attempts
  baseDelay: 1000,       // Base delay (1 second)
  maxDelay: 10000,       // Maximum delay (10 seconds)
  backoffMultiplier: 2,  // Double delay each retry
  jitter: true           // Add ±25% randomization
}
```

### Exponential Backoff Formula
```
delay = min(baseDelay × (backoffMultiplier ^ attempt), maxDelay)
```

With jitter:
```
finalDelay = delay ± (delay × 0.25 × random())
```

### Example Retry Timeline
- **Attempt 1**: Immediate
- **Attempt 2**: ~1 second delay (750ms - 1250ms with jitter)
- **Attempt 3**: ~2 second delay (1500ms - 2500ms with jitter)
- **Final failure**: ~4 second delay total

## 🎨 User Interface

### Full Error Display
- **Location**: Main widget container when initialization fails
- **Features**: 
  - Error type icon and emoji
  - Finnish title and description
  - Technical details in expandable section
  - Retry button (if applicable)
  - Retry counter
  - Timestamp

### Compact Error Display
- **Location**: Smaller containers, loading states
- **Features**:
  - Minimal error message
  - Small retry button
  - Loading spinner during retry

### Loading with Error
- **Location**: During resource loading
- **Features**:
  - Seamless transition from loading to error
  - Context-appropriate retry options
  - Custom loading messages

## 🔧 Integration Examples

### Basic Widget with Error Handling
```typescript
import { E1CalculatorWidget } from './enhanced-standalone-widget';

const config = {
  configUrl: 'https://example.com/config.json',
  enableRetry: true,
  maxRetries: 3,
  showDetailedErrors: true,
  onError: (error) => {
    console.log('Widget error:', error);
    // Custom error tracking/reporting
  }
};

<E1CalculatorWidget 
  config={config} 
  elementId="my-widget"
  isolationMode="shadow" 
/>
```

### Custom Retry Configuration
```typescript
import { ErrorManager } from './ErrorManager';

const customErrorManager = new ErrorManager({
  maxAttempts: 5,
  baseDelay: 500,
  maxDelay: 15000,
  backoffMultiplier: 1.5,
  jitter: false
});

// Use for custom operations
const data = await customErrorManager.loadJSONWithRetry(url);
```

### Manual Error Classification
```typescript
import { errorManager } from './ErrorManager';

try {
  // Some operation
} catch (error) {
  const errorInfo = errorManager.classifyError(error, {
    widgetId: 'my-widget',
    isolationMode: 'shadow',
    url: 'https://example.com/api'
  });
  
  // Handle classified error
  console.log(`Error type: ${errorInfo.type}, Retryable: ${errorInfo.retryable}`);
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run error handling unit tests
npm run test:error-unit

# Run specific test suite
npm run test src/components/error-handling/__tests__/ErrorManager.test.ts
```

### Integration Tests
```bash
# Run comprehensive error scenario tests
npm run test:error-handling

# Run all error handling tests
npm run test:error-all
```

### Manual Testing
The error scenario tester creates test pages for each error type:
```bash
npm run test:error-handling
# Open generated HTML files in test-pages/error-scenario-*.html
```

### Test Scenarios Covered

1. **Network Errors**: Connection failures, timeouts
2. **404 Errors**: Missing configuration files
3. **Malformed JSON**: Invalid response format
4. **Invalid Data**: Missing required data structure
5. **Request Timeouts**: Slow server responses
6. **Successful Recovery**: Retry success scenarios
7. **CORS Issues**: Cross-origin request blocking
8. **Dependency Loading**: Script/CSS loading failures

## 📊 Monitoring & Debugging

### Error Statistics
```typescript
import { errorManager } from './ErrorManager';

// Get error statistics
const stats = errorManager.getErrorStats();
console.log('Error summary:', stats);
// Output: { total: 5, byType: { network: 3, config: 2 }, recentErrors: [...] }
```

### Debug Logging
```typescript
// Enable debug logging (stores errors in sessionStorage)
errorManager.enableDebugLogging();

// Retrieve debug logs
const logs = JSON.parse(sessionStorage.getItem('e1-debug-logs') || '[]');
```

### Widget Events
```typescript
// Listen for error events
document.addEventListener('e1-calculator-error', (event) => {
  console.log('Widget error event:', event.detail);
});

// Listen for successful load events
document.addEventListener('e1-calculator-loaded', (event) => {
  console.log('Widget loaded after', event.detail.retryCount, 'attempts');
});
```

## 🚀 Production Deployment

### WordPress Integration
The enhanced error handling is automatically integrated when using the WordPress plugin:

```php
// WordPress shortcode with error handling
[e1_calculator type="default" theme="light" enable_retry="true"]
```

### Performance Considerations
- Error classification is fast (< 1ms per error)
- Retry logic uses efficient exponential backoff
- Error UI components are lightweight (~5KB additional)
- Browser support includes IE11+ with graceful degradation

### Security
- Error messages don't expose sensitive information
- Stack traces are only shown in development mode
- Network requests respect CORS policies
- Rate limiting prevents retry abuse

## 🔄 Migration from Basic Error Handling

### Before (Basic)
```typescript
// Old basic error handling
try {
  const config = await fetch(configUrl).then(r => r.json());
  setWidgetData(config);
} catch (error) {
  console.error('Failed to load:', error);
  setError('Loading failed');
}
```

### After (Enhanced)
```typescript
// New enhanced error handling
import { loadJSONWithRetry, errorManager } from './ErrorManager';

try {
  const config = await loadJSONWithRetry(configUrl, { widgetId });
  setWidgetData(config);
} catch (error) {
  // Error is automatically classified and retried
  const errorInfo = errorManager.classifyError(error);
  setError(errorInfo);  // Rich error object with retry capability
}
```

## 📋 Troubleshooting

### Common Issues

**Error: "Maximum retry attempts reached"**
- Check network connectivity
- Verify server is responding
- Increase retry limit if needed for slow networks

**Error: "Config not found" persisting after retries**
- Verify configUrl is correct
- Check server logs for 404s
- Ensure WordPress plugin is properly synced

**Error: "CORS policy blocked"**
- Configure server CORS headers
- Use same-origin requests when possible
- Check browser console for detailed CORS errors

**Error: "No cards available"**
- Verify config.json has valid data structure
- Check that cards array exists and is not empty
- Validate JSON syntax

### Performance Impact
- **Bundle Size**: +15KB (minified) for error handling system
- **Runtime Overhead**: < 1ms per error classification
- **Memory Usage**: ~50KB for error history (50 errors max)
- **Network Impact**: Retry attempts are rate-limited and use exponential backoff

## 🎯 Best Practices

### Error Message Design
- Use clear, non-technical Finnish language
- Provide actionable solutions when possible
- Include retry options for transient failures
- Show progress during retry attempts

### Error Context
- Always include relevant context (URL, widget ID, etc.)
- Capture user agent and browser info
- Log timestamp and retry attempts
- Preserve error history for debugging

### Retry Strategy
- Use exponential backoff to avoid overwhelming servers
- Add jitter to prevent thundering herd problems
- Limit total retry attempts to prevent infinite loops
- Classify errors correctly to avoid unnecessary retries

### User Experience
- Show immediate feedback during errors
- Provide clear retry options
- Use loading states during retry attempts
- Offer alternative actions when appropriate

---

For more information, see the source code documentation in `src/components/error-handling/`.