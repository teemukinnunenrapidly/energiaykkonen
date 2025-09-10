## E1 Calculator – End-to-End Data Process (v2.0.0)

This document explains how data flows through the E1 Calculator system today: from content in Supabase to the Vercel API, WordPress plugin cache & admin sync, the embedded widget runtime, user submission to the `submit-lead` API, PDF generation, storage, and notifications. It also covers caching, error handling, and observability.

### Scope
- What the system does end-to-end today (intended behavior)
- Where each piece of data originates and where it is stored/used
- How the WordPress plugin sync and caching interact with the Vercel API and the widget
- How leads are processed, stored, and turned into PDFs with email notifications

### Components (high level)
- **Next.js (Vercel app)**
  - `GET /api/widget-config`: Serves the full widget configuration JSON (cards, visuals, formulas, widget assets inline, metadata, settings).
  - `POST /api/submit-lead`: Accepts lead submissions, performs calculations, writes to Supabase, generates & stores a PDF, and sends emails.
- **Supabase**
  - Source of truth for cards, visuals, formulas; destination for leads.
  - Storage bucket for generated PDF files.
- **WordPress Plugin** (`e1-calculator-pro`)
  - Syncs & caches widget assets/config from Vercel to `wp-content/uploads/...`.
  - Provides admin UI for syncing, viewing cache status, and quick tests.
  - Renders the frontend widget and injects config for the runtime.
- **Frontend Widget**
  - Loads configuration from multiple sources (API → injected config → cached `config.json` → defaults).
  - Renders the card system, performs client-side calculations, emits lifecycle events, and submits leads.

---

## Data Sources and Models

### Supabase (primary source for dynamic content)
- **Tables (used today):**
  - `card_templates` (+ `card_fields`): Defines the calculator cards and fields (form, info, calculation, submit). Order is derived by either `display_order` or via `form_streams/form_stream_cards` if used.
  - `visual_objects` (+ `visual_object_images`): Optional visuals for cards or standalone visuals.
  - `formulas`: Optional formula definitions (meta) used by the engine.
  - `leads`: Destination for user submissions (fixed columns + JSONB `form_data` and `calculation_results`).
  - `field_completions`, `card_completions`: Optional telemetry for completion tracking (guarded to fail silently if unauthorized).
- **Storage:**
  - Bucket `lead-pdfs`: Stores generated lead PDFs under `<leadId>/saastolaskelma-<number>.pdf`.

### Widget Config JSON (served by Vercel)
- Produced by `GET /api/widget-config` ([route.ts](mdc:src/app/api/widget-config/route.ts)).
- Combines:
  - Latest content from Supabase (`cards`, `visuals`, `formulas`)
  - Inline widget assets (minified JS/CSS read from `dist/`)
  - Metadata (`version`, `buildTimestamp`, `lastUpdated`)
  - API endpoints and platform settings
  - Backward-compatibility fields (`cards`, `visuals`, `formulas` duplicated at root and inside `data`)
- CORS: `Access-Control-Allow-Origin: *`
- Cache headers: `Cache-Control: public, max-age=1800, s-maxage=3600`, `ETag`, `Last-Modified`

Structure (abridged):
```json
{
  "version": "2.0.0",
  "buildTimestamp": "2025-09-10T...",
  "widget": { "js": "...", "css": "..." },
  "api": {
    "baseUrl": "https://energiaykkonen-calculator.vercel.app",
    "submitEndpoint": "/api/submit-lead",
    "configEndpoint": "/api/widget-config",
    "healthEndpoint": "/api/health",
    "formulasEndpoint": "/api/formulas",
    "visualAssetsEndpoint": "/api/visual-assets",
    "adminEndpoint": "/api/admin"
  },
  "data": {
    "cards": [ { "id": "...", "name": "...", "type": "form|info|calculation|visual|submit", "card_fields": [ ... ] } ],
    "visuals": [ { "id": "...", "title": "...", "images": [ ... ] } ],
    "formulas": [ { "id": "...", "name": "..." } ]
  },
  "cards": [ ... ],
  "visuals": [ ... ],
  "formulas": [ ... ],
  "features": { "cardStreamSystem": true, "pdfGeneration": true, ... },
  "embedSettings": { "shadowDomEnabled": true, ... },
  "styling": { "primaryColor": "#10b981", ... },
  "performance": { "lazyLoading": true, ... },
  "wordpress": { "pluginVersion": "2.0.0", "syncInterval": "1800" },
  "security": { "corsEnabled": true, "csrfProtection": false },
  "dataStatus": { "cardsLastFetch": "...", "errors": [] }
}
```

