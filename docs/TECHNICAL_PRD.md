## Energiaykkönen Heat Pump Savings Calculator — Technical PRD

### 1) Executive Summary

The calculator collects minimal building and contact information, computes personalized savings for an air-to-water heat pump, emails a branded PDF report to the user, and notifies sales. It’s built with Next.js (App Router) on Vercel, Supabase for data and dynamic card configuration, and a PDF pipeline using `@react-pdf/renderer`.

### 2) Goals and Non‑Goals

- Goals:
  - Provide a frictionless, mobile‑first multi‑card form with progressive disclosure.
  - Generate an on‑brand PDF with calculated savings and send it to the user and sales.
  - Maintain auditable analytics and GDPR tooling (access/delete/rectify).
  - Allow non‑devs to manage form/cards via DB tables.
- Non‑Goals:
  - No heavy CMS; content is mostly DB/JSON driven.
  - No in‑browser complex simulation; calculations are straightforward formulas/lookups.

### 3) System Architecture

- Frontend: Next.js 15 (App Router), Tailwind/shadcn‑style UI, card stream UX.
- Server: Next.js API routes for submit, analytics, GDPR, admin tasks.
- Data: Supabase (Postgres + storage) for cards, fields, formulas, leads, analytics.
- PDF: `@react-pdf/renderer` + domain helpers, sent via Resend email API.
- Observability: Sentry initialized; CSP hardened in `next.config.ts`.

### 4) Core Domains and Modules

- Card System (`src/components/card-system/`):
  - `CardContext.tsx`: session state, form data, reveal/complete rules, submit orchestration.
  - `CardStream.tsx`, `cards/FormCard.tsx`, `cards/CalculationCard.tsx`: rendering and interactions.
  - Config styling: `cardstream-complete-config.json`, `useCardStyles()`.
  - Completion rules: per card, support required fields and button‑only flows.
- Calculation Engine (`src/lib/…`):
  - `unified-calculation-engine.ts`, `calculation-engine.ts`: resolve `[calc:...]`, `[lookup:...]`, simple math, caching per session.
  - Formula/lookup sources from Supabase (`formulas`, `enhanced_lookups`).
- PDF Pipeline (`src/lib/pdf/*`):
  - `SavingsReportPDF.tsx`: template.
  - `pdf-data-processor.ts`: gathers/normalizes values, invokes PDF calculations.
  - `pdf-calculation-definitions` (definitions), `pdf-shortcode-mappings.ts` (labels/content).
- Email (`src/lib/email-service.ts`, `src/lib/resend.ts`):
  - Sends customer PDF and sales notification (optional PDF attachment).
- API Endpoints (`src/app/api/*`):
  - `submit-lead/route.ts`: validation + compute + DB insert + PDF + email (+ CORS, rate limit, security logging).
  - `analytics/route.ts`: event storage.
  - `gdpr/data-request/route.ts`: access/deletion/rectification flows.
  - Admin endpoints for card templates, exports, test utilities.

### 5) Data Model (Supabase)

- `card_templates` (cards): id, name, type, title, config, styling, display_order, is_active.
- `card_fields`: id, card_id, field_name, field_type, label, validation_rules, required, display_order, options.
- `leads`: fixed contact columns (nimi, sahkoposti, puhelinnumero, paikkakunta, osoite), status, `form_data` (JSONB), `calculation_results` (JSONB), tracking (ip, user_agent), `pdf_url`.
- `formulas`, `enhanced_lookups`: dynamic calculations and data references.
- `analytics`: discrete events with session ids.

### 6) User Journeys

1. Complete the multi‑card form → calculations update progressively where applicable.
2. Consent checkbox must be ticked (GDPR) → submit → store lead → compute → generate PDF → send emails → display success with PDF link.
3. Admin edits card templates/fields in Card Builder (DB‑backed) → live UI renders from DB.

### 7) Validation & Security

- Field level: required flags (incl. `gdpr_consent` for checkbox) enforced in `FormCard` and on submit; address optional.
- Input sanitization & rate limiting in `submit-lead` API; CORS preflight allowed.
- Content Security Policy (CSP) in `next.config.ts` with `worker-src 'self' blob:` and `blob:` in `script-src` to support safe workers.
- HTTPS enforced via HSTS, `X-Content-Type-Options`, `Referrer-Policy`.
- GDPR endpoints: access, deletion, rectification; consent timestamp stored.

### 8) Emails

- Customer email: plain text template with optional PDF attachment.
- Sales notification: minimal fields + optional attachment.
- Transport via Resend (configurable `from`, `replyTo`).

### 9) PDF Content

- Branded header, customer/property blocks, calculated savings and breakdowns.
- Mappings via `pdf-shortcode-mappings.ts`; data via `pdf-data-processor.ts`.

### 10) Deployment & Environment

- Vercel for hosting, automatic deploys from `main`.
- Env vars: Supabase URL/keys, Resend API key, Sentry DSN, etc.
- Next.js build uses Turbopack; source maps uploaded to Sentry.

### 11) Analytics

- Client posts events to `/api/analytics` (event name, step, device, session).
- Stored in Supabase; can be exported via admin endpoints.

### 12) Accessibility & UX

- Keyboard focus styles, mobile‑first layout, clear errors, responsive cards.
- Visual support panel simplified; cards render inline visuals where configured.

### 13) Admin & Operations

- Card Builder (admin) loads/saves `card_templates` + `card_fields`.
- Export/import helpers and DB sanity checks under `/api/admin/*` and `scripts/`.

### 14) Open Items / Future Work

- Richer admin analytics dashboard.
- Versioned card templates and migration helper.
- Multi‑language PDF and UI strings.

### 15) Acceptance Criteria (High‑Level)

- A user can finish the flow on mobile, receive a PDF, and sales gets notified.
- GDPR consent required; address optional; CSP has no worker errors.
- All links in footer match canonical `energiaykkonen.fi` routes.

---

Document scope: summarizes the implemented system based on current repo (`src/components/card-system`, `src/app/api`, `src/lib/pdf`, `src/lib/*`, `next.config.ts`).
