import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const condition =
      url.searchParams.get('condition') || '"Öljylämmitys" == "Öljylämmitys"';

    // Test the regex validation
    const regexTest = /^[0-9a-zA-ZÀ-ÿ\u0100-\u017F"'\\s==!=<>()._-]+$/.test(
      condition
    );

    let evaluationResult;
    let evaluationError = null;

    try {
      // Test the actual evaluation
      evaluationResult = new Function('return ' + condition)();
      console.log(
        `Evaluation result: ${evaluationResult} (type: ${typeof evaluationResult})`
      );
    } catch {
      evaluationError =
        error instanceof Error ? error.message : 'Unknown error';
    }

    // Test character by character analysis
    const chars = condition.split('').map(c => ({
      char: c,
      code: c.charCodeAt(0),
      hex: c.charCodeAt(0).toString(16),
    }));

    return NextResponse.json({
      condition,
      regexTest,
      evaluationResult,
      evaluationError,
      characters: chars,
      length: condition.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test condition' },
      { status: 500 }
    );
  }
}