---

## Vercel APIs

### GET /api/widget-config
- File: [src/app/api/widget-config/route.ts](mdc:src/app/api/widget-config/route.ts)
- Purpose: Serve the full widget configuration for runtime use and for WordPress plugin sync.
- Inputs: None.
- Sources:
  - `fetchCardData()` → `card_templates` (+ `card_fields`, `visual_objects`)
  - `fetchVisualData()` → `visual_objects` (+ `visual_object_images`)
  - `fetchFormulaData()` → `formulas`
  - `fetchWidgetFiles()` → reads minified widget JS/CSS from `dist/`
- Output: JSON as described above with CORS + caching headers.

### POST /api/submit-lead
- File: [src/app/api/submit-lead/route.ts](mdc:src/app/api/submit-lead/route.ts)
- Purpose: Accepts lead submissions from the widget, performs calculations, persists the lead, generates a PDF, stores it in Supabase Storage, and sends notifications.
- Security/limits:
  - Rate-limited (default 10) with security logging.
  - Minimal field validation (e.g., requires `neliot` and `sahkoposti`).
- Processing flow:
  1) Parse request JSON and collect metadata (`ip`, `userAgent`, `referer`).
  2) Run `calculateHeatPumpSavings()` for immediate summary values.
  3) Build `formData` (filters out fields that are only calculated/transient).
  4) Compute detailed `calculationResults` for the PDF via `calculatePDFValues()` and `processPDFData()`.
  5) Insert the lead into Supabase `leads` with:
     - Fixed columns (nimi, sahkoposti, puhelinnumero, paikkakunta, osoite, status)
     - `form_data` (JSONB) with all dynamic inputs + metadata
     - `calculation_results` (JSONB) for the PDF template
  6) Generate PDF with `@react-pdf/renderer` (`SavingsReportPDF`).
  7) Upload PDF to Supabase Storage (`lead-pdfs` bucket), get public URL, and update the lead’s `form_data` with `pdf_url`.
  8) Send emails (customer and sales). Failures here do not fail the API.
  9) Respond with 201 JSON containing `leadId`, `calculations`, and `emailResults`.

---

## WordPress Plugin: Sync, Cache, Admin, Render

### Files (key parts)
- Cache manager: [class-cache-manager.php](mdc:wordpress-plugin/e1-calculator-pro/includes/class-cache-manager.php)
- Sync manager: [class-sync-manager.php](mdc:wordpress-plugin/e1-calculator-pro/includes/class-sync-manager.php)
- Admin settings: [class-admin-settings.php](mdc:wordpress-plugin/e1-calculator-pro/includes/class-admin-settings.php)
- Widget renderer: `includes/class-widget.php` (injects init call + config)
- Admin JS: [assets/admin.js](mdc:wordpress-plugin/e1-calculator-pro/assets/admin.js)

### Cache directory and ACL
- Target dir: `wp-content/uploads/e1-calculator-cache/` (example; exact root depends on constants).
- Files written by sync:
  - `widget.js` (namespaced/minified runtime)
  - `widget.css` (widget CSS)
  - `config.json` (exact JSON from `/api/widget-config`)
  - `metadata.json` (cache metadata with `cache_timestamp`, etc.)
- Access control: `.htaccess` is written to allow public access to `widget.js`, `widget.css`, `config.json` while denying others.

### Cache status detection
- Logic in [class-cache-manager.php](mdc:wordpress-plugin/e1-calculator-pro/includes/class-cache-manager.php):
  - Uses `metadata.json` if present; falls back to `meta.json` for compatibility.
  - `is_cache_valid()` checks:
    - `metadata.json` (or `meta.json`) exists and has `cache_timestamp`
    - Cache age <= `e1_calculator_cache_duration` (default 24h)
    - All required files exist: `widget.js`, `widget.css`, `config.json`
  - `get_cache_info()` returns:
    - `has_cache` (all required files present)
    - `version`, `cached_at`, `files`, `total_size`, `last_modified`, etc.

