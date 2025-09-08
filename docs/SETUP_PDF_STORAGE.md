# Setting Up PDF Storage in Supabase

## Instructions

To enable PDF generation and storage, you need to set up a storage bucket in Supabase:

1. **Go to your Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Storage Setup Script**
   - Copy and paste the contents of `/scripts/create-pdf-storage.sql`
   - Click "Run" to execute the script

4. **Verify the Bucket**
   - Go to "Storage" in the left sidebar
   - You should see a `lead-pdfs` bucket
   - The bucket should be marked as "Public"

## What This Does

- Creates a public storage bucket called `lead-pdfs`
- Sets up RLS (Row Level Security) policies to allow:
  - Anonymous users to upload PDFs (needed for the API)
  - Public users to view PDFs (for download links)
  - Anonymous users to update/delete PDFs

## Testing

After setting up the storage, test it by:

1. Submitting a form through the calculator
2. Check the admin panel at `/admin`
3. The PDF button should be enabled for new leads
4. Click the PDF button to download the generated report

## Troubleshooting

If PDFs are not being generated:

1. Check the browser console for errors
2. Check the server logs with: `npm run dev`
3. Verify the storage bucket exists in Supabase dashboard
4. Ensure the RLS policies are correctly applied

Common issues:
- "new row violates row-level security policy" - Run the SQL script again
- "Bucket not found" - Create the bucket using the SQL script
- PDF button disabled - Check if pdf_url is being saved in form_data