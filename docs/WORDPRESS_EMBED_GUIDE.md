# WordPress Embed Integration Guide

## Overview

This guide explains how to embed the E1 Calculator into any WordPress website using an iframe with automatic height adjustment.

## Embed URL

**Production:** `https://laskuri.energiaykkonen.fi/embed`

The `/embed` route provides a widget-only view without header, footer, or navigation.

## Current Implementation Status

### Already Implemented:

1. **CORS Headers** - API allows cross-origin requests
2. **Responsive Design** - Calculator adapts to container width
3. **Mobile Support** - Works on all devices
4. **Dedicated Embed Route** - Clean widget-only view at `/embed`
5. **Auto-resize** - Height adjustment via postMessage

### Embed Methods Available:

## Method 1: Simple iframe (No Auto-resize)

Paste this HTML into any WordPress page/post using the HTML block:

```html
<iframe
  src="https://laskuri.energiaykkonen.fi/embed"
  width="100%"
  height="2000"
  frameborder="0"
  loading="lazy"
  style="border: none; overflow: hidden;"
>
</iframe>
```

**Pros:** Simple, works immediately
**Cons:** Fixed height, may have scrollbars or excess space

## Method 2: Auto-resize iframe (Recommended)

This method automatically adjusts the iframe height to match content.

### Step 1: Add to WordPress Header (once per site)

Add this script to your WordPress theme's header or use a plugin like "Insert Headers and Footers":

```html
<script>
  // E1 Calculator Auto-resize Handler
  window.addEventListener('message', function (event) {
    // Security: Only accept messages from the calculator domain
    if (event.origin !== 'https://laskuri.energiaykkonen.fi') {
      return;
    }

    if (event.data && event.data.type === 'E1_CALCULATOR_RESIZE') {
      const iframes = document.querySelectorAll('.e1-calculator-iframe');
      iframes.forEach(function (iframe) {
        if (event.data.height) {
          iframe.style.height = event.data.height + 'px';
        }
      });
    }
  });
</script>
```

### Step 2: Add iframe to Any Page

Use this HTML in WordPress pages/posts:

```html
<iframe
  class="e1-calculator-iframe"
  src="https://laskuri.energiaykkonen.fi/embed"
  width="100%"
  height="800"
  frameborder="0"
  scrolling="no"
  loading="lazy"
  style="border: none; overflow: hidden; transition: height 0.3s ease;"
>
</iframe>
```

## Method 3: WordPress Shortcode (Most User-Friendly)

### Step 1: Add to functions.php

Add this code to your theme's `functions.php` file:

```php
// E1 Calculator Shortcode
function e1_calculator_shortcode($atts) {
    $atts = shortcode_atts(array(
        'height' => '800'
    ), $atts);

    $calculator_url = 'https://laskuri.energiaykkonen.fi/embed';

    // Add auto-resize script (only once per page)
    static $script_added = false;
    $output = '';

    if (!$script_added) {
        $output .= '<script>
        window.addEventListener("message", function(event) {
            if (event.origin !== "https://laskuri.energiaykkonen.fi") return;
            if (event.data && event.data.type === "E1_CALCULATOR_RESIZE") {
                document.querySelectorAll(".e1-calculator-iframe").forEach(function(iframe) {
                    if (event.data.height) {
                        iframe.style.height = event.data.height + "px";
                    }
                });
            }
        });
        </script>';
        $script_added = true;
    }

    $output .= '<iframe
        class="e1-calculator-iframe"
        src="' . $calculator_url . '"
        width="100%"
        height="' . esc_attr($atts['height']) . '"
        frameborder="0"
        scrolling="no"
        loading="lazy"
        style="border: none; overflow: hidden; transition: height 0.3s ease;">
    </iframe>';

    return $output;
}
add_shortcode('e1_calculator', 'e1_calculator_shortcode');
```

### Step 2: Use Shortcode in Pages

Simply add this shortcode anywhere in WordPress:

```
[e1_calculator]
```

Or with custom height:

```
[e1_calculator height="800"]
```

## Method 4: WordPress Plugin (Coming Soon)

We can create a dedicated WordPress plugin that:

- Adds the calculator via widget
- Provides Gutenberg block
- Includes admin settings
- Handles all scripts automatically

## Styling Options

### Add Custom Container Styling

Wrap the iframe in a styled container:

```html
<div
  style="
  max-width: 900px; 
  margin: 0 auto; 
  padding: 20px;
  background: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
"
>
  <iframe class="e1-calculator-iframe" ...></iframe>
</div>
```

### Responsive Container

```html
<div
  class="calculator-container"
  style="
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
"
>
  <iframe class="e1-calculator-iframe" ...></iframe>
</div>
```

## UX & UI Best Practices

