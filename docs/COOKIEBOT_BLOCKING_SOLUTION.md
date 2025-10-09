# Cookiebot Blocking Solution

This document explains how we block Cookiebot scripts from loading when they exist in the GTM container.

## Problem

When Cookiebot tags exist in the GTM container, they try to load scripts that:

- Show errors in the console
- Try to frame cookiebot.com domains (CSP violations)
- Attempt unauthorized domain access
- Conflict with our own cookie consent system

## Solution

We implemented a **three-layer blocking strategy** in `src/components/GoogleTagManager.tsx`:

### Layer 1: Mock Cookiebot Object

```javascript
// Block Cookiebot scripts from GTM completely
window.Cookiebot = window.Cookiebot || {};
window.Cookiebot.consent = {
  marketing: false,
  statistics: false,
  preferences: false,
  necessary: true,
};
```

**Purpose**:

- Creates a mock Cookiebot object before GTM loads
- GTM tags see the object and think Cookiebot is already initialized
- Prevents initial Cookiebot script loading attempts

### Layer 2: Script Blocking via createElement Override

```javascript
// Prevent Cookiebot scripts from loading
const originalCreateElement = document.createElement;
document.createElement = function (tagName) {
  const element = originalCreateElement.call(this, tagName);
  if (tagName.toLowerCase() === 'script') {
    const originalSetAttribute = element.setAttribute;
    element.setAttribute = function (name, value) {
      if (
        name === 'src' &&
        value &&
        typeof value === 'string' &&
        (value.includes('cookiebot.com') || value.includes('consent.cookiebot'))
      ) {
        console.log('[GTM] Blocked Cookiebot script:', value);
        return;
      }
      return originalSetAttribute.call(this, name, value);
    };
  }
  return element;
};
```

**Purpose**:

- Intercepts all script element creations
- Checks if the script source contains Cookiebot URLs
- Blocks setAttribute for Cookiebot scripts
- Logs blocked scripts for debugging

### Layer 3: Google Consent Mode v2

```javascript
// Initialize Google Consent Mode v2
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}

// Set default consent state (deny all except necessary)
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
});
```

**Purpose**:

- Our own consent system takes precedence
- GTM tags respect our consent mode
- GDPR-compliant from the start

## Benefits

✅ **No Console Errors** - Cookiebot scripts are blocked before loading  
✅ **No CSP Violations** - No frame loading attempts  
✅ **No Domain Errors** - No unauthorized domain access  
✅ **Clean Console** - Only logs blocked scripts for debugging  
✅ **Our System Works** - Cookie consent pop-up functions perfectly  
✅ **GTM Functions** - Other GTM tags work normally

## Technical Details

### Script Blocking Mechanism

The script blocking works by:

1. **Saving** the original `document.createElement` function
2. **Wrapping** it with our custom function
3. **Intercepting** script element creations
4. **Overriding** the `setAttribute` method on script elements
5. **Checking** if `src` attribute contains Cookiebot URLs
6. **Blocking** the setAttribute call if it's a Cookiebot script
7. **Logging** the blocked URL for transparency

### Patterns Blocked

The following URL patterns are blocked:

- `cookiebot.com/*` - Main Cookiebot domain
- `consent.cookiebot.com/*` - Consent CDN
- Any URL containing these substrings

### Performance Impact

- **Minimal** - Only runs once during initialization
- **Fast** - Simple string matching
- **Efficient** - No polling or intervals
- **Clean** - No memory leaks

## Debugging

### Check if Blocking is Active

Open browser console and look for:

```
[GTM] Blocked Cookiebot script: https://consent.cookiebot.com/...
```

### Verify Mock Object

In console:

```javascript
console.log(window.Cookiebot);
// Should show: {consent: {marketing: false, statistics: false, ...}}
```

### Test Our Cookie Consent

1. Clear cookies and localStorage
2. Reload page
3. Cookie consent pop-up should appear
4. No Cookiebot errors in console

## Alternative Solutions

### Option 1: Remove from GTM (Recommended Long-term)

1. Log in to Google Tag Manager
2. Find Cookiebot tags
3. Delete or pause them
4. Publish new version

**Pros**: Cleanest solution  
**Cons**: Requires GTM access

### Option 2: Keep Our Blocking (Current)

1. Keep the blocking code in place
2. Works regardless of GTM configuration
3. No GTM changes needed

**Pros**: Works immediately, no GTM access needed  
**Cons**: Code overhead (minimal)

## Maintenance

### When to Update

Update the blocking code if:

- Cookiebot changes their script URLs
- New Cookiebot domains appear
- GTM introduces new script loading methods

### How to Test

1. Clear browser cache
2. Clear localStorage
3. Reload page
4. Check console for blocked scripts
5. Verify cookie pop-up works
6. Test GTM events with `/test-gtm`

## Related Files

- `src/components/GoogleTagManager.tsx` - Main blocking implementation
- `src/components/CookieConsentBanner.tsx` - Our cookie consent system
- `src/config/gtm.ts` - GTM configuration and consent helpers
- `docs/GTM_INTEGRATION.md` - GTM integration documentation
- `docs/COOKIE_CONSENT_GUIDE.md` - Cookie consent system guide

## Support

If Cookiebot scripts still load:

1. Check browser console for `[GTM] Blocked` messages
2. Verify `window.Cookiebot` object exists
3. Check if scripts load from different domains
4. Update blocking patterns if needed

---

**This solution ensures a clean, error-free experience while using our own GDPR-compliant cookie consent system.**
