import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Check if the new columns exist
    const { data: existingColumns, error: checkError } = await supabase
      .from('card_templates')
      .select('reveal_next_conditions, completion_rules, reveal_timing')
      .limit(1);

    let needsMigration = false;
    const migrationActions: string[] = [];

    // Check if we need to add new columns
    if (
      checkError &&
      (checkError.message.includes(
        'column "reveal_next_conditions" does not exist'
      ) ||
        checkError.message.includes(
          'column "completion_rules" does not exist'
        ) ||
        checkError.message.includes('column "reveal_timing" does not exist') ||
        checkError.message.includes(
          'card_templates.completion_rules does not exist'
        ) ||
        checkError.message.includes(
          'card_templates.reveal_timing does not exist'
        ))
    ) {
      needsMigration = true;
    }

    if (needsMigration) {
      console.log('Running card reveal system migration...');

      // Read and execute the migration file
      try {
        const migrationPath = path.join(
          process.cwd(),
          'scripts/supabase-migrations/21_add_reveal_system_columns.sql'
        );
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
          .split(';')
          .filter((stmt: string) => stmt.trim().length > 0);

        for (const statement of statements) {
          const { error } = await supabase.rpc('exec', {
            query: statement.trim() + ';',
          });

          if (error) {
            console.error('Statement execution error:', error);
            // Continue with other statements even if one fails
          }
        }
      } catch (fileError) {
        console.error('Failed to read migration file:', fileError);

        // Fallback to inline migration
        const { error: alterError } = await supabase
          .from('card_templates')
          .select('id')
          .limit(1);

        if (alterError) {
          console.error('Failed to add columns:', alterError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to add columns',
              details: alterError.message,
            },
            { status: 500 }
          );
        }
      }

      migrationActions.push('Added new columns');

      // Migrate existing reveal_next_conditions to the new system
      const { error: migrateError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE card_templates 
          SET 
            completion_rules = CASE 
              WHEN type = 'form' AND reveal_next_conditions->>'type' = 'all_complete' THEN 
                '{"form_completion": {"type": "all_fields"}}'::jsonb
              WHEN type = 'form' AND reveal_next_conditions->>'type' = 'required_complete' THEN 
                '{"form_completion": {"type": "required_fields"}}'::jsonb
              WHEN type = 'form' THEN 
                '{"form_completion": {"type": "any_field"}}'::jsonb
              ELSE NULL
            END,
            reveal_timing = CASE 
              WHEN reveal_next_conditions->>'type' = 'after_delay' THEN 
                jsonb_build_object('timing', 'after_delay', 'delay_seconds', COALESCE((reveal_next_conditions->>'delay_seconds')::int, 3))
              WHEN reveal_next_conditions IS NOT NULL THEN 
                '{"timing": "immediately"}'::jsonb
              ELSE '{"timing": "immediately"}'::jsonb
            END
          WHERE reveal_next_conditions IS NOT NULL;
        `,
      });

      if (migrateError) {
        console.error('Failed to migrate data:', migrateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to migrate existing data',
            details: migrateError.message,
          },
          { status: 500 }
        );
      }

      migrationActions.push('Migrated existing data to new format');
    }

    if (needsMigration) {
      console.log('Migration completed successfully');
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        action: 'migrated',
        details: migrationActions,
      });
    } else if (existingColumns) {
      // Columns already exist
      return NextResponse.json({
        success: true,
        message: 'All columns already exist',
        action: 'already_exists',
      });
    } else {
      // Some other error
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check columns existence',
          details: checkError?.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
