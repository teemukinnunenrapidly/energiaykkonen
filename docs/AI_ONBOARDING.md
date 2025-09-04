## E1 Calculator – AI Onboarding Guide

### Overview
E1 Calculator is a modular, token‑driven platform for building and embedding interactive calculators and lead‑capture flows.
- Admin panel: Tailwind + shadcn/ui interface to configure card streams (forms, calculations, info), formulas/lookup rules, visual assets, and email templates.
- End‑user widget (Card System): a sequence of cards with reveal logic that renders forms, information, and calculated results, styled exclusively via the design token system.
- Core stack: Next.js App Router, Supabase (DB/auth/storage), Unified Calculation Engine for shortcodes and expressions, PDF generation with @react-pdf/renderer, and a design token system (`cardstream-complete-config.json`) applied via CSS variables.
- Primary goals: compute domain‑specific results, display supporting visuals, capture GDPR‑compliant leads, send emails, and track analytics. The widget can be embedded on third‑party sites using built assets.

Purpose: Hand this file to an AI assistant to build new features confidently. It explains the architecture, styling system (design tokens), data flow, and where to modify code.

### Quick Facts
- Framework: Next.js App Router (TypeScript)
- Backend: Next.js Route Handlers + Supabase (DB, auth, storage)
- UI Domains:
  - Admin panel (Tailwind + shadcn/ui)
  - Widget/Card System (design-token driven, no Tailwind)
- Tokens: `cardstream-complete-config.json` → applied via `cardstream-theme-applier.ts` → consumed by `cardstream-tokens.css` and `useCardStyles`

### Directory Map (high-signal)
- Widget (Card System)
  - `src/components/card-system/CardSystemContainer.tsx` – mounts VisualSupport + CardStream
  - `src/components/card-system/CardStream.tsx` – renders cards, scroll/reveal logic
  - `src/components/card-system/CardRenderer.tsx` – dispatches per card type
  - `src/components/card-system/CardContext.tsx` – session, form data, reveal/complete logic
  - Cards: `src/components/card-system/cards/{FormCard,CalculationCard,InfoCard,EditableCalculationResult}.tsx`
  - Styles: `src/hooks/useCardStyles.ts` (reads tokens), `src/styles/cardstream-tokens.css`
  - Theme: `src/lib/cardstream-theme-applier.ts`, `src/config/cardstream-config.ts`
- Admin (Tailwind/shadcn)
  - Pages: `src/app/admin/*`
  - Components: `src/components/admin/*`, shadcn primitives under `src/components/ui/*`
  - Global styles: `src/app/globals.css`
- APIs (Route Handlers)
  - Admin namespace: `src/app/api/admin/*`
  - Formulas/calc: `src/app/api/formulas/*`
  - Submit lead: `src/app/api/submit-lead/route.ts`
  - Analytics and utilities: `src/app/api/*`
- Services/Lib
  - Supabase client and queries: `src/lib/supabase.ts`
  - Unified engine: `src/lib/unified-calculation-engine.ts`
  - Lookups, formulas, shortcodes: `src/lib/*`
- Design System
  - Tokens source of truth: `cardstream-complete-config.json`
  - Config bridge: `src/config/cardstream-config.ts`

### Styling & Token Contract (must-follow)
- Single source of truth: `cardstream-complete-config.json`
- Apply tokens to CSS variables: `src/lib/cardstream-theme-applier.ts`
- Consume tokens:
  - CSS level: `src/styles/cardstream-tokens.css` via `var(--cs-*)`
  - React level: `src/hooks/useCardStyles.ts` provides token values
- Do NOT hardcode widget visuals (colors, spacing, radii, typography). Use tokens only.
- Admin styling is isolated to Tailwind (`globals.css`); widget must not depend on Tailwind.

### Runtime Flow (end-user)
1) `CardSystemContainer` renders VisualSupport (left, desktop) and `CardStream` (right).
2) `CardContext` loads cards from Supabase (`getCardsDirect`) and manages per-card state.
3) `CardStream` filters visible vs locked cards by `shouldBeRevealed`, renders via `CardRenderer`.
4) `FormCard` updates `CardContext.updateField`, which persists field completions and can trigger reveal/complete.
5) `CalculationCard` uses `UnifiedCalculationEngine` to process formulas/shortcodes.
6) Submit actions post to `/api/submit-lead` and may send emails/analytics.

### PDF Generation (Customer Savings Report)

- Trigger: After a successful lead submission to `/api/submit-lead`, the server generates a one‑page A4 savings report PDF for the customer.
- Data shaping: `processPDFData(formData, calculations)` merges validated inputs with computed values and resolves shortcodes per `pdfFieldMappings` using the Unified Calculation Engine.
  - Supported tokens: `{field}` (form), `[calc:name]` (computed), `[lookup:name]` (DB lookups), `CURRENT_DATE`, `AUTO_GENERATE` (calculation number).
