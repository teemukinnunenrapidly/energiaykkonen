# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
npm run dev           # Start development server with Turbopack
npm run build         # Build for production
npm start             # Start production server
```

### Code Quality

```bash
npm run lint          # Check code with ESLint
npm run lint:fix      # Auto-fix ESLint issues
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm run type-check    # TypeScript type checking
```

### Testing

```bash
npm run test:email       # Test email system
npm run test:email:full  # Full email system validation
```

## Architecture

### Core System: Card Stream Architecture

The application uses a **card-based progressive disclosure system** where forms are rendered as a stream of cards that unlock progressively. Key components:

- **CardStreamProvider** (`/src/components/card-system/CardContext.tsx`) - Manages state for the entire card stream, handles unlocking logic, and form data collection
- **CardRenderer** - Dynamically renders different card types (form, calculation, info, submit)
- **CardSystemContainer** - Main container that orchestrates the card stream and visual support panel
- **VisualSupport** (`/src/components/card-system/VisualSupport.tsx`) - Contextual help panel that displays images/content based on current card/field focus

Card types are stored in `card_templates` table with fields in `card_fields`. Cards can have reveal conditions that determine when they become visible.

### Shortcode System

The app uses shortcodes for dynamic content replacement throughout:

- `[calc:formula-name]` - Execute calculations from formulas table
- `[form:field-name]` - Insert form field values
- `[visual:object-name]` - Reference visual objects
- Processed by `/src/lib/shortcode-processor.ts`
- Used in emails, card content, and calculation results

### Database Architecture (Supabase)

Key tables and their relationships:

- `card_templates` → `card_fields` - Form structure
- `visual_objects` → `visual_object_images` - Media assets
- `formulas` - Calculation engine (JavaScript formulas)
- `leads` - Submitted form data
- `email_templates` - Notification templates
- `themes` - Branding configuration

### API Structure

All API routes are in `/src/app/api/`:

- `/admin/*` - Protected admin operations
- `/submit-lead` - Main form submission endpoint
- `/formulas/*` - Calculation execution
- `/visual-assets` - Image/content management
- Authentication handled via JWT in admin routes

### Admin Panel

Located at `/src/app/admin/`, protected by authentication:

- **Card Builder** - Drag-drop interface for building forms
- **Visual Assets** - Media library with Cloudflare Images integration
- **Calculations** - Formula editor with live testing
- **Email Builder** - Template creation with shortcodes
- **Analytics** - Lead tracking and conversion metrics

## Key Technical Decisions

### State Management

- React Context for card stream state (`CardContext`)
- Local state for form inputs within cards
- No global state management library - contexts are sufficient

### Styling

- Tailwind CSS for utilities
- shadcn/ui components from `/src/components/ui/`
- CSS-in-JS avoided for performance
- Theme customization via CSS variables

### Image Handling

- Cloudflare Images for storage and CDN
- Server-side upload/delete via `/api/admin/upload-image` and `/api/admin/delete-image`
- Multiple variants (public, thumbnail, avatar, cover)
- Never expose Cloudflare API tokens to client

### Form Handling

- React Hook Form for form state
- Zod for validation schemas
- Progressive validation as cards are completed
- Form data persisted in context until submission

### Email System

- Resend for transactional emails
- React Email templates in `/src/lib/email-templates/`
- Shortcode processing for dynamic content
- Dual templates: customer results + sales notification

## Environment Variables

Required for production:

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Email (Resend)
RESEND_API_KEY

# Admin Authentication
ADMIN_PASSWORD

# Cloudflare Images (for visual assets)
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_IMAGES_API_TOKEN
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH
```

## Important Patterns

### Adding New Card Types

1. Create component in `/src/components/card-system/cards/`
2. Add case in `CardRenderer` component
3. Update database `card_templates` type enum
4. Handle in `CardStreamProvider` if special logic needed

### Creating API Routes

1. Use Next.js App Router conventions
2. Validate input with Zod schemas
3. Check authentication for admin routes via `auth.ts`
4. Return consistent error formats: `{ error: string }`

### Working with Visual Objects

1. Upload images via admin panel (uses Cloudflare)
2. Reference in content as `[visual:object-name]`
3. Images stored with multiple variants
4. Cleanup handled automatically on deletion

### Modifying Calculations

1. Edit formulas in admin panel or `formulas` table
2. Use JavaScript syntax with access to `data` object
3. Test with live data in Formula Tester
4. Reference in content via `[calc:formula-name]`

## Common Tasks

### Deploy Changes

```bash
git add .
git commit -m "feat/fix: description"
git push origin main
# Vercel auto-deploys from main branch
```

### Add Database Migration

1. Create SQL file in `/scripts/supabase-migrations/`
2. Run via Supabase dashboard or CLI
3. Update types if schema changes

### Debug Email Issues

1. Check Resend dashboard for delivery status
2. Verify RESEND_API_KEY is set
3. Use `/api/test-email` endpoint for testing
4. Check `/src/lib/email-service.ts` for errors

### Fix TypeScript Errors

1. Run `npm run type-check` to see all errors
2. Update types in `/src/lib/supabase.ts` if database changed
3. Use `as const` for literal types
4. Avoid `any` - use `unknown` and type guards

## Security Considerations

- Admin routes protected by password authentication
- Sanitize all user inputs (handled by `input-sanitizer.ts`)
- CORS configured for iframe embedding
- Rate limiting on form submissions
- Never commit secrets - use environment variables
- Cloudflare API operations only via server-side routes
