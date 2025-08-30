# CardStream Widget - Complete Implementation Plan

## Executive Summary

This document outlines the complete implementation strategy for deploying the CardStream calculator widget as an embeddable solution across multiple websites, with a focus on performance, scalability, and ease of integration.

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Host Website                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  <div id="ecosave-calculator"></div>            │   │
│  │  <script src="widget.min.js"></script>          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     CDN Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ widget.min.js│  │ widget.min.css│  │   Assets    │  │
│  │   (6-8KB)    │  │   (included)   │  │  (sprites)  │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Calculate   │  │  Lead Capture │  │  Analytics  │  │
│  │   Endpoint   │  │   Endpoint    │  │   Endpoint  │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), No dependencies
- **Styling**: Inline CSS injection, BEM methodology
- **Build Tools**: Webpack 5, Terser, PostCSS
- **CDN**: CloudFlare/AWS CloudFront
- **Backend**: Node.js/Express or serverless functions
- **Database**: PostgreSQL/MongoDB for lead storage
- **Analytics**: Custom lightweight tracking

---

## 2. Development Phase

### 2.1 Project Structure

```
cardstream-widget/
├── src/
│   ├── core/
│   │   ├── widget.js           # Main widget class
│   │   ├── calculator.js       # Calculation logic
│   │   └── validator.js        # Form validation
│   ├── styles/
│   │   ├── base.css           # Base styles
│   │   ├── cards.css          # Card components
│   │   └── animations.css     # Transitions
│   ├── templates/
│   │   ├── layout.js          # HTML templates
│   │   └── cards.js           # Card templates
│   ├── utils/
│   │   ├── dom.js             # DOM utilities
│   │   ├── events.js          # Event handling
│   │   └── api.js             # API communication
│   └── index.js               # Entry point
├── dist/
│   ├── widget.min.js          # Production bundle
│   └── widget.min.js.map      # Source map
├── examples/
│   ├── basic.html             # Basic integration
│   ├── wordpress.php          # WordPress example
│   └── react.jsx              # React wrapper
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
└── build/
    ├── webpack.config.js      # Webpack configuration
    └── rollup.config.js       # Alternative bundler
```

### 2.2 Core Widget Class

