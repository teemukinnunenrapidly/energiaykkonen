## E1 Calculator — AI Assistant Context

Purpose: Give this file to an AI assistant as the primary context to answer questions about how the app is designed and where features live. It explains architecture, key files, runtime flows, and the styling/design-token system.

### How to use this document with an AI
- Paste or attach this file along with your question.
- When asking “where/what/how” questions, include the relevant file paths from the lists below.
- If the question is styling-related, always reference the design token contract section.

### System overview
- What this system does: A modular, token-driven platform for building and embedding interactive calculators and lead-capture flows for Energiaykkönen Oy. It renders a card-stream UI, computes results in real time, generates a branded one‑page PDF, captures GDPR‑compliant leads, sends transactional emails, and tracks analytics. The widget can be embedded on WordPress or run as a standalone page.

- Purpose:
  - Automate savings/quote calculations and standardize outputs.
  - Generate qualified leads with validated, structured data.
  - Produce a customer-friendly PDF savings report and notify both customer and sales.
  - Provide an admin UI for rapid iteration of forms, formulas, visuals, and emails.

- Core functionalities:
  - Card System widget with progressive disclosure: form inputs, calculation results, and information cards.
  - Admin panel to configure cards/forms, formulas/lookups, PDF settings, visual assets, and system settings.
  - Unified Calculation Engine for shortcodes, expressions, and lookups; plus hardcoded calculation sets for widget and PDF.
  - Lead submission pipeline: validation, rate limiting, Supabase persistence, PDF generation/upload, email dispatch, analytics.
  - Email system: customer results and sales notification via Resend, with optional PDF attachment.
  - PDF generation with @react-pdf/renderer, mapped via a PDF data processor and field mappings.
  - Analytics: client events via Vercel Analytics; critical events stored in Supabase via API.
  - Privacy/security: input sanitization, rate limiting, security logging, and GDPR self‑service endpoints.

- Stack & domains
  - Framework: Next.js (App Router), TypeScript.
  - Domains:
    - Admin panel: Built with Tailwind and shadcn/ui, used to configure content/cards/emails.
    - Widget (Card System): End-user calculator experience rendered as a card stream, styled purely via design tokens.
    - APIs (Route Handlers): Data fetch, calculations, submissions, analytics, email.
    - Services layer: Reusable logic for formulas, lookups, email, Supabase, etc.

### Core architecture boundaries
- Admin styling is isolated in `globals.css` (Tailwind). Widget styling never relies on Tailwind; it uses CSS variables from design tokens.
- Design tokens are the single source of truth for all widget styles.
- Widget components must not hardcode visual values; they read CSS variables that are set from the token config at runtime.

### Key directories and files (entry points)
- Design system
  - [cardstream-complete-config.json](mdc:cardstream-complete-config.json): Single source of truth for design tokens.
  - [src/lib/cardstream-theme-applier.ts](mdc:src/lib/cardstream-theme-applier.ts): Reads token JSON, applies CSS custom properties.
  - [src/styles/cardstream-tokens.css](mdc:src/styles/cardstream-tokens.css): Declares CSS variables and widget-oriented classes.

- Widget: Card System
  - [src/components/card-system/CardSystemContainer.tsx](mdc:src/components/card-system/CardSystemContainer.tsx): Top-level container; receives preview flags; mounts CardStream.
  - [src/components/card-system/CardStream.tsx](mdc:src/components/card-system/CardStream.tsx): Renders the stream of cards; scroll/reveal behavior; hydration-safe.
  - [src/components/card-system/CardRenderer.tsx](mdc:src/components/card-system/CardRenderer.tsx): Chooses which card component to render per card type.
  - [src/components/card-system/CardContext.tsx](mdc:src/components/card-system/CardContext.tsx): Context for stream state, navigation, reveal.
  - Cards: [FormCard.tsx](mdc:src/components/card-system/cards/FormCard.tsx), [CalculationCard.tsx](mdc:src/components/card-system/cards/CalculationCard.tsx), [InfoCard.tsx](mdc:src/components/card-system/cards/InfoCard.tsx), [EditableCalculationResult.tsx](mdc:src/components/card-system/cards/EditableCalculationResult.tsx)
  - Visuals: [VisualSupport.tsx](mdc:src/components/card-system/VisualSupport.tsx)
  - Types: [src/types/form.ts](mdc:src/types/form.ts)

