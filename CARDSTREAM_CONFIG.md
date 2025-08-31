# CardStream Single-File Configuration System

The entire CardStream design system is now controlled by a single JSON file: `cardstream-complete-config.json`. This eliminates the need for admin appearance pages and provides direct control over every visual aspect of the system.

## 🎯 Overview

- **Single Source of Truth**: One JSON file controls all visual aspects
- **No Admin Interface Needed**: Edit the file directly for changes  
- **Real-time Updates**: Changes apply immediately when the theme is reloaded
- **Complete Control**: Every color, spacing, typography, and animation setting

## 📁 Configuration File Location

```
/cardstream-complete-config.json
```

## 🚀 Quick Start

### 1. Basic Usage in React Components

```tsx
import React, { useEffect } from 'react';
import { applyCardStreamTheme } from '@/lib/cardstream-theme-applier';
import { ConfigurationDemo } from '@/components/cardstream';

function MyComponent() {
  // Apply theme when component mounts
  useEffect(() => {
    applyCardStreamTheme();
  }, []);

  return <ConfigurationDemo />;
}
```

### 2. Change Brand Color

Edit `cardstream-complete-config.json`:

```json
{
  "cardStreamConfig": {
    "colors": {
      "brand": {
        "primary": "#3b82f6"  // Changed from #10b981 to blue
      }
    }
  }
}
```

Then reload the theme:

```tsx
import { applyCardStreamTheme } from '@/lib/cardstream-theme-applier';

// Apply the updated configuration
applyCardStreamTheme();
```

## 🎨 Configuration Sections

### 1. Container (`container`)
Overall wrapper settings for the entire CardStream system.

```json
{
  "container": {
    "width": "100%",
    "maxWidth": "1400px",
    "borderRadius": "12px",
    "boxShadow": "0 10px 40px rgba(0, 0, 0, 0.1)"
  }
}
```

### 2. Layout (`layout`)
Panel proportions and spacing between components.

```json
{
  "layout": {
    "visualSupportRatio": "45%",
    "cardStreamRatio": "55%",
    "gapBetweenPanels": "0"
  }
}
```

### 3. Visual Support Panel (`visualSupport`)
Left panel configuration with gradient background and content styling.

```json
{
  "visualSupport": {
    "background": "#ffffff",
    "borderRight": "1px solid #e5e7eb",
    "content": {
      "background": "linear-gradient(135deg, #059669 0%, #34d399 100%)",
      "padding": "40px"
    }
  }
}
```

### 4. Card Stream Panel (`cardStream`)
Right panel containing the form cards.

```json
{
  "cardStream": {
    "background": "#f7f8f9",
    "padding": "30px",
    "cardSpacing": "20px"
  }
}
```

### 5. Card Styling (`card`)
Individual card appearance with the signature 4px green left border.

```json
{
  "card": {
    "base": {
      "background": "#ffffff",
      "borderRadius": "12px",
      "borderLeft": "4px solid #10b981",
      "padding": "32px",
      "boxShadow": "0 1px 3px rgba(0, 0, 0, 0.04)"
    },
    "hover": {
      "boxShadow": "0 4px 12px rgba(0, 0, 0, 0.08)",
      "transform": "translateY(-2px)"
    }
  }
}
```

### 6. Form Elements (`formElements`)
**Minimal theme specific**: Borderless inputs with bottom borders only.

```json
{
  "formElements": {
    "label": {
      "fontSize": "11px",
      "color": "#9ca3af",
      "textTransform": "uppercase",
      "letterSpacing": "0.5px"
    },
    "input": {
      "background": "transparent",
      "border": "none",
      "borderBottom": "2px solid #e5e7eb",
      "borderRadius": "0"
    }
  }
}
```

### 7. Colors (`colors`)
Complete color palette for the entire system.

```json
{
  "colors": {
    "brand": {
      "primary": "#10b981",
      "primaryHover": "#059669", 
      "primaryLight": "#ecfdf5"
    },
    "text": {
      "primary": "#1f2937",
      "secondary": "#6b7280",
      "tertiary": "#9ca3af"
    },
    "background": {
      "primary": "#ffffff",
      "secondary": "#f7f8f9",
      "tertiary": "#f3f4f6"
    }
  }
}
```

### 8. Typography (`typography`)
Font family, sizes, weights, and line heights.

```json
{
  "typography": {
    "fontFamily": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "fontSizeBase": "14px",
    "lineHeightBase": "1.5",
    "fontWeightLight": "300"
  }
}
```

### 9. Animations (`animations`)
Transition durations and easing functions.

```json
{
  "animations": {
    "transitions": {
      "fast": "150ms",
      "default": "200ms",
      "slow": "300ms"
    },
    "cardReveal": {
      "duration": "500ms",
      "easing": "cubic-bezier(0.4, 0, 0.2, 1)"
    }
  }
}
```

