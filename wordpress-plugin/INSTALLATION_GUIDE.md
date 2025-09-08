# E1 Calculator WordPress Plugin - Installation Guide

## 📦 Package Contents

The plugin package (`e1-calculator-1.0.0.zip`) contains:
- `e1-calculator.php` - Main plugin file
- `readme.txt` - WordPress plugin documentation
- `assets/resize-handler.js` - JavaScript for auto-resize functionality

## 🚀 Installation Methods

### Method 1: WordPress Admin Upload (Recommended)

1. **Download the Plugin**
   - File: `dist/e1-calculator-1.0.0.zip`
   - Size: ~8KB

2. **Login to WordPress Admin**
   - Go to your WordPress admin panel
   - URL: `https://yoursite.com/wp-admin`

3. **Upload Plugin**
   - Navigate to: **Plugins → Add New → Upload Plugin**
   - Click "Choose File"
   - Select `e1-calculator-1.0.0.zip`
   - Click "Install Now"

4. **Activate Plugin**
   - After installation, click "Activate Plugin"
   - Or go to **Plugins → Installed Plugins** and activate

### Method 2: FTP Installation

1. **Extract ZIP File**
   ```bash
   unzip e1-calculator-1.0.0.zip
   ```

2. **Upload via FTP**
   - Connect to your server via FTP
   - Navigate to `/wp-content/plugins/`
   - Upload the entire `e1-calculator` folder

3. **Activate in WordPress**
   - Go to **Plugins → Installed Plugins**
   - Find "E1 Calculator - Energiaykkönen"
   - Click "Activate"

### Method 3: WP-CLI (Command Line)

```bash
# Install from local file
wp plugin install dist/e1-calculator-1.0.0.zip --activate

# Or if already uploaded
wp plugin activate e1-calculator
```

## ⚙️ Configuration

### Basic Settings

1. **Access Settings**
   - Go to **Settings → E1 Calculator**

2. **Configure Options**
   - **Calculator URL**: Set your calculator instance URL
     - Development: `http://localhost:3001`
     - Production: `https://your-calculator-domain.com`
   - **Auto-resize**: Enable/disable automatic height adjustment
   - **Default Height**: Set initial iframe height (default: 600px)

3. **Save Changes**
   - Click "Save Changes" button

## 📝 Usage

### Basic Shortcode

Add to any page or post:
```
[e1_calculator]
```

### Shortcode with Options

```
[e1_calculator height="800" width="100%" class="my-calculator"]
```

### Available Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `height` | Iframe height in pixels | 600 | `height="750"` |
| `width` | Iframe width | 100% | `width="90%"` |
| `class` | Custom CSS class | - | `class="centered"` |
| `style` | Inline CSS styles | - | `style="margin: 20px;"` |
| `id` | Custom element ID | auto-generated | `id="calc-1"` |

### Gutenberg Block Editor

1. Add a **Shortcode Block**
2. Enter: `[e1_calculator]`
3. Preview or Publish

### Classic Editor

1. Switch to **Text/HTML** mode
2. Paste: `[e1_calculator]`
3. Switch back to **Visual** mode

### Widget Areas

1. Go to **Appearance → Widgets**
2. Add a **Text Widget** or **Custom HTML Widget**
3. Add shortcode: `[e1_calculator]`

## 🎨 Styling

### Custom CSS

Add to your theme's style.css or Customizer:

```css
/* Container styling */
.e1-calculator-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
}

/* Iframe styling */
.e1-calculator-iframe {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border-radius: 4px;
}
```

## 🔧 Troubleshooting

### Calculator Not Showing

1. **Check Plugin Activation**
   - Ensure plugin is activated in Plugins list

2. **Verify Shortcode**
   - Make sure shortcode is correctly typed: `[e1_calculator]`
   - No spaces inside brackets

3. **Check Calculator URL**
   - Go to Settings → E1 Calculator
   - Verify the Calculator URL is correct
   - Test URL directly in browser

### Height Not Adjusting

1. **Enable Auto-resize**
   - Settings → E1 Calculator
   - Check "Enable automatic height adjustment"

2. **Check JavaScript Console**
   - Open browser Developer Tools (F12)
   - Look for errors in Console tab

3. **Verify Origin**
   - Make sure calculator URL in settings matches actual URL

### Debugging

Enable debug mode in browser console:
```javascript
e1Calculator.debug(true);
```

Check statistics:
```javascript
e1Calculator.getStats();
```

Reload all calculators:
```javascript
e1Calculator.reload();
```

## 🔐 Security

The plugin includes:
- Origin verification for messages
- Input sanitization
- Nonce verification for admin actions
- Proper escaping of output

## 📊 Testing Checklist

After installation, test:

- [ ] Plugin activates without errors
- [ ] Settings page loads correctly
- [ ] Shortcode displays calculator
- [ ] Auto-resize works when filling form
- [ ] Form submission works
- [ ] PDF generation works
- [ ] Mobile responsive behavior
- [ ] No JavaScript errors in console

## 🌐 Production Deployment

Before going live:

1. **Update Calculator URL**
   - Change from localhost to production URL
   - Use HTTPS for security

2. **Test Cross-Origin**
   - Ensure calculator loads from production domain
   - Verify auto-resize works

3. **Performance**
   - Check page load speed
   - Optimize if needed

4. **Analytics**
   - Set up conversion tracking
   - Monitor usage

## 📞 Support

For issues or questions:
- Email: support@energiaykkonen.fi
- Documentation: This guide
- Debug mode: Use browser console tools

## 📄 License

GPL v2 or later - Same as WordPress

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-08  
**Author:** Energiaykkönen Oy