### 1. No Internal Scrollbars
The embed includes `scrolling="no"` and the calculator uses `overflow: hidden` to prevent ghost scrollbars. The auto-resize script ensures the iframe height always matches the content.

### 2. Smooth Height Transitions
Add `transition: height 0.3s ease-out;` to the iframe CSS for smooth animations when content changes height (e.g., moving between form steps).

### 3. Mobile Optimization
- The calculator is fully responsive and works on screens as narrow as 320px
- Input fields have 16px minimum font size to prevent iOS auto-zoom
- The embed has 16px horizontal padding to prevent edge clipping

### 4. Loading State
The embed displays a green spinner while loading to avoid white flash. For dark-themed sites, the iframe background is transparent by default.

### 5. Input Focus (iOS Zoom Prevention)
Mobile input fields use 16px font size to prevent iOS Safari from zooming when users tap input fields.

## Technical Optimizations

### Resize Message Debouncing
The calculator debounces resize messages (100ms) to prevent flooding the parent window with hundreds of postMessage calls during animations or rapid DOM changes.

### Infinite Growth Prevention
- Height comparison before sending: Only sends resize message if height actually changed
- `overflow: hidden` on html/body prevents recursive height growth loops
- The hook tracks previous height and skips duplicate messages

### Lazy Loading
All iframe examples include `loading="lazy"` attribute, which:
- Improves PageSpeed scores on the WordPress site
- Only loads the calculator when it approaches the viewport
- Reduces initial page load time

## Testing Checklist

Before going live, test:

**Functionality:**
- [ ] Calculator loads correctly
- [ ] Auto-resize works when changing form fields
- [ ] Form submission works
- [ ] PDF generation works
- [ ] Email notifications sent
- [ ] No console errors
- [ ] HTTPS works (production)

**UX & Visual:**
- [ ] No internal scrollbars (test by expanding all sections)
- [ ] Smooth height transitions when navigating steps
- [ ] Mobile responsive (test on 320px width / iPhone SE)
- [ ] No iOS input zoom when focusing text fields
- [ ] No white flash during initial load
- [ ] Card borders visible (not clipped at edges)

## Security Considerations

### HTTPS Required
The embed URL **must** use HTTPS (`https://laskuri.energiaykkonen.fi/embed`). Using HTTP will cause Mixed Content errors and the calculator will not load.

### Content Security Policy (CSP)
The calculator's CSP `frame-ancestors` directive controls which domains can embed it:

**Currently allowed:**
- `'self'` - laskuri.energiaykkonen.fi
- `https://energiaykkonen.fi`
- `https://*.energiaykkonen.fi`
- `https://www.energiaykkonen.fi`
- `localhost` (development only)

**To add new domains:** Contact the development team to update `next.config.ts`.

### Current Security Features:

1. **HSTS** - HTTP Strict Transport Security enforces HTTPS
2. **Input Sanitization** - All inputs are sanitized
3. **CORS Headers** - Configured for cross-origin API access
4. **Rate Limiting** - Form submissions are rate-limited
5. **CSP Headers** - Restricts embedding to whitelisted domains
6. **Origin Validation** - Resize messages only accepted from calculator domain

### For WordPress Administrators:

1. Always use `https://` in iframe src (never `http://`)
2. Keep the origin check in resize script (`https://laskuri.energiaykkonen.fi`)
3. If embedding fails, check browser console for CSP errors

## Troubleshooting

### iframe Not Showing

- Check if WordPress is blocking iframes
- Disable security plugins temporarily
- Check browser console for errors

### Height Not Adjusting

- Ensure resize script is added to page
- Check console for JavaScript errors
- Verify origin domain in script

### Form Not Submitting

- Check browser console for CORS errors
- Ensure cookies are enabled
- Check network tab for API errors

## Production Deployment

The embed URL is ready for production:
- **Embed URL:** `https://laskuri.energiaykkonen.fi/embed`

Before going live:
1. Test on multiple browsers
2. Verify auto-resize works correctly
3. Monitor error logs

## Advanced Integration

### Pass URL Parameters

Pre-fill form fields via URL:

```html
<iframe
  src="https://laskuri.energiaykkonen.fi/embed?name=John&email=john@example.com"
  ...
></iframe>
```

### Track Events

Add Google Analytics or other tracking:

```javascript
window.addEventListener('message', function (event) {
  if (event.data.type === 'calculator-submitted') {
    // Track conversion
    gtag('event', 'conversion', {
      send_to: 'YOUR_CONVERSION_ID',
    });
  }
});
```

### Custom Themes

Future feature - pass theme parameter:

```html
<iframe src="https://laskuri.energiaykkonen.fi/embed?theme=dark" ...></iframe>
```

## Support

For issues or questions:

- Check browser console for errors
- Test in incognito mode
- Verify WordPress version compatibility
- Contact support with error details
