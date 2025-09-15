import { NextRequest, NextResponse } from 'next/server';
import { executeFormula, validateFormula } from '@/lib/formula-service';

export async function POST(request: NextRequest) {
  try {
    const { formula, variables } = await request.json();

    if (!formula) {
      return NextResponse.json(
        { error: 'Formula is required' },
        { status: 400 }
      );
    }

    // Validate the formula first
    const validationResult = validateFormula(formula);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid formula',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // Execute the formula with the provided variables
    const executionResult = await executeFormula(formula, variables || {});

    if (!executionResult.success) {
      return NextResponse.json(
        {
          error: 'Formula execution failed',
          details: executionResult.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      result: executionResult.result,
      executionTime: executionResult.executionTime,
    });
    } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
