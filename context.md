# E1 Calculator - AI Context & Routing Map

## Project Overview
**Name:** Energiaykkönen Heat Pump Savings Calculator
**Stack:** Next.js 15 (App Router), TypeScript, Supabase, Tailwind, shadcn/ui.
**Core Concept:** A multi-step card stream widget that calculates energy savings, generates a PDF report, and captures leads.

---

## Domain Routing (Where to look)

### 1. Calculation Logic (The "Brain")
*If the task is about formulas, math, or logic:*
- **Core Engine:** `src/lib/unified-calculation-engine.ts` (Handles shortcodes, dependency resolution)
- **Definitions:** `src/lib/calculation-definitions.ts` (Hardcoded formulas like energy need, CO2)
- **PDF-specific:** `src/lib/pdf-calculation-definitions.ts` (Calculations specific to the PDF output)
- **Lookups:** `src/lib/enhanced-lookup-engine.ts` (Conditional logic for finding values)

### 2. Card System (The Widget UI)
*If the task is about the frontend user experience:*
- **Orchestrator:** `src/components/card-system/CardStream.tsx` (Renders the list of cards)
- **State Management:** `src/components/card-system/CardContext.tsx` (Handles form data, visibility, navigation)
- **Card Types:** `src/components/card-system/cards/`
    - `FormCard.tsx` (Inputs)
    - `CalculationCard.tsx` (Results display)
    - `InfoCard.tsx` (Static content)
- **Styling:** `src/styles/cardstream-tokens.css` (CSS Variables) & `cardstream-complete-config.json` (Design Tokens)

### 3. PDF Generation
*If the task is about the generated PDF report:*
- **Template/Layout:** `src/lib/pdf/SavingsReportPDF.tsx` (React-pdf component, visual layout)
- **Data Prep:** `src/lib/pdf/pdf-data-processor.ts` (Prepares data before rendering)
- **Styles:** `src/lib/pdf/pdf-styles.ts`
- **Shortcodes:** `src/config/pdf-shortcode-mappings.ts`

### 4. Data & Backend API
*If the task is about saving data, API endpoints, or DB:*
- **Main Submission:** `src/app/api/submit-lead/route.ts` (Handles lead save, PDF gen, Email send)
- **Database Client:** `src/lib/supabase.ts` (Types and client initialization)
- **Lead Utilities:** `src/lib/lead-helpers.ts` (Flattening JSONB data)

### 5. Admin Panel
*If the task is about the back-office tools:*
- **Card Builder:** `src/components/admin/card-builder/` (Drag-and-drop editor)
- **Calculations UI:** `src/app/admin/calculations/page.tsx`
- **Visual Assets:** `src/app/admin/visual-assets/`

### 6. Emails
*If the task is about Resend or email templates:*
- **Service:** `src/lib/email-service.ts`
- **Templates:** `src/lib/email-templates/` (Customer results & Sales notification)

---

## Critical Data Flows

### A. Lead Submission Flow
1. **Frontend:** User clicks submit in `FormCard.tsx`.
2. **Context:** `submitData()` in `CardContext.tsx` prepares payload.
3. **API:** `POST /api/submit-lead` receives data.
4. **Logic:**
    - Validates input.
    - Runs `calculatePDFValues()` for final numbers.
    - Inserts to Supabase `leads` table.
    - Generates PDF buffer (`processPDFData` -> `SavingsReportPDF`).
    - Uploads PDF to Supabase Storage.
    - Sends Emails via Resend.

### B. Calculation Engine Flow
1. **Trigger:** `CalculationCard` or API request.
2. **Engine:** `UnifiedCalculationEngine` parses string (e.g., `[calc:savings]`).
3. **Resolution:**
    - Resolves `{field}` references from `formData`.
    - Resolves `[lookup:x]` from DB lookup tables.
    - Executes math expressions.
4. **Output:** Returns numeric value or formatted string.

---

## Design System Contract
**Rule:** The Widget (`src/components/card-system`) does NOT use Tailwind directly for visuals.
- It uses CSS variables defined in `src/styles/cardstream-tokens.css`.
- Values are injected via `src/lib/cardstream-theme-applier.ts` from the JSON config.
- **Admin panel** uses standard Tailwind + shadcn/ui.
