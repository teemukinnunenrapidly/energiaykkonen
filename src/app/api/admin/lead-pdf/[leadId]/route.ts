import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    // Verify admin authentication
    try {
      await requireAdmin(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = await params;

    // Get lead to find PDF URL
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('pdf_url, first_name, last_name')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.pdf_url) {
      return NextResponse.json(
        { error: 'No PDF available for this lead' },
        { status: 404 }
      );
    }

    // Extract the file path from the URL
    // The URL format is: https://[project].supabase.co/storage/v1/object/public/lead-pdfs/[path]
    const urlParts = lead.pdf_url.split('/lead-pdfs/');
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid PDF URL format' },
        { status: 400 }
      );
    }

    const filePath = urlParts[1];

    // Download the PDF from Supabase storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('lead-pdfs')
      .download(filePath);

    if (downloadError || !pdfData) {
      console.error('PDF download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download PDF' },
        { status: 500 }
      );
    }

    // Convert Blob to ArrayBuffer then to Buffer
    const arrayBuffer = await pdfData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the PDF with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="saastolaskelma-${lead.first_name}-${lead.last_name}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching lead PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