```javascript
// src/core/widget.js
export class CardStreamWidget {
  constructor(container, config = {}) {
    this.version = '1.0.0';
    this.container = container;
    this.config = {
      apiEndpoint: 'https://api.ecosave.com/v1',
      theme: 'default',
      locale: 'en',
      currency: 'EUR',
      analytics: true,
      compression: true,
      lazyLoad: true,
      ...config
    };
    
    this.state = {
      currentCard: 0,
      formData: {},
      calculations: {},
      isLoading: false,
      errors: {}
    };
  }
  
  async init() {
    try {
      this.injectStyles();
      this.render();
      this.attachEventListeners();
      this.trackEvent('widget_loaded');
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### 2.3 Build Configuration

```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'widget.min.js',
    library: 'CardStreamWidget',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log']
          },
          mangle: {
            safari10: true
          }
        }
      }),
      new CssMinimizerPlugin()
    ]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  }
};
```

---

## 3. Optimization Strategy

### 3.1 Performance Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Initial Load | < 8KB | Minification, compression |
| Time to Interactive | < 100ms | Lazy loading, async init |
| First Paint | < 50ms | Critical CSS inline |
| API Response | < 200ms | Edge caching, CDN |
| Browser Support | > 95% | Transpilation, polyfills |

### 3.2 Loading Strategies

```javascript
// Lazy Loading Implementation
class LazyLoader {
  static async load(containerId) {
    // Stage 1: Minimal shell (2KB)
    const shell = document.getElementById(containerId);
    shell.innerHTML = `
      <div class="cw-loading">
        <div class="cw-spinner"></div>
        Loading calculator...
      </div>
    `;
    
    // Stage 2: Check viewport intersection
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            this.loadFullWidget(containerId);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(shell);
    } else {
      // Fallback for older browsers
      this.loadFullWidget(containerId);
    }
  }
  
  static async loadFullWidget(containerId) {
    // Stage 3: Load full widget
    const { CardStreamWidget } = await import('./widget.js');
    new CardStreamWidget(containerId).init();
  }
}
```

### 3.3 Compression & Caching

```nginx
# Nginx configuration
location ~* \.(js|css)$ {
    # Enable gzip and brotli
    gzip on;
    gzip_types text/javascript application/javascript;
    brotli on;
    brotli_comp_level 6;
    
    # Cache headers
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header CDN-Cache-Control "max-age=31536000";
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
}
```

---

## 4. Integration Methods

### 4.1 Universal JavaScript Embed

```html
<!-- Basic Integration -->
<div id="cardstream-calculator"></div>
<script>
  (function(w,d,s,o,f,js,fjs){
    w['CardStream']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','cs','https://cdn.ecosave.com/widget.min.js'));
  
  cs('init', {
    container: 'cardstream-calculator',
    apiKey: 'YOUR_API_KEY',
    theme: 'light'
  });
</script>
```

### 4.2 WordPress Plugin

```php
<?php
/**
 * Plugin Name: CardStream Calculator
 * Description: Embeddable energy savings calculator
 * Version: 1.0.0
 */

// Register shortcode
add_shortcode('cardstream', 'cardstream_shortcode');

function cardstream_shortcode($atts) {
    $atts = shortcode_atts([
        'theme' => 'default',
        'locale' => get_locale(),
        'currency' => 'EUR',
        'api_key' => get_option('cardstream_api_key')
    ], $atts);
    
    // Enqueue script
    wp_enqueue_script(
        'cardstream-widget',
        'https://cdn.ecosave.com/widget.min.js',
        [],
        '1.0.0',
        true
    );
    
    // Add initialization
    wp_add_inline_script(
        'cardstream-widget',
        sprintf(
            "CardStream.init(%s);",
            json_encode($atts)
        )
    );
    
    return '<div id="cardstream-calculator-' . uniqid() . '"></div>';
}

// Admin settings page
add_action('admin_menu', 'cardstream_admin_menu');

function cardstream_admin_menu() {
    add_options_page(
        'CardStream Settings',
        'CardStream',
        'manage_options',
        'cardstream',
        'cardstream_settings_page'
    );
}
```

### 4.3 React Component Wrapper

```jsx
// React wrapper component
import { useEffect, useRef } from 'react';

const CardStreamCalculator = ({ 
  apiKey, 
  theme = 'default', 
  onComplete,
  onError 
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  
  useEffect(() => {
    const loadWidget = async () => {
      try {
        // Dynamically import widget
        const script = document.createElement('script');
        script.src = 'https://cdn.ecosave.com/widget.min.js';
        script.async = true;
        
        script.onload = () => {
          widgetRef.current = new window.CardStream({
            container: containerRef.current,
            apiKey,
            theme,
            onComplete,
            onError
          });
          
          widgetRef.current.init();
        };
        
        document.body.appendChild(script);
      } catch (error) {
        onError?.(error);
      }
    };
    
    loadWidget();
    
    return () => {
      widgetRef.current?.destroy();
    };
  }, [apiKey, theme]);
  
  return <div ref={containerRef} id="cardstream-calculator" />;
};

export default CardStreamCalculator;
```

### 4.4 Next.js Integration

```jsx
// Next.js dynamic import
import dynamic from 'next/dynamic';

const CardStreamCalculator = dynamic(
  () => import('@/components/CardStreamCalculator'),
  { 
    ssr: false,
    loading: () => <div>Loading calculator...</div>
  }
);

export default function HomePage() {
  return (
    <div>
      <h1>Calculate Your Savings</h1>
      <CardStreamCalculator 
        apiKey={process.env.NEXT_PUBLIC_CARDSTREAM_API_KEY}
        theme="light"
      />
    </div>
  );
}
```

---

## 5. API Specification

### 5.1 Endpoints

```yaml
openapi: 3.0.0
info:
  title: CardStream Widget API
  version: 1.0.0

paths:
  /calculate:
    post:
      summary: Calculate energy savings
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                propertyType: string
                floorArea: number
                ceilingHeight: number
                heatingType: string
                annualCost: number
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  volume: number
                  savings: number
                  percentage: number
  
  /lead:
    post:
      summary: Submit lead information
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                firstName: string
                lastName: string
                email: string
                calculations: object
      responses:
        201:
          description: Lead created successfully
```

### 5.2 Security Measures

```javascript
// API Security Implementation
class APIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.ecosave.com/v1';
  }
  
  async request(endpoint, data) {
    // Rate limiting
    await this.checkRateLimit();
    
    // Build request
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Widget-Version': VERSION,
        'X-Origin': window.location.origin
      },
      body: JSON.stringify({
        ...data,
        timestamp: Date.now(),
        fingerprint: this.getFingerprint()
      })
    });
    
    // Validate response
    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }
    
    return response.json();
  }
  
  getFingerprint() {
    // Generate browser fingerprint for fraud detection
    return btoa([
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|'));
  }
}
```

---

## 6. Deployment Strategy

### 6.1 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Widget

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build widget
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Upload to CDN
        run: |
          aws s3 sync dist/ s3://cdn-bucket/widget/ \
            --cache-control "max-age=31536000"
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id $DISTRIBUTION_ID \
            --paths "/widget/*"
```

### 6.2 Version Management

```javascript
// Versioning strategy
const VERSION_CONFIG = {
  current: '1.0.0',
  minimum: '0.9.0',
  cdn: {
    latest: 'https://cdn.ecosave.com/widget.min.js',
    versioned: 'https://cdn.ecosave.com/widget-v1.0.0.min.js',
    beta: 'https://cdn.ecosave.com/widget-beta.min.js'
  },
  deprecation: {
    '0.8.0': '2024-12-31',
    '0.9.0': '2025-06-30'
  }
};
```

### 6.3 Rollback Plan

```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=$1
CURRENT_VERSION=$2

echo "Rolling back from $CURRENT_VERSION to $PREVIOUS_VERSION"

# Update CDN
aws s3 cp s3://cdn-bucket/widget-v$PREVIOUS_VERSION.min.js \
         s3://cdn-bucket/widget.min.js

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/widget.min.js"

# Update version endpoint
curl -X POST https://api.ecosave.com/admin/widget/version \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"version\": \"$PREVIOUS_VERSION\"}"

# Send notification
./notify-rollback.sh $PREVIOUS_VERSION $CURRENT_VERSION
```

---

## 7. Monitoring & Analytics

### 7.1 Performance Monitoring

```javascript
// Performance tracking
class PerformanceMonitor {
  static track() {
    if (!window.performance) return;
    
    const metrics = {
      loadTime: performance.timing.loadEventEnd - 
                performance.timing.fetchStart,
      domReady: performance.timing.domContentLoadedEventEnd - 
                performance.timing.fetchStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
      widgetInit: performance.mark('widget-initialized')
    };
    
    // Send to analytics
    this.sendMetrics(metrics);
  }
  
  static sendMetrics(metrics) {
    // Batch and send metrics
    navigator.sendBeacon('/analytics/performance', JSON.stringify({
      metrics,
      url: window.location.href,
      timestamp: Date.now(),
      version: VERSION
    }));
  }
}
```

### 7.2 Error Tracking

```javascript
// Error handling and reporting
class ErrorReporter {
  static init() {
    window.addEventListener('error', (e) => {
      this.report({
        message: e.message,
        source: e.filename,
        line: e.lineno,
        column: e.colno,
        stack: e.error?.stack
      });
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      this.report({
        message: 'Unhandled Promise Rejection',
        reason: e.reason
      });
    });
  }
  
  static report(error) {
    // Send to error tracking service
    fetch('/analytics/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error,
        context: {
          version: VERSION,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      })
    });
  }
}
```

### 7.3 Analytics Dashboard

```sql
-- Key metrics queries

-- Daily Active Widgets
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT widget_id) as active_widgets,
  COUNT(DISTINCT domain) as unique_domains
FROM widget_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);

-- Conversion Funnel
SELECT 
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT CASE WHEN event = 'form_started' THEN session_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'calculation_complete' THEN session_id END) as calculated,
  COUNT(DISTINCT CASE WHEN event = 'lead_submitted' THEN session_id END) as submitted
FROM widget_events
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Performance Metrics
SELECT 
  percentile_cont(0.5) WITHIN GROUP (ORDER BY load_time) as median_load,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY load_time) as p95_load,
  AVG(load_time) as avg_load
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```javascript
// tests/unit/calculator.test.js
describe('Calculator', () => {
  test('calculates volume correctly', () => {
    const calc = new Calculator();
    const result = calc.calculateVolume(150, 2.5);
    expect(result).toBe(375);
  });
  
  test('calculates savings based on heating type', () => {
    const calc = new Calculator();
    const testCases = [
      { type: 'oil', cost: 2000, expected: 1400 },
      { type: 'electric', cost: 2000, expected: 1000 },
      { type: 'gas', cost: 2000, expected: 800 }
    ];
    
    testCases.forEach(({ type, cost, expected }) => {
      expect(calc.calculateSavings(type, cost)).toBe(expected);
    });
  });
});
```

### 8.2 Integration Tests

```javascript
// tests/integration/widget.test.js
describe('Widget Integration', () => {
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  test('initializes correctly', async () => {
    const widget = new CardStreamWidget(container);
    await widget.init();
    
    expect(container.querySelector('.card-stream-panel')).toBeTruthy();
    expect(container.querySelector('.visual-panel')).toBeTruthy();
  });
  
  test('progresses through cards', async () => {
    const widget = new CardStreamWidget(container);
    await widget.init();
    
    // Fill first card
    const propertyType = container.querySelector('#property-type');
    propertyType.value = 'house';
    propertyType.dispatchEvent(new Event('change'));
    
    // Check if next card unlocked
    await waitFor(() => {
      const card2 = container.querySelector('#card-2');
      expect(card2.classList.contains('unlocked')).toBe(true);
    });
  });
});
```

### 8.3 Browser Testing Matrix

| Browser | Versions | Test Coverage |
|---------|----------|---------------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| iOS Safari | 14+ | Full |
| Chrome Android | 90+ | Full |
| Samsung Internet | 14+ | Basic |
| IE 11 | - | Fallback only |

---

## 9. Documentation

### 9.1 Integration Guide

```markdown
# Quick Start Guide

## 1. Get Your API Key
Sign up at https://dashboard.ecosave.com to get your API key.

## 2. Add the Widget
```html
<div id="calculator"></div>
<script src="https://cdn.ecosave.com/widget.min.js"></script>
<script>
  CardStream.init({
    container: 'calculator',
    apiKey: 'YOUR_API_KEY'
  });
</script>
```

## 3. Customize (Optional)
```javascript
CardStream.init({
  container: 'calculator',
  apiKey: 'YOUR_API_KEY',
  theme: 'dark',
  locale: 'de',
  currency: 'EUR',
  onComplete: (data) => {
    console.log('Lead submitted:', data);
  }
});
```
```

### 9.2 API Reference

```typescript
// TypeScript definitions
interface CardStreamConfig {
  container: string | HTMLElement;
  apiKey: string;
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
  currency?: string;
  companyName?: string;
  customFields?: CustomField[];
  webhookUrl?: string;
  analytics?: boolean;
  debug?: boolean;
  onInit?: () => void;
  onProgress?: (step: number) => void;
  onComplete?: (data: LeadData) => void;
  onError?: (error: Error) => void;
}

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
  validation?: RegExp;
}

