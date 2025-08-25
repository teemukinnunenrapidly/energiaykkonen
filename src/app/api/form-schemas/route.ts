import { NextRequest, NextResponse } from 'next/server';
import { createFormSchema, listFormSchemas } from '@/lib/form-schema-service';

export async function GET() {
  try {
    const schemas = await listFormSchemas();
    return NextResponse.json(schemas);
  } catch (error) {
    console.error('Error fetching form schemas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form schemas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, schema_data } = body;

    if (!name || !schema_data) {
      return NextResponse.json(
        { error: 'Name and schema_data are required' },
        { status: 400 }
      );
    }

    const newSchema = await createFormSchema({
      name,
      description,
      schema_data,
    });

    return NextResponse.json(newSchema, { status: 201 });
  } catch (error) {
    console.error('Error creating form schema:', error);
    return NextResponse.json(
      { error: 'Failed to create form schema' },
      { status: 500 }
    );
  }
}
