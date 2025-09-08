=== E1 Calculator Pro ===
Contributors: energiaykkonen
Tags: calculator, widget, heat pump, savings, energy
Requires at least: 5.8
Tested up to: 6.4
Stable tag: 3.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Professional widget sync system for E1 Calculator with advanced caching and optimization.

== Description ==

E1 Calculator Pro is a professional WordPress plugin that syncs and embeds the E1 heat pump savings calculator widget directly on your WordPress site. The widget runs natively without iframes for better performance and SEO.

**Key Features:**

* **Widget Sync System** - Download and cache widget code from central API
* **Advanced Caching** - Local storage for instant loading
* **No iFrames** - Widget runs directly on your page
* **Form Submissions** - Optional storage and email notifications
* **Auto-sync** - Schedule daily automatic updates
* **Secure API** - Encrypted API key storage
* **Multiple Instances** - Use multiple calculators on the same page
* **Responsive Design** - Works on all devices

**Professional Features:**

* Modular architecture for easy maintenance
* REST API endpoint for form submissions
* Cache management with expiration control
* Security hardening with nonce validation
* Encrypted API key storage
* Comprehensive admin interface
* Debug mode for troubleshooting

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/e1-calculator-pro/`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Go to E1 Calculator in the admin menu
4. Configure API URL and API Key
5. Click "Sync Widget" to download the widget bundle
6. Use shortcode `[e1_calculator]` in your pages

**Configuration:**

1. **API URL**: The endpoint URL for the widget bundle API
2. **API Key**: Your authentication key for the API
3. **Cache Duration**: How long to keep the widget cached
4. **Auto-sync**: Enable daily automatic synchronization

== Frequently Asked Questions ==

= How is this different from the iframe version? =

This plugin downloads the widget code and runs it directly on your site, providing better performance, SEO benefits, and deeper integration with WordPress.

= How often should I sync the widget? =

Sync whenever you need to update the calculator's functionality, design, or calculations. You can enable auto-sync for daily updates.

= Can I use multiple calculators on one page? =

Yes! Each shortcode creates a unique instance. Use different IDs for multiple calculators:
`[e1_calculator id="calc1"]`
`[e1_calculator id="calc2"]`

= Is the API key secure? =

Yes, the API key is encrypted before storage using WordPress security salts and OpenSSL encryption when available.

= What happens if the API is unavailable? =

The cached version will continue to work. The widget only needs to sync when you want to update it.

= Can I customize the widget appearance? =

The widget comes with predefined styles, but you can add custom CSS to override them if needed.

== Usage ==

**Basic usage:**
`[e1_calculator]`

**With custom ID:**
`[e1_calculator id="my-calculator"]`

**With custom CSS class:**
`[e1_calculator class="custom-style"]`

**With minimum height:**
`[e1_calculator height="800"]`

**Multiple calculators:**
```
[e1_calculator id="residential"]
[e1_calculator id="commercial"]
```

== Changelog ==

= 3.0.0 =
* Complete rewrite with modular architecture
* Added cache management system
* Implemented encrypted API key storage
* Added form submission handling
* REST API endpoint for submissions
* Auto-sync capability
* Improved admin interface
* Better error handling
* Security enhancements

= 2.0.0 =
* Widget sync functionality
* Local caching
* Direct embedding without iframe

= 1.0.0 =
* Initial release
* Basic iframe embedding

== Technical Details ==

**System Requirements:**
* WordPress 5.8 or higher
* PHP 7.4 or higher
* MySQL 5.7 or higher
* OpenSSL PHP extension (recommended)

**File Structure:**
```
/wp-content/plugins/e1-calculator-pro/
├── e1-calculator.php              # Main plugin file
├── includes/
│   ├── class-plugin.php          # Core plugin class
│   ├── class-api-client.php      # API communication
│   ├── class-cache-manager.php   # Cache handling
│   ├── class-widget.php          # Widget rendering
│   ├── class-admin.php           # Admin interface
│   └── class-security.php        # Security functions
├── assets/
│   ├── css/admin.css             # Admin styles
│   └── js/admin.js               # Admin JavaScript
└── cache/                         # Widget cache directory
```

**Hooks and Filters:**

* `e1_calculator_process_submission` - Process form submissions
* `e1_calculator_ssl_verify` - Control SSL verification
* Widget data is cached in `/wp-content/cache/e1-calculator/`

== Support ==

For support, please contact support@energiaykkonen.fi

== Privacy ==

This plugin:
* Stores API credentials locally (encrypted)
* Caches widget code locally
* Optionally stores form submissions
* Does not send data to external services except the configured API

Form submissions can be stored locally and/or sent via email based on your configuration.