### Admin sync flow
- Admin clicks “Sync” → AJAX to sync manager, which fetches `GET /api/widget-config` and writes files.
- After sync completes, the admin panel calls `e1_get_cache_status` (AJAX) to refresh and display the live cache status without reloading the page.
- Display shows counts derived from `config.json` (cards/visuals/formulas), version, and cache validity.

### Widget rendering in WordPress
- The renderer prints a container and injects a startup script that calls the global initializer:
  - `E1CalculatorWidget.init({ container: '<widget_id>', config: window.E1_WIDGET_CONFIG_<widget_id> || {} })`
  - The injected config includes a `configUrl` pointing to the locally cached `config.json`.
- The plugin enqueues the widget JS and CSS (from the cache directory), ensuring the runtime and styles are loaded.

---

## Widget Runtime: Initialization and Data Loading

- Entry: [enhanced-standalone-widget.tsx](mdc:src/widget/enhanced-standalone-widget.tsx)
- Global: Exposes `window.E1CalculatorWidget.init(options)` at runtime for WP loader compatibility.

### Initialization options
```ts
init({
  container: HTMLElement | string,
  config: {
    apiUrl?: string,     // optional: live config from Vercel
    configUrl?: string,  // optional: cached config.json in WP
    data?: any,          // optional: pre-provided data object
    ...otherOptions
  }
})
```

### Data source priority (first found wins)
1) `apiUrl` (fresh config from Vercel)
2) WordPress-injected global `window.E1_WIDGET_CONFIG_*` (if it contains `data` or `cards`)
3) `config.data` passed into `init`
4) `configUrl` (cached `config.json` in WP uploads)
5) Default WP path `/wp-content/plugins/e1-calculator-pro/cache/config.json`
6) Development mock data `(window.__E1_MOCK_DATA)`

### Data normalization and globals
- Ensures `cards` are present and that `fields → card_fields` mapping is normalized.
- Sets `window.__E1_WIDGET_DATA = { cards, visualObjects, formulas, ... }` for downstream components.
- Applies design tokens and theme variables.
- Emits DOM events on the container:
  - `e1-calculator-loaded` on success
  - `e1-calculator-error` on failure (with classified error info)

### Error handling and retries
- Centralized by `errorManager` with classifications and console logs.
- Retry mechanism for transient failures (`maxRetries`, backoff via `loadJSONWithRetry`/`loadResourceWithRetry`).
- `LoadingWithError` displays spinner + retry in UI.

---

## Lead Submission: Calculation, Persistence, PDF, Email

### Submission
- The submit card posts to `POST /api/submit-lead` with all collected fields.
- The API performs:
  - Rate limiting + security logging
  - Minimal validation
  - Immediate summary calculations (`calculateHeatPumpSavings`)
  - Detailed PDF-oriented calculations (`calculatePDFValues`, `processPDFData`)
  - Insert into `leads` with:
    - Fixed columns (`nimi`, `sahkoposti`, `puhelinnumero`, `paikkakunta`, `osoite`, `status`)
    - `form_data` JSONB (all dynamic fields + metadata like `source_page`, `user_agent`, `ip_address`)
    - `calculation_results` JSONB
  - PDF generation via React PDF (`SavingsReportPDF`)
  - Upload PDF to Storage (`lead-pdfs`), get public URL, update `form_data.pdf_url`
  - Send customer & sales emails (non-blocking)

### Response (201)
- `leadId`
- `calculations` summary (annualSavings, fiveYearSavings, tenYearSavings, paybackPeriod, co2Reduction)
- `emailResults` (flags and possible errors)

---

## Caching & Invalidation Matrix

- **Vercel CDN/browser** for `GET /api/widget-config`:
  - `Cache-Control: public, max-age=1800, s-maxage=3600`
  - `ETag` and `Last-Modified` present
- **WordPress cache** (`uploads/e1-calculator-cache/`):
  - `metadata.json` includes `cache_timestamp` when synced.
  - `is_cache_valid()` verifies age (`e1_calculator_cache_duration`, default 24h) and required files present.
  - Admin “Sync” overwrites files and refreshes `metadata.json`.