- Admin (App Router) and UI
  - Pages: [src/app/admin/page.tsx](mdc:src/app/admin/page.tsx) and sub-pages under `src/app/admin/*` (card-builder, calculations, preview, visual-assets, pdf-settings, settings, simple-leads, login).
  - Components: [src/components/admin/*](mdc:src/components/admin) incl. card-builder suite and visual-asset modals.
  - shadcn/ui primitives: [src/components/ui/*](mdc:src/components/ui)
  - Global styles (admin-only): [src/app/globals.css](mdc:src/app/globals.css)

- Preview and embedding
  - [src/app/admin/preview/page.tsx](mdc:src/app/admin/preview/page.tsx): Live preview of the Card System.
  - Built widget assets: [dist/](mdc:dist) (embed `widget.min.css`/`widget.min.js`); local embed tests: [public/widget-test/*](mdc:public/widget-test)

- APIs (Route Handlers)
  - Admin API namespace: [src/app/api/admin/*](mdc:src/app/api/admin)
  - Formulas/calc: [src/app/api/formulas/*](mdc:src/app/api/formulas) (incl. execute)
  - Submissions: [src/app/api/submit-lead/route.ts](mdc:src/app/api/submit-lead/route.ts)
  - PDF (on‑demand): [src/app/api/generate-pdf/route.ts](mdc:src/app/api/generate-pdf/route.ts)
  - Analytics: [src/app/api/analytics/route.ts](mdc:src/app/api/analytics/route.ts), dashboard: [src/app/api/analytics-dashboard/route.ts](mdc:src/app/api/analytics-dashboard/route.ts)
  - GDPR: [src/app/api/gdpr/data-request/route.ts](mdc:src/app/api/gdpr/data-request/route.ts)
  - Security test (dev): [src/app/api/security-test/route.ts](mdc:src/app/api/security-test/route.ts)
  - Utilities/debug/testing namespaces available under `src/app/api/*`

- Services (logic layer)
  - Formulas and lookups: [calculation-engine.ts](mdc:src/lib/calculation-engine.ts), [unified-calculation-engine.ts](mdc:src/lib/unified-calculation-engine.ts), [formula-service.ts](mdc:src/lib/formula-service.ts), [formula-lookup-service.ts](mdc:src/lib/formula-lookup-service.ts), [enhanced-lookup-engine.ts](mdc:src/lib/enhanced-lookup-engine.ts), [enhanced-lookup-service.ts](mdc:src/lib/enhanced-lookup-service.ts)
  - Email: [email-service.ts](mdc:src/lib/email-service.ts), [resend.ts](mdc:src/lib/resend.ts), templates under [src/lib/email-templates](mdc:src/lib/email-templates), and [email-templates-service.ts](mdc:src/lib/email-templates-service.ts)
  - Supabase: [supabase.ts](mdc:src/lib/supabase.ts), [verify-table-structure.ts](mdc:src/lib/verify-table-structure.ts)
  - Other: [shortcode-processor.ts](mdc:src/lib/shortcode-processor.ts), [shortcodes-service.ts](mdc:src/lib/shortcodes-service.ts), [analytics.ts](mdc:src/lib/analytics.ts)

- PDF & documents
  - Component: [src/lib/pdf/SavingsReportPDF.tsx](mdc:src/lib/pdf/SavingsReportPDF.tsx)
  - Data processor: [src/lib/pdf/pdf-data-processor.ts](mdc:src/lib/pdf/pdf-data-processor.ts)
  - Styles: [src/lib/pdf/pdf-styles.ts](mdc:src/lib/pdf/pdf-styles.ts)
  - Field mappings: [src/config/pdf-field-mappings.ts](mdc:src/config/pdf-field-mappings.ts), shortcode mappings: [src/config/pdf-shortcode-mappings.ts](mdc:src/config/pdf-shortcode-mappings.ts)
  - Calculation set: [src/lib/pdf-calculation-definitions.ts](mdc:src/lib/pdf-calculation-definitions.ts)

- Hooks
  - [useFormulaExecution.ts](mdc:src/hooks/useFormulaExecution.ts), [useFormulas.ts](mdc:src/hooks/useFormulas.ts)
  - [useCardStyles.ts](mdc:src/hooks/useCardStyles.ts) — Card System style lifecycle.
  - [useDebounce.ts](mdc:src/hooks/useDebounce.ts), [useShortcodeProcessing.ts](mdc:src/hooks/useShortcodeProcessing.ts)

- Build/tested widget
  - Built assets: [dist/](mdc:dist) (e.g., `widget.min.css`, `widget.min.js`)
  - Local embed tests: [public/widget-test/*](mdc:public/widget-test)

### Runtime data flow (high level)
1) Admin authoring (Tailwind/shadcn/ui):
   - Create/edit forms/cards/emails in `src/app/admin/*` using components under `src/components/admin/*`.
   - Persist and preview using admin APIs under `src/app/api/admin/*`.

2) Widget rendering (Card System):
   - `CardSystemContainer` mounts the Card Stream and sets preview flags.
   - `CardStream` asks `CardRenderer` to render each card component based on type and reveal rules.
   - Form fields map to types in [src/types/form.ts](mdc:src/types/form.ts).

3) Styling via tokens:
   - At startup or mount, `cardstream-theme-applier` reads [cardstream-complete-config.json](mdc:cardstream-complete-config.json) and sets CSS variables.
   - Card components reference CSS variables (no hardcoded visual values).
   - Admin styles remain in `globals.css` and do not affect widget.

4) Calculations and submissions:
   - Form inputs feed into formula execution via hooks/services (`useFormulaExecution`, `unified-calculation-engine`).
   - Submit triggers [submit-lead/route.ts](mdc:src/app/api/submit-lead/route.ts), which may send emails via `email-service` and record analytics.
5) Post-submission (server):
   - Generate PDF via [SavingsReportPDF.tsx](mdc:src/lib/pdf/SavingsReportPDF.tsx), upload to Supabase Storage, update `leads` with `pdf_url`.
   - Dispatch emails (customer results with optional PDF, sales notification), and respond with calculation summary.

### Design tokens & styling contract (must-follow rules)
- Single source of truth: [cardstream-complete-config.json](mdc:cardstream-complete-config.json)
- Theme applier: [src/lib/cardstream-theme-applier.ts](mdc:src/lib/cardstream-theme-applier.ts) writes CSS custom properties.
- Widget styles: consume variables declared in [src/styles/cardstream-tokens.css](mdc:src/styles/cardstream-tokens.css).
- No hardcoded visual values in widget components (colors, spacing, typography). Use `var(--cs-*)` vars.
- Field interaction states (hover/focus/error/disabled) must derive from token variables.
- Step indicator placement and styles must match tokens; avoid badges not defined by the design system.
- CSS isolation: Admin uses Tailwind via [globals.css](mdc:src/app/globals.css); widget must not depend on Tailwind.

### CSS isolation model
- Admin-only styles live in `globals.css` and shadcn/ui components.
- Widget gets scoped styles from `cardstream-tokens.css` and data attributes (e.g., `data-cardstream` where used).
- Avoid global overrides that could leak into the widget.

### Cards & forms
- Card types:
  - FormCard: renders fields, validations, help/error states.
  - CalculationCard: shows computed metrics.
  - InfoCard: rich informational content.
  - EditableCalculationResult: allows editing a result when applicable.
- Field schema/types: [src/types/form.ts](mdc:src/types/form.ts)
- Reveal conditions & navigation: [CardContext.tsx](mdc:src/components/card-system/CardContext.tsx)

### Calculations & lookups
- Orchestration: [unified-calculation-engine.ts](mdc:src/lib/unified-calculation-engine.ts)
- Engine/core: [calculation-engine.ts](mdc:src/lib/calculation-engine.ts)
- Calculation sets: [calculation-definitions.ts](mdc:src/lib/calculation-definitions.ts), PDF: [pdf-calculation-definitions.ts](mdc:src/lib/pdf-calculation-definitions.ts)
- Formulas: [formula-service.ts](mdc:src/lib/formula-service.ts)
- Lookups: [formula-lookup-service.ts](mdc:src/lib/formula-lookup-service.ts), [enhanced-lookup-engine.ts](mdc:src/lib/enhanced-lookup-engine.ts)

### Email & analytics
- Email: [email-service.ts](mdc:src/lib/email-service.ts), [resend.ts](mdc:src/lib/resend.ts), templates under [src/lib/email-templates](mdc:src/lib/email-templates) — customer results + sales notification, optional PDF attachment.
- Analytics: [src/lib/analytics.ts](mdc:src/lib/analytics.ts) and APIs [src/app/api/analytics/route.ts](mdc:src/app/api/analytics/route.ts), [src/app/api/analytics-dashboard/route.ts](mdc:src/app/api/analytics-dashboard/route.ts)

### Privacy, security & compliance
- Input sanitization & rate limiting: [src/lib/input-sanitizer.ts](mdc:src/lib/input-sanitizer.ts); security event logging used in submit flow.
- GDPR self‑service: [src/app/api/gdpr/data-request/route.ts](mdc:src/app/api/gdpr/data-request/route.ts) (access, deletion, rectification).
- Development security tests: [src/app/api/security-test/route.ts](mdc:src/app/api/security-test/route.ts) (disabled in production).

### Common tasks — where to look
- “Change active/focus/error styles of inputs” → Tokens in [cardstream-complete-config.json](mdc:cardstream-complete-config.json) + usage in [cardstream-tokens.css](mdc:src/styles/cardstream-tokens.css). Ensure FormCard uses the relevant classes/vars.
- “Step indicator position/appearance” → Tokens config + Card rendering in [CardRenderer.tsx](mdc:src/components/card-system/CardRenderer.tsx) and [FormCard.tsx](mdc:src/components/card-system/cards/FormCard.tsx).
- “Add a new card type” → Implement under `src/components/card-system/cards/`, export from [index.ts](mdc:src/components/card-system/index.ts), branch in [CardRenderer.tsx](mdc:src/components/card-system/CardRenderer.tsx).
- “Debug missing input borders” → Check resets/selectors in [cardstream-tokens.css](mdc:src/styles/cardstream-tokens.css) and ensure bottom-border tokens are applied.
- “Fix hydration mismatch” → Ensure preview flags are props (SSR-safe) in [CardSystemContainer.tsx](mdc:src/components/card-system/CardSystemContainer.tsx) and [CardStream.tsx](mdc:src/components/card-system/CardStream.tsx).
- “Why no cards render?” → Verify data sources via admin APIs (`src/app/api/admin/*`), `CardRenderer` branching, and any feature flags.

### Known constraints & decisions
- Widget visuals must originate from tokens; no Tailwind or hardcoded CSS in widget components.
- Admin and Widget styling are strictly separated to prevent leakage.
- Preview mode must not rely on `window` during SSR; pass booleans via props.

### Example prompts to ask an AI
- “Where do I change the hover/focus/error styles for form inputs in the widget?”
- “Show the data flow from user input to calculated results and submitted lead.”
- “Which files define and apply the step indicator style?”
- “How are formulas executed and where do lookups come from?”
- “What code sends emails after a form submission?”

### Glossary
- Card System: The widget rendering a stream of cards to end users.
- Tokens: Design-time variables in JSON driving CSS custom properties at runtime.
- Admin: Back-office UI for configuring forms, visuals, and emails.
- Route Handler: Next.js API endpoint under `src/app/api/*`.


