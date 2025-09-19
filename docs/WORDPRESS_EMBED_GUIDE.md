# WordPress Embed Integration Guide

## Overview

This guide explains how to embed the E1 Calculator into any WordPress website using an iframe with automatic height adjustment.

## Current Implementation Status

### ✅ Already Implemented:

1. **CORS Headers** - Application allows embedding from any domain (`frame-ancestors *`)
2. **Responsive Design** - Calculator adapts to container width
3. **Mobile Support** - Works on all devices

### 🎯 Embed Methods Available:

## Method 1: Simple iframe (No Auto-resize)

Paste this HTML into any WordPress page/post using the HTML block:

```html
<iframe
  src="http://localhost:3001/"
  width="100%"
  height="2000"
  frameborder="0"
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
    if (
      event.origin !== 'http://localhost:3001' &&
      event.origin !== 'https://your-production-domain.com'
    ) {
      return;
    }

    if (event.data && event.data.type === 'calculator-resize') {
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
  src="http://localhost:3001/"
  width="100%"
  height="600"
  frameborder="0"
  scrolling="no"
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
        'height' => '600',
        'theme' => 'default',
        'lang' => 'fi'
    ), $atts);

    $calculator_url = 'http://localhost:3001/';

    // Add auto-resize script (only once per page)
    static $script_added = false;
    $output = '';

    if (!$script_added) {
        $output .= '<script>
        window.addEventListener("message", function(event) {
            if (event.origin !== "http://localhost:3001") return;
            if (event.data && event.data.type === "calculator-resize") {
                const iframe = document.getElementById("e1-calc-' . uniqid() . '");
                if (iframe && event.data.height) {
                    iframe.style.height = event.data.height + "px";
                }
            }
        });
        </script>';
        $script_added = true;
    }

    $iframe_id = 'e1-calc-' . uniqid();

    $output .= '<iframe
        id="' . $iframe_id . '"
        src="' . $calculator_url . '"
        width="100%"
        height="' . esc_attr($atts['height']) . '"
        frameborder="0"
        scrolling="no"
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

## Testing Checklist

Before going live, test:

- [ ] Calculator loads correctly
- [ ] Auto-resize works when changing form fields
- [ ] Mobile responsive behavior
- [ ] Form submission works
- [ ] PDF generation works
- [ ] Email notifications sent
- [ ] No console errors
- [ ] HTTPS works (production)

## Security Considerations

### Current Security Features:

1. **Input Sanitization** - All inputs are sanitized
2. **CORS Headers** - Configured for cross-origin
3. **Rate Limiting** - Form submissions are rate-limited
4. **CSP Headers** - Content Security Policy active

### Recommended for Production:

1. Update the origin check in resize script to your production domain
2. Use HTTPS for production embedding
3. Consider adding domain whitelist for embedding

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

When moving to production:

1. Update all `http://localhost:3001` references to your production URL
2. Update CORS origin checks
3. Enable HTTPS
4. Test on multiple browsers
5. Monitor error logs

## Advanced Integration

### Pass URL Parameters

Pre-fill form fields via URL:

```html
<iframe
  src="http://localhost:3001/?name=John&email=john@example.com"
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
<iframe src="http://localhost:3001/?theme=dark" ...></iframe>
```

## Support

For issues or questions:

- Check browser console for errors
- Test in incognito mode
- Verify WordPress version compatibility
- Contact support with error details
