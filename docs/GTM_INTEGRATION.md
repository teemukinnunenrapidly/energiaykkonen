# Google Tag Manager (GTM) Integration

This document describes the Google Tag Manager integration implemented in the E1 Calculator application.

## Overview

Google Tag Manager has been integrated to enable comprehensive tracking and analytics for the calculator application. The integration includes:

- **GTM Container ID**: `GTM-KVS6J6V`
- **Event Tracking**: Form submissions, calculations, PDF generation, email sending, and errors
- **Data Layer**: Structured data for analytics and marketing tools

## Implementation Details

### 1. Core Components

#### `src/components/GoogleTagManager.tsx`

- Main GTM component for script injection
- Handles both the main script and noscript fallback
- Uses Next.js `Script` component with `afterInteractive` strategy

#### `src/config/gtm.ts`

- Configuration file with GTM ID and event helpers
- TypeScript definitions for dataLayer
- Predefined event functions for common tracking scenarios

### 2. Integration Points

#### Layout Integration (`src/app/layout.tsx`)

- GTM script injected in `<head>` section
- Noscript fallback in `<body>` section
- Loads on every page of the application

#### Form Tracking (`src/components/card-system/cards/FormCard.tsx`)

- Tracks form start events
- Tracks successful form submissions
- Tracks form submission errors
- Includes form metadata (card ID, lead ID, PDF generation status)

#### Calculation Tracking (`src/components/card-system/cards/CalculationCard.tsx`)

- Tracks calculation start events
- Tracks successful calculation completions
- Tracks calculation errors
- Includes calculation metadata (result, unit, formula)

## Event Types

### Form Events

- `form_start`: When user begins filling a form
- `form_submit`: When form is successfully submitted
- `form_error`: When form submission fails

### Calculation Events

- `calculation_start`: When calculation process begins
- `calculation_complete`: When calculation finishes successfully
- `calculation_error`: When calculation fails

### System Events

- `pdf_generated`: When PDF is successfully created
- `email_sent`: When email is successfully sent
- `error_occurred`: When any system error occurs

## Data Layer Structure

All events are pushed to the `dataLayer` with the following structure:

```javascript
{
  event: 'event_name',
  // Event-specific data
  card_name: 'string',
  card_id: 'string',
  lead_id: 'string',
  // Additional metadata based on event type
}
```

## Usage Examples

### Basic Event Tracking

```typescript
import { gtmEvents } from '@/config/gtm';

// Track form start
gtmEvents.formStart('energy_calculator');

// Track calculation completion
gtmEvents.calculationComplete('energy_calculation', {
  result: '20820',
  unit: 'kWh',
  formula: 'calc:energy_consumption',
});

// Track error
gtmEvents.errorOccurred('calculation_failed', 'Invalid input data');
```

### Custom Event Tracking

```typescript
import { gtmPush } from '@/config/gtm';

// Push custom event to dataLayer
gtmPush({
  event: 'custom_event',
  custom_property: 'custom_value',
  user_action: 'button_click',
});
```

## Testing

### Test Page

Visit `/test-gtm` to test all GTM events:

- Sends sample events for all event types
- Provides console output for verification
- Includes instructions for GTM preview mode

### Verification Steps

1. Open browser developer tools (F12)
2. Go to Console tab
3. Visit `/test-gtm` page
4. Click "Send Test Events" button
5. Check console for `dataLayer.push()` calls
6. Use GTM Preview mode to see events in real-time

## GTM Configuration

### Required Tags

Set up the following tags in your GTM container:

1. **Page View Tag**
   - Trigger: All Pages
   - Type: Google Analytics: GA4 Event
   - Event Name: `page_view`

2. **Form Events Tag**
   - Trigger: Custom Event = `form_start` OR `form_submit`
   - Type: Google Analytics: GA4 Event
   - Event Name: `{{Event}}`

3. **Calculation Events Tag**
   - Trigger: Custom Event = `calculation_start` OR `calculation_complete`
   - Type: Google Analytics: GA4 Event
   - Event Name: `{{Event}}`

4. **Error Events Tag**
   - Trigger: Custom Event = `error_occurred`
   - Type: Google Analytics: GA4 Event
   - Event Name: `error_occurred`

### Variables

Create the following variables in GTM:

- `Card Name`: `{{Card Name}}`
- `Card ID`: `{{Card ID}}`
- `Lead ID`: `{{Lead ID}}`
- `Error Type`: `{{Error Type}}`
- `Error Message`: `{{Error Message}}`

## Environment Configuration

### Development

- GTM loads in development mode
- Events are logged to console
- Test page available at `/test-gtm`

### Production

- GTM loads with full tracking
- Events sent to configured analytics tools
- Error tracking enabled

## Troubleshooting

### Common Issues

1. **GTM not loading**
   - Check GTM ID in `src/config/gtm.ts`
   - Verify network connectivity
   - Check browser console for errors

2. **Events not appearing in GTM**
   - Verify GTM container is published
   - Check GTM preview mode
   - Ensure triggers are configured correctly

3. **Data not appearing in Analytics**
   - Verify GTM tags are firing
   - Check Analytics configuration
   - Ensure proper event mapping

### Debug Mode

Enable debug mode by adding to browser console:

```javascript
// Enable GTM debug mode
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
```

## Security Considerations

- No sensitive data is tracked in GTM events
- User input is sanitized before tracking
- PII is excluded from event data
- Error messages are generic to avoid exposing system details

## Performance Impact

- GTM script loads asynchronously
- Events are batched to minimize performance impact
- No blocking operations in event tracking
- Minimal impact on page load times

## Future Enhancements

- Enhanced e-commerce tracking
- Custom dimension tracking
- Advanced funnel analysis
- A/B testing integration
- Conversion optimization tracking
