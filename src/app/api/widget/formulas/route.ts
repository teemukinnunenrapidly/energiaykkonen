import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public API endpoint for widget to fetch and execute formulas
 * GET: Fetch all active formulas
 * POST: Execute a specific formula with provided data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch active formulas
    const { data: formulas, error } = await supabase
      .from('formulas')
      .select('id, name, description, formula_code, result_unit')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching formulas:', error);
      throw error;
    }

    // Return formulas (without exposing internal formula code)
    const publicFormulas = (formulas || []).map(formula => ({
      id: formula.id,
      name: formula.name,
      description: formula.description,
      resultUnit: formula.result_unit
    }));

    return NextResponse.json(
      {
        success: true,
        formulas: publicFormulas,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=600', // Cache for 10 minutes
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Widget formulas API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch formulas',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

/**
 * Execute a formula with provided data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formulaName, data } = body;

    if (!formulaName || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: formulaName and data'
        },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch the formula
    const { data: formula, error: formulaError } = await supabase
      .from('formulas')
      .select('*')
      .eq('name', formulaName)
      .eq('is_active', true)
      .single();

    if (formulaError || !formula) {
      return NextResponse.json(
        {
          success: false,
          error: `Formula not found: ${formulaName}`
        },
        { status: 404 }
      );
    }

    // Execute the formula
    try {
      // Create a safe execution context
      const safeData = { ...data };
      const formulaFunction = new Function('data', formula.formula_code);
      const result = formulaFunction(safeData);

      return NextResponse.json(
        {
          success: true,
          result: {
            value: result,
            unit: formula.result_unit,
            formulaName: formula.name,
            description: formula.description
          },
          timestamp: new Date().toISOString()
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (execError) {
      console.error('Formula execution error:', execError);
      return NextResponse.json(
        {
          success: false,
          error: 'Formula execution failed',
          message: execError instanceof Error ? execError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Widget formula execution API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute formula',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}