# Task 7.2 Execution Guide: Create Leads Table

## Overview

Task 7.2 involves creating the leads table in Supabase according to the PRD specifications. All the code and migration scripts have been prepared - you just need to execute the table creation.

## What's Been Prepared

✅ **SQL Migration Script**: `scripts/supabase-migrations/01_create_leads_table.sql`

- Complete table schema with all PRD fields
- Data validation constraints
- Performance indexes
- Automatic timestamp updates
- Comprehensive documentation

✅ **Updated TypeScript Interface**: `src/lib/supabase.ts`

- Lead interface updated to match PRD schema exactly
- All form fields, calculated values, and metadata included
- Helper functions updated for new schema

✅ **Verification Tools**:

- `src/lib/verify-table-structure.ts` - Programmatic verification
- `src/app/api/verify-table/route.ts` - API endpoint for testing
- Comprehensive constraint testing

✅ **Documentation**:

- `SUPABASE_TABLE_SETUP.md` - Step-by-step setup guide
- `TASK_7.2_EXECUTION_GUIDE.md` - This guide

## Execution Steps

### Step 1: Create the Table in Supabase

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** in the left sidebar

2. **Execute Migration Script**
   - Click **"New Query"**
   - Copy the entire contents of `scripts/supabase-migrations/01_create_leads_table.sql`
   - Paste into the SQL Editor
   - Click **"Run"** to execute

3. **Verify Execution**
   - Check that no errors appear in the output
   - You should see messages confirming table creation

### Step 2: Verify Table Structure

1. **Check in Dashboard**
   - Navigate to **Database** → **Tables**
   - Confirm the `leads` table appears
   - Click on it to inspect the structure

2. **Test via API** (Optional)
   - Start your dev server: `npm run dev`
   - Visit: `http://localhost:3000/api/verify-table`
   - Should return `{"success": true}` if everything is correct

### Step 3: Mark Task as Complete

```bash
task-master set-status --id=7.2 --status=done
```

## Table Schema Summary

The leads table includes:

### 📝 Form Data (24 fields)

- **House Info**: square_meters, ceiling_height, construction_year, floors
- **Heating**: heating_type, current_heating_cost, current_energy_consumption
- **Household**: residents, hot_water_usage
- **Contact**: first_name, last_name, email, phone, street_address, city, contact_preference, message

### 🧮 Calculated Fields (8 fields)

- annual_energy_need, heat_pump_consumption, heat_pump_cost_annual
- annual_savings, five_year_savings, ten_year_savings
- payback_period, co2_reduction

### 📊 Metadata (8 fields)

- id, created_at, updated_at, status, notes
- ip_address, user_agent, source_page

## Validation & Constraints

The table enforces data integrity with:

- ✅ Square meters: 10-1000 range
- ✅ Ceiling height: Only 2.5, 3.0, 3.5 meters
- ✅ Construction year: Predefined ranges
- ✅ Heating type: Oil, Electric, District, Other
- ✅ Contact preference: Email, Phone, Both
- ✅ Lead status: new, contacted, qualified, converted

## Performance Features

- 🚀 Indexes on frequently queried columns (created_at, email, status, city, annual_savings)
- ⚡ Automatic updated_at timestamp updates
- 📝 Comprehensive column documentation
- 🔍 Optimized for lead queries and admin reporting

## Troubleshooting

### Common Issues:

1. **Permission Error**
   - Ensure you're logged into the correct Supabase project
   - Check you have admin/owner permissions

2. **SQL Syntax Error**
   - Copy the exact SQL from the migration file
   - Ensure no characters were lost during copy/paste

3. **Table Already Exists**
   - The script uses `IF NOT EXISTS` so it's safe to re-run
   - If you need to reset: `DROP TABLE IF EXISTS leads;` then re-run

## Next Steps After Completion

1. ✅ Task 7.2: Create leads table (this task)
2. ⏭️ Task 7.3: Configure Row-Level Security (RLS) and SSL
3. ⏭️ Task 7.4: Connect Next.js app to Supabase
4. ⏭️ Task 7.5: Implement /api/submit-lead route
5. ⏭️ Task 7.6: Store source page for analytics

## Files Created/Modified in This Task

- ✅ `scripts/supabase-migrations/01_create_leads_table.sql` - Migration script
- ✅ `src/lib/supabase.ts` - Updated Lead interface and helper functions
- ✅ `src/lib/verify-table-structure.ts` - Verification utilities
- ✅ `src/app/api/verify-table/route.ts` - API verification endpoint
- ✅ `SUPABASE_TABLE_SETUP.md` - Setup documentation
- ✅ `TASK_7.2_EXECUTION_GUIDE.md` - This execution guide

The database schema is now ready and matches the PRD requirements exactly!
