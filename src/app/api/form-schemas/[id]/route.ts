import { NextRequest, NextResponse } from 'next/server';
import { getFormSchema, updateFormSchema, createNewVersion } from '@/lib/form-schema-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schema = await getFormSchema(id);

    if (!schema) {
      return NextResponse.json(
        { error: 'Form schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error fetching form schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form schema' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, schema_data, is_active } = body;

    // Check if schema exists
    const existingSchema = await getFormSchema(id);
    if (!existingSchema) {
      return NextResponse.json(
        { error: 'Form schema not found' },
        { status: 404 }
      );
    }

    // Update the existing schema
    const updatedSchema = await updateFormSchema(id, {
      name,
      description,
      schema_data,
      is_active,
    });

    return NextResponse.json(updatedSchema);
  } catch (error) {
    console.error('Error updating form schema:', error);
    return NextResponse.json(
      { error: 'Failed to update form schema' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { createNewVersion: shouldCreateNewVersion, ...updateData } = body;

    if (shouldCreateNewVersion) {
      // Create a new version instead of updating the existing one
      const newVersion = await createNewVersion(id, updateData);
      return NextResponse.json(newVersion, { status: 201 });
    } else {
      // Regular update
      const updatedSchema = await updateFormSchema(id, updateData);
      return NextResponse.json(updatedSchema);
    }
  } catch (error) {
    console.error('Error updating form schema:', error);
    return NextResponse.json(
      { error: 'Failed to update form schema' },
      { status: 500 }
    );
  }
}
