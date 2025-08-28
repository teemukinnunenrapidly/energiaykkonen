# WordPress Integration Guide - Energiaykkonen Calculator

This guide provides complete instructions for embedding the Energiaykkonen Calculator in WordPress websites using iframe integration.

## 🚀 Quick Start

### 1. Simple Embed (Copy & Paste)

Add this HTML code to any WordPress page or post:

```html
<iframe
  src="https://laskuri.energiaykkonen.fi/calculator"
  width="100%"
  height="600"
  frameborder="0"
  scrolling="no"
  allowtransparency="true"
  title="Energiaykkonen Calculator"
>
</iframe>
```

### 2. Advanced Embed with Dynamic Resizing

For automatic height adjustment, use this enhanced version:

```html
<div class="energiaykkonen-calculator-container">
  <iframe
    id="energiaykkonen-calculator"
    src="https://laskuri.energiaykkonen.fi/calculator"
    width="100%"
    height="600"
    frameborder="0"
    scrolling="no"
    allowtransparency="true"
    title="Energiaykkonen Calculator"
  >
  </iframe>
</div>

<script>
  // Listen for resize messages from the calculator
  window.addEventListener('message', function (event) {
    if (
      event.data.type === 'calculator-resize' &&
      event.data.source === 'energiaykkonen-calculator'
    ) {
      const iframe = document.getElementById('energiaykkonen-calculator');
      if (iframe) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>

<style>
  .energiaykkonen-calculator-container {
    margin: 2rem 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .energiaykkonen-calculator-container iframe {
    transition: height 0.3s ease;
  }
</style>
```

## 📋 Step-by-Step Integration

### Method 1: Gutenberg Block Editor

1. **Create a new page or post**
2. **Add a "Custom HTML" block**
3. **Paste the embed code** from above
4. **Publish or update** the page

### Method 2: Classic Editor

1. **Switch to "Text" mode** in the editor
2. **Paste the embed code** where you want the calculator
3. **Switch back to "Visual" mode** to see the result
4. **Publish or update** the page

### Method 3: Theme Files (Advanced)

For permanent placement in your theme:

1. **Edit your theme files** (e.g., `page.php`, `single.php`)
2. **Add the embed code** in the desired location
3. **Save and test** the changes

## 🎨 Customization Options

### Basic Styling

```css
/* Custom container styling */
.energiaykkonen-calculator-container {
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-left: 4px solid #0073aa;
  border-radius: 8px;
}

/* Custom iframe styling */
.energiaykkonen-calculator-container iframe {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
```

### Responsive Design

```css
/* Mobile optimization */
@media (max-width: 768px) {
  .energiaykkonen-calculator-container {
    margin: 1rem 0;
    padding: 0.5rem;
  }

  .energiaykkonen-calculator-container iframe {
    height: 500px !important; /* Force mobile height */
  }
}
```

### Theme Integration

```css
/* Match your WordPress theme colors */
.energiaykkonen-calculator-container {
  border-left-color: var(--wp--preset--color--primary);
  background: var(--wp--preset--color--background);
}
```

## 🔧 Advanced Features

### 1. Dynamic Resizing

The calculator automatically adjusts its height based on content. Enable this by:

1. **Including the resize listener script** (see Advanced Embed above)
2. **Adding CSS transitions** for smooth height changes
3. **Setting appropriate min/max heights** for your layout

### 2. Event Handling

Listen for calculator events:

```javascript
window.addEventListener('message', function (event) {
  if (event.data.source === 'energiaykkonen-calculator') {
    switch (event.data.type) {
      case 'calculator-resize':
        // Handle height changes
        console.log('Calculator height:', event.data.height);
        break;
      case 'form-submitted':
        // Handle form submission
        console.log('Form submitted with data:', event.data.formData);
        break;
    }
  }
});
```

### 3. Custom Styling

Override calculator styles from your WordPress theme:

```css
/* Target calculator elements within iframe */
.energiaykkonen-calculator-container iframe {
  /* Your custom styles */
}

/* Note: Direct CSS targeting of iframe content is limited due to cross-origin restrictions */
```

## 📱 Mobile Optimization

### Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 1024px) {
  .energiaykkonen-calculator-container iframe {
    height: 550px !important;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .energiaykkonen-calculator-container iframe {
    height: 500px !important;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .energiaykkonen-calculator-container iframe {
    height: 450px !important;
  }
}
```

### Touch-Friendly Design

The calculator is optimized for touch devices with:

- Large touch targets
- Swipe-friendly navigation
- Mobile-optimized form controls

## 🚨 Troubleshooting

### Common Issues

#### 1. Calculator Not Loading

**Problem**: Iframe shows blank or error
**Solution**:

- Check if the URL is correct: `https://laskuri.energiaykkonen.fi/calculator`
- Verify your hosting allows iframe embedding
- Check browser console for errors

#### 2. Height Not Adjusting

**Problem**: Calculator height remains fixed
**Solution**:

- Ensure the resize listener script is included
- Check that postMessage communication is working
- Verify iframe has proper ID attribute

#### 3. Styling Conflicts

**Problem**: Calculator looks different than expected
**Solution**:

- Check for CSS conflicts in your theme
- Use more specific CSS selectors
- Consider using `!important` for critical styles

#### 4. Mobile Display Issues

**Problem**: Calculator doesn't work well on mobile
**Solution**:

- Ensure responsive CSS is included
- Test on actual mobile devices
- Check viewport meta tag is present

### Debug Mode

Enable debug logging:

```javascript
// Add this before the resize listener
window.addEventListener('message', function (event) {
  console.log('Calculator message received:', event.data);

  if (
    event.data.type === 'calculator-resize' &&
    event.data.source === 'energiaykkonen-calculator'
  ) {
    console.log('Resizing calculator to:', event.data.height);
    const iframe = document.getElementById('energiaykkonen-calculator');
    if (iframe) {
      iframe.style.height = event.data.height + 'px';
    }
  }
});
```

## 🔒 Security Considerations

### Content Security Policy

If you have strict CSP, add these directives:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="frame-ancestors 'self' https://laskuri.energiaykkonen.fi;"
/>
```

### Origin Verification

For enhanced security, verify message origin:

```javascript
window.addEventListener('message', function (event) {
  // Verify origin for security
  if (event.origin !== 'https://laskuri.energiaykkonen.fi') {
    return;
  }

  // Process message...
});
```

## 📊 Performance Optimization

### Lazy Loading

Load calculator only when needed:

```javascript
// Lazy load calculator
function loadCalculator() {
  const container = document.getElementById('calculator-container');
  container.innerHTML = `
    <iframe src="https://laskuri.energiaykkonen.fi/calculator" 
            width="100%" height="600" frameborder="0">
    </iframe>
  `;
}

// Load on scroll or button click
document
  .getElementById('load-calculator')
  .addEventListener('click', loadCalculator);
```

### Preloading

Preload calculator for better performance:

```html
<link
  rel="preload"
  href="https://laskuri.energiaykkonen.fi/calculator"
  as="document"
/>
```

## 🌐 Multi-Language Support

### Finnish Content

The calculator displays content in Finnish by default. For international sites:

1. **Use the Finnish version** for Finnish-speaking audiences
2. **Add language indicators** in your WordPress content
3. **Consider multiple calculators** for different languages if needed

### Language Detection

```javascript
// Detect user language and show appropriate calculator
const userLang = navigator.language || navigator.userLanguage;
if (userLang.startsWith('fi')) {
  // Show Finnish calculator
  iframe.src = 'https://laskuri.energiaykkonen.fi/calculator';
} else {
  // Show English calculator (when available)
  iframe.src = 'https://laskuri.energiaykkonen.fi/calculator/en';
}
```

## 📈 Analytics Integration

### Track Calculator Usage

```javascript
// Google Analytics 4
window.addEventListener('message', function (event) {
  if (event.data.source === 'energiaykkonen-calculator') {
    if (event.data.type === 'form-submitted') {
      gtag('event', 'calculator_completed', {
        event_category: 'calculator',
        event_label: 'energy_calculator',
        value: event.data.formData.savings,
      });
    }
  }
});

// Google Analytics Universal
window.addEventListener('message', function (event) {
  if (event.data.source === 'energiaykkonen-calculator') {
    if (event.data.type === 'form-submitted') {
      ga('send', 'event', 'Calculator', 'Completed', 'Energy Calculator');
    }
  }
});
```

## 🧪 Testing

### Test Checklist

- [ ] Calculator loads correctly
- [ ] Form navigation works
- [ ] Height adjusts automatically
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Cross-browser compatibility
- [ ] Performance acceptable

### Test URLs

- **Development**: `http://localhost:3000/calculator`
- **Production**: `https://laskuri.energiaykkonen.fi/calculator`
- **Test Page**: `https://laskuri.energiaykkonen.fi/embed-test.html`

## 📞 Support

### Technical Support

For technical issues:

- Check browser console for errors
- Verify iframe permissions
- Test with different browsers
- Contact development team

### Documentation

- **API Reference**: See embed.js source code
- **Examples**: Check embed-test.html and wordpress-demo.html
- **Updates**: Monitor for calculator updates

---

**Last Updated**: August 25, 2025  
**Version**: 1.0.0  
**Calculator Version**: Latest  
**WordPress Compatibility**: 5.0+