- **Widget runtime**:
  - Prefers `apiUrl` for freshness; falls back to `configUrl` for stability.
  - Retries transient network errors; surfaces errors visibly when exhausted.

---

## Observability & Troubleshooting

- **APIs**: Console logs for request metadata, data counts, errors.
- **Widget**: Classified error logs, UI error display with retry, load events.
- **WordPress Admin**:
  - AJAX `e1_get_cache_status` updates the cache status panel without page reload.
  - Shows existence of files, last modified, total size; displays counts from `config.json`.

Common checks:
- Confirm `GET /api/widget-config` returns 200 with expected counts.
- Ensure WP cache folder has: `widget.js`, `widget.css`, `config.json`, `metadata.json`.
- Verify `has_cache: true` from `e1_get_cache_status` after sync.
- In browser console within WP page:
  - `typeof E1CalculatorWidget.init === 'function'`
  - `window.E1_WIDGET_CONFIG_<widget_id>` exists and includes `configUrl`
  - Network tab: `config.json` loads with expected data

---

## Security Posture

- Widget Config API: CORS `*`, non-authenticated, read-only.
- Lead API: rate-limited per IP; minimal validation; logs security events.
- WordPress cache ACL: `.htaccess` blocks by default and explicitly allows widget assets (`widget.js`, `widget.css`, `config.json`).
- Supabase: Uses anon key for client reads (where applicable) and service via server-side Next.js APIs for writes.

---

## Versioning & Compatibility

- Current config `version: 2.0.0`.
- Backward-compat fields (`cards`, `visuals`, `formulas` duplicated at root and inside `data`).
- Widget adapts `fields → card_fields` when needed.

---

## Sequence Overview

```mermaid
sequenceDiagram
  autonumber
  participant Admin as WP Admin (Settings)
  participant WP as WordPress Plugin
  participant Vercel as Vercel API (Next.js)
  participant SB as Supabase
  participant User as Site Visitor (Widget)

  Admin->>WP: Click "Sync"
  WP->>Vercel: GET /api/widget-config
  Vercel->>SB: Query cards, visuals, formulas
  Vercel-->>WP: JSON (config + inline widget JS/CSS)
  WP->>WP: Write widget.js, widget.css, config.json, metadata.json
  WP-->>Admin: Update cache status via AJAX (no reload)

  User->>WP: Load page with widget
  WP->>User: Enqueue widget.js/css; inject init + configUrl
  User->>Vercel: (optional) Fetch live config via apiUrl
  alt Fallback path
    User->>WP: Fetch cached config.json via configUrl
  end
  User->>User: Render cards, interact, compute

  User->>Vercel: POST /api/submit-lead (form data)
  Vercel->>SB: Insert lead (JSONB), compute PDF data
  Vercel->>SB: Upload PDF to Storage (public URL)
  Vercel-->>User: 201 { leadId, calculations, emailResults }
```

---

## Key File References
- Vercel APIs:
  - [widget-config route](mdc:src/app/api/widget-config/route.ts)
  - [submit-lead route](mdc:src/app/api/submit-lead/route.ts)
- Widget runtime:
  - [enhanced-standalone-widget.tsx](mdc:src/widget/enhanced-standalone-widget.tsx)
- Supabase client and lead helpers:
  - [supabase.ts](mdc:src/lib/supabase.ts)
  - [lead-helpers.ts](mdc:src/lib/lead-helpers.ts)
- WordPress plugin (selected):
  - [class-cache-manager.php](mdc:wordpress-plugin/e1-calculator-pro/includes/class-cache-manager.php)
  - [class-admin-settings.php](mdc:wordpress-plugin/e1-calculator-pro/includes/class-admin-settings.php)
  - [class-sync-manager.php](mdc:wordpress-plugin/e1-calculator-pro/includes/class-sync-manager.php)

---

## Future Enhancements (suggested)
- Harden schema validation for incoming leads; explicit DTO validation.
- Add healthcheck endpoint surfacing build + Supabase connectivity.
- Extend admin to show last sync timestamp and diff (counts vs last).
- Add integrity checks: checksum of `config.json` and widget assets.
- Optional server-side rendering fallback for widget in low-capability browsers.