### 10. Responsive (`responsive`)
Breakpoints and mobile behavior.

```json
{
  "responsive": {
    "breakpoints": {
      "mobile": "768px",
      "tablet": "1024px"
    },
    "mobile": {
      "visualSupport": {
        "display": "none"
      },
      "cardStream": {
        "width": "100%",
        "padding": "20px"
      }
    }
  }
}
```

## 🛠️ API Reference

### applyCardStreamTheme(customConfig?)

Applies the theme configuration to CSS custom properties.

```tsx
import { applyCardStreamTheme } from '@/lib/cardstream-theme-applier';

// Apply default configuration
applyCardStreamTheme();

// Apply with custom overrides
applyCardStreamTheme({
  colors: {
    brand: {
      primary: '#3b82f6' // Override to blue
    }
  }
});
```

### getCardStreamConfig()

Returns the complete configuration object.

```tsx
import { getCardStreamConfig } from '@/lib/cardstream-theme-applier';

const config = getCardStreamConfig();
console.log(config.colors.brand.primary); // "#10b981"
```

### getConfigValue(path)

Get a specific value using dot notation.

```tsx
import { getConfigValue } from '@/lib/cardstream-theme-applier';

const brandColor = getConfigValue('colors.brand.primary'); // "#10b981"
const cardPadding = getConfigValue('card.base.padding'); // "32px"
```

### createConfigStyles(styleMap)

Create React inline styles from configuration paths.

```tsx
import { createConfigStyles } from '@/lib/cardstream-theme-applier';

const styles = createConfigStyles({
  padding: 'card.base.padding',
  color: 'colors.brand.primary',
  borderLeft: 'card.base.borderLeft'
});

return <div style={styles}>Styled with config</div>;
```

## 🎯 Common Use Cases

### Change Brand Color

```json
{
  "colors": {
    "brand": {
      "primary": "#3b82f6",      // Blue
      "primaryHover": "#2563eb", 
      "primaryLight": "#eff6ff"
    }
  }
}
```

### Adjust Layout Proportions

```json
{
  "layout": {
    "visualSupportRatio": "40%",  // Smaller left panel
    "cardStreamRatio": "60%"      // Larger right panel
  }
}
```

### Modify Typography

```json
{
  "typography": {
    "fontFamily": "'Inter', sans-serif",
    "fontSizeBase": "16px"        // Larger base font
  }
}
```

### Update Card Styling

```json
{
  "card": {
    "base": {
      "borderRadius": "16px",     // More rounded corners
      "padding": "40px",          // More padding
      "borderLeft": "6px solid #10b981"  // Thicker border
    }
  }
}
```

### Customize Form Elements

```json
{
  "formElements": {
    "input": {
      "borderBottom": "3px solid #e5e7eb",  // Thicker border
      "padding": "12px 0"                   // More padding
    }
  }
}
```

## 🧪 Testing Configuration

Run the configuration test script:

```bash
node test-config.js
```

This validates:
- JSON structure and syntax
- Required sections presence
- Color format validation
- Layout ratio calculations
- Typography and animation values

## 📱 Responsive Behavior

The configuration includes responsive breakpoints:

- **Mobile (≤768px)**: Visual panel hidden, single column layout
- **Tablet (768px-1024px)**: Adjusted panel ratios
- **Desktop (≥1024px)**: Full layout with all panels

Mobile behavior is controlled via the `responsive.mobile` section.

## ♿ Accessibility

Accessibility settings are configured in the `accessibility` section:

```json
{
  "accessibility": {
    "focusOutline": "3px solid #10b981",
    "minContrastRatio": "4.5:1",
    "reducedMotion": {
      "respectPreference": true
    }
  }
}
```

## 🚀 Deployment

1. Edit `cardstream-complete-config.json`
2. Commit changes to version control
3. Deploy - changes apply automatically when the theme reloads

No admin interface or database changes required!

## 🔧 Development Workflow

1. **Edit Configuration**: Modify `cardstream-complete-config.json`
2. **Test Changes**: Use `<ConfigurationDemo>` component to preview
3. **Validate**: Run `node test-config.js` to check configuration
4. **Apply**: Call `applyCardStreamTheme()` to see changes
5. **Deploy**: Commit and deploy the JSON file

## 💡 Tips

- Use the `ConfigurationDemo` component to preview changes
- Colors should be in hex format (`#10b981`)
- Sizes can use px, rem, em, or % units
- Test on different screen sizes using responsive settings
- Keep layout ratios totaling ~100% for best results

## 🎨 Design Philosophy

The CardStream system follows minimal design principles:

- **4px Green Left Border**: Signature brand element
- **Borderless Inputs**: Clean with bottom borders only
- **Uppercase Labels**: Small, spaced for sophistication  
- **Token-Based**: Zero hardcoded values
- **Progressive Disclosure**: Guided user experience

All these principles are maintained through the configuration system.