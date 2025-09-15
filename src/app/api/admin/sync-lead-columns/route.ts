import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    await requireAdmin(request);

    const { oldFieldName, newFieldName } = await request.json();

    if (!oldFieldName || !newFieldName) {
      return NextResponse.json(
        { error: 'Both oldFieldName and newFieldName are required' },
        { status: 400 }
      );
    }

    // Sanitize field names to ensure they're valid PostgreSQL column names
    const sanitizeColumnName = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');
    };

    const sanitizedOldName = sanitizeColumnName(oldFieldName);
    const sanitizedNewName = sanitizeColumnName(newFieldName);

    if (sanitizedOldName === sanitizedNewName) {
      return NextResponse.json(
        { message: 'Field names are the same, no update needed' },
        { status: 200 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if the old column exists in the leads table
    const { data: columns, error: columnsError } = await supabase.rpc(
      'get_table_columns',
      { table_name: 'leads' }
    );

    if (columnsError) {
      // If the RPC doesn't exist, create it first
      const { error: createRpcError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
          RETURNS TABLE(column_name text)
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT c.column_name::text
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = get_table_columns.table_name;
          END;
          $$;
        `,
      });

      if (createRpcError) {
        // Fallback: Use a different approach to check columns

        // Try to select the old column to see if it exists
        const { error: selectError } = await supabase
          .from('leads')
          .select(sanitizedOldName)
          .limit(1);

        if (
          selectError?.message?.includes('column') &&
          selectError?.message?.includes('does not exist')
        ) {
          console.log(
            `Column ${sanitizedOldName} does not exist in leads table`
          );
          return NextResponse.json(
            {
              message: `Column ${sanitizedOldName} does not exist in leads table, no update needed`,
            },
            { status: 200 }
          );
        }
      }
    }

    // Check if column exists
    const columnExists = columns?.some(
      (col: { column_name: string }) => col.column_name === sanitizedOldName
    );

    if (!columnExists) {
      // Try direct check as fallback
      const { error: selectError } = await supabase
        .from('leads')
        .select(sanitizedOldName)
        .limit(1);

      if (selectError?.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            message: `Column ${sanitizedOldName} does not exist in leads table, skipping`,
          },
          { status: 200 }
        );
      }
    }

    // Check if new column name already exists
    const newColumnExists = columns?.some(
      (col: { column_name: string }) => col.column_name === sanitizedNewName
    );

    if (newColumnExists) {
      return NextResponse.json(
        { error: `Column ${sanitizedNewName} already exists in leads table` },
        { status: 400 }
      );
    }

    // Rename the column using RPC
    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE leads RENAME COLUMN ${sanitizedOldName} TO ${sanitizedNewName};`,
    });

    if (renameError) {
      // If exec_sql doesn't exist, we need admin to manually update

      return NextResponse.json(
        {
          warning: `Column rename requires manual database update: ALTER TABLE leads RENAME COLUMN ${sanitizedOldName} TO ${sanitizedNewName}`,
          requiresManualUpdate: true,
        },
        { status: 200 }
      );
    }

    console.log(
      `✅ Successfully renamed column in leads table: ${sanitizedOldName} → ${sanitizedNewName}`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Column renamed from ${sanitizedOldName} to ${sanitizedNewName}`,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to sync lead columns',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
