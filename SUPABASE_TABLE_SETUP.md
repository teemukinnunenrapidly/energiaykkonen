# Supabase Leads Table Setup Guide

This guide explains how to create the leads table in your Supabase project using the SQL migration script.

## Prerequisites

Before running this setup, ensure you have:

- ✅ Supabase project created (Task 7.1)
- ✅ Environment variables configured
- ✅ Supabase connection tested

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"** to create a new SQL script

### Step 2: Execute Migration Script

1. Copy the contents of `scripts/supabase-migrations/01_create_leads_table.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script
4. Verify no errors appear in the output

### Step 3: Verify Table Creation

1. Navigate to **Database** → **Tables** in the left sidebar
2. Confirm the `leads` table appears in the list
3. Click on the table to inspect its structure
4. Verify all columns and constraints are present

## Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

## Table Schema Overview

The migration creates a `leads` table with the following structure:

### Form Input Fields

- **House Information**: `square_meters`, `ceiling_height`, `construction_year`, `floors`
- **Current Heating**: `heating_type`, `current_heating_cost`, `current_energy_consumption`
- **Household**: `residents`, `hot_water_usage`
- **Contact Info**: `first_name`, `last_name`, `email`, `phone`, `street_address`, `city`, `contact_preference`, `message`

### Calculated Fields

- `annual_energy_need`, `heat_pump_consumption`, `heat_pump_cost_annual`
- `annual_savings`, `five_year_savings`, `ten_year_savings`
- `payback_period`, `co2_reduction`

### Metadata Fields

- `id` (UUID primary key)
- `created_at`, `updated_at` (timestamps)
- `ip_address`, `user_agent`, `source_page` (analytics)
- `status`, `notes` (lead management)

## Data Validation

The table includes comprehensive constraints:

- ✅ Square meters: 10-1000 range
- ✅ Ceiling height: 2.5, 3.0, or 3.5 meters only
- ✅ Construction year: predefined ranges
- ✅ Floors: 1-10 range
- ✅ Heating type: Oil, Electric, District, Other
- ✅ Residents: 1-10 range
- ✅ Contact preference: Email, Phone, Both
- ✅ Status: new, contacted, qualified, converted

## Performance Features

The migration includes:

- 📈 Indexes on frequently queried columns
- 🔄 Automatic `updated_at` timestamp updates
- 📝 Comprehensive column documentation
- 🚀 Optimized for lead queries and reporting

## Testing the Table

After creating the table, you can test it using the test connection page:

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/test-supabase`
3. The connection test should now pass

## Troubleshooting

### Common Issues:

1. **Permission denied error**
   - Ensure you're logged in to the correct Supabase project
   - Check that you have admin/owner permissions

2. **Syntax error in SQL**
   - Copy the exact SQL from the migration file
   - Ensure no characters were lost during copy/paste

3. **Table already exists**
   - The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run
   - If you need to reset, drop the table first: `DROP TABLE IF EXISTS leads;`

4. **Connection timeout**
   - Check your internet connection
   - Verify your Supabase project is active

## Next Steps

After successfully creating the table:

1. ✅ Task 7.2: Create leads table (this task)
2. ⏭️ Task 7.3: Configure Row-Level Security (RLS)
3. ⏭️ Task 7.4: Connect Next.js app to Supabase
4. ⏭️ Task 7.5: Implement /api/submit-lead route

## Security Note

The table is created without Row-Level Security (RLS) initially. RLS will be configured in Task 7.3 to ensure proper data access controls.