interface LeadData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  propertyData: {
    type: string;
    area: number;
    height: number;
  };
  heatingData: {
    currentType: string;
    annualCost: number;
  };
  calculations: {
    volume: number;
    estimatedSavings: number;
    savingsPercentage: number;
  };
}
```

---

## 10. Timeline & Milestones

### Phase 1: Foundation (Week 1-2)
- [x] Architecture design
- [ ] Core widget development
- [ ] Basic styling
- [ ] Local testing environment

### Phase 2: Features (Week 3-4)
- [ ] Card progression logic
- [ ] Form validation
- [ ] Calculation engine
- [ ] API integration

### Phase 3: Optimization (Week 5)
- [ ] Performance optimization
- [ ] Bundle size reduction
- [ ] Browser compatibility
- [ ] Loading strategies

### Phase 4: Integration (Week 6)
- [ ] CDN deployment
- [ ] WordPress plugin
- [ ] React wrapper
- [ ] Documentation

### Phase 5: Testing (Week 7)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Browser testing
- [ ] Load testing

### Phase 6: Launch (Week 8)
- [ ] Beta deployment
- [ ] Partner integration
- [ ] Monitoring setup
- [ ] Go-live

---

## 11. Success Metrics

### Technical KPIs
- Page load impact: < 100ms
- Bundle size: < 10KB gzipped
- Browser support: > 95%
- Uptime: 99.9%
- API response time: < 200ms

### Business KPIs
- Conversion rate: > 15%
- Lead quality score: > 80%
- Integration time: < 30 minutes
- Support tickets: < 5% of installs
- Partner satisfaction: > 4.5/5

### Monitoring Dashboard
```javascript
// Real-time metrics tracking
const MetricsDashboard = {
  realtime: {
    activeWidgets: 1247,
    currentUsers: 89,
    apiLatency: 145, // ms
    errorRate: 0.02 // %
  },
  daily: {
    impressions: 45678,
    starts: 12345,
    completions: 4567,
    conversionRate: 37.1 // %
  },
  alerts: [
    { level: 'warning', message: 'API latency above 200ms' },
    { level: 'info', message: 'New version 1.0.1 available' }
  ]
};
```

---

## 12. Support & Maintenance

### 12.1 Support Channels
- Developer documentation: https://docs.ecosave.com
- Email support: developers@ecosave.com
- Slack community: ecosave-developers.slack.com
- GitHub issues: github.com/ecosave/widget/issues

### 12.2 SLA Commitments
- Response time: < 4 hours (business days)
- Resolution time: < 24 hours (critical), < 72 hours (standard)
- Uptime guarantee: 99.9%
- API rate limits: 1000 requests/hour per API key

### 12.3 Update Schedule
- Security patches: As needed (immediate)
- Bug fixes: Bi-weekly
- Feature updates: Monthly
- Major versions: Quarterly

---

## Appendix A: Security Checklist

- [ ] Content Security Policy headers configured
- [ ] XSS protection implemented
- [ ] CSRF tokens for API requests
- [ ] Input sanitization on all fields
- [ ] Rate limiting per domain/IP
- [ ] API key rotation mechanism
- [ ] SSL/TLS encryption enforced
- [ ] Regular security audits scheduled
- [ ] GDPR compliance verified
- [ ] Privacy policy integration

## Appendix B: Emergency Procedures

### Widget Failure
1. Automatic fallback to cached version
2. Error reported to monitoring
3. User shown graceful degradation message
4. Support team notified if widespread

### API Outage
1. Widget enters offline mode
2. Form data cached locally
3. Retry mechanism activated
4. Data synced when connection restored

### Security Breach
1. Immediate API key revocation
2. Affected partners notified
3. Security patch deployed
4. Post-mortem analysis conducted