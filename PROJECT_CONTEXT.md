# E1 Calculator - Energy Savings Calculator Project Brief

## Project Overview

A sophisticated energy savings calculator SaaS platform designed to help users calculate potential savings from heat pump installations. The system features a multi-step form builder with progressive card-based UI, dynamic calculations, and comprehensive admin panel for configuration.

## Tech Stack

- **Frontend**: Next.js 15.5.0 (Turbopack), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Framer Motion, @dnd-kit
- **Backend**: Supabase (PostgreSQL)
- **Email Service**: Resend
- **Hosting**: Vercel
- **Authentication**: Supabase Auth
- **Development**: ESLint, Prettier

## Core Architecture

### Database Structure

#### Main Tables

- **`card_templates`** - Dynamic form cards configuration
  - Types: form, calculation, info, submit
  - Supports reveal conditions and progressive disclosure
  - Customizable styling and behavior
- **`card_fields`** - Field definitions for form cards
  - Various input types: text, number, select, radio, checkbox
  - Validation rules and dependencies
  - Conditional visibility

- **`visual_objects`** - Visual support content system
  - Images, videos, help content
  - Contextual display based on card/field
  - Reference system: visual_object_XXX
- **`formulas`** - Calculation engine
  - JavaScript-based formula definitions
  - Shortcode system: [calc:formula-name]
  - Access to form data via: data.fieldName

- **`leads`** - Submitted form data and calculations
  - Full form submission storage
  - Calculated results preservation
  - GDPR compliance fields

- **`email_templates`** - Email notification templates
  - HTML/text versions
  - Shortcode support for dynamic content
  - Multiple trigger types

- **`themes`** - Branding and appearance settings
  - Color schemes
  - Typography settings
  - Component styling overrides

### Main Systems

#### 1. **Card Stream System** (`/src/components/card-system/`)

- Progressive form with sequential card unlocking
- Blur/reveal mechanics with animations
- Visual support panel integration
- Key Components:
  - `CardStreamProvider` - Context and state management
  - `CardRenderer` - Dynamic card type rendering
  - `CardSystemContainer` - Main container component
  - `VisualSupport` - Contextual help display

#### 2. **Visual Support System** (`/src/components/card-system/`)

- Contextual help and visual content display
- Used by Card System for progressive disclosure
- Components:
  - `VisualSupport` - Contextual help panel

#### 3. **Shortcode Processing System**

- Format: `[calc:formula-name]`, `[form:field-name]`, `[visual:object-name]`
- Real-time calculation updates
- Embedded in content, emails, and results
- Recursive processing support

#### 4. **Admin Panel** (`/src/app/admin/`)

- **Dashboard** - Lead management and analytics
- **Card Builder** - Drag-drop card/field creation
- **Calculations** - Formula management interface
- **Visual Assets** - Image/content management
- **Email Builder** - Template creation
- **Appearance** - Theme customization
- **Settings** - System configuration

### Current Implementation Status

#### ✅ Completed Features

- Complete card system with blur/reveal mechanics
- Card Builder admin interface with drag-drop
- Visual support integration
- Calculation engine with shortcodes
- Lead capture and management
- Email notification system
- GDPR compliance features
- Multi-language support structure
- Iframe embedding capability
- Admin authentication

#### 🔄 Recent Additions

- Card Builder added to admin navigation
- Visual objects system with reference management
- Card field configuration UI
- Reveal conditions for progressive disclosure
- Admin navigation redesign with gradient theme

#### ⏳ Known Issues/TODOs

- Linter warnings in some admin components
- Viewport metadata deprecation warnings
- Card field relationship management needs optimization
- Mobile responsiveness for card builder interface

### Key Business Logic

#### Energy Calculator Flow

1. **Property Details** - Location, size, current heating
2. **Energy Usage** - Current consumption and costs
3. **Heat Pump Selection** - System recommendations
4. **Savings Calculation** - ROI and payback period
5. **Lead Capture** - Contact information
6. **Results Display** - Detailed savings breakdown

#### Calculation Examples

- Annual savings: `current_cost - (current_consumption * heat_pump_efficiency_factor * electricity_price)`
- Payback period: `installation_cost / annual_savings`
- CO2 reduction: `current_emissions - heat_pump_emissions`

### File Structure

```
/src/
├── app/
│   ├── admin/          # Admin panel pages
│   ├── api/            # API endpoints
│   ├── calculator/     # Main calculator page
│   └── layout.tsx      # Root layout
├── components/
│   ├── admin/          # Admin UI components
│   ├── card-system/    # Card stream components + Visual support
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── supabase.ts     # Database types & client
│   ├── calculations.ts # Formula engine
│   └── email-service.ts # Email handling
└── types/
    └── form.ts         # TypeScript definitions
```

### Integration Points

#### Embedding

- Iframe embed via `/calculator?embed=true`
- WordPress plugin ready
- Customizable themes via query params

#### API Endpoints

- `/api/submit-lead` - Form submission
- `/api/visual-objects` - Visual content
- `/api/admin/*` - Admin operations
- `/api/export-leads` - Data export

### Development Guidelines

#### State Management

- React Context for card state
- Local state for form inputs
- Supabase real-time for admin updates

#### Styling Approach

- Tailwind CSS utilities first
- CSS modules for complex components
- Theme variables for customization

#### Performance Considerations

- Lazy loading for visual objects
- Progressive form validation
- Optimistic UI updates in admin

### Configuration

#### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

### Questions for New Features

When implementing new features, consider:

1. **Card Flow Integration** - How does it fit in the progressive disclosure?
2. **Admin Control** - What needs to be configurable vs hardcoded?
3. **Visual Support** - What contextual help is needed?
4. **Mobile Experience** - How does it work on small screens?
5. **Calculation Impact** - Does it affect formulas or shortcodes?
6. **Data Storage** - What needs to be saved to leads table?

### Testing Approach

- Component testing with React Testing Library
- E2E testing for critical paths
- Manual testing checklist for admin features
- Load testing for calculation performance

### Deployment Notes

- Vercel deployment with preview branches
- Environment variables per deployment
- Database migrations via Supabase CLI
- SSL verification for embed domains

### Security Considerations

- Admin routes protected by middleware
- Input sanitization on all user inputs
- CORS configuration for embedding
- Rate limiting on form submissions
- GDPR compliance with data retention

This document should be updated as new features are added or architectural decisions are made.