- Rendering: `SavingsReportPDF` (React component) renders the document with `@react-pdf/renderer` and styles from `pdf-styles.ts` (header, customer info, 1/5/10‑year cost comparison, savings, notes, footer).
- Storage: The PDF is uploaded to Supabase Storage bucket `lead-pdfs` at `<leadId>/saastolaskelma-<calculationNumber>.pdf`; the `leads` row is updated with `pdf_url` and `pdf_generated_at`.
- Email attachment: If generation succeeds, the PDF is attached to the customer results email; the sales notification remains HTML‑only.

Relevant files:
- API route: [src/app/api/submit-lead/route.ts](mdc:src/app/api/submit-lead/route.ts)
- PDF component: [src/lib/pdf/SavingsReportPDF.tsx](mdc:src/lib/pdf/SavingsReportPDF.tsx)
- PDF styles: [src/lib/pdf/pdf-styles.ts](mdc:src/lib/pdf/pdf-styles.ts)
- Data processor: [src/lib/pdf/pdf-data-processor.ts](mdc:src/lib/pdf/pdf-data-processor.ts)
- Field mappings & formatting: [src/config/pdf-field-mappings.ts](mdc:src/config/pdf-field-mappings.ts)
- Email sender (attachment): [src/lib/email-service.ts](mdc:src/lib/email-service.ts)

Testing locally:
- Submit a valid payload to `POST /api/submit-lead` (via the app flow or API client) and check Supabase Storage for the file under `lead-pdfs/` and the updated `leads.pdf_url`.
- Email sending uses the configured provider; in development, verify logs and the response JSON for `emailResults` and errors.

Notes:
- Static HTML prototypes like `public/saastolaskelma.html` are useful for layout iteration but are not part of the runtime PDF pipeline.

### Unified Calculation Engine (where calculations live)
- File: `src/lib/unified-calculation-engine.ts`
- Handles: `[calc:name]`, `[lookup:name]`, `{field-name}` and math expressions
- Resolves dependencies iteratively (no recursion), caches, and supports overrides via `override_*` fields

### Adding a New Feature (playbook)
1) Define UX and data
   - If it’s a new card: add a record via admin or mock in code for dev
   - For new field types, extend `src/types/form.ts` and ensure FormCard handles it
2) Style via tokens
   - Add/adjust tokens in `cardstream-complete-config.json`
   - If new CSS vars needed, update `cardstream-theme-applier.ts` (set vars) and `cardstream-tokens.css` (consume vars)
   - Access values in React via `useCardStyles()`
3) Implement UI
   - New card type: create component in `src/components/card-system/cards/`, export in `index.ts`, branch in `CardRenderer.tsx`
   - Extend `FormCard` render cases for new field types
4) Logic & data
   - Add formula/lookup logic in `src/lib/*` as needed (or update engine usage in card components)
   - For persistence or admin integration, add/update Route Handlers under `src/app/api/*`
5) Verify isolation & SSR
   - Avoid Tailwind in widget; rely on tokens
   - Don’t use `window` during SSR; pass flags as props from container
6) Test
   - Use `public/widget-test/*` for local widget validation
   - Validate fields, reveal timing, calculation outputs, and submission path

### Common Tasks
- Change input focus/error styles → tokens in `cardstream-complete-config.json` + consumption in `cardstream-tokens.css` and `FormCard`
- Move step indicator/adjust style → tokens + `CardRenderer`/card headers
- Add calculation dependency → engine processes `[calc:*]` and can read form fields via `{field}` or `[field:*]`
- Fix hydration mismatch → ensure booleans/flags pass via props (see `CardSystemContainer` → `CardStream`)

### References (open these when coding)
- Tokens: `cardstream-complete-config.json`
- Token bridge: `src/config/cardstream-config.ts`
- Token application: `src/lib/cardstream-theme-applier.ts`
- CSS vars/classes: `src/styles/cardstream-tokens.css`
- React token access: `src/hooks/useCardStyles.ts`
- Card context/state: `src/components/card-system/CardContext.tsx`
- Card stream: `src/components/card-system/CardStream.tsx`
- Cards: `src/components/card-system/cards/*.tsx`
- Engine: `src/lib/unified-calculation-engine.ts`
- Supabase: `src/lib/supabase.ts`
- Admin UI: `src/app/admin/*`, `src/components/admin/*`, `src/components/ui/*`

### Ground Rules
- Widget visuals = tokens only. No Tailwind in widget components.
- Keep admin and widget styles isolated.
- New features should provide tokens first, UI second.
- SSR safety: pass runtime flags via props, not `window` checks.
